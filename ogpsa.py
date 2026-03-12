"""
OGPSA: Orthogonal Gradient Projection for Safety Alignment

Implements gradient projection that prevents safety updates from degrading
capability, while allowing the Constitutional Layer to be trained.

Based on:
- "Safety Alignment as Continual Learning" (arXiv:2602.07892)
- Orthogonal gradient projection methods from continual learning

Key insight: Project safety gradients onto the orthogonal complement of
the capability subspace, so safety improves without capability degradation.
"""

import torch
import torch.nn as nn
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import numpy as np


@dataclass
class OGPSAConfig:
    """Configuration for OGPSA gradient projection."""
    projection_strength: float = 1.0  # How strongly to project (1.0 = full orthogonal)
    capability_reg_alpha: float = 0.1  # Capability regularization weight
    safety_reg_beta: float = 0.1  # Safety regularization weight
    accumulate_capability_directions: bool = True  # Update directions over time


@dataclass
class ProjectionResult:
    """Result of gradient projection."""
    original_gradient_norm: float
    projected_gradient_norm: float
    projection_magnitude: float  # How much was projected away
    capability_overlap: float  # Original overlap with capability subspace


class CapabilitySubspaceTracker:
    """
    Tracks the capability subspace direction for each parameter.

    The capability subspace is defined as the direction in parameter space
    that most affects general capability (measured via MMLU-style tasks).

    We approximate this by:
    1. Computing gradients on capability tasks
    2. Accumulating a running estimate of the principal direction
    3. Using this for orthogonal projection during safety training
    """

    def __init__(self, model: nn.Module, momentum: float = 0.9):
        self.model = model
        self.momentum = momentum

        # Track capability direction for each parameter
        self.capability_directions: Dict[str, torch.Tensor] = {}

        # Initialize with small random directions
        for name, param in model.named_parameters():
            if param.requires_grad and 'lora' in name.lower():
                direction = torch.randn_like(param.data)
                direction = direction / (direction.norm() + 1e-8)
                self.capability_directions[name] = direction

    @torch.no_grad()
    def update_from_capability_gradient(self, named_parameters: Dict[str, torch.Tensor]):
        """
        Update capability direction estimates from observed capability gradients.

        Uses exponential moving average to track the principal direction.
        """
        for name, grad in named_parameters.items():
            if name in self.capability_directions:
                # Normalize gradient
                grad_norm = grad.norm()
                if grad_norm > 1e-8:
                    normalized_grad = grad / grad_norm

                    # EMA update
                    current = self.capability_directions[name]
                    updated = self.momentum * current + (1 - self.momentum) * normalized_grad
                    updated = updated / (updated.norm() + 1e-8)
                    self.capability_directions[name] = updated

    def get_capability_direction(self, name: str) -> Optional[torch.Tensor]:
        """Get the capability direction for a parameter."""
        return self.capability_directions.get(name)


class OGPSA:
    """
    Orthogonal Gradient Projection for Safety Alignment.

    Usage:
        ogpsa = OGPSA(model, config)

        # Before optimizer.step():
        for name, param in model.named_parameters():
            if param.grad is not None and ogpsa.should_project(name):
                param.grad = ogpsa.project_gradient(name, param.grad)
    """

    def __init__(
        self,
        model: nn.Module,
        config: OGPSAConfig = None,
        constitutional_layer_indices: List[int] = None,
    ):
        self.model = model
        self.config = config or OGPSAConfig()
        self.constitutional_layer_indices = constitutional_layer_indices or list(range(6, 11))

        # Track capability subspace
        self.subspace_tracker = CapabilitySubspaceTracker(model)

        # Statistics
        self.projection_history: List[ProjectionResult] = []

    def is_constitutional_param(self, name: str) -> bool:
        """Check if parameter is in Constitutional Layer."""
        # Check for layer indices in parameter name
        for idx in self.constitutional_layer_indices:
            if f"layers.{idx}." in name:
                return True
        return False

    def should_project(self, name: str) -> bool:
        """Determine if gradient for this parameter should be projected."""
        # Only project Constitutional Layer parameters that have LoRA
        return self.is_constitutional_param(name) and 'lora' in name.lower()

    def project_gradient(self, name: str, gradient: torch.Tensor) -> torch.Tensor:
        """
        Project gradient onto orthogonal complement of capability subspace.

        This ensures the update moves toward safety without degrading capability.
        """
        cap_direction = self.subspace_tracker.get_capability_direction(name)

        if cap_direction is None:
            return gradient

        # Flatten for projection computation
        grad_flat = gradient.flatten().float()
        cap_flat = cap_direction.flatten().float()

        # Compute projection of gradient onto capability direction
        cap_norm_sq = torch.dot(cap_flat, cap_flat)
        if cap_norm_sq < 1e-10:
            return gradient

        projection_coeff = torch.dot(grad_flat, cap_flat) / cap_norm_sq

        # Compute capability overlap (for monitoring)
        grad_norm = grad_flat.norm()
        capability_overlap = abs(projection_coeff.item()) * cap_flat.norm() / (grad_norm + 1e-8)

        # Project gradient onto orthogonal complement
        projected_flat = grad_flat - self.config.projection_strength * projection_coeff * cap_flat

        # Reshape back
        projected = projected_flat.reshape(gradient.shape).to(gradient.dtype)

        # Record statistics
        self.projection_history.append(ProjectionResult(
            original_gradient_norm=grad_norm.item(),
            projected_gradient_norm=projected_flat.norm().item(),
            projection_magnitude=abs(projection_coeff.item()) * cap_flat.norm().item(),
            capability_overlap=capability_overlap.item(),
        ))

        return projected

    def project_all_gradients(self):
        """
        Project gradients for all Constitutional Layer parameters.

        Call this before optimizer.step().
        """
        for name, param in self.model.named_parameters():
            if param.grad is not None and self.should_project(name):
                param.grad = self.project_gradient(name, param.grad)

    @torch.no_grad()
    def update_capability_directions(self):
        """
        Update capability directions from current gradients.

        Should be called after capability-related backward pass.
        """
        grads = {}
        for name, param in self.model.named_parameters():
            if param.grad is not None and 'lora' in name.lower():
                grads[name] = param.grad.clone()

        self.subspace_tracker.update_from_capability_gradient(grads)

    def get_stats(self) -> Dict:
        """Get projection statistics."""
        if not self.projection_history:
            return {"projections": 0}

        recent = self.projection_history[-100:]  # Last 100 projections

        return {
            "projections": len(self.projection_history),
            "avg_original_norm": np.mean([p.original_gradient_norm for p in recent]),
            "avg_projected_norm": np.mean([p.projected_gradient_norm for p in recent]),
            "avg_projection_magnitude": np.mean([p.projection_magnitude for p in recent]),
            "avg_capability_overlap": np.mean([p.capability_overlap for p in recent]),
        }


class OverlapScoreComputer:
    """
    Computes the Overlap Score from "Geometry of Alignment Collapse" (arXiv:2602.15799).

    The Overlap Score measures how much a proposed weight update projects onto
    the safety-critical subspace. High overlap predicts safety degradation.

    Score = ||P_U(ΔW)||_F / ||ΔW||_F

    Where U is the safety subspace basis.
    """

    def __init__(self, model: nn.Module, device: str = "cuda"):
        self.model = model
        self.device = device
        self.safety_subspace_basis: Optional[Dict[str, torch.Tensor]] = None

    @torch.no_grad()
    def extract_safety_subspace(
        self,
        harmful_prompts: List[str],
        harmless_prompts: List[str],
        tokenizer,
        layer_indices: List[int],
        k_components: int = 10,
    ) -> Dict[str, torch.Tensor]:
        """
        Extract safety-critical subspace via contrastive activation analysis.

        Returns orthonormal basis for safety subspace at each layer.
        """
        from refusal_direction import RefusalDirectionExtractor

        extractor = RefusalDirectionExtractor(self.model, tokenizer, self.device)

        subspace_basis = {}

        for layer_idx in layer_indices:
            # Get activations for harmful and harmless prompts
            harmful_acts = extractor.get_activations(harmful_prompts[:20], layer_idx)
            harmless_acts = extractor.get_activations(harmless_prompts[:20], layer_idx)

            # Compute contrastive activations
            contrastive = harmful_acts - harmless_acts  # [N, hidden_dim]

            # SVD to get principal directions
            U, S, V = torch.svd(contrastive.float(), full_matrices=False)

            # Keep top-k components as safety subspace
            subspace_basis[f"layer_{layer_idx}"] = V[:, :k_components]  # [hidden_dim, k]

        self.safety_subspace_basis = subspace_basis
        return subspace_basis

    def compute_overlap_score(
        self,
        weight_delta: Dict[str, torch.Tensor],
    ) -> Tuple[float, Dict[str, float]]:
        """
        Compute overlap score for a weight update.

        Returns:
            (overall_score, per_layer_scores)
        """
        if self.safety_subspace_basis is None:
            raise ValueError("Must call extract_safety_subspace first")

        per_layer_scores = {}
        total_projection_norm = 0.0
        total_delta_norm = 0.0

        for name, subspace in self.safety_subspace_basis.items():
            # Find corresponding weight delta
            # This is simplified - actual implementation would match param names
            if name in weight_delta:
                delta = weight_delta[name].flatten().float()
                delta_norm = delta.norm()

                if delta_norm > 1e-8:
                    # Project onto safety subspace
                    projection = subspace @ (subspace.T @ delta)
                    projection_norm = projection.norm()

                    per_layer_scores[name] = projection_norm.item() / delta_norm.item()
                    total_projection_norm += projection_norm.item() ** 2
                    total_delta_norm += delta_norm.item() ** 2

        overall_score = np.sqrt(total_projection_norm) / (np.sqrt(total_delta_norm) + 1e-8)

        return overall_score, per_layer_scores


# Integration with training loop

def create_ogpsa_for_lora(
    model: nn.Module,
    constitutional_layers: List[int] = None,
) -> OGPSA:
    """
    Create OGPSA instance configured for LoRA-based Constitutional Layer training.
    """
    config = OGPSAConfig(
        projection_strength=1.0,
        capability_reg_alpha=0.1,
        safety_reg_beta=0.1,
    )

    return OGPSA(
        model,
        config=config,
        constitutional_layer_indices=constitutional_layers or list(range(6, 11)),
    )


if __name__ == "__main__":
    print("OGPSA module ready")
    print("Key classes:")
    print("  - OGPSA: Main gradient projection class")
    print("  - CapabilitySubspaceTracker: Tracks capability directions")
    print("  - OverlapScoreComputer: Computes alignment collapse prediction")
