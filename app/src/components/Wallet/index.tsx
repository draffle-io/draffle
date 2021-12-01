import React, { FC, useCallback, useMemo } from 'react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
  getSlopeWallet,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import toast from 'react-hot-toast';

enum Extension {
  Localnet = 'localnet',
}

const extendedClusterApiUrl = (network: WalletAdapterNetwork | Extension) => {
  return network === Extension.Localnet
    ? (process.env.REACT_APP_RPC_ENDPOINT as string) ||
        'https://draffle.ngrok.io'
    : clusterApiUrl(network);
};

const Wallet: FC = ({ children }) => {
  const network = Extension.Localnet;
  const endpoint = useMemo(() => extendedClusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets imports all the adapters but supports tree shaking --
  // Only the wallets you want to support will be compiled into your application
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSlopeWallet(),
      getSolletWallet({ network: network as unknown as WalletAdapterNetwork }),
      getSolletExtensionWallet({
        network: network as unknown as WalletAdapterNetwork,
      }),
    ],
    [network]
  );

  const onError = useCallback((error: WalletError) => {
    toast.error(error.message ? `${error.name}: ${error.message}` : error.name);
    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletDialogProvider featuredWallets={5}>
          {children}
        </WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Wallet;
