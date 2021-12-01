import { Keypair, PublicKey } from '@solana/web3.js';

export const DRAFFLE_PROGRAM_ID = process.env
  .REACT_APP_DRAFFLE_PROGRAM_ID as string;
export const DISPENSER_PROGRAM_ID = new PublicKey(
  process.env.REACT_APP_DISPENSER_PROGRAM_ID as string
);

export const DISPENSER_REGISTRY_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(
    JSON.parse(process.env.REACT_APP_DISPENSER_REGISTRY_KEYPAIR as string)
  )
);
export const DISPENSER_REGISTRY_ADDRESS = DISPENSER_REGISTRY_KEYPAIR.publicKey;
