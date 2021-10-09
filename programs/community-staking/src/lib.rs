use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount};

#[cfg(not(feature = "production"))]
declare_id!("9bZjYwx8yzVGjAtth8AuLCC6AY7Pts5jjX6T7Kb6iNEa");

#[cfg(feature = "production")]
declare_id!("NNpzg8oFqYxeXWwPwJrJWRBizJ33AeqmpjGwVeaM6yg");

const REWARD_RATE_DENOMINATOR: u64 = 100_000_000;

#[program]
pub mod community_staking {
    use super::*;

    pub fn create_registry(
        ctx: Context<CreateRegistry>,
        reward_period: i64,
        reward_rate_numerator: u64,
    ) -> ProgramResult {
        ctx.accounts.registry.vault = ctx.accounts.vault.key();
        ctx.accounts.registry.admin = ctx.accounts.admin.key();
        ctx.accounts.registry.reward_period = reward_period;
        ctx.accounts.registry.reward_rate_numerator = reward_rate_numerator;

        Ok(())
    }

    pub fn update_registry(
        ctx: Context<UpdateRegistry>,
        reward_period: i64,
        reward_rate_numerator: u64,
    ) -> ProgramResult {
        ctx.accounts.registry.reward_period = reward_period;
        ctx.accounts.registry.reward_rate_numerator = reward_rate_numerator;

        Ok(())
    }

    pub fn assign_controller(ctx: Context<AssignController>) -> ProgramResult {
        ctx.accounts.controller_record.enabled = true;
        ctx.accounts.controller_record.max_multiplier = 1;
        Ok(())
    }

    pub fn update_controller(
        ctx: Context<RevokeController>,
        enabled: Option<bool>,
        max_multiplier: Option<u64>,
    ) -> ProgramResult {
        if let Some(enabled) = enabled {
            ctx.accounts.controller_record.enabled = enabled;
        }
        if let Some(max_multiplier) = max_multiplier {
            ctx.accounts.controller_record.max_multiplier = max_multiplier;
        }
        Ok(())
    }

    pub fn control(ctx: Context<Control>, multiplier: u64) -> ProgramResult {
        if !ctx.accounts.controller_record.enabled {
            return Err(StakingError::ControllerDisabled.into());
        }
        if multiplier > ctx.accounts.controller_record.max_multiplier {
            return Err(StakingError::MultiplierTooLarge.into());
        }
        ctx.accounts.stake_account.multiplier = multiplier;
        Ok(())
    }

    pub fn create_stake_account(ctx: Context<CreateStakeAccount>) -> ProgramResult {
        ctx.accounts.stake_account.registry = ctx.accounts.registry.key();
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> ProgramResult {
        let unix_timestamp = Clock::get()?.unix_timestamp;
        let rewards = ctx
            .accounts
            .stake_account
            .calculate_rewards(unix_timestamp, ctx.accounts.registry.reward_rate_numerator)
            .ok_or(StakingError::InvalidCalculation)?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.staker_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.staker.to_account_info(),
                },
            ),
            amount,
        )?;

        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.amount = stake_account
            .amount
            .checked_add(amount)
            .ok_or(StakingError::InvalidCalculation)?
            .checked_add(rewards)
            .ok_or(StakingError::InvalidCalculation)?;

        if stake_account.amount == 0 {
            return Err(StakingError::InsufficientAmount.into());
        }

        stake_account.rewards_start_timestamp = unix_timestamp;
        stake_account.rewards_end_timestamp = unix_timestamp + ctx.accounts.registry.reward_period;
        stake_account.multiplier = 1;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>) -> ProgramResult {
        let unix_timestamp = Clock::get()?.unix_timestamp;
        let rewards = ctx
            .accounts
            .stake_account
            .calculate_rewards(unix_timestamp, ctx.accounts.registry.reward_rate_numerator)
            .ok_or(StakingError::InvalidCalculation)?;

        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.amount += rewards;
        stake_account.rewards_start_timestamp = 0;
        stake_account.rewards_end_timestamp = 0;
        stake_account.multiplier = 1;

        let registry_key = ctx.accounts.registry.key();
        let (_, nonce) = Pubkey::find_program_address(
            &[b"vault".as_ref(), registry_key.as_ref()],
            ctx.program_id,
        );
        let seeds = &[b"vault".as_ref(), registry_key.as_ref(), &[nonce]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.staker_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                &[seeds],
            ),
            stake_account.amount,
        )?;

        // Clear
        stake_account.amount = 0;

        Ok(())
    }
}

// CreateRegistry
// UpdateRegistry

// AssignController
// UpdateController
// Control

// CreateStake
// Stake add tokens
// Unstake remove tokens

#[derive(Accounts)]
pub struct CreateRegistry<'info> {
    #[account(
        init,
        payer = admin,
    )]
    registry: Account<'info, Registry>,
    #[account(
        init,
        seeds = [b"vault", registry.key().as_ref()],
        bump,
        payer = admin,
        token::authority = vault,
        token::mint = mint,
    )]
    vault: Account<'info, TokenAccount>,
    mint: Account<'info, Mint>,
    #[account(mut)]
    admin: Signer<'info>,
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

// Controller

#[derive(Accounts)]
pub struct AssignController<'info> {
    #[account(has_one = admin)]
    registry: Account<'info, Registry>,
    #[account(mut)]
    admin: Signer<'info>,
    controller: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = [b"controller_record", registry.key().as_ref(), controller.key.as_ref()],
        bump,
        payer = admin,
    )]
    controller_record: Account<'info, ControllerRecord>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeController<'info> {
    #[account(has_one = admin)]
    registry: Account<'info, Registry>,
    #[account(mut)]
    admin: Signer<'info>,
    controller: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"controller_record", registry.key().as_ref(), controller.key.as_ref()],
        bump,
        close = admin,
    )]
    controller_record: Account<'info, ControllerRecord>,
}

#[derive(Accounts)]
pub struct Control<'info> {
    registry: Account<'info, Registry>,
    controller: Signer<'info>,
    #[account(
        seeds = [b"controller_record", registry.key().as_ref(), controller.key.as_ref()],
        bump,
    )]
    controller_record: Account<'info, ControllerRecord>,
    #[account(mut, has_one = registry)]
    stake_account: Account<'info, StakeAccount>,
}

// Staker

#[derive(Accounts)]
pub struct CreateStakeAccount<'info> {
    registry: Account<'info, Registry>,
    #[account(mut)]
    staker: Signer<'info>,
    #[account(
        init,
        seeds = [b"stake", registry.key().as_ref(), staker.key.as_ref()],
        bump,
        payer = staker,
    )]
    stake_account: Account<'info, StakeAccount>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(has_one = vault)]
    registry: Account<'info, Registry>,
    #[account(mut)]
    vault: Account<'info, TokenAccount>,
    staker: Signer<'info>,
    #[account(mut)]
    staker_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"stake", registry.key().as_ref(), staker.key.as_ref()],
        bump,
    )]
    stake_account: Account<'info, StakeAccount>,
    token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(has_one = vault)]
    registry: Account<'info, Registry>,
    #[account(mut)]
    vault: Account<'info, TokenAccount>,
    #[account(mut)]
    staker: Signer<'info>,
    #[account(mut)]
    staker_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"stake", registry.key().as_ref(), staker.key.as_ref()],
        bump,
    )]
    stake_account: Account<'info, StakeAccount>,
    token_program: Program<'info, Token>,
}

#[account]
#[derive(Default, Debug)]
pub struct Registry {
    vault: Pubkey,
    admin: Pubkey,
    reward_period: i64,         // Period after which, rewards stop
    reward_rate_numerator: u64, // per second reward rate
    reward_rate_denominator: u64,
}

#[account]
#[derive(Default, Debug)]
pub struct ControllerRecord {
    enabled: bool,
    max_multiplier: u64,
}

#[account]
#[derive(Default, Debug)]
pub struct StakeAccount {
    registry: Pubkey,
    amount: u64,
    rewards_start_timestamp: i64,
    rewards_end_timestamp: i64,
    multiplier: u64,
}

impl StakeAccount {
    pub fn calculate_rewards(
        &self,
        unix_timestamp: i64,
        rewards_rate_numerator: u64,
    ) -> Option<u64> {
        let effective_time_elapsed = std::cmp::min(unix_timestamp, self.rewards_end_timestamp)
            .checked_sub(self.rewards_start_timestamp)?;

        (effective_time_elapsed as u64)
            .checked_mul(self.amount)?
            .checked_mul(self.multiplier)?
            .checked_mul(rewards_rate_numerator)?
            .checked_div(REWARD_RATE_DENOMINATOR)
    }
}

#[error]
pub enum StakingError {
    #[msg("Amount too large")]
    AmountTooLarge,
    #[msg("Invalid calculation")]
    InvalidCalculation,
    #[msg("Insufficient amount")]
    InsufficientAmount,
    #[msg("Multiplier too large")]
    MultiplierTooLarge,
    #[msg("Controller is disabled")]
    ControllerDisabled,
}
