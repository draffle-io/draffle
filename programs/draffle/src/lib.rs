pub mod randomness_tools;
pub mod recent_blockhashes;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;
use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount};
use std::cell::{RefMut, Ref};
use std::convert::TryFrom;

pub const ENTRANTS_SIZE: u32 = 5000;
pub const TIME_BUFFER: i64 = 20;

#[cfg(not(feature = "production"))]
pub const PROTOCOL_FEE_BPS: u128 = 10;

#[cfg(feature = "production")]
pub const PROTOCOL_FEE_BPS: u128 = 0;

pub mod treasury {
    use super::*;
    // Replace with your treasury, this is the default treasury for testing purposes
    declare_id!("Treasury11111111111111111111111111111111112");
}

#[cfg(not(feature = "production"))]
declare_id!("dRaFFLe111111111111111111111111111111111112");

#[cfg(feature = "production")]
declare_id!("dRafA7ymQiLKjR5dmmdZC9RPX4EQUjqYFB3mWokRuDs");

#[program]
pub mod draffle {
    use super::*;

    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        end_timestamp: i64,
        ticket_price: u64,
        max_entrants: u32,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;

        raffle.creator = *ctx.accounts.creator.key;
        raffle.total_prizes = 0;
        raffle.claimed_prizes = 0;
        raffle.randomness = None;
        raffle.end_timestamp = end_timestamp;
        raffle.ticket_price = ticket_price;
        raffle.entrants = ctx.accounts.entrants.key();

        let entrants = &mut ctx.accounts.entrants;
        entrants.total = 0;
        entrants.max = max_entrants;

        // Verify that we have enough space for max entrants
        if entrants.to_account_info().data_len() < 8 + 4 + 4 + 32 * max_entrants as usize {
            return Err(RaffleError::EntrantsAccountTooSmallForMaxEntrants.into());
        }

        Ok(())
    }

    pub fn add_prize(ctx: Context<AddPrize>, prize_index: u32, amount: u64) -> Result<()> {
        let clock = Clock::get()?;
        let raffle = &mut ctx.accounts.raffle;

        if clock.unix_timestamp > raffle.end_timestamp {
            return Err(RaffleError::RaffleEnded.into());
        }

        if prize_index != raffle.total_prizes {
            return Err(RaffleError::InvalidPrizeIndex.into());
        }

        if amount == 0 {
            return Err(RaffleError::NoPrize.into());
        }

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.from.to_account_info(),
                    to: ctx.accounts.prize.to_account_info(),
                    authority: ctx.accounts.creator.to_account_info(),
                },
            ),
            amount,
        )?;

        raffle.total_prizes = raffle
            .total_prizes
            .checked_add(1)
            .ok_or(RaffleError::InvalidCalculation)?;

        Ok(())
    }

    pub fn buy_tickets(ctx: Context<BuyTickets>, amount: u32) -> Result<()> {
        let clock = Clock::get()?;
        let raffle = &mut ctx.accounts.raffle;
        let entrants = &mut ctx.accounts.entrants;

        if clock.unix_timestamp > raffle.end_timestamp {
            return Err(RaffleError::RaffleEnded.into());
        }

        let entrants_account_info = entrants.to_account_info();
        for _ in 0..amount {
            entrants.append_entrant(
                entrants_account_info.data.borrow_mut(),
                ctx.accounts.buyer_token_account.owner,
            )?;
        }

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.buyer_token_account.to_account_info(),
                    to: ctx.accounts.proceeds.to_account_info(),
                    authority: ctx.accounts.buyer_transfer_authority.to_account_info(),
                },
            ),
            raffle
                .ticket_price
                .checked_mul(amount as u64)
                .ok_or(RaffleError::InvalidCalculation)?,
        )?;

        msg!("Total entrants: {}", { entrants.total });

        Ok(())
    }

    pub fn reveal_winners(ctx: Context<RevealWinners>) -> Result<()> {
        let clock = Clock::get()?;
        let raffle = &mut ctx.accounts.raffle;

        let end_timestamp_with_buffer = raffle
            .end_timestamp
            .checked_add(TIME_BUFFER)
            .ok_or(RaffleError::InvalidCalculation)?;
        if clock.unix_timestamp < end_timestamp_with_buffer {
            return Err(RaffleError::RaffleStillRunning.into());
        }

        let randomness =
            recent_blockhashes::last_blockhash_accessor(&ctx.accounts.recent_blockhashes)?;

        match raffle.randomness {
            Some(_) => return Err(RaffleError::WinnersAlreadyDrawn.into()),
            None => raffle.randomness = Some(randomness),
        }

        Ok(())
    }

    pub fn claim_prize(
        ctx: Context<ClaimPrize>,
        prize_index: u32,
        ticket_index: u32,
    ) -> Result<()> {
        let raffle_account_info = ctx.accounts.raffle.to_account_info();
        let raffle = &mut ctx.accounts.raffle;

        let randomness = match raffle.randomness {
            Some(randomness) => randomness,
            None => return Err(RaffleError::WinnerNotDrawn.into()),
        };

        let entrants = &ctx.accounts.entrants;

        // When total number of entrants is zero we bypass the winner check and verify the "winner_token_account" belongs to the raffle creator,
        if entrants.total == 0 {
            if ctx.accounts.winner_token_account.owner != raffle.creator {
                return Err(RaffleError::OnlyCreatorCanClaimNoEntrantRafflePrizes.into());
            }
            msg!(
                "Raffle creator claiming prize {} of empty raffle",
                prize_index
            );
        } else {
            let winner_rand = randomness_tools::expand(randomness, prize_index);
            let winner_index = winner_rand % entrants.total;

            msg!(
                "Ticket {} attempts claiming prize {} (winner is {})",
                ticket_index,
                prize_index,
                winner_index
            );
            msg!("{} {}", winner_rand, winner_index);

            if ticket_index != winner_index {
                return Err(RaffleError::TicketHasNotWon.into());
            }

            if ctx.accounts.winner_token_account.owner.key()
                != Entrants::get_entrant(
                    ctx.accounts.entrants.to_account_info().data.borrow(),
                    ticket_index as usize,
                )
            {
                return Err(RaffleError::TokenAccountNotOwnedByWinner.into());
            }
        }

        if ctx.accounts.prize.amount == 0 {
            return Err(RaffleError::NoPrize.into());
        }

        let (_, nonce) = Pubkey::find_program_address(
            &[b"raffle".as_ref(), raffle.entrants.as_ref()],
            ctx.program_id,
        );

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info().clone(),
                token::Transfer {
                    from: ctx.accounts.prize.to_account_info(),
                    to: ctx.accounts.winner_token_account.to_account_info(),
                    authority: raffle_account_info,
                },
                &[&[b"raffle".as_ref(), raffle.entrants.as_ref(), &[nonce]]],
            ),
            ctx.accounts.prize.amount,
        )?;

        raffle.claimed_prizes = raffle
            .claimed_prizes
            .checked_add(1)
            .ok_or(RaffleError::InvalidCalculation)?;

        Ok(())
    }

    pub fn collect_proceeds<'info>(
        ctx: Context<'_, '_, '_, 'info, CollectProceeds<'info>>,
    ) -> Result<()> {
        let raffle = &ctx.accounts.raffle;

        if !raffle.randomness.is_some() {
            return Err(RaffleError::WinnerNotDrawn.into());
        }

        let (_, nonce) = Pubkey::find_program_address(
            &[b"raffle".as_ref(), raffle.entrants.as_ref()],
            ctx.program_id,
        );

        let proceeds_amount = ctx.accounts.proceeds.amount;
        let protocol_fee_amount = u64::try_from(
            (proceeds_amount as u128)
                .checked_mul(PROTOCOL_FEE_BPS)
                .ok_or(RaffleError::InvalidCalculation)?,
        )
        .map_err(|_| RaffleError::InvalidCalculation)?
        .checked_div(10_000)
        .ok_or(RaffleError::InvalidCalculation)?;
        let creator_proceeds = proceeds_amount
            .checked_sub(protocol_fee_amount)
            .ok_or(RaffleError::InvalidCalculation)?;

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.proceeds.to_account_info(),
                    to: ctx.accounts.creator_proceeds.to_account_info(),
                    authority: ctx.accounts.raffle.to_account_info(),
                },
                &[&[b"raffle".as_ref(), raffle.entrants.as_ref(), &[nonce]]],
            ),
            creator_proceeds,
        )?;

        if PROTOCOL_FEE_BPS > 0 {
            let mut remaining_accounts_iter = ctx.remaining_accounts.iter();
            let treasury_token_account: Account<TokenAccount> =
                Account::try_from(&remaining_accounts_iter.next().unwrap())?;
            if treasury_token_account.owner != treasury::ID {
                return Err(RaffleError::InvalidTreasuryTokenAccountOwner.into());
            }
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    token::Transfer {
                        from: ctx.accounts.proceeds.to_account_info(),
                        to: treasury_token_account.to_account_info(),
                        authority: ctx.accounts.raffle.to_account_info(),
                    },
                    &[&[b"raffle".as_ref(), raffle.entrants.as_ref(), &[nonce]]],
                ),
                protocol_fee_amount,
            )?;
        }

        Ok(())
    }

    pub fn close_entrants(ctx: Context<CloseEntrants>) -> Result<()> {
        let raffle = &ctx.accounts.raffle;
        let entrants = &ctx.accounts.entrants;
        if (raffle.claimed_prizes != raffle.total_prizes) && entrants.total != 0 {
            return Err(RaffleError::UnclaimedPrizes.into());
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateRaffle<'info> {
    #[account(
        init,
        seeds = [b"raffle".as_ref(), entrants.key().as_ref()],
        bump,
        payer = creator,
        space = 8 + 32 + 4 + 4 + 4 + 32 + 8 + 8 + 32,
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(zero)]
    pub entrants: Account<'info, Entrants>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        seeds = [raffle.key().as_ref(), b"proceeds"],
        bump,
        payer = creator,
        token::mint = proceeds_mint,
        token::authority = raffle,
    )]
    pub proceeds: Account<'info, TokenAccount>,
    pub proceeds_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(prize_index: u32)]
pub struct AddPrize<'info> {
    #[account(mut, has_one = creator)]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(
        init,
        seeds = [raffle.key().as_ref(), b"prize", &prize_index.to_le_bytes()],
        bump,
        payer = creator,
        token::mint = prize_mint,
        token::authority = raffle,
    )]
    pub prize: Account<'info, TokenAccount>,
    pub prize_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyTickets<'info> {
    #[account(has_one = entrants)]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub entrants: Account<'info, Entrants>,
    #[account(
        mut,
        seeds = [raffle.key().as_ref(), b"proceeds"],
        bump,
    )]
    pub proceeds: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    pub buyer_transfer_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RevealWinners<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    /// CHECK: sysvar address check is hardcoded, we want to avoid the default deserialization
    #[account(address = sysvar::recent_blockhashes::ID)]
    pub recent_blockhashes: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(prize_index: u32)]
pub struct ClaimPrize<'info> {
    #[account(mut, has_one = entrants)]
    pub raffle: Account<'info, Raffle>,
    pub entrants: Account<'info, Entrants>,
    #[account(
        mut,
        seeds = [raffle.key().as_ref(), b"prize", &prize_index.to_le_bytes()],
        bump,
    )]
    pub prize: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CollectProceeds<'info> {
    #[account(has_one = creator)]
    pub raffle: Account<'info, Raffle>,
    #[account(
        mut,
        seeds = [raffle.key().as_ref(), b"proceeds"],
        bump
    )]
    pub proceeds: Account<'info, TokenAccount>,
    pub creator: Signer<'info>,
    #[account(
        mut,
        constraint = creator_proceeds.owner == creator.key()
    )]
    pub creator_proceeds: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseEntrants<'info> {
    #[account(has_one = creator, has_one = entrants)]
    pub raffle: Account<'info, Raffle>,
    #[account(mut, close = creator)]
    pub entrants: Account<'info, Entrants>,
    pub creator: Signer<'info>,
}

#[account]
#[derive(Debug)]
pub struct Raffle {
    pub creator: Pubkey,
    pub total_prizes: u32,
    pub claimed_prizes: u32,
    pub randomness: Option<[u8; 32]>,
    pub end_timestamp: i64,
    pub ticket_price: u64,
    pub entrants: Pubkey,
}

#[account]
pub struct Entrants {
    pub total: u32,
    pub max: u32,
    // Entrants array of length max
    // pub entrants: [Pubkey; max],
}

impl Entrants {
    pub fn get_entrant(entrants_data: Ref<&mut [u8]>, index: usize) -> Pubkey {
        let start_index = 8 + 4 + 4 + 32 * index;
        Pubkey::new(&entrants_data[start_index..start_index + 32])
    }

    fn append_entrant(&mut self, mut entrants_data: RefMut<&mut [u8]>, entrant: Pubkey) -> Result<()> {
        if self.total >= self.max {
            return Err(RaffleError::NotEnoughTicketsLeft.into());
        }
        let current_index = 8 + 4 + 4 + 32 * self.total as usize;
        let entrant_slice: &mut [u8] =
            &mut entrants_data[current_index..current_index + 32];
        entrant_slice.copy_from_slice(&entrant.to_bytes());
        self.total += 1;

        Ok(())
    }
}

#[error_code]
pub enum RaffleError {
    #[msg("Entrants account too small for max entrants")]
    EntrantsAccountTooSmallForMaxEntrants,
    #[msg("Raffle has ended")]
    RaffleEnded,
    #[msg("Invalid prize index")]
    InvalidPrizeIndex,
    #[msg("No prize")]
    NoPrize,
    #[msg("Invalid calculation")]
    InvalidCalculation,
    #[msg("Not enough tickets left")]
    NotEnoughTicketsLeft,
    #[msg("Raffle is still running")]
    RaffleStillRunning,
    #[msg("Winner already drawn")]
    WinnersAlreadyDrawn,
    #[msg("Winner not drawn")]
    WinnerNotDrawn,
    #[msg("Invalid revealed data")]
    InvalidRevealedData,
    #[msg("Ticket account not owned by winner")]
    TokenAccountNotOwnedByWinner,
    #[msg("Ticket has not won")]
    TicketHasNotWon,
    #[msg("Unclaimed prizes")]
    UnclaimedPrizes,
    #[msg("Invalid recent blockhashes")]
    InvalidRecentBlockhashes,
    #[msg("Only the creator can calin no entrant raffle prizes")]
    OnlyCreatorCanClaimNoEntrantRafflePrizes,
    #[msg("Invalid treasury token account owner")]
    InvalidTreasuryTokenAccountOwner,
}
