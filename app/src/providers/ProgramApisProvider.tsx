import { createContext, FC, useMemo } from 'react';
import { AnchorProvider, IdlAccounts, Program } from '@project-serum/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { customProviderFactory } from '../lib/anchorUtils';

import { Draffle, IDL as DraffleIdl } from '../lib/idl/draffle';
import { Dispenser, IDL as DispenserIdl } from '../lib/idl/dispenser';
import { DISPENSER_PROGRAM_ID, DRAFFLE_PROGRAM_ID } from '../config/programIds';

export const ProgramApisContext = createContext<{
  draffleClient: DraffleProgram;
  dispenserClient: DispenserProgram;
}>({} as any);

export type RaffleDataRaw = IdlAccounts<Draffle>['raffle'];
export type EntrantsDataRaw = IdlAccounts<Draffle>['entrants'];
export type DraffleProgram = Omit<Program<Draffle>, 'provider'> & {
  provider: AnchorProvider;
};

export type DispenserRegistryRaw = IdlAccounts<Dispenser>['registry'];
export type DispenserProgram = Omit<Program<Dispenser>, 'provider'> & {
  provider: AnchorProvider;
};

const ProgramApisProvider: FC = ({ children }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  // TODO: Customize type to allow access of publicKey
  const customProvider = useMemo(
    () => customProviderFactory(connection, anchorWallet),
    [connection, anchorWallet]
  );

  const { draffleClient } = useMemo(() => {
    const draffleClient = new Program<Draffle>(
      DraffleIdl,
      DRAFFLE_PROGRAM_ID,
      customProvider
    ) as unknown as DraffleProgram;
    return { draffleClient };
  }, [customProvider]);

  const { dispenserClient } = useMemo(() => {
    const dispenserClient = new Program<Dispenser>(
      DispenserIdl,
      DISPENSER_PROGRAM_ID,
      customProvider
    ) as unknown as DispenserProgram;
    return { dispenserClient };
  }, [customProvider]);

  return (
    <ProgramApisContext.Provider value={{ draffleClient, dispenserClient }}>
      {children}
    </ProgramApisContext.Provider>
  );
};

export default ProgramApisProvider;
