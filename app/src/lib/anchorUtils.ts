import { Provider } from '@project-serum/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import {
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import toast from 'react-hot-toast';
import { sleep } from './utils';

export class StubWallet {
  async signTransaction(tx: Transaction): Promise<Transaction> {
    return tx;
  }
  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    return txs;
  }
  publicKey: PublicKey = undefined as unknown as PublicKey; // Hack so that the stub is not recognised as a connected user down the track
}

export const customProviderFactory = (
  connection: Connection,
  anchorWallet: AnchorWallet | undefined
): Provider => {
  const provider = new Provider(
    connection,
    anchorWallet || new StubWallet(),
    {}
  );

  // No websocket sender with tx confirmation awaiting
  provider.send = async (
    tx: Transaction,
    signers?: Array<Signer | undefined>,
    opts?: ConfirmOptions
  ): Promise<TransactionSignature> => {
    if (signers === undefined) {
      signers = [];
    }

    tx.feePayer = anchorWallet?.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    await anchorWallet?.signTransaction(tx);
    signers
      .filter((s): s is Signer => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });

    const rawTx = tx.serialize();
    const signature = await connection.sendRawTransaction(rawTx);

    // Await for 30 seconds
    for (let i = 0; i < 30; i++) {
      const signatureStatus = (await connection.getSignatureStatus(signature))
        .value;
      if (signatureStatus?.confirmationStatus === 'confirmed') {
        break;
      }
      await sleep(1000);
    }
    return signature;
  };

  return provider;
};

// Allows generic wrapping of rpc calls to elevate success and errors to the user
export const txHandler = async (
  rpcFc: () => Promise<TransactionSignature>,
  successMessage: string
) => {
  try {
    const signature = await rpcFc();
    console.log('Success:', signature);
    toast.success(successMessage);
    return true;
  } catch (error: any) {
    console.log(error);
    if (error.msg) {
      toast.error(`Transaction failed: ${error.msg}`);
    } else {
      toast.error('Unexpected error');
    }
    return false;
  }
};
