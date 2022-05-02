use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::{prelude::*, InstructionData};
use assert_matches::assert_matches;
use bincode::deserialize;
use bytemuck;
use draffle::{Entrants, Raffle};
use solana_program_test::{processor, tokio, ProgramTest, ProgramTestContext};
use solana_sdk::{
    instruction::{Instruction, InstructionError},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction, system_program, sysvar,
    transaction::{Transaction, TransactionError},
};
use std::mem::size_of;
use std::str::FromStr;

#[tokio::test]
async fn test_raffle() {
    let mut draffle_program_test = DraffleProgramTest::start_new().await;

    let entrants_keypair = Keypair::new();

    let proceeds_mint_keypair = Keypair::new();
    // NFT like
    let first_prize_mint_keypair = Keypair::new();
    // Fungible
    let second_prize_mint_keypair = Keypair::new();

    let program_id = draffle_program_test.program_id;
    let payer_pk = draffle_program_test.context.payer.pubkey();

    // Setup
    initialize_mint(&proceeds_mint_keypair, 9, &mut draffle_program_test).await;
    let creator_proceeds_ata = initialize_ata(
        &payer_pk,
        &proceeds_mint_keypair.pubkey(),
        &mut draffle_program_test,
    )
    .await;
    initialize_mint(&first_prize_mint_keypair, 0, &mut draffle_program_test).await;
    let creator_first_prize_ata = initialize_ata(
        &payer_pk,
        &first_prize_mint_keypair.pubkey(),
        &mut draffle_program_test,
    )
    .await;
    mint_some(
        &creator_first_prize_ata,
        &first_prize_mint_keypair.pubkey(),
        &mut draffle_program_test,
        1,
    )
    .await;
    initialize_mint(&second_prize_mint_keypair, 4, &mut draffle_program_test).await;
    let creator_second_prize_ata = initialize_ata(
        &payer_pk,
        &second_prize_mint_keypair.pubkey(),
        &mut draffle_program_test,
    )
    .await;
    mint_some(
        &creator_second_prize_ata,
        &second_prize_mint_keypair.pubkey(),
        &mut draffle_program_test,
        321,
    )
    .await;
    let users = prepare_users(&proceeds_mint_keypair.pubkey(), &mut draffle_program_test).await;

    // Create raffle
    let (raffle, _) = Pubkey::find_program_address(
        &[b"raffle".as_ref(), entrants_keypair.pubkey().as_ref()],
        &draffle_program_test.program_id,
    );

    let (proceeds, _) = Pubkey::find_program_address(
        &[raffle.key().as_ref(), b"proceeds".as_ref()],
        &draffle_program_test.program_id,
    );

    let clock = draffle_program_test.get_clock().await;
    println!("{:?}", clock);
    let end_timestamp: i64 = clock.unix_timestamp + 5;
    let ticket_price = 1234;

    let entrants_rent_exempt_threshold = draffle_program_test
        .context
        .banks_client
        .get_rent()
        .await
        .unwrap()
        .minimum_balance(8 + size_of::<draffle::Entrants>());

    draffle_program_test
        .process_tx_and_assert_ok(
            &[
                system_instruction::create_account(
                    &payer_pk,
                    &entrants_keypair.pubkey(),
                    entrants_rent_exempt_threshold,
                    8 + size_of::<draffle::Entrants>() as u64,
                    &program_id,
                ),
                Instruction {
                    program_id,
                    accounts: draffle::accounts::CreateRaffle {
                        raffle,
                        entrants: entrants_keypair.pubkey(),
                        creator: payer_pk,
                        proceeds,
                        proceeds_mint: proceeds_mint_keypair.pubkey(),
                        system_program: system_program::id(),
                        token_program: spl_token::id(),
                        rent: sysvar::rent::ID,
                    }
                    .to_account_metas(None),
                    data: draffle::instruction::CreateRaffle {
                        end_timestamp,
                        ticket_price,
                        max_entrants: 5000,
                    }
                    .data(),
                },
            ],
            &[&entrants_keypair],
        )
        .await;

    // Add first prize
    let (first_prize, _) = Pubkey::find_program_address(
        &[raffle.key().as_ref(), b"prize", &0u32.to_le_bytes()],
        &program_id,
    );
    draffle_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::AddPrize {
                    raffle,
                    creator: payer_pk,
                    from: creator_first_prize_ata,
                    prize: first_prize,
                    prize_mint: first_prize_mint_keypair.pubkey(),
                    system_program: system_program::id(),
                    token_program: spl_token::id(),
                    rent: sysvar::rent::ID,
                }
                .to_account_metas(None),
                data: draffle::instruction::AddPrize {
                    prize_index: 0,
                    amount: 1,
                }
                .data(),
            }],
            &[],
        )
        .await;

    // Add second prize
    let (second_prize, _) = Pubkey::find_program_address(
        &[raffle.key().as_ref(), b"prize", &1u32.to_le_bytes()],
        &program_id,
    );
    draffle_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::AddPrize {
                    raffle,
                    creator: payer_pk,
                    from: creator_second_prize_ata,
                    prize: second_prize,
                    prize_mint: second_prize_mint_keypair.pubkey(),
                    system_program: system_program::id(),
                    token_program: spl_token::id(),
                    rent: sysvar::rent::ID,
                }
                .to_account_metas(None),
                data: draffle::instruction::AddPrize {
                    prize_index: 1,
                    amount: 123,
                }
                .data(),
            }],
            &[],
        )
        .await;

    // Buy tickets
    for (i, user) in users.iter().enumerate() {
        draffle_program_test
            .process_tx_and_assert_ok(
                &[Instruction {
                    program_id,
                    accounts: draffle::accounts::BuyTickets {
                        raffle,
                        entrants: entrants_keypair.pubkey(),
                        proceeds,
                        buyer_token_account: user.proceeds_mint_ata,
                        buyer_transfer_authority: user.keypair.pubkey(),
                        token_program: spl_token::id(),
                    }
                    .to_account_metas(None),
                    data: draffle::instruction::BuyTickets {
                        amount: fibonacci(i as u32) + 1,
                    }
                    .data(),
                }],
                &[&user.keypair],
            )
            .await;
    }

    // Try to collect proceeds before end

    // Draw winner too early
    draffle_program_test
        .process_tx_and_assert_err(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::RevealWinners {
                    raffle,
                    recent_blockhashes: sysvar::recent_blockhashes::ID,
                }
                .to_account_metas(None),
                data: draffle::instruction::RevealWinners.data(),
            }],
            &[],
            TransactionError::InstructionError(
                0,
                InstructionError::Custom(draffle::RaffleError::RaffleStillRunning as u32 + 6000),
            ),
        )
        .await;

    // Progress to after raffle end time
    loop {
        let clock = draffle_program_test.get_clock().await;
        if clock.unix_timestamp > end_timestamp + draffle::TIME_BUFFER {
            break;
        }
        draffle_program_test
            .context
            .warp_to_slot(clock.slot + 5)
            .unwrap();
    }

    // Draw winner
    draffle_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::RevealWinners {
                    raffle,
                    recent_blockhashes: sysvar::recent_blockhashes::ID,
                }
                .to_account_metas(None),
                data: draffle::instruction::RevealWinners.data(),
            }],
            &[],
        )
        .await;

    let raffle_data = &draffle_program_test
        .context
        .banks_client
        .get_account(raffle)
        .await
        .unwrap()
        .unwrap()
        .data;
    let raffle_state: Raffle = Raffle::try_deserialize(&mut raffle_data.as_ref()).unwrap();

    assert_eq!(true, raffle_state.randomness.is_some());

    // Claim first prize
    let entrants_data = &draffle_program_test
        .context
        .banks_client
        .get_account(entrants_keypair.pubkey())
        .await
        .unwrap()
        .unwrap()
        .data;
    let entrants: &Entrants = bytemuck::from_bytes::<Entrants>(&entrants_data[8..]);
    println!("{:?}", &entrants.entrants[..20]);

    let first_prize_winner_ticket =
        draffle::randomness_tools::expand(raffle_state.randomness.unwrap(), 0) % entrants.total;
    let first_prize_winner = entrants.entrants[first_prize_winner_ticket as usize];
    let winner_prize_ata = spl_associated_token_account::get_associated_token_address(
        &first_prize_winner,
        &first_prize_mint_keypair.pubkey(),
    );

    println!("first_prize_winner_ticket: {}", first_prize_winner_ticket);
    println!("Entrants data winner: {}", first_prize_winner);

    draffle_program_test
        .process_tx_and_assert_ok(
            &[
                spl_associated_token_account::create_associated_token_account(
                    &payer_pk,
                    &first_prize_winner,
                    &first_prize_mint_keypair.pubkey(),
                ),
                Instruction {
                    program_id,
                    accounts: draffle::accounts::ClaimPrize {
                        raffle,
                        entrants: entrants_keypair.pubkey(),
                        prize: first_prize,
                        winner_token_account: winner_prize_ata,
                        token_program: spl_token::ID,
                    }
                    .to_account_metas(None),
                    data: draffle::instruction::ClaimPrize {
                        prize_index: 0,
                        ticket_index: first_prize_winner_ticket,
                    }
                    .data(),
                },
            ],
            &[],
        )
        .await;

    // Close entrants before all prizes are claimed
    draffle_program_test
        .process_tx_and_assert_err(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::CloseEntrants {
                    raffle,
                    entrants: entrants_keypair.pubkey(),
                    creator: payer_pk,
                }
                .to_account_metas(None),
                data: draffle::instruction::CloseEntrants.data(),
            }],
            &[],
            TransactionError::InstructionError(
                0,
                InstructionError::Custom(draffle::RaffleError::UnclaimedPrizes as u32 + 6000),
            ),
        )
        .await;

    // Claim second prize
    let second_prize_winner_ticket =
        draffle::randomness_tools::expand(raffle_state.randomness.unwrap(), 1) % entrants.total;
    let second_prize_winner = entrants.entrants[second_prize_winner_ticket as usize];
    let second_prize_winner_ata = spl_associated_token_account::get_associated_token_address(
        &second_prize_winner,
        &second_prize_mint_keypair.pubkey(),
    );

    draffle_program_test
        .process_tx_and_assert_ok(
            &[
                spl_associated_token_account::create_associated_token_account(
                    &payer_pk,
                    &second_prize_winner,
                    &second_prize_mint_keypair.pubkey(),
                ),
                Instruction {
                    program_id,
                    accounts: draffle::accounts::ClaimPrize {
                        raffle,
                        entrants: entrants_keypair.pubkey(),
                        prize: second_prize,
                        winner_token_account: second_prize_winner_ata,
                        token_program: spl_token::ID,
                    }
                    .to_account_metas(None),
                    data: draffle::instruction::ClaimPrize {
                        prize_index: 1,
                        ticket_index: second_prize_winner_ticket,
                    }
                    .data(),
                },
            ],
            &[],
        )
        .await;

    // Collect proceeds
    draffle_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: draffle::accounts::CollectProceeds {
                    raffle,
                    proceeds,
                    creator: payer_pk,
                    creator_proceeds: creator_proceeds_ata,
                    token_program: spl_token::ID,
                }
                .to_account_metas(None),
                data: draffle::instruction::CollectProceeds.data(),
            }],
            &[],
        )
        .await;

    // Close entrants
    draffle_program_test
        .process_tx_and_assert_ok(
            &[
                Instruction {
                    program_id,
                    accounts: draffle::accounts::CloseEntrants {
                        raffle,
                        entrants: entrants_keypair.pubkey(),
                        creator: payer_pk,
                    }
                    .to_account_metas(None),
                    data: draffle::instruction::CloseEntrants.data(),
                },
                // Self transfer to prevent identical signature as before
                system_instruction::transfer(&payer_pk, &payer_pk, 0),
            ],
            &[],
        )
        .await;
}

pub async fn initialize_mint(
    mint_keypair: &Keypair,
    decimals: u8,
    draffle_program_test: &mut DraffleProgramTest,
) {
    let mint_rent_exempt_threshold = draffle_program_test
        .context
        .banks_client
        .get_rent()
        .await
        .unwrap()
        .minimum_balance(spl_token::state::Mint::LEN);

    draffle_program_test
        .process_tx_and_assert_ok(
            &[
                system_instruction::create_account(
                    &draffle_program_test.context.payer.pubkey(),
                    &mint_keypair.pubkey(),
                    mint_rent_exempt_threshold,
                    spl_token::state::Mint::LEN as u64,
                    &spl_token::id(),
                ),
                spl_token::instruction::initialize_mint(
                    &spl_token::id(),
                    &mint_keypair.pubkey(),
                    &draffle_program_test.context.payer.pubkey(),
                    None,
                    decimals,
                )
                .unwrap(),
            ],
            &[mint_keypair],
        )
        .await;
}

pub async fn initialize_ata(
    user: &Pubkey,
    mint: &Pubkey,
    draffle_program_test: &mut DraffleProgramTest,
) -> Pubkey {
    draffle_program_test
        .process_tx_and_assert_ok(
            &[
                spl_associated_token_account::create_associated_token_account(
                    &draffle_program_test.context.payer.pubkey(),
                    user,
                    mint,
                ),
            ],
            &[],
        )
        .await;
    spl_associated_token_account::get_associated_token_address(user, mint)
}

// To simplify, the payer is mint authority of all mints
pub async fn mint_some(
    token_account: &Pubkey,
    mint: &Pubkey,
    draffle_program_test: &mut DraffleProgramTest,
    amount: u64,
) {
    draffle_program_test
        .process_tx_and_assert_ok(
            &[spl_token::instruction::mint_to(
                &spl_token::id(),
                mint,
                &token_account,
                &draffle_program_test.context.payer.pubkey(),
                &[],
                amount,
            )
            .unwrap()],
            &[],
        )
        .await;
}

pub struct User {
    keypair: Keypair,
    proceeds_mint_ata: Pubkey,
}

async fn prepare_users(
    proceeds_mint: &Pubkey,
    draffle_program_test: &mut DraffleProgramTest,
) -> Vec<User> {
    let mut users = Vec::new();
    for _ in 0..10 {
        let keypair = Keypair::new();
        let proceeds_mint_ata =
            initialize_ata(&keypair.pubkey(), proceeds_mint, draffle_program_test).await;
        mint_some(
            &proceeds_mint_ata,
            proceeds_mint,
            draffle_program_test,
            1000000,
        )
        .await;
        users.push(User {
            keypair,
            proceeds_mint_ata,
        })
    }
    users
}

fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 1,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

pub struct DraffleProgramTest {
    pub context: ProgramTestContext,
    pub rent: Rent,
    pub program_id: Pubkey,
}

impl DraffleProgramTest {
    pub async fn start_new() -> Self {
        let pt = ProgramTest::new("draffle", draffle::ID, processor!(draffle::entry));

        let mut context = pt.start_with_context().await;
        let rent = context.banks_client.get_rent().await.unwrap();

        Self {
            context,
            rent,
            program_id: draffle::ID,
        }
    }

    pub async fn process_tx_and_assert_ok(
        &mut self,
        instructions: &[Instruction],
        signers: &[&Keypair],
    ) {
        let mut all_signers = vec![&self.context.payer];
        all_signers.extend_from_slice(signers);

        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&self.context.payer.pubkey()),
            &all_signers,
            self.context.last_blockhash,
        );

        assert_matches!(
            self.context.banks_client.process_transaction(tx).await,
            Ok(())
        );
    }

    pub async fn process_tx_and_assert_err(
        &mut self,
        instructions: &[Instruction],
        signers: &[&Keypair],
        transaction_error: TransactionError,
    ) {
        let mut all_signers = vec![&self.context.payer];
        all_signers.extend_from_slice(signers);

        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&self.context.payer.pubkey()),
            &all_signers,
            self.context.last_blockhash,
        );

        assert_eq!(
            transaction_error,
            self.context
                .banks_client
                .process_transaction(tx)
                .await
                .unwrap_err()
                .unwrap(),
        );
    }

    pub async fn get_clock(&mut self) -> Clock {
        deserialize::<Clock>(
            &self
                .context
                .banks_client
                .get_account(sysvar::clock::ID)
                .await
                .unwrap()
                .unwrap()
                .data,
        )
        .unwrap()
    }
}
