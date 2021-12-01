import { Provider, utils } from '@project-serum/anchor';
import { getTokenAccount } from '@project-serum/common';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import * as math from 'mathjs';

export const getWalletLamports = async (
  provider: Provider
): Promise<number | undefined> => {
  if (!provider.wallet.publicKey) return;

  const walletAccount = await provider.connection.getAccountInfo(
    provider.wallet.publicKey
  );

  return walletAccount?.lamports; // TODO: Check why number??
};

export const getBuyerATABalance = async (
  provider: Provider,
  proceedsMint: PublicKey
): Promise<u64 | undefined> => {
  const buyerATA = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    proceedsMint,
    provider.wallet.publicKey
  );

  try {
    const accountInfo = await getTokenAccount(provider, buyerATA);
    return accountInfo.amount;
  } catch (error: any) {
    console.error(error);
    return;
  }
};

export const getDisplayAmount = (
  amount: u64,
  mint: { decimals: number }
): string => {
  return math
    .bignumber(amount.toString())
    .div(Math.pow(10, mint.decimals))
    .toString();
};

export const getAssociatedTokenAccountAddress = (
  walletAddress: PublicKey,
  mint: PublicKey
) =>
  Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    walletAddress
  );

export const findAssociatedTokenAccountAddressSync = (
  walletAddress: PublicKey,
  mint: PublicKey
) =>
  utils.publicKey.findProgramAddressSync(
    [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

export const createOwnAssociatedTokenAccountInstruction = (
  mint: PublicKey,
  ata: PublicKey,
  owner: PublicKey
) =>
  Token.createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    ata,
    owner,
    owner
  );
