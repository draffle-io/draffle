import { AccountsCoder, ProgramAccount } from '@project-serum/anchor';
import { connection, parseTokenAccount } from '@project-serum/common';
import { u64, AccountInfo as TokenAccountInfo } from '@solana/spl-token';
import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';

import { tokenInfoMap, UNKNOWN_TOKEN_INFO } from '../../config/tokenRegistry';
import {
  DraffleProgram,
  EntrantsDataRaw,
  RaffleDataRaw,
} from '../../providers/ProgramApisProvider';
import { getDisplayAmount } from '../accounts';
import { getMetadata, getNFTMetadata } from '../metadata';
import { Entrant, EntrantsMap, Mint, Prize, PrizeType } from '../types';

export const fetchProceedsAccount = async (
  raffleAccountAddress: PublicKey,
  draffleClient: DraffleProgram,
  connection: Connection
): Promise<{ address: PublicKey; mintInfo: Mint }> => {
  const [address] = await PublicKey.findProgramAddress(
    [raffleAccountAddress.toBytes(), Buffer.from('proceeds')],
    draffleClient.programId
  );

  const account = await connection.getAccountInfo(address);
  if (!account) throw Error('Failed to fetch proceeds account');
  const data = parseTokenAccount(account.data);
  const tokenInfo = tokenInfoMap.get(data.mint.toString());
  if (!tokenInfo)
    throw Error(
      `Info not found for proceeds account mint ${data.mint.toString()}`
    );
  const mintInfo = {
    name: tokenInfo.name,
    publicKey: data.mint,
    logoUrl: tokenInfo.logoURI,
    symbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
  };
  return { address, mintInfo };
};

const getPrizeAddressForPrizeIndex = async (
  raffleAccountAddress: PublicKey,
  prizeIndex: number,
  programId: PublicKey
): Promise<PublicKey> => {
  const [prizeAddress] = await PublicKey.findProgramAddress(
    [
      raffleAccountAddress.toBuffer(),
      Buffer.from('prize'),
      new u64(prizeIndex).toArrayLike(Buffer, 'le', 4),
    ],
    programId
  );
  return prizeAddress;
};

// Batch fetch prize token accounts then batch fetch metadata accounts given mint
export const fetchPrizes = async (
  raffleAccountAddress: PublicKey,
  draffleClient: DraffleProgram,
  totalPrizes: number,
): Promise<Prize[]> => {
  let prizes: Prize[] = [];

  const prizeAddresses = await Promise.all(
    [...Array(totalPrizes).keys()].map((prizeIndex) =>
      getPrizeAddressForPrizeIndex(
        raffleAccountAddress,
        prizeIndex,
        draffleClient.programId
      )
    )
  );
  const prizeAccounts =
    await draffleClient.provider.connection.getMultipleAccountsInfo(
      prizeAddresses
    );
  
  const prizeTokenAccounts = prizeAccounts.map((prizeAccount) => {
    if (!prizeAccount) {
      throw new Error('Invalid prize account');
    }
    return parseTokenAccount(prizeAccount.data);
  });

  const metadataAddresses = await Promise.all(
    prizeTokenAccounts.map((prizeTokenAccount) => getMetadata(prizeTokenAccount.mint))
  );

  const metadataAccountsInfos = await draffleClient.provider.connection.getMultipleAccountsInfo(
    metadataAddresses
  );

  for (const [index, prizeTokenAccount] of prizeTokenAccounts.entries()) {
    prizes.push(
      await processPrize(
        prizeAddresses[index],
        prizeTokenAccount,
        metadataAccountsInfos[index],
      )
    );
  }
  return prizes;
};

const processPrize = async (
  prizeAddress: PublicKey,
  prizeTokenAccount: TokenAccountInfo,
  metadataAccountInfo: AccountInfo<Buffer> | null
): Promise<Prize> => {
  let mintInfo;
  const tokenInfo = tokenInfoMap.get(prizeTokenAccount.mint.toString());
  if (tokenInfo) {
    const name = `${getDisplayAmount(prizeTokenAccount.amount, tokenInfo)} ${tokenInfo.symbol}`;
    const imageURI = (tokenInfo as any)?.extensions?.imageURI
    mintInfo = {
      name,
      publicKey: prizeTokenAccount.mint,
      logoUrl: tokenInfo.logoURI,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
    };
    return {
      address: prizeAddress,
      mint: mintInfo,
      amount: prizeTokenAccount.amount,
      type: PrizeType.FT,
      meta: {
        imageUri: imageURI || tokenInfo.logoURI,
      },
    };
  } else {
    // It isn't a recognized fungible token so it might be a NFT
    const meta = metadataAccountInfo
      ? await getNFTMetadata(metadataAccountInfo)
      : undefined;

    // TODO: Need to distinguish between NFT types to fill correct attributes
    const tokenInfo = UNKNOWN_TOKEN_INFO;
    mintInfo = {
      name: meta?.name || tokenInfo.name,
      publicKey: prizeTokenAccount.mint,
      logoUrl: meta?.image || tokenInfo.logoURI,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals,
    };
    return {
      address: prizeAddress,
      mint: mintInfo,
      amount: prizeTokenAccount.amount,
      type: PrizeType.NFTPicture,
      meta: {
        name: meta?.name || tokenInfo.name,
        imageUri: meta?.image || tokenInfo.name,
      },
    };
  }
};

export const toEntrantsProcessed = (entrantsDataRaw: EntrantsDataRaw) => {
  const entrantsProcessed = entrantsDataRaw.entrants
    .slice(0, entrantsDataRaw.total)
    .reduce<EntrantsMap>((acc, entrant, index) => {
      if (acc.has(entrant.toString())) {
        acc.get(entrant.toString())!.tickets.push(index);
      } else {
        acc.set(entrant.toString(), {
          publicKey: entrant,
          tickets: [index],
        });
      }
      return acc;
    }, new Map<string, Entrant>());

  return entrantsProcessed;
}

export const getRaffleProgramAccounts = async (
  draffleClient: DraffleProgram
  ): Promise<[a: ProgramAccount<RaffleDataRaw>[], b: ProgramAccount<EntrantsDataRaw>[]]> => {

  const result = await draffleClient.provider.connection.getProgramAccounts(
    draffleClient.programId
  );
  const raffleDiscriminator = AccountsCoder.accountDiscriminator('Raffle');
  const entrantsDiscriminator = AccountsCoder.accountDiscriminator('Entrants');

  const raffleDataRawProgramAccounts: ProgramAccount<RaffleDataRaw>[] = [];
  const entrantsDataRawProgramAccounts: ProgramAccount<EntrantsDataRaw>[] = [];

  result.forEach(({ pubkey, account }) => {
    const discriminator = account.data.slice(0, 8);

    if (raffleDiscriminator.compare(discriminator) === 0) {
      raffleDataRawProgramAccounts.push({
        publicKey: pubkey,
        account: draffleClient.coder.accounts.decode<RaffleDataRaw>(
          'Raffle',
          account.data
        )
      });
    } else if (entrantsDiscriminator.compare(discriminator) === 0) {
      entrantsDataRawProgramAccounts.push({
        publicKey: pubkey,
        account: draffleClient.coder.accounts.decode<EntrantsDataRaw>(
          'Entrants',
          account.data
        )
      });
    } else {
      console.log(`Could not decode ${pubkey.toBase58()}`);
    }
  });
  return [raffleDataRawProgramAccounts, entrantsDataRawProgramAccounts];
}