import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';
import { DraffleProgram } from '../../providers/ProgramApisProvider';
import { Raffle } from '../types';

export const collectProceeds = async (
  draffleClient: DraffleProgram,
  creator: PublicKey,
  proceedsMint: PublicKey,
  raffle: Raffle
) => {
// Get creator proceed account
const creatorProceeds = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    raffle.proceeds.mint.publicKey,
    draffleClient.provider.wallet.publicKey,
    );
    
  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  // Create raffle
  instructions.push(
    draffleClient.instruction.collectProceeds({
      accounts: {
        raffle: raffle.publicKey,
        proceeds: proceedsMint,
        creator: creator,
        creatorProceeds: creatorProceeds,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    })
  );

  console.log(
    `You have successfully collected your proceeds`
  );

  // Sign with entrants keypair
  return draffleClient.provider.sendAndConfirm(
    new Transaction().add(...instructions),
    []
  );
};
