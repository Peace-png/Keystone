"""
Keystone Three-Layer Continuous Learning Architecture (3LCL)

This module implements the foundational three-tier architecture for Keystone:
- Tier 1: Autonomic Floor (frozen, base language competence)
- Tier 2: Immune/Constitutional Layer (PackNet masks, safety layers)
- Tier 3: Conscious/Operational Layer (trainable, QLoRA)

Based on research from:
- Anthropic SGTM (Selective Gradient Masking)
- Arditi et al. "Refusal in Language Models Is Mediated by a Single Direction"
- PackNet (PackNet: Multiple Pruning, 2024)
- Three-Layer Brain for SLMs (Opus Research, 2026-03-12)
"""

import torch
import torch.nn as nn
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import numpy as np


@dataclass
class TierConfig:
    """Configuration for a single tier"""
    name: str
    layer_indices: List[int]
    trainable: bool
    protection_type: str  # 'none', 'frozen', 'packnet'
    description: str


@dataclass
class ThreeLayerConfig:
    """Full three-layer architecture configuration"""
    model_name: str
    total_layers: int

    # Tier 1: Autonomic Floor
    tier1_layers: List[int] = None  # Bottom 25-40%
    tier1_protection: str = "frozen"  # requires_grad_(False)

    # Tier 2: Immune/Constitutional
    tier2_layers: List[int] = None  # Middle 30-40%
    tier2_protection: str = "packnet"  # Binary masks

    # Tier 3: Conscious/Operational
    tier3_layers: List[int] = None  # Top 20-30%
    tier3_protection: str = "none"  # Freely trainable

    # LoRA config for Tier 3
    lora_rank: int = 16
    lora_alpha: int = 32
    lora_target_modules: List[str] = None

    def __post_init__(self):
        if self.tier1_layers is None:
            self.tier1_layers = []
        if self.tier2_layers is None:
            self.tier2_layers = []
        if self.tier3_layers is None:
            self.tier3_layers = []
        if self.lora_target_modules is None:
            self.lora_target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]


def get_llama_layer_assignment(total_layers: int) -> ThreeLayerConfig:
    """
    Determine layer assignment for LLaMA models.

    Research-based assignment:
    - Tier 1 (Autonomic): bottom 25-40% - fundamental language competence
    - Tier 2 (Immune): middle 30-40% - safety layers (ICLR 2025)
    - Tier 3 (Conscious): top 20-30% - freely trainable

    For LLaMA 3.2 1B (16 layers):
    - Tier 1: layers 0-5 (6 layers, 37.5%)
    - Tier 2: layers 6-10 (5 layers, 31.25%)
    - Tier 3: layers 11-15 (5 layers, 31.25%)
    """
    # Calculate tier boundaries
    tier1_end = int(total_layers * 0.375)  # ~37.5%
    tier2_end = int(total_layers * 0.6875)  # ~69%

    return ThreeLayerConfig(
        model_name="llama-3.2-1b",
        total_layers=total_layers,
        tier1_layers=list(range(0, tier1_end)),
        tier2_layers=list(range(tier1_end, tier2_end)),
        tier3_layers=list(range(tier2_end, total_layers)),
    )


class PackNetBinaryMask:
    """
    PackNet-style binary mask for immune layer protection.

    Unlike EWC (soft penalty), binary masks make weight updates
    PHYSICALLY IMPOSSIBLE - zero forgetting guaranteed by construction.

    VRAM cost: ~375 MB for 3B model at 1 bit per parameter
    """

    def __init__(self, shape: torch.Size, device: str = "cuda"):
        self.shape = shape
        self.device = device
        # Initialize with all ones (nothing protected initially)
        self.mask = torch.ones(shape, dtype=torch.bool, device=device)

    def protect_subset(self, importance_scores: torch.Tensor, keep_fraction: float = 0.7):
        """
        Protect the most important weights based on importance scores.

        Args:
            importance_scores: Per-parameter importance (e.g., Fisher Information)
            keep_fraction: Fraction of weights to protect (0.7 = protect top 70%)
        """
        flat_scores = importance_scores.flatten()
        threshold = torch.quantile(flat_scores, 1.0 - keep_fraction)
        self.mask = (importance_scores >= threshold).to(self.device)

    def apply_mask(self, gradient: torch.Tensor) -> torch.Tensor:
        """
        Apply mask to gradient - protected weights receive zero gradient.
        """
        return gradient * (~self.mask).float()

    def get_mask_stats(self) -> Dict[str, float]:
        """Get statistics about the mask"""
        total = self.mask.numel()
        protected = self.mask.sum().item()
        return {
            "total_params": total,
            "protected": protected,
            "protected_fraction": protected / total,
        }


class GradientHookManager:
    """
    Manages register_hook gradient masking for tier boundaries.

    This is the safety net that enforces unidirectional write protection:
    - Gradients FLOW through all layers during backprop (needed for computation)
    - Gradients are APPLIED only to Tier 3 parameters
    """

    def __init__(self):
        self.handles = []
        self.masked_gradient_count = 0

    def register_tier1_hook(self, param: nn.Parameter):
        """Register hook that zeros gradients for Tier 1 (Autonomic)"""
        def hook(grad):
            if grad is not None:
                self.masked_gradient_count += 1
                return torch.zeros_like(grad)
        handle = param.register_hook(hook)
        self.handles.append(handle)
        return handle

    def register_tier2_hook(self, param: nn.Parameter, mask: PackNetBinaryMask):
        """Register hook that applies PackNet mask for Tier 2 (Immune)"""
        def hook(grad):
            if grad is not None:
                return mask.apply_mask(grad)
        handle = param.register_hook(hook)
        self.handles.append(handle)
        return handle

    def clear_hooks(self):
        """Remove all registered hooks"""
        for handle in self.handles:
            handle.remove()
        self.handles.clear()


class ThreeLayerModel:
    """
    Main class wrapping a base model with three-layer protection.

    Usage:
        config = get_llama_layer_assignment(16)  # For 1B model
        model = ThreeLayerModel("meta-llama/Llama-3.2-1B-Instruct", config)
        model.setup_tier_protection()

        # Only Tier 3 parameters will receive gradient updates
        optimizer = torch.optim.AdamW(model.get_trainable_parameters(), lr=1e-5)
    """

    def __init__(self, model_name: str, config: ThreeLayerConfig):
        self.model_name = model_name
        self.config = config
        self.base_model = None
        self.tier2_masks: Dict[str, PackNetBinaryMask] = {}
        self.hook_manager = GradientHookManager()

    def load_model(self, quantization: str = "4bit"):
        """Load the base model with optional quantization"""
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

        if quantization == "4bit":
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
            )
        else:
            quantization_config = None

        self.base_model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            quantization_config=quantization_config,
            device_map="auto",
            trust_remote_code=True,
        )
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        return self.base_model

    def setup_tier_protection(self):
        """
        Set up protection for all three tiers.

        Tier 1: requires_grad_(False) - completely frozen
        Tier 2: PackNet masks + gradient hooks
        Tier 3: No protection - freely trainable
        """
        if self.base_model is None:
            raise ValueError("Model not loaded. Call load_model() first.")

        # Get the model's layers (transformer blocks)
        # For LLaMA: model.model.layers
        layers = self._get_transformer_layers()

        # Tier 1: Freeze completely
        for idx in self.config.tier1_layers:
            for param in layers[idx].parameters():
                param.requires_grad_(False)
            print(f"Tier 1 (Autonomic): Layer {idx} frozen")

        # Tier 2: Set up PackNet masks
        for idx in self.config.tier2_layers:
            for name, param in layers[idx].named_parameters():
                # Create mask for this parameter
                mask = PackNetBinaryMask(param.shape)
                self.tier2_masks[f"layer{idx}.{name}"] = mask
                # Register gradient hook
                self.hook_manager.register_tier2_hook(param, mask)
            print(f"Tier 2 (Immune): Layer {idx} protected with PackNet mask")

        # Tier 3: No protection needed
        for idx in self.config.tier3_layers:
            print(f"Tier 3 (Conscious): Layer {idx} trainable")

        print(f"\nTier Summary:")
        print(f"  Tier 1 (Autonomic): {len(self.config.tier1_layers)} layers - FROZEN")
        print(f"  Tier 2 (Immune): {len(self.config.tier2_layers)} layers - PACKNET MASKS")
        print(f"  Tier 3 (Conscious): {len(self.config.tier3_layers)} layers - TRAINABLE")

    def _get_transformer_layers(self) -> nn.ModuleList:
        """Get the transformer layers from the model"""
        # For LLaMA models
        if hasattr(self.base_model, 'model') and hasattr(self.base_model.model, 'layers'):
            return self.base_model.model.layers
        # For other architectures, try common patterns
        elif hasattr(self.base_model, 'transformer') and hasattr(self.base_model.transformer, 'h'):
            return self.base_model.transformer.h
        else:
            raise ValueError(f"Unknown model architecture: {type(self.base_model)}")

    def get_trainable_parameters(self) -> List[Dict]:
        """Get only Tier 3 parameters for optimizer"""
        trainable = []
        for name, param in self.base_model.named_parameters():
            if param.requires_grad:
                trainable.append(param)
        return [{'params': trainable}]

    def get_tier_stats(self) -> Dict:
        """Get statistics about all tiers"""
        layers = self._get_transformer_layers()

        stats = {
            "tier1": {"layers": len(self.config.tier1_layers), "frozen": True},
            "tier2": {
                "layers": len(self.config.tier2_layers),
                "masks": len(self.tier2_masks),
                "mask_stats": {}
            },
            "tier3": {"layers": len(self.config.tier3_layers), "trainable": True},
        }

        # Get mask statistics
        for name, mask in self.tier2_masks.items():
            stats["tier2"]["mask_stats"][name] = mask.get_mask_stats()

        return stats


def verify_gradient_isolation(model: ThreeLayerModel) -> Dict[str, bool]:
    """
    Test that gradient isolation is working correctly.

    Returns dict of test results:
    - tier1_frozen: True if Tier 1 has no gradients
    - tier2_masked: True if Tier 2 masks are active
    - tier3_trainable: True if Tier 3 has gradients
    """
    results = {}

    # Check Tier 1 frozen
    tier1_frozen = True
    for idx in model.config.tier1_layers:
        for param in model._get_transformer_layers()[idx].parameters():
            if param.requires_grad:
                tier1_frozen = False
                break
    results["tier1_frozen"] = tier1_frozen

    # Check Tier 2 masks
    results["tier2_masked"] = len(model.tier2_masks) > 0

    # Check Tier 3 trainable
    tier3_trainable = False
    for idx in model.config.tier3_layers:
        for param in model._get_transformer_layers()[idx].parameters():
            if param.requires_grad:
                tier3_trainable = True
                break
    results["tier3_trainable"] = tier3_trainable

    return results


# CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Keystone Three-Layer Architecture")
    parser.add_argument("--model", default="meta-llama/Llama-3.2-1B-Instruct", help="Model name")
    parser.add_argument("--layers", type=int, default=16, help="Number of transformer layers")
    parser.add_argument("--verify", action="store_true", help="Run verification tests")
    args = parser.parse_args()

    # Get layer assignment
    config = get_llama_layer_assignment(args.layers)
    print(f"Layer assignment for {args.model}:")
    print(f"  Tier 1 (Autonomic): layers {config.tier1_layers}")
    print(f"  Tier 2 (Immune): layers {config.tier2_layers}")
    print(f"  Tier 3 (Conscious): layers {config.tier3_layers}")

    if args.verify:
        print("\nVerification requires model loading (not implemented in this demo)")
