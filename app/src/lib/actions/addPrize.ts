import { BN } from '@project-serum/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import { DRAFFLE_PROGRAM_ID } from '../../config/programIds';
import { DraffleProgram } from '../../providers/ProgramApisProvider';
import { Raffle } from '../types';

export const addPrize = async (
  draffleClient: DraffleProgram,
  raffle: Raffle,
  creator: PublicKey,
  prizeMint: PublicKey,
  prizeIndex: number,
  amount: number
) => {
  // Helper for PrizeIndex format for PDA
  const formatPrizeIndex = (num: number) => {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint8(0, num);
    return new Uint8Array(arr);
  };

  // Find Prize PDA for backend init
  const PRIZE_PREFIX = 'prize';
  async function getPrizeId(): Promise<PublicKey> {
    let [address] = await PublicKey.findProgramAddress(
      [
        raffle.publicKey.toBytes(),
        Buffer.from(PRIZE_PREFIX),
        formatPrizeIndex(prizeIndex),
      ],
      new PublicKey(DRAFFLE_PROGRAM_ID)
    );
    return address;
  }

  let prizeId = await getPrizeId();

  // ATA of prize mint
  let creatorPrizeAddress = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    prizeMint,
    creator
  );

  // Begin transaction instructions
  let instructions: TransactionInstruction[] = [];

  instructions.push(
    draffleClient.instruction.addPrize(new BN(prizeIndex), new BN(amount), {
      accounts: {
        raffle: raffle.publicKey,
        creator: creator,
        from: creatorPrizeAddress,
        prize: prizeId,
        prizeMint: prizeMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      },
    })
  );

  return draffleClient.provider.sendAndConfirm(
    new Transaction().add(...instructions)
  );
};
