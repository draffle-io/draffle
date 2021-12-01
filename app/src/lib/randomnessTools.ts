import BN from 'bn.js';
import { keccak_256 } from 'js-sha3';

// Output is only u32, so can be a number
export function expand(randomValue: number[], n: number): number {
  const hasher = keccak_256.create();
  hasher.update(new Uint8Array(randomValue));
  hasher.update(new BN(n).toArrayLike(Buffer, 'le', 4));

  return new BN(hasher.digest().slice(0, 4), 'le').toNumber();
}
