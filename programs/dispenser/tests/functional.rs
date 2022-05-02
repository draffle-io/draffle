use anchor_lang::{prelude::*, InstructionData};
use anchor_client::solana_sdk::{
    instruction::{Instruction, InstructionError},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction, system_program, sysvar,
    transaction::{Transaction, TransactionError},
};
use anchor_spl::token::TokenAccount;
use assert_matches::assert_matches;
use dispenser::{DispenserError, Registry};
use solana_program_test::{processor, tokio, ProgramTest, ProgramTestContext};
use std::str::FromStr;

#[tokio::test]
async fn test_dispenser() {
    let mut dispenser_program_test = DispenserProgramTest::start_new().await;

    let dct_mint_keypair = Keypair::new();
    let wsol_mint_keypair = Keypair::new();
    let registry_keypair = Keypair::new();

    let program_id = dispenser_program_test.program_id;
    let payer_pk = dispenser_program_test.context.payer.pubkey();

    // Setup DCT mint and create user ATA

    initialize_mint(&dct_mint_keypair, 6, &mut dispenser_program_test).await;
    let user_dct_ata = initialize_ata(
        &payer_pk,
        &dct_mint_keypair.pubkey(),
        &mut dispenser_program_test,
    )
    .await;

    // Setup wSOL mint, create user ATA, and fund it

    initialize_mint(&wsol_mint_keypair, 9, &mut dispenser_program_test).await;
    let user_wsol_ata = initialize_ata(
        &payer_pk,
        &wsol_mint_keypair.pubkey(),
        &mut dispenser_program_test,
    )
    .await;
    mint_some(
        &user_wsol_ata,
        &wsol_mint_keypair.pubkey(),
        &mut dispenser_program_test,
        1_500_000_000,
    )
    .await;

    // Create vaults and registry

    let (vault_wsol, _) = Pubkey::find_program_address(
        &[
            b"vault_token_in".as_ref(),
            registry_keypair.pubkey().as_ref(),
        ],
        &program_id,
    );
    println!("{}", vault_wsol);

    let (vault_dct, _) = Pubkey::find_program_address(
        &[
            b"vault_token_out".as_ref(),
            registry_keypair.pubkey().as_ref(),
        ],
        &program_id,
    );
    println!("{}", vault_dct);

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::CreateRegistry {
                    registry: registry_keypair.pubkey(),
                    vault_token_in: vault_wsol,
                    vault_token_out: vault_dct,
                    admin: payer_pk,
                    mint_token_in: wsol_mint_keypair.pubkey(),
                    mint_token_out: dct_mint_keypair.pubkey(),
                    token_program: spl_token::id(),
                    system_program: system_program::id(),
                    rent: sysvar::rent::ID,
                }
                .to_account_metas(None),
                data: dispenser::instruction::CreateRegistry {
                    rate_token_in: 500_000_000,
                    rate_token_out: 1_000_000,
                }
                .data(),
            }],
            &[&registry_keypair],
        )
        .await;

    // Fund DCT vault

    mint_some(
        &vault_dct,
        &dct_mint_keypair.pubkey(),
        &mut dispenser_program_test,
        3_000_000,
    )
    .await;

    // Successful swap

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::Swap {
                    registry: registry_keypair.pubkey(),
                    swapper: payer_pk,
                    vault_token_in: vault_wsol,
                    vault_token_out: vault_dct,
                    buyer_token_in_account: user_wsol_ata,
                    buyer_token_out_account: user_dct_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::Swap {
                    amount_requested: 3_000_000,
                }
                .data(),
            }],
            &[],
        )
        .await;
    let vault_dct_account_state = get_token_account(vault_dct, &mut dispenser_program_test).await;
    let user_dct_account_state = get_token_account(user_dct_ata, &mut dispenser_program_test).await;
    let vault_wsol_account_state = get_token_account(vault_wsol, &mut dispenser_program_test).await;
    let user_wsol_account_state =
        get_token_account(user_wsol_ata, &mut dispenser_program_test).await;
    // println!("Vault DCT amount: {:#?}", vault_dct_account_state.amount);
    // println!("User DCT amount: {:#?}", user_dct_account_state.amount);
    assert_eq!(vault_dct_account_state.amount, 0);
    assert_eq!(user_dct_account_state.amount, 3_000_000);
    assert_eq!(vault_wsol_account_state.amount, 1_500_000_000);
    assert_eq!(user_wsol_account_state.amount, 0);

    // Failed swap (not enough DCT in vault)

    mint_some(
        &user_wsol_ata,
        &wsol_mint_keypair.pubkey(),
        &mut dispenser_program_test,
        4_000_000_000,
    )
    .await;

    dispenser_program_test
        .process_tx_and_assert_err(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::Swap {
                    registry: registry_keypair.pubkey(),
                    swapper: payer_pk,
                    vault_token_in: vault_wsol,
                    vault_token_out: vault_dct,
                    buyer_token_in_account: user_wsol_ata,
                    buyer_token_out_account: user_dct_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::Swap {
                    amount_requested: 8_000_000,
                }
                .data(),
            }],
            &[],
            TransactionError::InstructionError(
                0,
                InstructionError::Custom(DispenserError::InsufficientVaultFunds as u32 + 300),
            ),
        )
        .await;

    // Failed swap (not enough wSOL in user account)

    mint_some(
        &vault_dct,
        &dct_mint_keypair.pubkey(),
        &mut dispenser_program_test,
        9_000_000,
    )
    .await;

    dispenser_program_test
        .process_tx_and_assert_err(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::Swap {
                    registry: registry_keypair.pubkey(),
                    swapper: payer_pk,
                    vault_token_in: vault_wsol,
                    vault_token_out: vault_dct,
                    buyer_token_in_account: user_wsol_ata,
                    buyer_token_out_account: user_dct_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::Swap {
                    amount_requested: 9_000_000,
                }
                .data(),
            }],
            &[],
            TransactionError::InstructionError(
                0,
                InstructionError::Custom(DispenserError::InsufficientUserFunds as u32 + 300),
            ),
        )
        .await;

    // Modify swap rates

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::UpdateRegistry {
                    registry: registry_keypair.pubkey(),
                    admin: payer_pk,
                }
                .to_account_metas(None),
                data: dispenser::instruction::UpdateRegistry {
                    rate_token_in: 200_000_000,
                    rate_token_out: 2_000_000,
                }
                .data(),
            }],
            &[],
        )
        .await;

    let registry_data = &dispenser_program_test
        .context
        .banks_client
        .get_account(registry_keypair.pubkey())
        .await
        .unwrap()
        .unwrap()
        .data;
    let registry_state: Registry = Registry::try_deserialize(&mut registry_data.as_ref()).unwrap();
    assert_eq!(registry_state.rate_token_in, 200_000_000);
    assert_eq!(registry_state.rate_token_out, 2_000_000);

    // Successful swap with new rate

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::Swap {
                    registry: registry_keypair.pubkey(),
                    swapper: payer_pk,
                    vault_token_in: vault_wsol,
                    vault_token_out: vault_dct,
                    buyer_token_in_account: user_wsol_ata,
                    buyer_token_out_account: user_dct_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::Swap {
                    amount_requested: 6_000_000,
                }
                .data(),
            }],
            &[],
        )
        .await;
    let vault_dct_account_state = get_token_account(vault_dct, &mut dispenser_program_test).await;
    let user_dct_account_state = get_token_account(user_dct_ata, &mut dispenser_program_test).await;
    let vault_wsol_account_state = get_token_account(vault_wsol, &mut dispenser_program_test).await;
    let user_wsol_account_state =
        get_token_account(user_wsol_ata, &mut dispenser_program_test).await;
    // println!("Vault DCT amount: {:#?}", vault_dct_account_state.amount);
    // println!("User DCT amount: {:#?}", user_dct_account_state.amount);
    assert_eq!(vault_dct_account_state.amount, 3_000_000);
    assert_eq!(user_dct_account_state.amount, 9_000_000);
    assert_eq!(vault_wsol_account_state.amount, 2_100_000_000);
    assert_eq!(user_wsol_account_state.amount, 3_400_000_000);

    // Collect proceeds

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::CollectProceeds {
                    registry: registry_keypair.pubkey(),
                    admin: payer_pk,
                    vault_token_in: vault_wsol,
                    admin_proceeds_account: user_wsol_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::CollectProceeds.data(),
            }],
            &[],
        )
        .await;
    let vault_dct_account_state = get_token_account(vault_dct, &mut dispenser_program_test).await;
    let user_dct_account_state = get_token_account(user_dct_ata, &mut dispenser_program_test).await;
    let vault_wsol_account_state = get_token_account(vault_wsol, &mut dispenser_program_test).await;
    let user_wsol_account_state =
        get_token_account(user_wsol_ata, &mut dispenser_program_test).await;
    assert_eq!(vault_dct_account_state.amount, 3_000_000);
    assert_eq!(user_dct_account_state.amount, 9_000_000);
    assert_eq!(vault_wsol_account_state.amount, 0);
    assert_eq!(user_wsol_account_state.amount, 5_500_000_000);

    // Collect reserve

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::CollectReserve {
                    registry: registry_keypair.pubkey(),
                    admin: payer_pk,
                    vault_token_out: vault_dct,
                    admin_reserve_account: user_dct_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::CollectReserve.data(),
            }],
            &[],
        )
        .await;
    let vault_dct_account_state = get_token_account(vault_dct, &mut dispenser_program_test).await;
    let user_dct_account_state = get_token_account(user_dct_ata, &mut dispenser_program_test).await;
    let vault_wsol_account_state = get_token_account(vault_wsol, &mut dispenser_program_test).await;
    let user_wsol_account_state =
        get_token_account(user_wsol_ata, &mut dispenser_program_test).await;
    assert_eq!(vault_dct_account_state.amount, 0);
    assert_eq!(user_dct_account_state.amount, 12_000_000);
    assert_eq!(vault_wsol_account_state.amount, 0);
    assert_eq!(user_wsol_account_state.amount, 5_500_000_000);

    // Swap parameters lead to non-integer amount_token_in

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::UpdateRegistry {
                    registry: registry_keypair.pubkey(),
                    admin: payer_pk,
                }
                .to_account_metas(None),
                data: dispenser::instruction::UpdateRegistry {
                    rate_token_in: 567_000_237,
                    rate_token_out: 1_000_000,
                }
                .data(),
            }],
            &[],
        )
        .await;

    mint_some(
        &vault_dct,
        &dct_mint_keypair.pubkey(),
        &mut dispenser_program_test,
        10_000_000,
    )
    .await;
    mint_some(
        &user_wsol_ata,
        &wsol_mint_keypair.pubkey(),
        &mut dispenser_program_test,
        10_000_000_000,
    )
    .await;

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[Instruction {
                program_id,
                accounts: dispenser::accounts::Swap {
                    registry: registry_keypair.pubkey(),
                    swapper: payer_pk,
                    vault_token_in: vault_wsol,
                    vault_token_out: vault_dct,
                    buyer_token_in_account: user_wsol_ata,
                    buyer_token_out_account: user_dct_ata,
                    token_program: spl_token::id(),
                }
                .to_account_metas(None),
                data: dispenser::instruction::Swap {
                    amount_requested: 1_234_567,
                }
                .data(),
            }],
            &[],
        )
        .await;
}

pub async fn get_token_account(
    account_pk: Pubkey,
    dispenser_program_test: &mut DispenserProgramTest,
) -> TokenAccount {
    let user_dct_account_data = &dispenser_program_test
        .context
        .banks_client
        .get_account(account_pk)
        .await
        .unwrap()
        .unwrap()
        .data;
    TokenAccount::try_deserialize(&mut user_dct_account_data.as_ref()).unwrap()
}

pub async fn initialize_mint(
    mint_keypair: &Keypair,
    decimals: u8,
    dispenser_program_test: &mut DispenserProgramTest,
) {
    let mint_rent_exempt_threshold = dispenser_program_test
        .context
        .banks_client
        .get_rent()
        .await
        .unwrap()
        .minimum_balance(spl_token::state::Mint::LEN);

    dispenser_program_test
        .process_tx_and_assert_ok(
            &[
                system_instruction::create_account(
                    &dispenser_program_test.context.payer.pubkey(),
                    &mint_keypair.pubkey(),
                    mint_rent_exempt_threshold,
                    spl_token::state::Mint::LEN as u64,
                    &spl_token::id(),
                ),
                spl_token::instruction::initialize_mint(
                    &spl_token::id(),
                    &mint_keypair.pubkey(),
                    &dispenser_program_test.context.payer.pubkey(),
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
    dispenser_program_test: &mut DispenserProgramTest,
) -> Pubkey {
    dispenser_program_test
        .process_tx_and_assert_ok(
            &[
                spl_associated_token_account::create_associated_token_account(
                    &dispenser_program_test.context.payer.pubkey(),
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
    dispenser_program_test: &mut DispenserProgramTest,
    amount: u64,
) {
    dispenser_program_test
        .process_tx_and_assert_ok(
            &[spl_token::instruction::mint_to(
                &spl_token::id(),
                mint,
                &token_account,
                &dispenser_program_test.context.payer.pubkey(),
                &[],
                amount,
            )
            .unwrap()],
            &[],
        )
        .await;
}

pub struct DispenserProgramTest {
    pub context: ProgramTestContext,
    pub rent: Rent,
    pub program_id: Pubkey,
}

impl DispenserProgramTest {
    pub async fn start_new() -> Self {
        let program_id = Pubkey::from_str("B2jCF3V3hCCPcwsXPtjMhXVjzafXU68EMJWz3eKZ2kVa").unwrap();
        let pt = ProgramTest::new(
            "dispenser",
            program_id.clone(),
            processor!(dispenser::entry),
        );

        let mut context = pt.start_with_context().await;
        let rent = context.banks_client.get_rent().await.unwrap();

        Self {
            context,
            rent,
            program_id,
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
}
