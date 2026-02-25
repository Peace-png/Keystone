#!/usr/bin/env python3
"""
Test script for memory-fine-tuned models.

Usage:
    python test-memory-model.py ./fine-tuned-model
"""

import sys
from pathlib import Path
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel


def load_finetuned_model(model_path: Path):
    """Load a fine-tuned model with LoRA adapters"""

    # Determine base model (check config or use default)
    base_model = "microsoft/Phi-3-mini-4k-instruct"

    print(f"Loading base model: {base_model}")
    tokenizer = AutoTokenizer.from_pretrained(base_model)
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True
    )

    print(f"Loading adapters from: {model_path}")
    model = PeftModel.from_pretrained(model, str(model_path))

    return model, tokenizer


def test_memory_reflection(model, tokenizer):
    """Test the model's ability to reflect on concepts"""

    test_prompts = [
        # Meaning layer test
        """<|memory|>Concept: continuous-loop
Surface: AI that runs constantly instead of waiting for input
<|reflect|>""",

        # Connection test
        """<|memory|>botox-problem connects to: frozen-architecture, stagnant-expression
<|reflect|>""",

        # Journey test
        """<|memory|>A wondering began: Why does AI feel frozen even when technically good?
Thread: What makes AI feel conscious vs just functional
<|reflect|>""",

        # Failure learning test
        """<|memory|>Tried: Bigger model parameters for better responses
<|reflect|>""",

        # Insight emergence test
        """<|memory|>An insight emerged:
<|reflect|>"""
    ]

    print("\n" + "="*60)
    print("MEMORY MODEL TEST")
    print("="*60)

    for i, prompt in enumerate(test_prompts):
        print(f"\n--- Test {i+1} ---")
        print(f"Prompt: {prompt.strip()[:80]}...")

        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=150,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract just the generated part
        response = response.replace(prompt, "").strip()

        print(f"\nResponse:\n{response}")
        print("-"*60)


def interactive_mode(model, tokenizer):
    """Chat with the model interactively"""

    print("\n" + "="*60)
    print("INTERACTIVE MODE")
    print("Type concepts or questions. 'quit' to exit.")
    print("="*60 + "\n")

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() in ['quit', 'exit', 'q']:
            break

        # Format as memory prompt
        prompt = f"<|memory|>{user_input}\n<|reflect|>"

        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=200,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response = response.replace(prompt, "").strip()

        print(f"\nModel: {response}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python test-memory-model.py <model_path>")
        print("Example: python test-memory-model.py ./fine-tuned-model")
        sys.exit(1)

    model_path = Path(sys.argv[1])

    if not model_path.exists():
        print(f"Error: Model path not found: {model_path}")
        sys.exit(1)

    model, tokenizer = load_finetuned_model(model_path)

    # Run automated tests
    test_memory_reflection(model, tokenizer)

    # Then interactive
    interactive_mode(model, tokenizer)


if __name__ == "__main__":
    main()
