import React, { createContext, FC, useMemo } from 'react';
import { Program } from '@project-serum/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { customProviderFactory } from '../lib/anchorUtils';
import { AnchorTypes } from '@saberhq/anchor-contrib';

import { Draffle as DraffleIdl } from '../lib/idl/draffle';
import { Dispenser as DispenserIdl } from '../lib/idl/dispenser';
import DraffleJson from '../lib/idl/draffle.json';
import DispenserJson from '../lib/idl/dispenser.json';
import { DISPENSER_PROGRAM_ID, DRAFFLE_PROGRAM_ID } from '../config/programIds';

//@ts-ignore
export const ProgramApisContext = createContext<{
  draffleClient: DraffleProgram;
  dispenserClient: DispenserProgram;
}>();

export type DraffleTypes = AnchorTypes<
  DraffleIdl,
  {
    raffle: RaffleDataRaw;
    entrants: EntrantsDataRaw;
  }
>;

type DraffleAccounts = DraffleTypes['Accounts'];
export type RaffleDataRaw = DraffleAccounts['raffle'];
export type EntrantsDataRaw = DraffleAccounts['entrants'];
export type DraffleProgram = DraffleTypes['Program'];

export type DispenserTypes = AnchorTypes<
  DispenserIdl,
  {
    registry: DispenserRegistryRaw;
  }
>;

type DispenserAccounts = DispenserTypes['Accounts'];
export type DispenserRegistryRaw = DispenserAccounts['registry'];
export type DispenserProgram = DispenserTypes['Program'];

const ProgramApisProvider: FC = ({ children }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const { draffleClient } = useMemo(() => {
    const draffleClient = new Program(
      DraffleJson as DraffleIdl,
      DRAFFLE_PROGRAM_ID,
      customProviderFactory(connection, anchorWallet)
    ) as DraffleProgram;
    return {
      draffleClient,
    };
  }, [connection, anchorWallet]);

  const { dispenserClient } = useMemo(() => {
    const dispenserClient = new Program(
      DispenserJson as DispenserIdl,
      DISPENSER_PROGRAM_ID,
      customProviderFactory(connection, anchorWallet)
    ) as DispenserProgram;
    return {
      dispenserClient,
    };
  }, [connection, anchorWallet]);

  return (
    <ProgramApisContext.Provider value={{ draffleClient, dispenserClient }}>
      {children}
    </ProgramApisContext.Provider>
  );
};

export default ProgramApisProvider;
