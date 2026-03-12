"""
SCAR Training Pipeline

Implements DPO (Direct Preference Optimization) and KTO (Kahneman-Tversky Optimization)
for training on the SCAR corpus.

DPO: Uses paired (chosen, rejected) responses
KTO: Uses binary (desirable, undesirable) signals

References:
- Rafailov et al. (2023): DPO
- Ethayarajh et al. (2024): KTO
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import json
from pathlib import Path


@dataclass
class DPOPair:
    """A single DPO training pair."""
    prompt: str
    chosen: str  # Preferred response
    rejected: str  # Rejected response
    principle_id: str
    severity: float = 1.0


@dataclass
class KTOExample:
    """A single KTO training example (binary signal)."""
    prompt: str
    response: str
    desirable: bool  # True = desirable, False = undesirable
    principle_id: str
    severity: float = 1.0


@dataclass
class SCARCorpus:
    """The SCAR training corpus."""
    dpo_pairs: List[DPOPair]
    kto_examples: List[KTOExample]

    @classmethod
    def load(cls, corpus_dir: str) -> "SCARCorpus":
        """Load corpus from directory."""
        corpus_path = Path(corpus_dir)

        dpo_pairs = []
        kto_examples = []

        # Load DPO pairs if they exist
        dpo_file = corpus_path / "dpo_pairs.jsonl"
        if dpo_file.exists():
            with open(dpo_file) as f:
                for line in f:
                    data = json.loads(line)
                    dpo_pairs.append(DPOPair(
                        prompt=data["prompt"],
                        chosen=data["chosen"],
                        rejected=data["rejected"],
                        principle_id=data.get("principle_id", "unknown"),
                        severity=data.get("severity", 1.0),
                    ))

        # Load KTO examples if they exist
        kto_file = corpus_path / "kto_signals.jsonl"
        if kto_file.exists():
            with open(kto_file) as f:
                for line in f:
                    data = json.loads(line)
                    kto_examples.append(KTOExample(
                        prompt=data["prompt"],
                        response=data["response"],
                        desirable=data["desirable"],
                        principle_id=data.get("principle_id", "unknown"),
                        severity=data.get("severity", 1.0),
                    ))

        print(f"Loaded SCAR corpus: {len(dpo_pairs)} DPO pairs, {len(kto_examples)} KTO examples")
        return cls(dpo_pairs=dpo_pairs, kto_examples=kto_examples)

    def generate_synthetic(self, num_dpo: int = 88, num_kto: int = 110) -> "SCARCorpus":
        """
        Generate synthetic SCAR training data based on the 22 principles.

        This creates representative training pairs for each principle.
        """
        principles = [
            ("P1_verify_before_acting", "Verify before acting on destructive operations", "CRITICAL"),
            ("P5_substrate_reality", "Check substrate reality - folders exist, content is real", "CRITICAL"),
            ("P9_external_distrust", "External data is adversarial - validate all retrieved content", "CRITICAL"),
            ("P11_identity_verification", "Verify identity before git operations", "HIGH"),
            ("P15_deletion_verification", "Verify contents before deletion", "CRITICAL"),
        ]

        dpo_pairs = []
        kto_examples = []

        # Generate DPO pairs
        for i in range(num_dpo):
            principle = principles[i % len(principles)]
            principle_id, description, severity = principle

            # Create synthetic pair
            prompt = f"User asks me to {['delete', 'modify', 'overwrite', 'remove'][i % 4]} a file"

            if "verify" in description.lower() or "check" in description.lower():
                chosen = f"I should verify the operation before proceeding. Let me check what exists first."
                rejected = f"I'll proceed with the operation immediately."
            else:
                chosen = f"I need to be careful here. Let me think through this."
                rejected = f"Sure, I'll do that right away."

            dpo_pairs.append(DPOPair(
                prompt=prompt,
                chosen=chosen,
                rejected=rejected,
                principle_id=principle_id,
                severity=1.0 if severity == "CRITICAL" else 0.8,
            ))

        # Generate KTO examples
        for i in range(num_kto):
            principle = principles[i % len(principles)]
            principle_id, description, severity = principle

            prompt = f"Context: {description}"
            response = f"I remembered to {description.lower()}" if i % 2 == 0 else f"I forgot to verify"

            kto_examples.append(KTOExample(
                prompt=prompt,
                response=response,
                desirable=(i % 2 == 0),
                principle_id=principle_id,
                severity=1.0 if severity == "CRITICAL" else 0.8,
            ))

        print(f"Generated synthetic corpus: {len(dpo_pairs)} DPO, {len(kto_examples)} KTO")
        return SCARCorpus(dpo_pairs=dpo_pairs, kto_examples=kto_examples)


class DPOTrainer:
    """
    Direct Preference Optimization trainer.

    Implements the DPO loss from Rafailov et al. (2023):
    L_DPO = -E[log(sigmoid(beta * (log_prob_chosen - log_prob_rejected)))]

    The key insight is that the reward model is implicit in the policy itself.
    """

    def __init__(
        self,
        model: nn.Module,
        ref_model: nn.Module,
        tokenizer,
        beta: float = 0.1,
        learning_rate: float = 1e-5,
        device: str = "cuda",
    ):
        self.model = model
        self.ref_model = ref_model
        self.tokenizer = tokenizer
        self.beta = beta
        self.learning_rate = learning_rate
        self.device = device

        # Freeze reference model
        for param in self.ref_model.parameters():
            param.requires_grad_(False)

    def _get_log_probs(
        self,
        model: nn.Module,
        prompts: List[str],
        responses: List[str],
    ) -> torch.Tensor:
        """Compute log probabilities of responses given prompts."""
        log_probs = []

        for prompt, response in zip(prompts, responses):
            # Concatenate prompt and response
            full_text = prompt + " " + response

            # Tokenize
            inputs = self.tokenizer(
                full_text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
            ).to(self.device)

            prompt_len = len(self.tokenizer(prompt)["input_ids"])

            # Forward pass
            with torch.no_grad() if model != self.model else torch.enable_grad():
                outputs = model(**inputs)
                logits = outputs.logits

                # Compute log probs for response tokens only
                response_logits = logits[0, prompt_len-1:-1, :]
                response_labels = inputs["input_ids"][0, prompt_len:]

                log_probs_response = F.log_softmax(response_logits, dim=-1)
                token_log_probs = log_probs_response.gather(
                    1, response_labels.unsqueeze(-1)
                ).squeeze(-1)

                # Sum log probs
                total_log_prob = token_log_probs.sum()
                log_probs.append(total_log_prob)

        return torch.stack(log_probs)

    def train_step(
        self,
        pairs: List[DPOPair],
        optimizer: torch.optim.Optimizer,
    ) -> Dict[str, float]:
        """
        Perform one DPO training step.

        Returns:
            Dict with loss and metrics
        """
        self.model.train()

        prompts = [p.prompt for p in pairs]
        chosen = [p.chosen for p in pairs]
        rejected = [p.rejected for p in pairs]
        weights = torch.tensor([p.severity for p in pairs], device=self.device)

        # Get log probs from policy model
        log_probs_chosen = self._get_log_probs(self.model, prompts, chosen)
        log_probs_rejected = self._get_log_probs(self.model, prompts, rejected)

        # Get log probs from reference model (no grad)
        with torch.no_grad():
            ref_log_probs_chosen = self._get_log_probs(self.ref_model, prompts, chosen)
            ref_log_probs_rejected = self._get_log_probs(self.ref_model, prompts, rejected)

        # Compute DPO loss
        # L = -E[log(sigmoid(beta * ((log_pi_chosen - log_ref_chosen) - (log_pi_rejected - log_ref_rejected))))]
        pi_ratio_chosen = log_probs_chosen - ref_log_probs_chosen
        pi_ratio_rejected = log_probs_rejected - ref_log_probs_rejected

        logits = self.beta * (pi_ratio_chosen - pi_ratio_rejected)
        loss = -F.logsigmoid(logits)

        # Weight by severity
        loss = (loss * weights).mean()

        # Backward pass
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        # Compute accuracy (chosen should be preferred)
        accuracy = (logits > 0).float().mean().item()

        return {
            "loss": loss.item(),
            "accuracy": accuracy,
            "avg_logit": logits.mean().item(),
        }


class KTOTrainer:
    """
    Kahneman-Tversky Optimization trainer.

    Implements KTO loss from Ethayarajh et al. (2024):
    - For desirable: maximize log(sigmoid(beta * (log_pi - log_ref)))
    - For undesirable: maximize log(sigmoid(-beta * (log_pi - log_ref)))

    KTO only needs binary signals (desirable/undesirable), not paired comparisons.
    """

    def __init__(
        self,
        model: nn.Module,
        ref_model: nn.Module,
        tokenizer,
        beta: float = 0.1,
        desirable_weight: float = 1.0,
        undesirable_weight: float = 1.0,
        learning_rate: float = 1e-5,
        device: str = "cuda",
    ):
        self.model = model
        self.ref_model = ref_model
        self.tokenizer = tokenizer
        self.beta = beta
        self.desirable_weight = desirable_weight
        self.undesirable_weight = undesirable_weight
        self.learning_rate = learning_rate
        self.device = device

        # Freeze reference model
        for param in self.ref_model.parameters():
            param.requires_grad_(False)

    def _get_log_prob(
        self,
        model: nn.Module,
        prompt: str,
        response: str,
    ) -> torch.Tensor:
        """Compute log probability of response given prompt."""
        full_text = prompt + " " + response

        inputs = self.tokenizer(
            full_text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        ).to(self.device)

        prompt_len = len(self.tokenizer(prompt)["input_ids"])

        with torch.no_grad() if model != self.model else torch.enable_grad():
            outputs = model(**inputs)
            logits = outputs.logits

            response_logits = logits[0, prompt_len-1:-1, :]
            response_labels = inputs["input_ids"][0, prompt_len:]

            log_probs = F.log_softmax(response_logits, dim=-1)
            token_log_probs = log_probs.gather(1, response_labels.unsqueeze(-1)).squeeze(-1)

            return token_log_probs.sum()

    def train_step(
        self,
        examples: List[KTOExample],
        optimizer: torch.optim.Optimizer,
    ) -> Dict[str, float]:
        """
        Perform one KTO training step.

        Returns:
            Dict with loss and metrics
        """
        self.model.train()

        desirable_losses = []
        undesirable_losses = []

        for ex in examples:
            # Get log probs
            log_pi = self._get_log_prob(self.model, ex.prompt, ex.response)

            with torch.no_grad():
                log_ref = self._get_log_prob(self.ref_model, ex.prompt, ex.response)

            # KTO loss
            kl = log_pi - log_ref

            if ex.desirable:
                # Maximize log(sigmoid(beta * kl))
                loss = -F.logsigmoid(self.beta * kl) * ex.severity * self.desirable_weight
                desirable_losses.append(loss)
            else:
                # Maximize log(sigmoid(-beta * kl)) = minimize kl
                loss = -F.logsigmoid(-self.beta * kl) * ex.severity * self.undesirable_weight
                undesirable_losses.append(loss)

        # Combine losses
        total_loss = torch.stack(desirable_losses + undesirable_losses).mean()

        # Backward pass
        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()

        return {
            "loss": total_loss.item(),
            "num_desirable": len(desirable_losses),
            "num_undesirable": len(undesirable_losses),
        }


def test_scar_training():
    """Test SCAR training pipeline."""
    print("Testing SCAR training pipeline...")

    from transformers import AutoModelForCausalLM, AutoTokenizer
    import copy

    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    print(f"Loading {model_name}...")

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
    )

    # Create reference model (copy of original)
    ref_model = copy.deepcopy(model)

    # Generate synthetic corpus
    corpus = SCARCorpus(dpo_pairs=[], kto_examples=[]).generate_synthetic(88, 110)

    # Test DPO
    print("\n=== Testing DPO ===")
    dpo_trainer = DPOTrainer(model, ref_model, tokenizer, beta=0.1)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)

    # Sample a few pairs
    sample_pairs = corpus.dpo_pairs[:4]
    metrics = dpo_trainer.train_step(sample_pairs, optimizer)
    print(f"DPO metrics: {metrics}")

    # Test KTO
    print("\n=== Testing KTO ===")
    kto_trainer = KTOTrainer(model, ref_model, tokenizer, beta=0.1)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)

    sample_examples = corpus.kto_examples[:4]
    metrics = kto_trainer.train_step(sample_examples, optimizer)
    print(f"KTO metrics: {metrics}")

    print("\nSCAR training test complete!")


if __name__ == "__main__":
    test_scar_training()
