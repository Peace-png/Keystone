"""
Keystone LoRA Setup for Tier 3 (Conscious Layer)

This module sets up QLoRA (Quantized LoRA) for the Conscious/Operational tier.
Only Tier 3 layers receive LoRA adapters - Tiers 1 and 2 are protected.

Based on:
- PEFT library for LoRA implementation
- QLoRA paper (Dettmers et al., 2023)
- Three-Layer Brain research (2026-03-12)
"""

import torch
from typing import List, Dict, Optional
from dataclasses import dataclass
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType,
)
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig


@dataclass
class LoRAConfig:
    """Configuration for LoRA adapters on Tier 3"""
    rank: int = 16
    alpha: int = 32
    dropout: float = 0.05
    bias: str = "none"
    target_modules: List[str] = None

    def __post_init__(self):
        if self.target_modules is None:
            # All linear layers in transformer
            self.target_modules = [
                "q_proj", "k_proj", "v_proj", "o_proj",  # Attention
                "gate_proj", "up_proj", "down_proj",  # MLP
            ]

    def to_peft_config(self, target_layers: List[int]) -> LoraConfig:
        """Convert to PEFT LoraConfig"""
        return LoraConfig(
            r=self.rank,
            lora_alpha=self.alpha,
            lora_dropout=self.dropout,
            bias=self.bias,
            target_modules=self.target_modules,
            layers_to_transform=target_layers,  # Only apply to Tier 3!
            task_type=TaskType.CAUSAL_LM,
        )


class Tier3LoRASetup:
    """
    Sets up LoRA adapters ONLY on Tier 3 (Conscious) layers.

    Key principle: LoRA adapters on Tiers 1-2 are READ-ONLY during normal training.
    Only Tier 3's adapter weights receive gradients.
    """

    def __init__(
        self,
        model_name: str,
        tier3_layer_indices: List[int],
        lora_config: Optional[LoRAConfig] = None,
    ):
        self.model_name = model_name
        self.tier3_layers = tier3_layer_indices
        self.lora_config = lora_config or LoRAConfig()
        self.model = None
        self.tokenizer = None
        self.peft_config = None

    def load_and_setup(self, quantization: str = "4bit") -> tuple:
        """
        Load model with quantization and set up LoRA on Tier 3.

        Returns: (model, tokenizer)
        """
        # Quantization config
        if quantization == "4bit":
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
        elif quantization == "8bit":
            bnb_config = BitsAndBytesConfig(load_in_8bit=True)
        else:
            bnb_config = None

        # Load base model
        print(f"Loading {self.model_name}...")
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
        )
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

        # Prepare for k-bit training (required for QLoRA)
        print("Preparing model for k-bit training...")
        self.model = prepare_model_for_kbit_training(self.model)

        # Create PEFT config targeting only Tier 3 layers
        self.peft_config = self.lora_config.to_peft_config(self.tier3_layers)

        # Apply LoRA
        print(f"Applying LoRA (rank={self.lora_config.rank}) to Tier 3 layers: {self.tier3_layers}")
        self.model = get_peft_model(self.model, self.peft_config)

        # Print trainable parameters
        self.model.print_trainable_parameters()

        return self.model, self.tokenizer

    def get_optimizer_groups(self, learning_rate: float = 2e-4) -> List[Dict]:
        """
        Get optimizer parameter groups for Tier 3 ONLY.

        This enforces that only Tier 3 parameters receive updates,
        even if someone accidentally includes other parameters.
        """
        # Get only trainable parameters (which are only Tier 3 LoRA)
        trainable_params = [p for p in self.model.parameters() if p.requires_grad]

        return [{
            "params": trainable_params,
            "lr": learning_rate,
            "weight_decay": 0.01,
        }]

    def get_trainable_param_count(self) -> Dict[str, int]:
        """Get count of trainable vs total parameters"""
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        total = sum(p.numel() for p in self.model.parameters())
        return {
            "trainable": trainable,
            "total": total,
            "trainable_percent": 100 * trainable / total,
        }


def create_optimizer(model, learning_rate: float = 2e-4, use_8bit: bool = True):
    """
    Create optimizer with only Tier 3 parameters.

    Uses 8-bit AdamW for memory efficiency (recommended for QLoRA).
    """
    import bitsandbytes as bnb

    if use_8bit:
        optimizer = bnb.optim.PagedAdamW8bit(
            model.parameters(),
            lr=learning_rate,
            weight_decay=0.01,
        )
    else:
        optimizer = torch.optim.AdamW(
            model.parameters(),
            lr=learning_rate,
            weight_decay=0.01,
        )

    return optimizer


# CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Keystone LoRA Setup")
    parser.add_argument("--model", default="meta-llama/Llama-3.2-1B-Instruct")
    parser.add_argument("--rank", type=int, default=16, help="LoRA rank")
    parser.add_argument("--layers", type=int, default=16, help="Total transformer layers")
    parser.add_argument("--dry-run", action="store_true", help="Print config without loading")
    args = parser.parse_args()

    # Determine Tier 3 layers (top 30%)
    tier3_start = int(args.layers * 0.7)
    tier3_layers = list(range(tier3_start, args.layers))

    print(f"Model: {args.model}")
    print(f"LoRA Rank: {args.rank}")
    print(f"Tier 3 Layers: {tier3_layers}")

    if not args.dry_run:
        setup = Tier3LoRASetup(
            model_name=args.model,
            tier3_layer_indices=tier3_layers,
            lora_config=LoRAConfig(rank=args.rank),
        )
        model, tokenizer = setup.load_and_setup()
        print(f"\nTrainable parameters: {setup.get_trainable_param_count()}")
