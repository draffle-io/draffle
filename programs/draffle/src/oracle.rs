use anchor_lang::prelude::*;
use pyth_client;
use solana_program::keccak;

pub mod pyth_prices {
    use super::*;

    pub mod sol_price {
        use super::*;
        declare_id!("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");
    }

    pub mod btc_price {
        use super::*;
        declare_id!("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
    }

    pub mod srm_price {
        use super::*;
        declare_id!("3NBReDRTLKMQEKiLD5tGcx4kXbTf88b7f2xLS9UuGjym");
    }
}

// Feed addresses are verified at the Accounts level
//
// This achieves pseudo-randomness that can be tampered with
// However, we assume the reward is lower than the reputation risk impact of tempering for a validator
// or the pyth price feeds
pub fn oracle_feeds_to_randomness<'info>(
    pyth_price_account_infos: &[&AccountInfo<'info>],
) -> Result<[u8; 32], ProgramError> {
    let mut data = Vec::new();
    for pyth_price_account_info in pyth_price_account_infos {
        let price_data = &pyth_price_account_info.try_borrow_data()?;
        let price = pyth_client::cast::<pyth_client::Price>(price_data);

        data.extend(&price.agg.price.to_le_bytes());
        data.extend(&price.agg.conf.to_le_bytes());
    }

    let mut hasher = keccak::Hasher::default();
    hasher.hash(&data);

    Ok(hasher.result().to_bytes())
}
