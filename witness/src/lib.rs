//! Witness Layer for Keystone
//!
//! This module implements the cryptographic Witness using RISC Zero zkVM.
//! The Witness can observe internal state (SOUL.md, ClawMem) without being able to modify it.

use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};

/// Output from the Witness observation
#[derive(Serialize, Deserialize, Debug)]
pub struct ObservationOutput {
    /// Hash of the state before observation
    pub pre_hash: [u8; 32],
    /// Hash of the state after observation (should equal pre_hash)
    pub post_hash: [u8; 32],
    /// Whether the hashes match (proves read-only)
    pub is_read_only: bool,
    /// Size of the observed data
    pub data_size: usize,
}

/// Compute SHA-256 hash of data
pub fn compute_hash(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

/// Verify that observation was read-only
pub fn verify_read_only(pre_hash: &[u8; 32], post_hash: &[u8; 32]) -> bool {
    pre_hash == post_hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_computation() {
        let data = b"test data for hashing";
        let hash1 = compute_hash(data);
        let hash2 = compute_hash(data);
        assert_eq!(hash1, hash2, "Same data should produce same hash");
    }

    #[test]
    fn test_read_only_verification() {
        let hash = compute_hash(b"test data");
        assert!(verify_read_only(&hash, &hash), "Same hashes should verify as read-only");

        let different_hash = compute_hash(b"different data");
        assert!(!verify_read_only(&hash, &different_hash), "Different hashes should fail verification");
    }
}
