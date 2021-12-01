import { useContext } from 'react';

import { RafflesStoreContext } from '../providers/RafflesStoreProvider';

export const useRafflesStore = () => {
  const context = useContext(RafflesStoreContext);
  if (context === undefined) {
    throw new Error(
      'useRafflesStore must be used within an RafflesStoreProvider'
    );
  }
  return context;
};
