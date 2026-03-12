"""
Orthogonal LoRA Merge

Implements orthogonal projection merging for LoRA adapters to minimize
interference with existing representations during consolidation.

Based on:
- Qiao et al. (2025): "Merge Before Forget: Orthogonal LoRA Merging for Continual Learning"
- PAM (2025): Projection-based adapter merging

Key insight: Project new adapter weights onto the orthogonal complement
of existing weights to minimize interference.
"""

import torch
import torch.nn as nn
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import copy


@dataclass
class MergeResult:
    """Result of an orthogonal merge operation."""
    success: bool
    interference_score: float  # Lower is better
    merged_params: int
    message: str


class OrthogonalLoRAMerger:
    """
    Merge LoRA adapters orthogonally to minimize interference.

    Usage:
        merger = OrthogonalLoRAMerger(model)
        result = merger.merge_adapters(alpha=1.0)
    """

    def __init__(self, model: nn.Module, device: str = "cuda"):
        self.model = model
        self.device = device

    def _get_base_weight(self, name: str) -> Optional[torch.Tensor]:
        """Get the base weight for a LoRA adapter."""
        # Navigate through PEFT model structure
        parts = name.split(".")

        # Try to find base layer
        current = self.model
        for i, part in enumerate(parts):
            if part == "lora_A" or part == "lora_B":
                # Back up to base layer
                base_path = parts[:i]
                base = self.model
                for p in base_path:
                    if hasattr(base, p):
                        base = getattr(base, p)
                    else:
                        return None
                if hasattr(base, "base_layer"):
                    return base.base_layer.weight.data
                elif hasattr(base, "weight"):
                    return base.weight.data
            if hasattr(current, part):
                current = getattr(current, part)
            else:
                return None
        return None

    def _gram_schmidt_orthogonalize(
        self,
        new_vector: torch.Tensor,
        existing_vectors: List[torch.Tensor],
    ) -> torch.Tensor:
        """
        Orthogonalize new_vector against existing_vectors using Gram-Schmidt.

        This projects new_vector onto the orthogonal complement of the
        space spanned by existing_vectors.
        """
        result = new_vector.clone().float()

        for existing in existing_vectors:
            existing_flat = existing.flatten().float()
            result_flat = result.flatten().float()

            # Compute projection coefficient
            if existing_flat.norm() > 1e-8:
                proj_coeff = torch.dot(result_flat, existing_flat) / torch.dot(existing_flat, existing_flat)
                result_flat = result_flat - proj_coeff * existing_flat
                result = result_flat.reshape(result.shape)

        return result.to(new_vector.dtype)

    def compute_interference(
        self,
        lora_A: torch.Tensor,
        lora_B: torch.Tensor,
        base_weight: torch.Tensor,
    ) -> float:
        """
        Compute interference score between LoRA delta and base weight.

        Lower is better - means the LoRA update is more orthogonal to
        the existing representation.

        Uses cosine similarity between the LoRA delta direction and
        the principal components of the base weight.
        """
        # Compute LoRA delta: delta_W = B @ A
        delta = (lora_B @ lora_A).flatten().float()
        base_flat = base_weight.flatten().float()

        # Cosine similarity
        cos_sim = torch.dot(delta, base_flat) / (delta.norm() * base_flat.norm() + 1e-8)

        # Return absolute cosine similarity as interference score
        return abs(cos_sim.item())

    def merge_single_adapter(
        self,
        lora_A: torch.Tensor,
        lora_B: torch.Tensor,
        base_weight: torch.Tensor,
        alpha: float = 1.0,
        orthogonalize: bool = True,
    ) -> Tuple[torch.Tensor, float]:
        """
        Merge a single LoRA adapter into base weight.

        Args:
            lora_A: LoRA A matrix (rank x in_features)
            lora_B: LoRA B matrix (out_features x rank)
            base_weight: Base weight matrix (out_features x in_features)
            alpha: Scaling factor for merge
            orthogonalize: Whether to orthogonalize before merging

        Returns:
            (merged_weight, interference_score)
        """
        # Store original dtype
        original_dtype = base_weight.dtype

        # Compute LoRA delta
        delta = alpha * (lora_B.to(original_dtype) @ lora_A.to(original_dtype))

        if orthogonalize:
            # Orthogonalize against base weight
            delta_flat = delta.flatten().float()
            base_flat = base_weight.flatten().float()

            # Project delta onto orthogonal complement of base
            if base_flat.norm() > 1e-8:
                proj = torch.dot(delta_flat, base_flat) / torch.dot(base_flat, base_flat)
                delta_orthogonal = delta_flat - proj * base_flat
                delta = delta_orthogonal.reshape(delta.shape).to(original_dtype)

        # Compute interference before merge
        interference = self.compute_interference(lora_A, lora_B, base_weight)

        # Merge (preserve dtype)
        merged = (base_weight + delta).to(original_dtype)

        return merged, interference

    def merge_adapters(
        self,
        alpha: float = 1.0,
        orthogonalize: bool = True,
        preserve_norm: bool = True,
    ) -> MergeResult:
        """
        Merge all LoRA adapters into base model orthogonally.

        Args:
            alpha: Scaling factor for merge
            orthogonalize: Whether to orthogonalize deltas
            preserve_norm: Whether to preserve weight norms after merge

        Returns:
            MergeResult with success status and metrics
        """
        print(f"\n{'='*60}")
        print("ORTHOGONAL LORA MERGE")
        print(f"{'='*60}")
        print(f"Alpha: {alpha}")
        print(f"Orthogonalize: {orthogonalize}")
        print(f"Preserve norm: {preserve_norm}")

        merged_count = 0
        interference_scores = []
        original_norms = {}

        # Find all LoRA adapters
        for name, module in self.model.named_modules():
            if hasattr(module, "lora_A") and hasattr(module, "lora_B"):
                # Get LoRA weights
                lora_A = module.lora_A.default.weight.data
                lora_B = module.lora_B.default.weight.data

                # Get base weight
                if hasattr(module, "base_layer"):
                    base_weight = module.base_layer.weight.data
                elif hasattr(module, "weight"):
                    base_weight = module.weight.data
                else:
                    print(f"  Skipping {name}: no base weight found")
                    continue

                # Store original norm
                if preserve_norm:
                    original_norms[name] = base_weight.norm().item()

                # Merge
                merged_weight, interference = self.merge_single_adapter(
                    lora_A, lora_B, base_weight,
                    alpha=alpha,
                    orthogonalize=orthogonalize,
                )

                # Update base weight
                if hasattr(module, "base_layer"):
                    module.base_layer.weight.data = merged_weight
                else:
                    module.weight.data = merged_weight

                # Preserve norm if requested
                if preserve_norm and name in original_norms:
                    current_norm = merged_weight.norm()
                    if current_norm > 1e-8:
                        module.base_layer.weight.data = merged_weight * (original_norms[name] / current_norm)

                merged_count += 1
                interference_scores.append(interference)

        avg_interference = sum(interference_scores) / len(interference_scores) if interference_scores else 0.0

        print(f"\nMerged {merged_count} adapters")
        print(f"Average interference: {avg_interference:.6f}")
        print(f"Max interference: {max(interference_scores):.6f}" if interference_scores else "No interference data")

        success = avg_interference < 0.5  # Threshold for acceptable interference

        return MergeResult(
            success=success,
            interference_score=avg_interference,
            merged_params=merged_count,
            message="Merge completed successfully" if success else "Merge had high interference",
        )

    def reset_adapters(self):
        """Reset all LoRA adapters to zero (for next training cycle)."""
        for name, module in self.model.named_modules():
            if hasattr(module, "lora_A") and hasattr(module, "lora_B"):
                nn.init.zeros_(module.lora_A.default.weight)
                nn.init.zeros_(module.lora_B.default.weight)
        print("LoRA adapters reset to zero")


class KLConstrainedMerger(OrthogonalLoRAMerger):
    """
    Extended merger with KL divergence constraint.

    Ensures that the merged model doesn't deviate too far from
    the original in terms of output distribution.
    """

    def __init__(self, model: nn.Module, tokenizer, device: str = "cuda", epsilon: float = 0.01):
        super().__init__(model, device)
        self.tokenizer = tokenizer
        self.epsilon = epsilon  # Max KL divergence allowed

    @torch.no_grad()
    def compute_kl_divergence(
        self,
        original_outputs: torch.Tensor,
        merged_outputs: torch.Tensor,
    ) -> float:
        """
        Compute KL divergence between original and merged model outputs.

        Args:
            original_outputs: Logits from original model
            merged_outputs: Logits from merged model

        Returns:
            KL divergence (scalar)
        """
        # Convert to probabilities
        p = torch.softmax(original_outputs, dim=-1)
        q = torch.softmax(merged_outputs, dim=-1)

        # KL(P || Q) = sum(P * log(P/Q))
        kl = (p * (torch.log(p + 1e-10) - torch.log(q + 1e-10))).sum(dim=-1).mean()

        return kl.item()

    def merge_with_kl_constraint(
        self,
        test_inputs: Dict[str, torch.Tensor],
        alpha: float = 1.0,
        max_iterations: int = 10,
    ) -> MergeResult:
        """
        Merge with KL divergence constraint.

        If KL exceeds epsilon, reduce alpha until it's within bounds.
        """
        # Store original outputs
        self.model.eval()
        with torch.no_grad():
            original_outputs = self.model(**test_inputs).logits

        # Try merge at full alpha
        current_alpha = alpha

        for iteration in range(max_iterations):
            # Merge
            result = self.merge_adapters(alpha=current_alpha, orthogonalize=True)

            # Check KL
            with torch.no_grad():
                merged_outputs = self.model(**test_inputs).logits
                kl = self.compute_kl_divergence(original_outputs, merged_outputs)

            print(f"Iteration {iteration + 1}: alpha={current_alpha:.4f}, KL={kl:.6f}")

            if kl <= self.epsilon:
                print(f"KL constraint satisfied: {kl:.6f} <= {self.epsilon}")
                return result

            # Reduce alpha
            current_alpha *= 0.5

        print(f"Warning: Could not satisfy KL constraint after {max_iterations} iterations")
        return result


def test_orthogonal_merge():
    """Test orthogonal LoRA merge."""
    print("Testing orthogonal LoRA merge...")

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import LoraConfig, get_peft_model, TaskType

    model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    print(f"Loading {model_name}...")

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto",
    )

    # Attach LoRA
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)

    # Simulate some training (random updates to LoRA)
    for name, param in model.named_parameters():
        if "lora" in name.lower() and param.requires_grad:
            param.data += torch.randn_like(param) * 0.01

    # Merge
    merger = OrthogonalLoRAMerger(model)
    result = merger.merge_adapters(alpha=1.0, orthogonalize=True)

    print(f"\n=== MERGE RESULT ===")
    print(f"Success: {result.success}")
    print(f"Interference: {result.interference_score:.6f}")
    print(f"Merged params: {result.merged_params}")
    print(f"Message: {result.message}")

    print("\nOrthogonal merge test complete!")


if __name__ == "__main__":
    test_orthogonal_merge()
