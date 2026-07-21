import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    "Missing VITE_WALLETCONNECT_PROJECT_ID. Create a free project at https://cloud.reown.com and copy apps/app-integration-template/.env.example to .env",
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "EVM ↔ Aptos integration template",
  projectId: projectId ?? "00000000000000000000000000000000",
  chains: [sepolia],
  ssr: false,
});
