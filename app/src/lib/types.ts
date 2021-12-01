import { u64 } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

export interface Mint {
  name: string;
  publicKey: PublicKey;
  logoUrl: string;
  symbol: string;
  decimals: number;
}

export interface Entrant {
  publicKey: PublicKey;
  tickets: number[];
}

export type EntrantsMap = Map<string, Entrant>;

export enum PrizeType {
  FT = 'FT',
  NFTPicture = 'NFTPicture',
}

export interface PrizeBase {
  address: PublicKey;
  mint: Mint;
  amount: u64;
}

export type Prize = PrizeBase &
  (
    | { type: PrizeType.FT; meta: FungiblePrizeMeta }
    | { type: PrizeType.NFTPicture; meta: PrizeNFTPictureMeta }
  );

export interface FungiblePrizeMeta {
  imageUri: string;
}

export interface PrizeNFTPictureMeta {
  name: string;
  imageUri: string;
}

export interface Proceeds {
  address: PublicKey;
  mint: Mint;
  ticketPrice: u64;
}

export interface RaffleMetaData {
  name: string;
  overviewImageUri?: string;
  alternatePurchaseMints?: PublicKey[];
}

export interface Raffle {
  publicKey: PublicKey;
  metadata: RaffleMetaData;
  endTimestamp: Date;
  proceeds: Proceeds;
  entrants: EntrantsMap;
  entrantsCap: number;
  entrantsRaw: PublicKey[];
  totalTickets: number;
  entrantsAccountAddress: PublicKey;
  prizes: Prize[];
  randomness: number[] | null;
  isEnded: boolean;
}

export interface PaymentOption {
  dispenserPriceIn: u64;
  dispenserPriceOut: u64;
  mint: Mint;
}

export interface TokenAccountInfo {
  address: PublicKey;
  owner: PublicKey;
  amount: u64;
  mint: PublicKey;
  state: string;
}
