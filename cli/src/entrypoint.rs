use anchor_client::anchor_lang::Key;
use anchor_client::solana_client::rpc_config::RpcSendTransactionConfig;
use anchor_client::solana_sdk::program_pack::Pack;
use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        instruction::Instruction,
        signature::Signer,
        signature::{read_keypair_file, Keypair},
        system_instruction, system_program, sysvar,
        transaction::Transaction,
    },
    Client, Cluster,
};
use anchor_lang::prelude::*;
use anchor_lang::InstructionData;
use anyhow::{Context, Result};
use bincode::deserialize;
use chrono::NaiveDateTime;
use clap::Parser;
use draffle::Entrants;
use spl_associated_token_account;
use std::cell::RefCell;
use std::rc::Rc;
use std::str::FromStr;

#[derive(Default, Debug, Parser)]
pub struct ConfigOverride {
    /// Cluster override.
    #[clap(global = true, long = "provider.cluster")]
    pub cluster: Option<Cluster>,
    // /// Wallet override.
    #[clap(global = true, long = "provider.wallet")]
    pub wallet: Option<String>,
    #[clap(
        global = true,
        long = "program-id",
        default_value = "dRaFFLe111111111111111111111111111111111112"
    )]
    pub program_id: String,
}

#[derive(Debug, Parser)]
pub enum Command {
    ShowRaffle {
        raffle: Pubkey,
    },
    /// Creates a raffle.
    CreateRaffle {
        proceeds_mint: Pubkey,
        ticket_price: u64,
        end_date_utc: String,
        entrants_keypair: Option<String>,
        #[clap(long = "max-entrants")]
        max_entrants: Option<u32>,
    },
    /// Adds a prize to a raffle.
    AddPrize {
        raffle: Pubkey,
        prize_mint: Pubkey,
        prize_amount: u64,
        prize_index: u32,
    },
    /// Reveal winners of a raffle.
    RevealWinners {
        raffle: Pubkey,
    },
    /// Collect proceeds of a raffle.
    CollectProceeds {
        raffle: Pubkey,
        creator_proceeds: Pubkey,
    },
    // Close entrants
    CloseEntrants {
        raffle: Pubkey,
    },
}

#[derive(Debug, Parser)]
pub struct Opts {
    #[clap(flatten)]
    pub cfg_override: ConfigOverride,
    #[clap(subcommand)]
    pub command: Command,
}

pub fn entry(opts: Opts) -> Result<()> {
    let wallet = match opts.cfg_override.wallet {
        Some(wallet) => wallet,
        None => shellexpand::tilde("~/.config/solana/id.json").to_string(),
    };

    // Client setup
    let payer = read_keypair_file(wallet.clone()).expect("Example requires a keypair file");
    let payer2 = read_keypair_file(wallet).expect("Example requires a keypair file");
    let url = match opts.cfg_override.cluster {
        Some(cluster) => cluster,
        None => Cluster::Custom(
            "http://localhost:8899".to_string(),
            "ws://127.0.0.1:8900".to_string(),
        ),
    };
    let client = Client::new_with_options(url, Rc::new(payer), CommitmentConfig::processed());
    let program_id: Pubkey = FromStr::from_str(&opts.cfg_override.program_id)?;
    let program_client = client.program(program_id);

    match opts.command {
        Command::ShowRaffle { raffle } => show_raffle(&program_client, raffle),
        Command::CreateRaffle {
            proceeds_mint,
            ticket_price,
            end_date_utc,
            entrants_keypair,
            max_entrants,
        } => create_raffle(
            program_id,
            &program_client,
            proceeds_mint,
            ticket_price,
            end_date_utc,
            entrants_keypair,
            max_entrants,
        ),
        Command::AddPrize {
            raffle,
            prize_mint,
            prize_amount,
            prize_index,
        } => add_prize(
            program_id,
            &program_client,
            raffle,
            prize_mint,
            prize_amount,
            prize_index,
        ),
        Command::RevealWinners { raffle } => {
            reveal_winners(program_id, &program_client, raffle, &payer2)
        }
        Command::CollectProceeds {
            raffle,
            creator_proceeds,
        } => collect_proceeds(
            program_id,
            &program_client,
            raffle,
            creator_proceeds,
            &payer2,
        ),
        Command::CloseEntrants { raffle } => close_entrants(&program_client, raffle),
    }
}

fn show_raffle(program_client: &anchor_client::Program, raffle: Pubkey) -> Result<()> {
    let raffle: draffle::Raffle = program_client.account(raffle)?;
    println!("{:#?}", raffle);
    match raffle.randomness {
        Some(randomness) => {
            let entrants: draffle::Entrants = program_client.account(raffle.entrants)?;
            for i in 0..raffle.total_prizes {
                println!(
                    "prize {}, winning ticket {}",
                    i,
                    draffle::randomness_tools::expand(randomness, i) % entrants.total
                );
            }
        }
        _ => (),
    }
    Ok(())
}

fn create_raffle(
    program_id: Pubkey,
    program_client: &anchor_client::Program,
    proceeds_mint: Pubkey,
    ticket_price: u64,
    end_date_utc: String,
    entrants_keypair: Option<String>,
    max_entrants: Option<u32>,
) -> Result<()> {
    let entrants_keypair = match entrants_keypair {
        Some(entrants_keypair) => {
            read_keypair_file(entrants_keypair).expect("Could not find entrants keypair")
        }
        _ => Keypair::new(),
    };

    let (raffle, _) = Pubkey::find_program_address(
        &[b"raffle".as_ref(), entrants_keypair.pubkey().as_ref()],
        &program_id,
    );
    println!("Raffle address: {:}", raffle);
    let (proceeds, _) =
        Pubkey::find_program_address(&[raffle.key().as_ref(), b"proceeds".as_ref()], &program_id);

    // Request arguments
    let clock = deserialize::<Clock>(
        &program_client
            .rpc()
            .get_account(&sysvar::clock::ID)
            .unwrap()
            .data,
    )
    .unwrap();
    let date_time = NaiveDateTime::parse_from_str(&end_date_utc, "%Y-%m-%d %H:%M")?;
    let end_timestamp: i64 = date_time.timestamp();
    println!(
        "Cluster clock unix_timestamp: {:}, raffle end_timestamp: {:}",
        clock.unix_timestamp, end_timestamp
    );
    let max_entrants = max_entrants.unwrap_or(draffle::ENTRANTS_SIZE);
    let entrants_account_size = 8 + 4 + 4 + 32 * max_entrants as usize;
    program_client
        .request()
        .instruction(system_instruction::create_account(
            &program_client.payer(),
            &entrants_keypair.pubkey(),
            program_client
                .rpc()
                .get_minimum_balance_for_rent_exemption(entrants_account_size)?,
            entrants_account_size as u64,
            &program_id,
        ))
        .accounts(draffle::accounts::CreateRaffle {
            raffle,
            entrants: entrants_keypair.pubkey(),
            creator: program_client.payer(),
            proceeds,
            proceeds_mint,
            system_program: system_program::id(),
            token_program: spl_token::id(),
            rent: sysvar::rent::ID,
        })
        .args(draffle::instruction::CreateRaffle {
            end_timestamp,
            ticket_price,
            max_entrants,
        })
        .signer(&entrants_keypair)
        .send()?;

    Ok(())
}

fn add_prize(
    program_id: Pubkey,
    program_client: &anchor_client::Program,
    raffle: Pubkey,
    prize_mint: Pubkey,
    prize_amount: u64,
    prize_index: u32,
) -> Result<()> {
    // Accounts creation
    let (prize, _) = Pubkey::find_program_address(
        &[raffle.as_ref(), b"prize", &prize_index.to_le_bytes()],
        &program_id,
    );

    let creator_prize_token_account = spl_associated_token_account::get_associated_token_address(
        &program_client.payer(),
        &prize_mint,
    );

    // Request arguments
    program_client
        .request()
        .accounts(draffle::accounts::AddPrize {
            raffle,
            creator: program_client.payer(),
            from: creator_prize_token_account,
            prize,
            prize_mint,
            system_program: system_program::id(),
            token_program: spl_token::id(),
            rent: sysvar::rent::ID,
        })
        .args(draffle::instruction::AddPrize {
            prize_index,
            amount: prize_amount,
        })
        .send()?;

    Ok(())
}

fn reveal_winners(
    program_id: Pubkey,
    program_client: &anchor_client::Program,
    raffle: Pubkey,
    payer: &Keypair,
) -> Result<()> {
    let rpc_client = program_client.rpc();
    let latest_hash = rpc_client.get_latest_blockhash().unwrap();
    rpc_client.send_and_confirm_transaction_with_spinner_and_config(
        &Transaction::new_signed_with_payer(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::RevealWinners {
                    raffle,
                    recent_blockhashes: sysvar::recent_blockhashes::ID,
                }
                .to_account_metas(None),
                data: draffle::instruction::RevealWinners.data(),
            }],
            Some(&program_client.payer()),
            &[payer],
            latest_hash,
        ),
        CommitmentConfig::confirmed(),
        RpcSendTransactionConfig {
            skip_preflight: true,
            ..RpcSendTransactionConfig::default()
        },
    )?;

    Ok(())
}

fn collect_proceeds(
    program_id: Pubkey,
    program_client: &anchor_client::Program,
    raffle: Pubkey,
    creator_proceeds: Pubkey,
    payer: &Keypair,
) -> Result<()> {
    let (proceeds, _) =
        Pubkey::find_program_address(&[raffle.key().as_ref(), b"proceeds".as_ref()], &program_id);
    let rpc_client = program_client.rpc();
    let latest_hash = rpc_client.get_latest_blockhash().unwrap();
    rpc_client.send_and_confirm_transaction_with_spinner_and_config(
        &Transaction::new_signed_with_payer(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::CollectProceeds {
                    raffle,
                    proceeds,
                    creator: program_client.payer(),
                    creator_proceeds,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: draffle::instruction::CollectProceeds.data(),
            }],
            Some(&program_client.payer()),
            &[payer],
            latest_hash,
        ),
        CommitmentConfig::confirmed(),
        RpcSendTransactionConfig {
            skip_preflight: true,
            ..RpcSendTransactionConfig::default()
        },
    )?;

    Ok(())
}

/// If the winners haven't claimed it is permissionless to claim into their wallet
fn claim_for_winners(program_client: &anchor_client::Program, raffle: Pubkey) -> Result<()> {
    let raffle_state: draffle::Raffle = program_client.account(raffle)?;

    let randomness = raffle_state.randomness
        .context("The randomness has not been revealed yet, raffle could still be ongoing or reveal_winners needs to be called")?;

    let entrants_account_data = program_client
        .rpc()
        .get_account_data(&raffle_state.entrants)
        .expect("Entrants not found for the raffle, is it already closed?");
    let entrants: draffle::Entrants = program_client.account(raffle_state.entrants)?;
    for prize_index in 0..raffle_state.total_prizes {
        let ticket_index =
            draffle::randomness_tools::expand(randomness, prize_index) & entrants.total;
        println!("prize {}, winning ticket {}", prize_index, ticket_index);

        let winner = Entrants::get_entrant(
            RefCell::new(&mut entrants_account_data.clone()[..]).borrow(),
            ticket_index as usize,
        );

        let prize = Pubkey::find_program_address(
            &[raffle.as_ref(), b"prize", &prize_index.to_le_bytes()],
            &program_client.id(),
        )
        .0;

        let prize_token_account = spl_token::state::Account::unpack(
            &program_client
                .rpc()
                .get_account_data(&prize)
                .expect("Prize account does not exist, but it should be unreachable"),
        )?;

        if prize_token_account.amount == 0 {
            println!(
                "Skipping prize {} as it has already been claimed",
                prize_index
            );
            continue;
        }

        let winner_token_account = spl_associated_token_account::get_associated_token_address(
            &winner,
            &prize_token_account.mint,
        );

        program_client
            .request()
            .instruction(
                build_associated_token_account_create_idempotent_instruction(
                    &program_client.payer(),
                    &winner,
                    &prize_token_account.mint,
                    &spl_token::ID,
                ),
            )
            .accounts(draffle::accounts::ClaimPrize {
                raffle,
                entrants: raffle_state.entrants,
                prize,
                winner_token_account,
                token_program: spl_token::ID,
            })
            .args(draffle::instruction::ClaimPrize {
                prize_index,
                ticket_index,
            })
            .send()?;
    }

    Ok(())
}

// Copy/pasted as 1.1.0 isn't released yet and we want CreateIdempotent
fn build_associated_token_account_create_idempotent_instruction(
    funding_address: &Pubkey,
    wallet_address: &Pubkey,
    token_mint_address: &Pubkey,
    token_program_id: &Pubkey,
) -> Instruction {
    let associated_account_address = spl_associated_token_account::get_associated_token_address(
        wallet_address,
        token_mint_address,
    );

    Instruction {
        program_id: spl_associated_token_account::ID,
        accounts: vec![
            AccountMeta::new(*funding_address, true),
            AccountMeta::new(associated_account_address, false),
            AccountMeta::new_readonly(*wallet_address, false),
            AccountMeta::new_readonly(*token_mint_address, false),
            AccountMeta::new_readonly(system_program::ID, false),
            AccountMeta::new_readonly(*token_program_id, false),
        ],
        data: vec![1],
    }
}

fn close_entrants(program_client: &anchor_client::Program, raffle: Pubkey) -> Result<()> {
    let raffle_state: draffle::Raffle = program_client.account(raffle)?;

    program_client
        .request()
        .accounts(draffle::accounts::CloseEntrants {
            raffle,
            entrants: raffle_state.entrants,
            creator: program_client.payer(),
        })
        .args(draffle::instruction::CloseEntrants)
        .send()?;

    Ok(())
}
