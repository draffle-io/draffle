use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount};

#[cfg(not(feature = "production"))]
declare_id!("B2jCF3V3hCCPcwsXPtjMhXVjzafXU68EMJWz3eKZ2kVa");

#[program]
pub mod dispenser {
    use super::*;

    pub fn create_registry(
        ctx: Context<CreateRegistry>,
        rate_token_in: u64,
        rate_token_out: u64,
    ) -> Result<()> {
        ctx.accounts.registry.vault_token_in = ctx.accounts.vault_token_in.key();
        ctx.accounts.registry.vault_token_out = ctx.accounts.vault_token_out.key();
        ctx.accounts.registry.admin = ctx.accounts.admin.key();
        ctx.accounts.registry.rate_token_in = rate_token_in;
        ctx.accounts.registry.rate_token_out = rate_token_out;
        ctx.accounts.registry.mint_token_in = ctx.accounts.mint_token_in.key();
        ctx.accounts.registry.mint_token_out = ctx.accounts.mint_token_out.key();

        Ok(())
    }

    pub fn update_registry(
        ctx: Context<UpdateRegistry>,
        rate_token_in: u64,
        rate_token_out: u64,
    ) -> Result<()> {
        ctx.accounts.registry.admin = ctx.accounts.admin.key();
        ctx.accounts.registry.rate_token_in = rate_token_in;
        ctx.accounts.registry.rate_token_out = rate_token_out;

        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount_requested: u64) -> Result<()> {
        if ctx.accounts.vault_token_out.amount < amount_requested {
            return Err(DispenserError::InsufficientVaultFunds.into());
        }

        // `checked_div` will truncate any potential remainder
        // consequence is to slightly under-charge the user by the remainder amount
        let amount_token_in = amount_requested
            .checked_mul(ctx.accounts.registry.rate_token_in)
            .ok_or(DispenserError::InvalidCalculation)?
            .checked_div(ctx.accounts.registry.rate_token_out)
            .ok_or(DispenserError::InvalidCalculation)?;

        if ctx.accounts.buyer_token_in_account.amount < amount_token_in {
            return Err(DispenserError::InsufficientUserFunds.into());
        }

        msg!("Amount requested: {}", amount_requested);
        msg!("Amount charged: {}", amount_token_in);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.buyer_token_in_account.to_account_info(),
                    to: ctx.accounts.vault_token_in.to_account_info(),
                    authority: ctx.accounts.swapper.to_account_info(),
                },
            ),
            amount_token_in,
        )?;

        let registry_key = ctx.accounts.registry.key();
        let (_, nonce) = Pubkey::find_program_address(
            &[b"vault_token_out".as_ref(), registry_key.as_ref()],
            ctx.program_id,
        );
        let seeds = &[b"vault_token_out".as_ref(), registry_key.as_ref(), &[nonce]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_token_out.to_account_info(),
                    to: ctx.accounts.buyer_token_out_account.to_account_info(),
                    authority: ctx.accounts.vault_token_out.to_account_info(),
                },
                &[seeds],
            ),
            amount_requested,
        )?;

        Ok(())
    }

    pub fn collect_proceeds(ctx: Context<CollectProceeds>) -> Result<()> {
        let registry_key = ctx.accounts.registry.key();

        let (_, nonce) = Pubkey::find_program_address(
            &[b"vault_token_in".as_ref(), registry_key.as_ref()],
            ctx.program_id,
        );
        let seeds = &[b"vault_token_in".as_ref(), registry_key.as_ref(), &[nonce]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_token_in.to_account_info(),
                    to: ctx.accounts.admin_proceeds_account.to_account_info(),
                    authority: ctx.accounts.vault_token_in.to_account_info(),
                },
                &[seeds],
            ),
            ctx.accounts.vault_token_in.amount,
        )?;

        Ok(())
    }

    pub fn collect_reserve(ctx: Context<CollectReserve>) -> Result<()> {
        let registry_key = ctx.accounts.registry.key();

        let (_, nonce) = Pubkey::find_program_address(
            &[b"vault_token_out".as_ref(), registry_key.as_ref()],
            ctx.program_id,
        );
        let seeds = &[b"vault_token_out".as_ref(), registry_key.as_ref(), &[nonce]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault_token_out.to_account_info(),
                    to: ctx.accounts.admin_reserve_account.to_account_info(),
                    authority: ctx.accounts.vault_token_out.to_account_info(),
                },
                &[seeds],
            ),
            ctx.accounts.vault_token_out.amount,
        )?;

        Ok(())
    }
}

// Endpoint guards

#[derive(Accounts)]
pub struct CreateRegistry<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 32 + 32
    )]
    registry: Account<'info, Registry>,
    #[account(
        init,
        seeds = [b"vault_token_in", registry.key().as_ref()],
        bump,
        payer = admin,
        token::authority = vault_token_in,
        token::mint = mint_token_in,
    )]
    vault_token_in: Account<'info, TokenAccount>,
    #[account(
        init,
        seeds = [b"vault_token_out", registry.key().as_ref()],
        bump,
        payer = admin,
        token::authority = vault_token_out,
        token::mint = mint_token_out,
    )]
    vault_token_out: Account<'info, TokenAccount>,
    #[account(mut)]
    admin: Signer<'info>,
    mint_token_in: Account<'info, Mint>,
    mint_token_out: Account<'info, Mint>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateRegistry<'info> {
    #[account(mut, has_one = admin)]
    registry: Account<'info, Registry>,
    admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(has_one = vault_token_in, has_one = vault_token_out)]
    registry: Account<'info, Registry>,
    swapper: Signer<'info>,
    #[account(mut)]
    vault_token_in: Account<'info, TokenAccount>,
    #[account(mut)]
    vault_token_out: Account<'info, TokenAccount>,
    #[account(mut)]
    buyer_token_in_account: Account<'info, TokenAccount>,
    #[account(mut)]
    buyer_token_out_account: Account<'info, TokenAccount>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CollectProceeds<'info> {
    #[account(has_one = admin)]
    pub registry: Account<'info, Registry>,
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault_token_in", registry.key().as_ref()],
        bump
    )]
    pub vault_token_in: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = admin_proceeds_account.owner == admin.key()
    )]
    pub admin_proceeds_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CollectReserve<'info> {
    #[account(has_one = admin)]
    pub registry: Account<'info, Registry>,
    #[account(
        mut,
        seeds = [b"vault_token_out", registry.key().as_ref()],
        bump
    )]
    pub vault_token_out: Account<'info, TokenAccount>,
    pub admin: Signer<'info>,
    #[account(
        mut,
        constraint = admin_reserve_account.owner == admin.key()
    )]
    pub admin_reserve_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// States definition

#[account]
#[derive(Default, Debug)]
pub struct Registry {
    pub admin: Pubkey,
    pub vault_token_in: Pubkey,
    pub vault_token_out: Pubkey,
    pub rate_token_in: u64,
    pub rate_token_out: u64,
    pub mint_token_in: Pubkey,
    pub mint_token_out: Pubkey,
}

#[error_code]
pub enum DispenserError {
    #[msg("Insufficient user funds")]
    InsufficientUserFunds,
    #[msg("Insufficient vault funds")]
    InsufficientVaultFunds,
    #[msg("Invalid calculation")]
    InvalidCalculation,
}
