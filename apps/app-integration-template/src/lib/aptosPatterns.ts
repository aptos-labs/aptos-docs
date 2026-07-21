import type { AccountAddress, Aptos } from "@aptos-labs/ts-sdk";

/** APT balance in octas (matches Application Integration Guide). */
export async function readAptBalanceOctas(
  aptos: Aptos,
  accountAddress: AccountAddress | string,
): Promise<number> {
  return aptos.getBalance({
    accountAddress,
    asset: "0x1::aptos_coin::AptosCoin",
  });
}

/** Example view read: whether an on-chain account resource exists (read-only state). */
export async function readAccountExistsAtView(
  aptos: Aptos,
  accountAddress: AccountAddress | string,
): Promise<boolean> {
  const [exists] = await aptos.view<[boolean]>({
    payload: {
      function: "0x1::account::exists_at",
      typeArguments: [],
      functionArguments: [accountAddress],
    },
  });
  return exists;
}

/** Random u64 for orderless replay protection (AIP-123). */
export function randomReplayNonce(): bigint {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  const hi = words[0] ?? 0;
  const lo = words[1] ?? 0;
  return (BigInt(hi) << 32n) | BigInt(lo);
}
