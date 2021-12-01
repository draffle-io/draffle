import { Wallet } from '@project-serum/anchor';
import {
  clusterApiUrl,
  Connection,
  Signer,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export async function sendTransaction(
  connection: Connection,
  wallet: Wallet,
  instructions: TransactionInstruction[],
  signers?: Signer[]
) {
  if (!wallet?.publicKey) {
    throw new Error('Wallet is not connected');
  }
  const { blockhash } = await connection.getRecentBlockhash('max');

  let transaction = new Transaction({
    feePayer: wallet.publicKey,
    recentBlockhash: blockhash,
  }).add(...instructions);

  if (signers && signers.length > 0) {
    transaction.partialSign(...signers);
  }
  transaction = await wallet.signTransaction(transaction);
  const rawTransaction = transaction.serialize();
  let options = {
    skipPreflight: true, // implications?
    commitment: 'processed',
  };

  const txid = await connection.sendRawTransaction(rawTransaction, options);
  return txid;
}

export function getSolanaExplorerUrlSuffix(endpointUrl: string) {
  if (endpointUrl === clusterApiUrl('devnet')) {
    return '?cluster=devnet';
  } else if (endpointUrl === clusterApiUrl('testnet')) {
    return '?cluster=testnet';
  }
  return '';
}
