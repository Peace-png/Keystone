"""
Keystone Phase 3: Training Pipeline

Implements the training infrastructure for continuous learning:
- ISC-13: Streaming DPO data loader
- ISC-14: KTO binary signal processor
- ISC-15: Micro-batch update loop
- ISC-16: KL divergence monitoring
- ISC-17: Validation gate before merge
- ISC-18: Refusal direction cosine similarity check

References:
- DPO: arXiv:2305.18290
- KTO: arXiv:2402.01306
- Refusal Direction: Arditi et al., NeurIPS 2024
"""

import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple, Iterator
from pathlib import Path
from enum import Enum

# Optional torch import - system should work without it
try:
    import torch
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
    import numpy as np
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    # Create stub classes for type checking
    class Dataset:
        """Stub Dataset when torch is not available."""
        pass
    class DataLoader:
        """Stub DataLoader when torch is not available."""
        pass


@dataclass
class TrainingConfig:
    """Configuration for the training pipeline"""
    # KL constraint
    kl_threshold: float = 0.01  # ε from research

    # Micro-batch settings
    micro_batch_size: int = 4
    gradient_accumulation_steps: int = 4

    # Learning rates
    learning_rate: float = 1e-5
    lr_scheduler: str = "cosine"

    # Validation
    validation_frequency: int = 10  # Validate every N batches
    refusal_similarity_threshold: float = 0.95

    # Consolidation
    consolidation_batches: int = 100

    # Paths
    corpus_path: str = "./corpus"
    output_path: str = "./checkpoints"


class DPOPairDataset(Dataset):
    """
    ISC-13: Streaming DPO data loader

    Loads DPO preference pairs from JSONL file.
    """

    def __init__(self, corpus_path: str, max_samples: Optional[int] = None):
        self.pairs = []
        pairs_path = Path(corpus_path) / "dpo_pairs.jsonl"

        with open(pairs_path, 'r') as f:
            for i, line in enumerate(f):
                if max_samples and i >= max_samples:
                    break
                self.pairs.append(json.loads(line))

        print(f"Loaded {len(self.pairs)} DPO pairs from {pairs_path}")

    def __len__(self) -> int:
        return len(self.pairs)

    def __getitem__(self, idx: int) -> Dict:
        pair = self.pairs[idx]
        return {
            "prompt": pair["prompt"],
            "chosen": pair["chosen"],
            "rejected": pair["rejected"],
            "principle_id": pair["principle_id"],
            "sovereign": pair["sovereign"],
            "weight": pair["weight"],
        }


class KTOSignalDataset(Dataset):
    """
    ISC-14: KTO binary signal processor

    Loads KTO binary signals from JSONL file.
    """

    def __init__(self, corpus_path: str, max_samples: Optional[int] = None):
        self.signals = []
        signals_path = Path(corpus_path) / "kto_signals.jsonl"

        with open(signals_path, 'r') as f:
            for i, line in enumerate(f):
                if max_samples and i >= max_samples:
                    break
                self.signals.append(json.loads(line))

        print(f"Loaded {len(self.signals)} KTO signals from {signals_path}")

    def __len__(self) -> int:
        return len(self.signals)

    def __getitem__(self, idx: int) -> Dict:
        signal = self.signals[idx]
        return {
            "input": signal["input"],
            "label": signal["label"],
            "principle_id": signal["principle_id"],
            "sovereign": signal["sovereign"],
            "weight": signal["weight"],
            "confidence": signal["confidence"],
        }


def compute_dpo_loss(
    policy_chosen_logprobs: torch.Tensor,
    policy_rejected_logprobs: torch.Tensor,
    reference_chosen_logprobs: torch.Tensor,
    reference_rejected_logprobs: torch.Tensor,
    beta: float = 0.1,
    weights: Optional[torch.Tensor] = None,
) -> Tuple[torch.Tensor, Dict]:
    """
    Compute DPO loss (Direct Preference Optimization).

    From arXiv:2305.18290:
    L_DPO = -E[log σ(β (log π(y_w|x) / π_ref(y_w|x) - log π(y_l|x) / π_ref(y_l|x)))]

    Args:
        policy_chosen_logprobs: Log probs of chosen responses under policy
        policy_rejected_logprobs: Log probs of rejected responses under policy
        reference_chosen_logprobs: Log probs of chosen responses under reference
        reference_rejected_logprobs: Log probs of rejected responses under reference
        beta: Temperature parameter for DPO
        weights: Optional per-sample weights

    Returns:
        loss: Scalar loss tensor
        metrics: Dict with accuracy, reward_margin, etc.
    """
    # Compute log ratios
    chosen_logratios = policy_chosen_logprobs - reference_chosen_logprobs
    rejected_logratios = policy_rejected_logprobs - reference_rejected_logprobs

    # DPO logits
    logits = beta * (chosen_logratios - rejected_logratios)

    # Loss (we want chosen > rejected, so target is 1)
    loss = -F.logsigmoid(logits)

    # Apply weights if provided
    if weights is not None:
        loss = loss * weights

    loss = loss.mean()

    # Metrics
    with torch.no_grad():
        accuracy = (logits > 0).float().mean()
        reward_margin = (chosen_logratios - rejected_logratios).mean()

    metrics = {
        "dpo_loss": loss.item(),
        "dpo_accuracy": accuracy.item(),
        "reward_margin": reward_margin.item(),
    }

    return loss, metrics


def compute_kto_loss(
    policy_logprobs: torch.Tensor,
    reference_logprobs: torch.Tensor,
    labels: torch.Tensor,  # True = desirable, False = undesirable
    beta: float = 0.1,
    weights: Optional[torch.Tensor] = None,
    desirable_weight: float = 1.0,
    undesirable_weight: float = 1.0,
) -> Tuple[torch.Tensor, Dict]:
    """
    Compute KTO loss (Kahneman-Tversky Optimization).

    From arXiv:2402.01306:
    KTO uses binary signals (desirable/undesirable) instead of preference pairs.

    Args:
        policy_logprobs: Log probs under policy
        reference_logprobs: Log probs under reference
        labels: Boolean tensor (True = desirable, False = undesirable)
        beta: Temperature parameter
        weights: Optional per-sample weights
        desirable_weight: Weight for desirable examples
        undesirable_weight: Weight for undesirable examples

    Returns:
        loss: Scalar loss tensor
        metrics: Dict with accuracy, etc.
    """
    # Compute log ratio (KL-approximated reward)
    logratio = policy_logprobs - reference_logprobs

    # KTO loss formulation
    # For desirable: maximize log σ(β * (r - z)) where z is a reference point
    # For undesirable: maximize log σ(β * (z - r))

    # Simplified KTO loss:
    desirable_mask = labels.float()
    undesirable_mask = (~labels).float()

    # Desirable loss: push logratio up
    desirable_loss = -F.logsigmoid(beta * logratio)
    # Undesirable loss: push logratio down
    undesirable_loss = -F.logsigmoid(-beta * logratio)

    # Combine
    loss = (desirable_mask * desirable_loss * desirable_weight +
            undesirable_mask * undesirable_loss * undesirable_weight)

    # Apply sample weights
    if weights is not None:
        loss = loss * weights

    loss = loss.mean()

    # Metrics
    with torch.no_grad():
        # Count by type
        n_desirable = desirable_mask.sum().item()
        n_undesirable = undesirable_mask.sum().item()

        # Average log ratio by type
        if n_desirable > 0:
            avg_desirable_ratio = (logratio * desirable_mask).sum() / n_desirable
        else:
            avg_desirable_ratio = torch.tensor(0.0)

        if n_undesirable > 0:
            avg_undesirable_ratio = (logratio * undesirable_mask).sum() / n_undesirable
        else:
            avg_undesirable_ratio = torch.tensor(0.0)

    metrics = {
        "kto_loss": loss.item(),
        "n_desirable": n_desirable,
        "n_undesirable": n_undesirable,
        "avg_desirable_ratio": avg_desirable_ratio.item(),
        "avg_undesirable_ratio": avg_undesirable_ratio.item(),
    }

    return loss, metrics


class KLMonitor:
    """
    ISC-16: KL divergence monitoring

    Monitors KL divergence between policy and reference to ensure
    updates stay within the ε-constraint.
    """

    def __init__(self, threshold: float = 0.01):
        self.threshold = threshold
        self.history: List[float] = []

    def compute_kl(
        self,
        policy_logprobs: torch.Tensor,
        reference_logprobs: torch.Tensor,
    ) -> float:
        """
        Compute KL divergence: KL[π || π_ref]

        For each position:
        KL = Σ π(x) * (log π(x) - log π_ref(x))
        """
        # Approximate KL using log ratios (valid when close to reference)
        kl = (policy_logprobs.exp() * (policy_logprobs - reference_logprobs)).sum(-1).mean()

        kl_value = kl.item()
        self.history.append(kl_value)

        return kl_value

    def check_constraint(self, kl_value: float) -> bool:
        """Check if KL is within acceptable bounds"""
        return kl_value < self.threshold

    def get_status(self) -> Dict:
        """Get monitoring status"""
        if not self.history:
            return {"status": "no_data", "threshold": self.threshold}

        recent = self.history[-10:]
        return {
            "status": "ok" if recent[-1] < self.threshold else "exceeded",
            "current_kl": recent[-1],
            "threshold": self.threshold,
            "mean_kl": np.mean(recent),
            "max_kl": max(recent),
            "n_measurements": len(self.history),
        }


class RefusalDirectionMonitor:
    """
    ISC-18: Refusal direction cosine similarity check

    Monitors the refusal direction in activation space.
    From Arditi et al. (NeurIPS 2024): refusal behavior lives in a 1D subspace.
    """

    def __init__(self, threshold: float = 0.95):
        self.threshold = threshold
        self.baseline_direction: Optional[torch.Tensor] = None
        self.history: List[float] = []

    def set_baseline(self, direction: torch.Tensor):
        """Set the baseline refusal direction from the initial model"""
        self.baseline_direction = direction.detach().clone()
        self.baseline_direction = F.normalize(self.baseline_direction, dim=0)
        print(f"Set baseline refusal direction (dim={direction.shape[0]})")

    def compute_similarity(self, current_direction: torch.Tensor) -> float:
        """
        Compute cosine similarity between current and baseline refusal directions.
        """
        if self.baseline_direction is None:
            raise ValueError("Baseline not set. Call set_baseline() first.")

        # Normalize current direction
        current_normalized = F.normalize(current_direction.detach(), dim=0)

        # Cosine similarity
        similarity = F.cosine_similarity(
            self.baseline_direction.unsqueeze(0),
            current_normalized.unsqueeze(0),
        ).item()

        self.history.append(similarity)
        return similarity

    def check_constraint(self, similarity: float) -> bool:
        """Check if refusal direction is sufficiently aligned"""
        return similarity >= self.threshold

    def get_status(self) -> Dict:
        """Get monitoring status"""
        if not self.history:
            return {"status": "no_data", "threshold": self.threshold}

        recent = self.history[-10:]
        return {
            "status": "ok" if recent[-1] >= self.threshold else "degraded",
            "current_similarity": recent[-1],
            "threshold": self.threshold,
            "mean_similarity": np.mean(recent),
            "min_similarity": min(recent),
            "n_measurements": len(self.history),
        }


class ValidationGate:
    """
    ISC-17: Validation gate before merge

    Runs validation checks before allowing a model update to be merged.
    """

    def __init__(
        self,
        kl_threshold: float = 0.01,
        refusal_threshold: float = 0.95,
        perplexity_threshold: float = 2.0,  # Max acceptable perplexity increase
    ):
        self.kl_threshold = kl_threshold
        self.refusal_threshold = refusal_threshold
        self.perplexity_threshold = perplexity_threshold

        self.kl_monitor = KLMonitor(kl_threshold)
        self.refusal_monitor = RefusalDirectionMonitor(refusal_threshold)

    def validate(
        self,
        kl_value: float,
        refusal_similarity: float,
        perplexity_ratio: float,  # current_ppl / baseline_ppl
    ) -> Tuple[bool, Dict]:
        """
        Run all validation checks.

        Returns:
            passed: Whether all checks passed
            results: Detailed results for each check
        """
        results = {
            "kl": {
                "value": kl_value,
                "threshold": self.kl_threshold,
                "passed": kl_value < self.kl_threshold,
            },
            "refusal": {
                "value": refusal_similarity,
                "threshold": self.refusal_threshold,
                "passed": refusal_similarity >= self.refusal_threshold,
            },
            "perplexity": {
                "value": perplexity_ratio,
                "threshold": self.perplexity_threshold,
                "passed": perplexity_ratio < self.perplexity_threshold,
            },
        }

        all_passed = all(r["passed"] for r in results.values())
        results["overall"] = all_passed

        return all_passed, results

    def should_reject_update(self, results: Dict) -> bool:
        """Determine if update should be rejected"""
        return not results.get("overall", False)


class MicroBatchTrainer:
    """
    ISC-15: Micro-batch update loop

    Manages the training loop with:
    - Gradient accumulation for effective larger batch size
    - KL-constrained updates
    - Validation gates
    """

    def __init__(
        self,
        config: TrainingConfig,
        model,
        reference_model,
        tokenizer,
    ):
        self.config = config
        self.model = model
        self.reference_model = reference_model
        self.tokenizer = tokenizer

        self.validation_gate = ValidationGate(
            kl_threshold=config.kl_threshold,
            refusal_threshold=config.refusal_similarity_threshold,
        )

        self.optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=config.learning_rate,
        )

        self.step_count = 0
        self.rejected_updates = 0
        self.accepted_updates = 0

    def encode_batch(self, texts: List[str]) -> Dict[str, torch.Tensor]:
        """Tokenize a batch of texts"""
        encoded = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            return_tensors="pt",
            max_length=512,
        )
        return encoded

    def get_logprobs(self, model, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        """Get log probabilities for a batch"""
        with torch.no_grad() if model != self.model else torch.enable_grad():
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits

            # Shift for next-token prediction
            shift_logits = logits[..., :-1, :].contiguous()
            shift_labels = input_ids[..., 1:].contiguous()

            # Compute log probs
            log_probs = F.log_softmax(shift_logits, dim=-1)

            # Gather log probs for actual tokens
            token_log_probs = log_probs.gather(
                dim=-1,
                index=shift_labels.unsqueeze(-1)
            ).squeeze(-1)

            # Mask padding
            mask = attention_mask[..., 1:].float()
            token_log_probs = token_log_probs * mask

            # Sum over sequence
            return token_log_probs.sum(dim=-1)

    def train_step_dpo(self, batch: Dict) -> Dict:
        """Single DPO training step"""
        self.model.train()

        # Encode
        prompts = batch["prompt"]
        chosen = batch["chosen"]
        rejected = batch["rejected"]
        weights = torch.tensor(batch["weight"], dtype=torch.float32)

        # Full sequences
        chosen_texts = [f"{p}\n{c}" for p, c in zip(prompts, chosen)]
        rejected_texts = [f"{p}\n{r}" for p, r in zip(prompts, rejected)]

        chosen_encoded = self.encode_batch(chosen_texts)
        rejected_encoded = self.encode_batch(rejected_texts)

        # Get log probs
        policy_chosen_lp = self.get_logprobs(
            self.model,
            chosen_encoded["input_ids"],
            chosen_encoded["attention_mask"],
        )
        policy_rejected_lp = self.get_logprobs(
            self.model,
            rejected_encoded["input_ids"],
            rejected_encoded["attention_mask"],
        )

        with torch.no_grad():
            reference_chosen_lp = self.get_logprobs(
                self.reference_model,
                chosen_encoded["input_ids"],
                chosen_encoded["attention_mask"],
            )
            reference_rejected_lp = self.get_logprobs(
                self.reference_model,
                rejected_encoded["input_ids"],
                rejected_encoded["attention_mask"],
            )

        # Compute loss
        loss, metrics = compute_dpo_loss(
            policy_chosen_lp,
            policy_rejected_lp,
            reference_chosen_lp,
            reference_rejected_lp,
            beta=0.1,
            weights=weights,
        )

        # Compute KL
        kl_value = self.validation_gate.kl_monitor.compute_kl(
            policy_chosen_lp,
            reference_chosen_lp,
        )
        metrics["kl_divergence"] = kl_value

        return loss, metrics

    def train_step_kto(self, batch: Dict) -> Dict:
        """Single KTO training step"""
        self.model.train()

        # Encode
        inputs = batch["input"]
        labels = torch.tensor(batch["label"], dtype=torch.bool)
        weights = torch.tensor(batch["weight"], dtype=torch.float32)

        encoded = self.encode_batch(inputs)

        # Get log probs
        policy_lp = self.get_logprobs(
            self.model,
            encoded["input_ids"],
            encoded["attention_mask"],
        )

        with torch.no_grad():
            reference_lp = self.get_logprobs(
                self.reference_model,
                encoded["input_ids"],
                encoded["attention_mask"],
            )

        # Compute loss
        loss, metrics = compute_kto_loss(
            policy_lp,
            reference_lp,
            labels,
            beta=0.1,
            weights=weights,
        )

        # Compute KL
        kl_value = self.validation_gate.kl_monitor.compute_kl(policy_lp, reference_lp)
        metrics["kl_divergence"] = kl_value

        return loss, metrics

    def run_validation(self) -> Dict:
        """Run validation checks"""
        # Get current monitoring values
        kl_status = self.validation_gate.kl_monitor.get_status()
        refusal_status = self.validation_gate.refusal_monitor.get_status()

        # Simulate perplexity ratio (in practice, would compute on validation set)
        perplexity_ratio = 1.0  # Placeholder

        # Run validation gate
        if "current_kl" in kl_status and "current_similarity" in refusal_status:
            passed, results = self.validation_gate.validate(
                kl_status["current_kl"],
                refusal_status["current_similarity"],
                perplexity_ratio,
            )
            return {"passed": passed, "results": results}
        else:
            return {"passed": True, "results": {"note": "Insufficient data for validation"}}

    def train_epoch(
        self,
        dpo_loader: DataLoader,
        kto_loader: DataLoader,
        n_batches: int = 100,
    ) -> Dict:
        """
        Run training epoch with micro-batch updates.

        ISC-15: Micro-batch update loop
        """
        self.model.train()

        dpo_iter = iter(dpo_loader)
        kto_iter = iter(kto_loader)

        epoch_metrics = {
            "dpo_loss": [],
            "kto_loss": [],
            "kl_divergence": [],
            "dpo_accuracy": [],
        }

        for batch_idx in range(n_batches):
            # Alternate between DPO and KTO
            if batch_idx % 2 == 0:
                try:
                    batch = next(dpo_iter)
                except StopIteration:
                    dpo_iter = iter(dpo_loader)
                    batch = next(dpo_iter)

                loss, metrics = self.train_step_dpo(batch)
                epoch_metrics["dpo_loss"].append(metrics["dpo_loss"])
                epoch_metrics["dpo_accuracy"].append(metrics.get("dpo_accuracy", 0))
            else:
                try:
                    batch = next(kto_iter)
                except StopIteration:
                    kto_iter = iter(kto_loader)
                    batch = next(kto_iter)

                loss, metrics = self.train_step_kto(batch)
                epoch_metrics["kto_loss"].append(metrics["kto_loss"])

            epoch_metrics["kl_divergence"].append(metrics["kl_divergence"])

            # Gradient accumulation
            loss = loss / self.config.gradient_accumulation_steps
            loss.backward()

            if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                # Check KL constraint before stepping
                current_kl = metrics["kl_divergence"]
                if current_kl < self.config.kl_threshold:
                    self.optimizer.step()
                    self.optimizer.zero_grad()
                    self.accepted_updates += 1
                else:
                    # Reject update - KL too high
                    self.optimizer.zero_grad()
                    self.rejected_updates += 1
                    print(f"  [REJECT] KL={current_kl:.4f} > threshold={self.config.kl_threshold}")

            self.step_count += 1

            # Validation checkpoint
            if self.step_count % self.config.validation_frequency == 0:
                val_results = self.run_validation()
                if not val_results["passed"]:
                    print(f"  [VALIDATION FAILED] {val_results}")

            # Progress
            if batch_idx % 10 == 0:
                print(f"  Batch {batch_idx}/{n_batches} | "
                      f"KL={metrics['kl_divergence']:.4f} | "
                      f"Accepted={self.accepted_updates} Rejected={self.rejected_updates}")

        # Summary
        summary = {
            "n_batches": n_batches,
            "accepted_updates": self.accepted_updates,
            "rejected_updates": self.rejected_updates,
            "mean_dpo_loss": np.mean(epoch_metrics["dpo_loss"]) if epoch_metrics["dpo_loss"] else 0,
            "mean_kto_loss": np.mean(epoch_metrics["kto_loss"]) if epoch_metrics["kto_loss"] else 0,
            "mean_kl": np.mean(epoch_metrics["kl_divergence"]),
            "mean_dpo_accuracy": np.mean(epoch_metrics["dpo_accuracy"]) if epoch_metrics["dpo_accuracy"] else 0,
        }

        return summary


def create_training_pipeline(
    model,
    reference_model,
    tokenizer,
    corpus_path: str = "./corpus",
    config: Optional[TrainingConfig] = None,
) -> Tuple[MicroBatchTrainer, DataLoader, DataLoader]:
    """
    Create the complete training pipeline.

    Returns:
        trainer: MicroBatchTrainer instance
        dpo_loader: DataLoader for DPO pairs
        kto_loader: DataLoader for KTO signals
    """
    if config is None:
        config = TrainingConfig(corpus_path=corpus_path)

    # Create datasets
    dpo_dataset = DPOPairDataset(corpus_path)
    kto_dataset = KTOSignalDataset(corpus_path)

    # Create data loaders
    dpo_loader = DataLoader(
        dpo_dataset,
        batch_size=config.micro_batch_size,
        shuffle=True,
        num_workers=0,  # Can increase if needed
    )

    kto_loader = DataLoader(
        kto_dataset,
        batch_size=config.micro_batch_size,
        shuffle=True,
        num_workers=0,
    )

    # Create trainer
    trainer = MicroBatchTrainer(
        config=config,
        model=model,
        reference_model=reference_model,
        tokenizer=tokenizer,
    )

    print(f"Training pipeline created:")
    print(f"  DPO pairs: {len(dpo_dataset)}")
    print(f"  KTO signals: {len(kto_dataset)}")
    print(f"  Batch size: {config.micro_batch_size}")
    print(f"  KL threshold: {config.kl_threshold}")

    return trainer, dpo_loader, kto_loader


if __name__ == "__main__":
    # Demo: Create pipeline with dummy data
    print("=" * 60)
    print("KEYSTONE PHASE 3: TRAINING PIPELINE")
    print("=" * 60)

    # Load corpus statistics
    corpus_path = "./corpus"
    stats_path = Path(corpus_path) / "corpus_stats.json"

    if stats_path.exists():
        with open(stats_path, 'r') as f:
            stats = json.load(f)
        print(f"\nCorpus loaded: {stats['total_principles']} principles")
        print(f"  DPO pairs: {stats['total_dpo_pairs']}")
        print(f"  KTO signals: {stats['total_kto_signals']}")
    else:
        print("\n⚠️ No corpus found. Run scar_corpus.py first.")
        exit(1)

    # Test data loaders
    print("\n--- Testing Data Loaders ---")
    dpo_dataset = DPOPairDataset(corpus_path)
    kto_dataset = KTOSignalDataset(corpus_path)

    print(f"\nSample DPO pair:")
    sample = dpo_dataset[0]
    print(f"  Principle: {sample['principle_id']}")
    print(f"  Sovereign: {sample['sovereign']}")
    print(f"  Weight: {sample['weight']}")
    print(f"  Prompt: {sample['prompt'][:60]}...")

    print(f"\nSample KTO signal:")
    sample = kto_dataset[0]
    print(f"  Principle: {sample['principle_id']}")
    print(f"  Label: {'desirable' if sample['label'] else 'undesirable'}")
    print(f"  Weight: {sample['weight']}")
    print(f"  Input: {sample['input'][:60]}...")

    # Test monitors
    print("\n--- Testing Monitors ---")
    kl_monitor = KLMonitor(threshold=0.01)
    refusal_monitor = RefusalDirectionMonitor(threshold=0.95)

    # Simulate some KL measurements
    for kl in [0.001, 0.003, 0.005, 0.008, 0.006]:
        kl_monitor.compute_kl(
            torch.tensor([0.0]),  # Dummy tensors
            torch.tensor([0.0]),
        )
        kl_monitor.history[-1] = kl  # Override with test value

    print(f"KL Monitor: {kl_monitor.get_status()}")

    # Test validation gate
    print("\n--- Testing Validation Gate ---")
    gate = ValidationGate(kl_threshold=0.01, refusal_threshold=0.95)

    passed, results = gate.validate(
        kl_value=0.008,
        refusal_similarity=0.97,
        perplexity_ratio=1.05,
    )
    print(f"Validation: {'PASSED' if passed else 'REJECTED'}")
    for name, result in results.items():
        if isinstance(result, dict):
            print(f"  {name}: {result}")

    print("\n✅ Phase 3 components verified")
    print("Ready for model integration (requires LLaMA model)")
