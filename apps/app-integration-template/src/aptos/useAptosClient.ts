import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMemo } from "react";

export function useAptosClient(): Aptos {
  const { network } = useWallet();

  return useMemo(() => {
    const name = network?.name?.toLowerCase();
    const mapped =
      name === "mainnet" ? Network.MAINNET : name === "devnet" ? Network.DEVNET : Network.TESTNET;

    return new Aptos(new AptosConfig({ network: mapped }));
  }, [network?.name]);
}
