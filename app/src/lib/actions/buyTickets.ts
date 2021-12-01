import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from '@solana/spl-token';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import { VAULT_TOKEN_IN, VAULT_TOKEN_OUT } from '../../config/accounts';
import { DISPENSER_REGISTRY_ADDRESS } from '../../config/programIds';
import { wrappedSOL } from '../../config/tokenRegistry';
import {
  DispenserProgram,
  DraffleProgram,
} from '../../providers/ProgramApisProvider';
import { createOwnAssociatedTokenAccountInstruction } from '../accounts';
import { PaymentOption, Raffle } from '../types';

export const BUY_TICKETS_TX_FEE_LAMPORTS = 5;

export const calculateBasketPrice = (
  ticketPrice: u64,
  ticketAmount: number,
  paymentOption: PaymentOption
) =>
  ticketPrice
    .muln(ticketAmount)
    .mul(paymentOption.dispenserPriceIn)
    .div(paymentOption.dispenserPriceOut);

export const buyTickets = async (
  draffleClient: DraffleProgram,
  dispenserClient: DispenserProgram,
  raffle: Raffle,
  ticketAmount: number,
  paymentOption: PaymentOption,
  buyerATAExists: boolean
) => {
  // Compute buyer ATA for tickets purchase
  const buyerTokenAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    paymentOption.mint.publicKey,
    draffleClient.provider.wallet.publicKey
  );
  let finalBuyerAccount = buyerTokenAccount;
  let instructions: TransactionInstruction[] = [];

  // Required for wSOL payment only because the associated amount is read from native lamports
  // In other cases user cannot click "BUY" if no ATA (= not enough to buy), and won't hit `buyTicket`
  if (paymentOption.mint.publicKey.toBase58() === wrappedSOL) {
    if (!buyerATAExists) {
      instructions.push(
        createOwnAssociatedTokenAccountInstruction(
          new PublicKey(wrappedSOL),
          buyerTokenAccount,
          draffleClient.provider.wallet.publicKey
        )
      );
    }

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: draffleClient.provider.wallet.publicKey,
        toPubkey: buyerTokenAccount,
        lamports: calculateBasketPrice(
          raffle.proceeds.ticketPrice,
          ticketAmount,
          paymentOption
        ).toNumber(),
      })
    );
    instructions.push(
      // @ts-ignore
      Token.createSyncNativeInstruction(TOKEN_PROGRAM_ID, buyerTokenAccount)
    );
  }

  // Get raffle proceeds token from dispenser if needed
  if (
    paymentOption.mint.publicKey.toString() !==
    raffle.proceeds.mint.publicKey.toString()
  ) {
    const basketPrice = calculateBasketPrice(
      raffle.proceeds.ticketPrice,
      ticketAmount,
      paymentOption
    );

    console.log(
      `Swapping ${basketPrice.toString()} ${
        paymentOption.mint.symbol
      } for ${raffle.proceeds.ticketPrice.muln(ticketAmount).toString()} ${
        raffle.proceeds.mint.symbol
      }`
    );

    const buyerIntermediaryTokenAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      raffle.proceeds.mint.publicKey,
      draffleClient.provider.wallet.publicKey
    );

    // Safe amount requested, because only multiplied.
    // Together with program-side logic, only consequence of potentially non-integer
    // associated tokenIn amount is under-charging the user by remainder amount
    instructions.push(
      dispenserClient.instruction.swap(
        raffle.proceeds.ticketPrice.muln(ticketAmount),
        {
          accounts: {
            registry: DISPENSER_REGISTRY_ADDRESS,
            swapper: dispenserClient.provider.wallet.publicKey,
            vaultTokenIn: VAULT_TOKEN_IN,
            vaultTokenOut: VAULT_TOKEN_OUT,
            buyerTokenInAccount: buyerTokenAccount,
            buyerTokenOutAccount: buyerIntermediaryTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }
      )
    );

    finalBuyerAccount = buyerIntermediaryTokenAccount;
  }

  instructions.push(
    draffleClient.instruction.buyTickets(ticketAmount, {
      accounts: {
        raffle: raffle.publicKey,
        entrants: raffle.entrantsAccountAddress,
        proceeds: raffle.proceeds.address,
        buyerTokenAccount: finalBuyerAccount,
        buyerTransferAuthority: draffleClient.provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  return await draffleClient.provider.send(
    new Transaction().add(...instructions)
  );
};
