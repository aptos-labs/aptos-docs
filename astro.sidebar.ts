import type { StarlightUserConfig } from '@astrojs/starlight/types';
import { openAPISidebarGroups } from "starlight-openapi";
import { group } from './config/sidebar';
import { ENV } from "./src/lib/env";

const ENABLE_API_REFERENCE = ENV.ENABLE_API_REFERENCE;
const enableApiReference = ENABLE_API_REFERENCE === "true";

/**
 * Starlight sidebar configuration object for the global site sidebar.
 *
 * - Top-level groups become tabs.
 * - Use the `group()` utility function to define groups. This uses labels from our
 *   `src/content/nav/*.ts` files instead of defining labels and translations inline.
 *
 */

export const sidebar = [
  group('build', {
    items: [
      'build/get-started',
      'build/smart-contracts',
      'build/apis',
      'build/sdks',
      'build/indexer',
      'build/cli',
    ],
  }),

  group('network', {
    items: [
      // 'getting-started',
      group('network.group.blockchain', {
				items: [
          'network/blockchain/blockchain-deep-dive',
          'network/blockchain/execution',
          'network/blockchain/gas-txn-fee',
          'network/blockchain/events',
          'network/blockchain/accounts',
          'network/blockchain/validator-nodes',
          'network/blockchain/fullnodes',
          'network/blockchain/node-networks-sync',
          'network/blockchain/move',
          'network/blockchain/resources',
          'network/blockchain/txns-states',
          'network/blockchain/base-gas',
          'network/blockchain/blocks',
          'network/blockchain/staking',
          'network/blockchain/delegated-staking',
          'network/blockchain/governance',
        ],
			}),
      group('network.group.nodes', {
				items: [
          'network/nodes/localnet',
          'network/nodes/validator-node',
          'network/nodes/full-node',
          'network/nodes/bootstrap-fullnode',
          'network/nodes/configure',
          'network/nodes/measure',
          'network/nodes/building-from-source',
          'network/nodes/networks'
        ],
			}),
      'network/releases',
      'network/glossary',
      'network/faucet'
    ],
  }),

  group('guides', {
    items: [
      group('guides.group.beginner', {
				items: [
          'build/guides/first-transaction',
          'build/guides/your-first-nft',
          'build/guides/first-coin',
          'build/guides/first-fungible-asset',
          'build/guides/first-move-module',
          'build/guides/first-multisig',
          'build/create-aptos-dapp',
          'build/guides/build-e2e-dapp',
        ],
			}),
      group('guides.group.advanced', {
				items: [
          'build/guides/multisig-managed-fungible-asset',
          'build/guides/aptos-keyless',
          'build/guides/sponsored-transactions',
          'build/guides/transaction-management',
          'build/guides/key-rotation',

        ],
			}),
    ],
  }),

  group('reference', {
    items: [
      { 
        label: "Move Reference",
        link: "/move-reference/",
        translations: {
          'zh': 'Move 参考',
          'ja': 'Move リファレンス',
        },
      },
      ...(enableApiReference ? openAPISidebarGroups : []),
      // Other items...
    ],
  }),
  
] satisfies StarlightUserConfig['sidebar'];