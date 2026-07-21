import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";

import { App } from "./App";
import { wagmiConfig } from "./ethereum/wagmiConfig";
import "./index.css";

const queryClient = new QueryClient();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Missing root element with id "root"');
}

createRoot(rootEl).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AptosWalletAdapterProvider
          autoConnect={true}
          disableTelemetry={true}
          dappConfig={{ network: Network.TESTNET }}
          onError={(error) => {
            console.error("Aptos wallet adapter error", error);
          }}
        >
          <App />
        </AptosWalletAdapterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);
