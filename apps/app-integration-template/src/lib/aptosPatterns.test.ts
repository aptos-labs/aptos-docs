import { describe, expect, it, vi } from "vitest";

import { randomReplayNonce, readAccountExistsAtView, readAptBalanceOctas } from "./aptosPatterns";

describe("randomReplayNonce", () => {
  it("returns a u64-sized bigint", () => {
    const n = randomReplayNonce();
    expect(n).toBeGreaterThanOrEqual(0n);
    expect(n).toBeLessThan(1n << 64n);
  });
});

describe("readAptBalanceOctas", () => {
  it("delegates to aptos.getBalance with AptosCoin", async () => {
    const getBalance = vi.fn().mockResolvedValue(42);
    const aptos = { getBalance } as never;
    const out = await readAptBalanceOctas(aptos, "0x5");
    expect(out).toBe(42);
    expect(getBalance).toHaveBeenCalledWith({
      accountAddress: "0x5",
      asset: "0x1::aptos_coin::AptosCoin",
    });
  });
});

describe("readAccountExistsAtView", () => {
  it("returns the first view tuple element as boolean", async () => {
    const view = vi.fn().mockResolvedValue([true]);
    const aptos = { view } as never;
    const out = await readAccountExistsAtView(aptos, "0x1");
    expect(out).toBe(true);
    expect(view).toHaveBeenCalledWith({
      payload: {
        function: "0x1::account::exists_at",
        typeArguments: [],
        functionArguments: ["0x1"],
      },
    });
  });
});
