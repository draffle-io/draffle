use anchor_client::anchor_lang::Key;
use anchor_client::solana_client::rpc_config::RpcSendTransactionConfig;
use anchor_client::solana_sdk::signature::Signer;
use anchor_client::solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::Instruction,
    signature::{read_keypair_file, Keypair},
    system_instruction, system_program, sysvar,
    transaction::Transaction,
};
use anchor_client::{Client, Cluster};
use anchor_lang::prelude::*;
use anchor_lang::InstructionData;
use anyhow::Result;
use bincode::deserialize;
use chrono::NaiveDateTime;
use clap::Parser;
use spl_associated_token_account;
use std::mem::size_of;
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
    let entrants_account_size = 8 + size_of::<draffle::Entrants>();
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
            max_entrants: max_entrants.unwrap_or(draffle::ENTRANTS_SIZE),
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
