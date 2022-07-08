import {
  PublicKey,
  TransactionInstruction,
  Transaction,
} from '@solana/web3.js';
import { DraffleProgram } from '../../providers/ProgramApisProvider';
import { Raffle } from '../types';

export const closeEntrants = async (
  draffleClient: DraffleProgram,
  creator: PublicKey,
  raffle: Raffle
) => {
    
  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  // Create raffle
  instructions.push(
    draffleClient.instruction.closeEntrants({
      accounts: {
        raffle: raffle.publicKey,
        entrants: raffle.entrantsAccountAddress,
        creator: creator,
      },
    })
  );

  console.log(
    `You have successfully closed the raffle account`
  );

  // Sign with entrants keypair
  return draffleClient.provider.sendAndConfirm(
    new Transaction().add(...instructions),
    []
  );
};
