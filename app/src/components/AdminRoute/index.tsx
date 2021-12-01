import React, { FC, useEffect } from 'react';
import { Route, RouteProps, useHistory } from 'react-router';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { ADMIN_ACCOUNTS } from '../../config/accounts';
import { routes } from '../../router/routes';

export const isAdmin = (publicKey: PublicKey | null) =>
  publicKey && ADMIN_ACCOUNTS.includes(publicKey.toBase58());

const AdminRoute: FC<RouteProps> = (props) => {
  const { publicKey, disconnect } = useWallet();
  const {
    push,
    location: { pathname },
  } = useHistory();

  useEffect(() => {
    if (
      (!!publicKey && !isAdmin(publicKey)) ||
      (!publicKey && pathname !== routes.HOME)
    ) {
      disconnect();
      push(routes.HOME);
    }
  }, [publicKey, pathname, disconnect, push]);
  return <Route {...props} />;
};

export default AdminRoute;
