import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TransactionInstruction } from '@solana/web3.js';

import { DraffleProgram } from '../../providers/ProgramApisProvider';
import { createOwnAssociatedTokenAccountInstruction } from '../accounts';
import { Raffle } from '../types';

export const claimPrize = async (
  draffleClient: DraffleProgram,
  raffle: Raffle,
  prizeIndex: number,
  ticketIndex: number
) => {
  if (prizeIndex >= raffle.prizes.length)
    throw Error(
      `Prize index does not match prize list (${raffle.prizes.length})`
    );
  const prize = raffle.prizes[prizeIndex];

  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    prize.mint.publicKey,
    draffleClient.provider.wallet.publicKey
  );

  let instructions: TransactionInstruction[] | undefined;
  const info = await draffleClient.provider.connection.getAccountInfo(ata);
  if (info === null) {
    instructions = [
      createOwnAssociatedTokenAccountInstruction(
        prize.mint.publicKey,
        ata,
        draffleClient.provider.wallet.publicKey,
      ),
    ];
  }

  return await draffleClient.rpc.claimPrize(prizeIndex, ticketIndex, {
    accounts: {
      raffle: raffle.publicKey,
      entrants: raffle.entrantsAccountAddress,
      prize: prize.address,
      winnerTokenAccount: ata,
      tokenProgram: TOKEN_PROGRAM_ID,
    },
    instructions,
  });
};
