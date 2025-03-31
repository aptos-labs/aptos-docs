export const NETWORK_NAMES = ["mainnet", "testnet", "devnet"] as const;
export const DEFAULT_NETWORK = "mainnet";
export type NetworkName = (typeof NETWORK_NAMES)[number];
