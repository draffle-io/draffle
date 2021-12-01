import React, {
  createContext,
  FC,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { ProgramAccount } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

import {
  DraffleProgram,
  EntrantsDataRaw,
  RaffleDataRaw,
} from './ProgramApisProvider';
import { useProgramApis } from '../hooks/useProgramApis';
import { Entrant, Raffle, RaffleMetaData } from '../lib/types';
import { fetchPrizes, fetchProceedsAccount, getRaffleProgramAccounts, toEntrantsProcessed } from '../lib/store';
import { cloneDeep } from 'lodash';
import { areEqualObjects } from '../lib/utils';
import { useConnection } from '@solana/wallet-adapter-react';
import { RAFFLES_WHITELIST } from '../config/raffleWhitelist';

export interface RafflesStore {
  raffles: Map<string, Raffle>;
  fetchAllRaffles: (includeEmpty?: boolean) => void;
  updateRaffleById: (raffleId: string) => void;
  fetching: boolean;
}

// @ts-ignore
export const RafflesStoreContext = createContext<RafflesStore>();

const RafflesStoreProvider: FC = ({ children = null as any }) => {
  const { connection } = useConnection();
  const { draffleClient } = useProgramApis();

  const [fetching, setFetching] = useState<boolean>(true); // prevents messy first render, but probably not optimal
  const [raffles, setRaffles] = useState<Map<string, Raffle>>(
    new Map<string, Raffle>()
  );

  const getAssociatedRaffleData = async (
    raffleRaw: ProgramAccount<RaffleDataRaw>,
    raffleMetaData: RaffleMetaData,
    draffleClient: DraffleProgram,
    connection: Connection,
    entrantsDataRaw?: EntrantsDataRaw
  ): Promise<Raffle> => {
    const proceedsAccount = await fetchProceedsAccount(
      raffleRaw.publicKey,
      draffleClient,
      connection
    );
    let entrants = new Map<string, Entrant>();
    if (!entrantsDataRaw) {
      try {
        entrantsDataRaw = await draffleClient.account.entrants.fetch(
          raffleRaw.account.entrants
        );
      } catch {
        // TODO: Merge ended raffle data stored off-chain here
        console.log(`Raffle ${raffleRaw.publicKey} entrants account is closed`);

        entrantsDataRaw = {
          entrants: [],
          max: 0,
          total: 0,
        };
      }
    }

    entrants = toEntrantsProcessed(entrantsDataRaw);

    const prizes = await fetchPrizes(raffleRaw.publicKey, draffleClient, raffleRaw.account.totalPrizes);

    const endTimestamp = new Date(
      raffleRaw.account.endTimestamp.toNumber() * 1000
    );

    return {
      publicKey: raffleRaw.publicKey,
      metadata: raffleMetaData,
      endTimestamp,
      entrantsCap: entrantsDataRaw.max,
      entrants,
      entrantsRaw: entrantsDataRaw.entrants,
      totalTickets: entrantsDataRaw.total,
      entrantsAccountAddress: raffleRaw.account.entrants,
      randomness: raffleRaw.account.randomness as number[],
      prizes,
      proceeds: {
        address: proceedsAccount.address,
        ticketPrice: raffleRaw.account.ticketPrice,
        mint: proceedsAccount.mintInfo,
      },
      isEnded: endTimestamp < new Date(),
    };
  };

  const fetchAllRaffles = useCallback(
    async (includeEmpty: boolean = false) => {
      setFetching(true);
      let raffleDataRawProgramAccounts: ProgramAccount<RaffleDataRaw>[] = [];
      let entrantsDataRawProgramAccounts: ProgramAccount<EntrantsDataRaw>[] =
        [];
      try {
        [raffleDataRawProgramAccounts, entrantsDataRawProgramAccounts] =
          await getRaffleProgramAccounts(draffleClient);
      } catch (e) {
        console.log(e);
      }

      raffleDataRawProgramAccounts = raffleDataRawProgramAccounts.filter(
        ({ publicKey }) =>
          includeEmpty || RAFFLES_WHITELIST.has(publicKey.toBase58())
      );

      const newRaffles = (
        await Promise.all(
          raffleDataRawProgramAccounts.map(async (raffleRaw) =>
            getAssociatedRaffleData(
              raffleRaw,
              RAFFLES_WHITELIST.get(raffleRaw.publicKey.toString()) || {
                name: 'Unnamed Raffle',
                alternatePurchaseMints: [],
              },
              draffleClient,
              connection,
              entrantsDataRawProgramAccounts.find(({ publicKey }) =>
                publicKey.equals(raffleRaw.account.entrants)
              )?.account
            )
          )
        )
      ).reduce<Map<string, Raffle>>((acc, raffle) => {
        acc.set(raffle.publicKey.toString(), raffle);
        return acc;
      }, new Map<string, Raffle>());
      setRaffles(newRaffles);
      setFetching(false);
    },
    [connection, draffleClient]
  );

  const updateRaffleById = useCallback(
    async (raffleId: string) => {
      if (!raffles.has(raffleId.toString()) || !RAFFLES_WHITELIST.has(raffleId))
        return;
      setFetching(true);
      const updatedRaffleRaw = await draffleClient.account.raffle.fetch(
        new PublicKey(raffleId)
      );
      const updatedRaffle = await getAssociatedRaffleData(
        { publicKey: new PublicKey(raffleId), account: updatedRaffleRaw },
        RAFFLES_WHITELIST.get(raffleId)!,
        draffleClient,
        connection
      );
      if (!areEqualObjects(raffles.get(raffleId.toString()), updatedRaffle)) {
        setRaffles((currentRaffles) => {
          let newRaffles = cloneDeep(currentRaffles);
          newRaffles = newRaffles.set(raffleId, updatedRaffle);
          return newRaffles;
        });
      }
      setFetching(false);
    },
    [connection, draffleClient, raffles, setRaffles]
  );

  useEffect(() => {
    fetchAllRaffles();
  }, [fetchAllRaffles]);

  return (
    <RafflesStoreContext.Provider
      value={{
        raffles,
        fetchAllRaffles,
        updateRaffleById,
        fetching,
      }}
    >
      {children}
    </RafflesStoreContext.Provider>
  );
};

export default RafflesStoreProvider;
