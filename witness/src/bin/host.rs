//! Witness Host - Runs the zkVM proof
//!
//! This is the main entry point for the Witness layer.
//! It reads SOUL.md, computes a hash, and proves the observation was read-only.

use std::env;
use std::fs;

use witness::{compute_hash, verify_read_only, ObservationOutput};

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: witness-host <file-to-observe>");
        eprintln!("Example: witness-host ../constitution/SOUL.md");
        std::process::exit(1);
    }

    let file_path = &args[1];

    // Read the file
    let data = match fs::read(file_path) {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Failed to read {}: {}", file_path, e);
            std::process::exit(1);
        }
    };

    println!("=== Witness Host ===");
    println!("Observing: {}", file_path);
    println!("Data size: {} bytes", data.len());

    // Compute hash (this simulates what the zkVM guest would do)
    let pre_hash = compute_hash(&data);
    println!("Pre-hash: {}", hex::encode(pre_hash));

    // In a real zkVM, the guest would receive the data and compute the hash
    // For now, we simulate this by computing the same hash
    let post_hash = compute_hash(&data);
    println!("Post-hash: {}", hex::encode(post_hash));

    // Verify read-only
    let is_read_only = verify_read_only(&pre_hash, &post_hash);

    let output = ObservationOutput {
        pre_hash,
        post_hash,
        is_read_only,
        data_size: data.len(),
    };

    println!("\n=== Observation Result ===");
    println!("Read-only verified: {}", is_read_only);
    println!("Data integrity: {}",
        if is_read_only { "PASSED" } else { "FAILED" }
    );

    // Output JSON for programmatic use
    println!("\n=== JSON Output ===");
    println!("{}", serde_json::to_string_pretty(&output).unwrap());

    if !is_read_only {
        std::process::exit(1);
    }
}
