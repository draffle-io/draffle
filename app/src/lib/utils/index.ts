import { u64 } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { Raffle } from '../types';

export const shortenPubkeyString = (
  pubkey: PublicKey,
  sidesLength: number = 4
) => {
  const keyString = pubkey.toString();
  const keyLength = keyString.length;
  return `${keyString.substr(0, sidesLength)}...${keyString.substr(
    keyLength - sidesLength,
    keyLength
  )}`;
};

export function notify({
  message,
  description,
}: {
  message: string;
  description: string;
}) {
  console.log(`${message}, ${description}`);
}

export const areEqualObjects = (account1: any, account2: any) =>
  JSON.stringify(account1) === JSON.stringify(account2);

export const getRemainingTime = (now: Date, end: Date) => {
  const dt = end.getTime() - now.getTime();
  if (dt < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  let days = Math.floor(dt / (1000 * 60 * 60 * 24));
  let hours = Math.floor((dt % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let minutes = Math.floor((dt % (1000 * 60 * 60)) / (1000 * 60));
  let seconds = Math.floor((dt % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// const bitSlicing = () => {};

export const computeTotalTicketsBought = (raffle: Raffle) =>
  [...raffle.entrants.values()].reduce(
    (total, entrant) => total.add(new u64(entrant.tickets.length)),
    new u64(0)
  );

export const debounce = (func: Function, timeout = 300) => {
  let timer: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

// https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
export const toHHMMSS = (secs: number) => {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor(secs / 60) % 60;
  const seconds = secs % 60;

  return [hours, minutes, seconds]
    .map((v) => (v < 10 ? '0' + v : v))
    .filter((v, i) => v !== '00' || i > 0)
    .join(':');
};
