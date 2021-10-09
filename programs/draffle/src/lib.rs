pub mod oracle;
pub mod randomness_tools;
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::{self, Mint, TokenAccount};

pub const ENTRANTS_SIZE: u32 = 5000;
pub const TIME_BUFFER: i64 = 20;

declare_id!("DJgm9u3C2eiWVeokxwzJ92GbS5j2qiqsZ16YMoe8ShXf");

#[program]
pub mod draffle {
    use super::*;

    pub fn create_raffle(
        ctx: Context<CreateRaffle>,
        end_timestamp: i64,
        ticket_price: u64,
        max_entrants: u32,
    ) -> ProgramResult {
        let raffle = &mut ctx.accounts.raffle;

        raffle.creator = *ctx.accounts.creator.key;
        raffle.randomness = None;
        raffle.end_timestamp = end_timestamp;
        raffle.ticket_price = ticket_price;
        raffle.entrants = ctx.accounts.entrants.key();

        let mut entrants = ctx.accounts.entrants.load_init()?;
        if max_entrants > ENTRANTS_SIZE {
            return Err(RaffleError::MaxEntrantsTooLarge.into());
        }
        entrants.max = max_entrants;

        Ok(())
    }

    #[allow(unused_variables)]
    pub fn add_prize(ctx: Context<AddPrize>, prize_index: u32, amount: u64) -> ProgramResult {
        let clock = Clock::get()?;
        let raffle = &ctx.accounts.raffle;

        if clock.unix_timestamp > raffle.end_timestamp {
            return Err(RaffleError::RaffleEnded.into());
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

        Ok(())
    }

    pub fn buy_tickets(ctx: Context<BuyTickets>, amount: u32) -> ProgramResult {
        let clock = Clock::get()?;
        let raffle = &mut ctx.accounts.raffle;
        let mut entrants = ctx.accounts.entrants.load_mut()?;

        if clock.unix_timestamp > raffle.end_timestamp {
            return Err(RaffleError::RaffleEnded.into());
        }

        for _ in 0..amount {
            entrants.append(ctx.accounts.buyer_token_account.owner)?;
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

    pub fn reveal_winners(ctx: Context<RevealWinners>) -> ProgramResult {
        let clock = Clock::get()?;
        let raffle = &mut ctx.accounts.raffle;

        let end_timestamp_with_buffer = raffle.end_timestamp
            .checked_add(TIME_BUFFER)
            .ok_or(RaffleError::InvalidCalculation)?;
        if clock.unix_timestamp < end_timestamp_with_buffer {
            return Err(RaffleError::RaffleStillRunning.into());
        }

        let randomness = oracle::oracle_feeds_to_randomness(&vec![
            &ctx.accounts.price_feeds.pyth_sol_price,
            &ctx.accounts.price_feeds.pyth_btc_price,
            &ctx.accounts.price_feeds.pyth_srm_price,
        ])?;

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
    ) -> ProgramResult {
        let raffle = &ctx.accounts.raffle;

        let randomness = match raffle.randomness {
            Some(randomness) => randomness,
            None => return Err(RaffleError::WinnerNotDrawn.into()),
        };

        let entrants = ctx.accounts.entrants.load()?;

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

        if ctx.accounts.winner.key() != entrants.entrants[ticket_index as usize] {
            return Err(RaffleError::TicketNotSigned.into());
        }

        let (_, nonce) = Pubkey::find_program_address(
            &[b"raffle".as_ref(), raffle.entrants.as_ref()],
            ctx.program_id,
        );
        let seeds = &[b"raffle".as_ref(), raffle.entrants.as_ref(), &[nonce]];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info().clone(),
                token::Transfer {
                    from: ctx.accounts.prize.to_account_info(),
                    to: ctx.accounts.winner_token_account.to_account_info(),
                    authority: ctx.accounts.raffle.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.prize.amount,
        )?;

        Ok(())
    }

    pub fn collect_proceeds(ctx: Context<CollectProceeds>) -> ProgramResult {
        let raffle = &ctx.accounts.raffle;

        if !raffle.randomness.is_some() {
            return Err(RaffleError::WinnerNotDrawn.into());
        }

        let (_, nonce) = Pubkey::find_program_address(
            &[b"raffle".as_ref(), raffle.entrants.as_ref()],
            ctx.program_id,
        );
        let seeds = &[b"raffle".as_ref(), raffle.entrants.as_ref(), &[nonce]];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.proceeds.to_account_info(),
                    to: ctx.accounts.creator_proceeds.to_account_info(),
                    authority: ctx.accounts.raffle.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.proceeds.amount,
        )?;

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
        space = 8 + 300, // Option serialization workaround
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(zero)]
    pub entrants: Loader<'info, Entrants>,
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
    #[account(has_one = creator)]
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
    pub entrants: Loader<'info, Entrants>,
    #[account(
        mut,
        seeds = [raffle.key().as_ref(), b"proceeds"],
        bump,
    )]
    pub proceeds: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(signer)]
    pub buyer_transfer_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PriceFeeds<'info> {
    #[account(address = oracle::pyth_prices::sol_price::ID)]
    pub pyth_sol_price: AccountInfo<'info>,
    #[account(address = oracle::pyth_prices::btc_price::ID)]
    pub pyth_btc_price: AccountInfo<'info>,
    #[account(address = oracle::pyth_prices::srm_price::ID)]
    pub pyth_srm_price: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RevealWinners<'info> {
    #[account(mut)]
    pub raffle: Account<'info, Raffle>,
    pub price_feeds: PriceFeeds<'info>,
}

#[derive(Accounts)]
#[instruction(prize_index: u32)]
pub struct ClaimPrize<'info> {
    #[account(has_one = entrants)]
    pub raffle: Account<'info, Raffle>,
    pub entrants: Loader<'info, Entrants>,
    #[account(
        mut,
        seeds = [raffle.key().as_ref(), b"prize", &prize_index.to_le_bytes()],
        bump,
    )]
    pub prize: Account<'info, TokenAccount>,
    #[account(mut, constraint = winner_token_account.owner == winner.key())]
    pub winner_token_account: Account<'info, TokenAccount>,
    #[account(signer)]
    pub winner: AccountInfo<'info>,
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

#[account]
#[derive(Default, Debug)]
pub struct Raffle {
    pub creator: Pubkey,
    pub randomness: Option<[u8; 32]>,
    pub end_timestamp: i64,
    pub ticket_price: u64,
    pub entrants: Pubkey,
}

#[account(zero_copy)]
pub struct Entrants {
    pub total: u32,
    pub max: u32,
    pub entrants: [Pubkey; 5000], // ENTRANTS_SIZE
}

impl Entrants {
    fn append(&mut self, entrant: Pubkey) -> ProgramResult {
        if self.total >= self.max {
            return Err(RaffleError::NotEnoughTicketsLeft.into());
        }
        self.entrants[self.total as usize] = entrant;
        self.total += 1;
        Ok(())
    }
}

#[error]
pub enum RaffleError {
    #[msg("Max entrants is too large")]
    MaxEntrantsTooLarge,
    #[msg("Raffle has ended")]
    RaffleEnded,
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
    #[msg("Ticket not signed")]
    TicketNotSigned,
    #[msg("Ticket has not won")]
    TicketHasNotWon,
}
