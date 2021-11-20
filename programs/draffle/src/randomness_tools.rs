use anchor_lang::solana_program::keccak;
use std::convert::TryInto;

//https://docs.chain.link/docs/chainlink-vrf-best-practices/#getting-multiple-random-number
pub fn expand(randomness: [u8; 32], n: u32) -> u32 {
    let mut hasher = keccak::Hasher::default();
    hasher.hash(&randomness);
    hasher.hash(&n.to_le_bytes());

    u32::from_le_bytes(
        hasher.result().to_bytes()[0..4]
            .try_into()
            .expect("slice with incorrect length"),
    )
}

#[cfg(test)]
mod test {
    use super::*;
    #[test]
    fn test_bit_slicing() {
        let mut randomness = [0; 32];
        randomness[0] = 1;
        randomness[2] = 2;

        let first_result = expand(randomness, 0);
        println!("data: {:?}", randomness);
        println!("{}", first_result);

        randomness[0] = 255;
        randomness[1] = 254;

        let second_result = expand(randomness, 1);
        assert_ne!(first_result, second_result);
    }
}
