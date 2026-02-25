#!/usr/bin/env python3
"""
Memory JSON Fine-Tuning Pipeline

Converts memory JSONs into training data for consciousness-mimicking AI.
Based on the Emotional Savants pipeline but adapted for meaning-capture format.

Usage:
    python memory-json-finetune.py --input ./memories/ --output ./fine-tuned-model/
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
import bitsandbytes as bnb

# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class MemoryTrainingConfig:
    """Configuration for memory-based fine-tuning"""

    # Model settings
    base_model: str = "microsoft/Phi-3-mini-4k-instruct"  # Small, efficient
    # Alternative: "mistralai/Mistral-7B-v0.1" for more capacity

    # QLoRA settings (from Emotional Savants pipeline)
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05

    # Quantization
    use_4bit: bool = True
    bnb_4bit_compute_dtype: str = "float16"
    bnb_4bit_quant_type: str = "nf4"

    # Training
    epochs: int = 3
    batch_size: int = 4
    gradient_accumulation_steps: int = 4
    learning_rate: float = 2e-4
    max_seq_length: int = 2048

    # Memory-specific
    meaning_depth_weight: float = 1.5  # Weight deeper meaning layers more
    connection_weight: float = 1.2     # Weight connected concepts
    insight_weight: float = 2.0        # Weight insights heavily


# ============================================================================
# MEMORY JSON PARSER
# ============================================================================

class MemoryJSONParser:
    """
    Converts memory JSONs into training examples.

    The key insight: we're not training on facts, we're training on
    the STRUCTURE of meaning - how ideas connect, how insights emerge,
    how failed ideas teach.
    """

    def __init__(self, config: MemoryTrainingConfig):
        self.config = config

    def parse_memory_file(self, filepath: Path) -> List[Dict[str, str]]:
        """Parse a single memory JSON into training examples"""
        with open(filepath, 'r') as f:
            memory = json.load(f)

        examples = []

        # 1. Journey examples - how thinking evolved
        examples.extend(self._extract_journey_examples(memory))

        # 2. Meaning node examples - concept relationships
        examples.extend(self._extract_meaning_examples(memory))

        # 3. Insight examples - what was learned
        examples.extend(self._extract_insight_examples(memory))

        # 4. Failed/killed idea examples - negative learning
        examples.extend(self._extract_failure_examples(memory))

        # 5. Connection examples - how ideas link
        examples.extend(self._extract_connection_examples(memory))

        return examples

    def _extract_journey_examples(self, memory: Dict) -> List[Dict]:
        """Extract training examples from the journey section"""
        examples = []

        journey = memory.get('journey', {})
        thread = memory.get('thread', '')

        # Started wondering -> arrived at
        started = journey.get('started_wondering', '')
        arrived = journey.get('arrived_at', '')

        if started and arrived:
            prompt = f"<|memory|>A wondering began: {started}\n\nThread: {thread}\n<|reflect|>"
            response = f"Through exploration, this evolved into: {arrived}"

            examples.append({
                'prompt': prompt,
                'response': response,
                'type': 'journey',
                'weight': 1.0
            })

        return examples

    def _extract_meaning_examples(self, memory: Dict) -> List[Dict]:
        """Extract training examples from meaning nodes"""
        examples = []

        for node in memory.get('meaning_nodes', []):
            if node.get('relevance') == 'irrelevant':
                continue  # Skip irrelevant nodes

            concept = node.get('node', '')
            surface = node.get('surface', '')
            layers = node.get('layers', {})

            # Create layered understanding example
            deeper = layers.get('deeper', '')
            deepest = layers.get('deepest', '')

            if surface and deeper:
                prompt = f"<|memory|>Concept: {concept}\nSurface: {surface}\n<|reflect|>"
                response = f"Deeper: {deeper}"
                if deepest:
                    response += f"\nDeepest: {deepest}"

                # Weight by depth
                weight = 1.0
                if deepest:
                    weight = self.config.meaning_depth_weight

                examples.append({
                    'prompt': prompt,
                    'response': response,
                    'type': 'meaning',
                    'weight': weight
                })

        return examples

    def _extract_insight_examples(self, memory: Dict) -> List[Dict]:
        """Extract training examples from insights"""
        examples = []

        for insight in memory.get('insights', []):
            the_insight = insight.get('insight', '')
            metaphor = insight.get('metaphor_used', '')
            why_matters = insight.get('why_matters', '')

            if the_insight:
                prompt = "<|memory|>An insight emerged:\n<|reflect|>"
                response = the_insight

                if metaphor:
                    response += f"\n\nMetaphor: {metaphor}"

                if why_matters:
                    response += f"\n\nWhy this matters: {why_matters}"

                examples.append({
                    'prompt': prompt,
                    'response': response,
                    'type': 'insight',
                    'weight': self.config.insight_weight
                })

        return examples

    def _extract_failure_examples(self, memory: Dict) -> List[Dict]:
        """Extract training examples from failed and killed ideas"""
        examples = []

        # Failed ideas - what didn't work
        for failed in memory.get('failed_ideas', []):
            idea = failed.get('idea', '')
            why_failed = failed.get('why_it_failed', '')
            learned = failed.get('learned_instead', '')

            if idea and why_failed:
                prompt = f"<|memory|>Tried: {idea}\n<|reflect|>"
                response = f"This failed because: {why_failed}"
                if learned:
                    response += f"\n\nLearned instead: {learned}"

                examples.append({
                    'prompt': prompt,
                    'response': response,
                    'type': 'failure',
                    'weight': 1.3  # Failures teach well
                })

        # Killed ideas - paradigm shifts
        for killed in memory.get('killed_ideas', []):
            old = killed.get('old_idea', '')
            killed_by = killed.get('killed_by', '')
            why = killed.get('why', '')

            if old and killed_by:
                prompt = f"<|memory|>Old belief: {old}\n<|reflect|>"
                response = f"Replaced by: {killed_by}\nWhy better: {why}"

                examples.append({
                    'prompt': prompt,
                    'response': response,
                    'type': 'killed',
                    'weight': 1.5  # Paradigm shifts are important
                })

        return examples

    def _extract_connection_examples(self, memory: Dict) -> List[Dict]:
        """Extract training examples showing how ideas connect"""
        examples = []

        for node in memory.get('meaning_nodes', []):
            concept = node.get('node', '')
            connects_to = node.get('connects_to', [])
            reason = node.get('connection_reason', '')

            if connects_to and reason:
                prompt = f"<|memory|>{concept} connects to: {', '.join(connects_to)}\n<|reflect|>"
                response = f"Connection reason: {reason}"

                examples.append({
                    'prompt': prompt,
                    'response': response,
                    'type': 'connection',
                    'weight': self.config.connection_weight
                })

        return examples


# ============================================================================
# TRAINING PIPELINE
# ============================================================================

class MemoryTrainer:
    """
    Fine-tunes a model on memory JSONs using QLoRA.

    This creates a model that understands:
    - How meaning layers work (surface -> deeper -> deepest)
    - How ideas connect and why
    - How failed ideas teach
    - How insights emerge
    """

    def __init__(self, config: MemoryTrainingConfig):
        self.config = config
        self.parser = MemoryJSONParser(config)

    def load_model(self):
        """Load base model with 4-bit quantization"""
        print(f"Loading base model: {self.config.base_model}")

        # Quantization config
        bnb_config = None
        if self.config.use_4bit:
            from transformers import BitsAndBytesConfig
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type=self.config.bnb_4bit_quant_type,
                bnb_4bit_compute_dtype=getattr(torch, self.config.bnb_4bit_compute_dtype),
                bnb_4bit_use_double_quant=True,
            )

        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            self.config.base_model,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True
        )

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.base_model,
            trust_remote_code=True
        )
        self.tokenizer.pad_token = self.tokenizer.eos_token

        # Prepare for k-bit training
        self.model = prepare_model_for_kbit_training(self.model)

        # Add LoRA adapters
        lora_config = LoraConfig(
            r=self.config.lora_r,
            lora_alpha=self.config.lora_alpha,
            lora_dropout=self.config.lora_dropout,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
        )

        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()

    def prepare_dataset(self, memory_dir: Path) -> Dataset:
        """Load all memory JSONs and prepare training dataset"""
        all_examples = []

        # Find all memory JSONs
        memory_files = list(memory_dir.glob("**/*.json"))

        print(f"Found {len(memory_files)} memory files")

        for filepath in memory_files:
            try:
                examples = self.parser.parse_memory_file(filepath)
                all_examples.extend(examples)
            except Exception as e:
                print(f"Error parsing {filepath}: {e}")

        print(f"Extracted {len(all_examples)} training examples")

        # Format as training data
        formatted_data = []
        for ex in all_examples:
            # Weighted repetition - important examples appear more
            repetitions = max(1, int(ex['weight']))
            for _ in range(repetitions):
                text = f"{ex['prompt']}\n{ex['response']}{self.tokenizer.eos_token}"
                formatted_data.append({'text': text})

        # Create dataset
        dataset = Dataset.from_list(formatted_data)

        # Tokenize
        def tokenize(examples):
            return self.tokenizer(
                examples['text'],
                truncation=True,
                max_length=self.config.max_seq_length,
                padding='max_length'
            )

        tokenized = dataset.map(tokenize, batched=True)

        return tokenized

    def train(self, memory_dir: Path, output_dir: Path):
        """Run the full training pipeline"""

        # Load model
        self.load_model()

        # Prepare data
        dataset = self.prepare_dataset(memory_dir)

        # Training arguments
        training_args = TrainingArguments(
            output_dir=str(output_dir),
            num_train_epochs=self.config.epochs,
            per_device_train_batch_size=self.config.batch_size,
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            learning_rate=self.config.learning_rate,
            fp16=True,
            logging_steps=10,
            save_strategy="epoch",
            report_to="none",
        )

        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=dataset,
            data_collator=DataCollatorForLanguageModeling(self.tokenizer, mlm=False)
        )

        # Train
        print("Starting training...")
        trainer.train()

        # Save
        print(f"Saving to {output_dir}")
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)

        print("Training complete!")


# ============================================================================
# MAIN
# ============================================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Fine-tune on memory JSONs")
    parser.add_argument("--input", type=str, required=True, help="Directory of memory JSONs")
    parser.add_argument("--output", type=str, required=True, help="Output directory")
    parser.add_argument("--model", type=str, default="microsoft/Phi-3-mini-4k-instruct")
    parser.add_argument("--epochs", type=int, default=3)

    args = parser.parse_args()

    config = MemoryTrainingConfig(
        base_model=args.model,
        epochs=args.epochs
    )

    trainer = MemoryTrainer(config)
    trainer.train(
        memory_dir=Path(args.input),
        output_dir=Path(args.output)
    )


if __name__ == "__main__":
    main()
