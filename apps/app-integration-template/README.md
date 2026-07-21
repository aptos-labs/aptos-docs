# Application integration template (EVM + Aptos)

Minimal React app that mirrors the same product flow on **Ethereum (Sepolia)** and **Aptos** side by side: connect a wallet, read a native balance, submit a simple transfer, and read on-chain state. It exists to pair with the [Application Integration Guide](https://aptos.dev/build/guides/application-integration).

## Patterns included

| Concern | Ethereum | Aptos |
| --- | --- | --- |
| Wallet UX | RainbowKit + wagmi | `@aptos-labs/wallet-adapter-react` + Ant Design selector |
| Balance | `useBalance` | `aptos.getBalance` (`0x1::aptos_coin::AptosCoin`) |
| Submit + wait | `useSendTransaction` + `useWaitForTransactionReceipt` | `signAndSubmitTransaction` + `aptos.waitForTransaction` |
| Read state | `useChainId` / `useBlockNumber` | `aptos.view` (`0x1::account::exists_at`) |
| Parallel / nonce txs | N/A in this demo | Optional `replayProtectionNonce` (orderless, AIP-123) |

## Run locally

```bash
cd apps/app-integration-template
cp .env.example .env
# Set VITE_WALLETCONNECT_PROJECT_ID for RainbowKit (EVM connect button).

pnpm install
pnpm dev
```

Open the URL Vite prints (default port `5175`). Use testnet faucets for Sepolia ETH and Aptos testnet APT as needed.

## Test

```bash
pnpm test
pnpm lint
```

## Splitting to a standalone repo

This folder is self-contained (`package.json`, `pnpm-lock.yaml`). To publish as `aptos-labs/app-integration-template`, copy the directory to a new repository root and push; then change the integration guide link from this monorepo path to the new repository URL.

## SDK note

The template pins `@aptos-labs/ts-sdk` to the **v5** line because current `@aptos-labs/wallet-adapter-react` peer dependencies expect it. When the adapter declares compatibility with ts-sdk v6, bump the dependency here and re-run `pnpm test`.
