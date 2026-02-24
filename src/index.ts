import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { SupportedChainId } from '@ichidao/ichi-vaults-sdk';

// --- Default RPC URLs per chain ---

export const DEFAULT_RPC_URLS: Record<SupportedChainId, string> = {
  [SupportedChainId.arbitrum]: 'https://arb1.arbitrum.io/rpc',
  [SupportedChainId.arthera]: 'https://rpc.arthera.net',
  [SupportedChainId.arthera_testnet]: 'https://rpc-test.arthera.net',
  [SupportedChainId.base]: 'https://base.llamarpc.com',
  [SupportedChainId.base_sepolia]: 'https://sepolia.base.org',
  [SupportedChainId.berachain]: 'https://rpc.berachain.com',
  [SupportedChainId.berachain_bartio]: 'https://bartio.rpc.berachain.com',
  [SupportedChainId.blast]: 'https://blast.drpc.org',
  [SupportedChainId.blast_sepolia_testnet]: 'https://sepolia.blast.io',
  [SupportedChainId.botanix]: 'https://rpc.ankr.com/botanix_mainnet',
  [SupportedChainId.bsc]: 'https://bsc-dataseed1.binance.org',
  [SupportedChainId.celo]: 'https://1rpc.io/celo',
  [SupportedChainId.citrea]: 'https://rpc.mainnet.citrea.xyz',
  [SupportedChainId.citrea_testnet]: 'https://rpc.testnet.citrea.xyz',
  [SupportedChainId.cronos]: 'https://1rpc.io/cro',
  [SupportedChainId.eon]: 'https://rpc.ankr.com/horizen_eon',
  [SupportedChainId.evmos]: 'https://evmos-evm.publicnode.com',
  [SupportedChainId.fantom]: 'https://fantom.drpc.org',
  [SupportedChainId.flare]: 'https://rpc.ankr.com/flare',
  [SupportedChainId.flow]: 'https://mainnet.evm.nodes.onflow.org',
  [SupportedChainId.fuse]: 'https://fuse-pokt.nodies.app',
  [SupportedChainId.haven1]: 'https://rpc.haven1.org',
  [SupportedChainId.haven1_devnet]: 'https://rpc.dev.haven1.org',
  [SupportedChainId.hedera]: 'https://mainnet.hashio.io/api',
  [SupportedChainId.hedera_testnet]: 'https://testnet.hashio.io/api',
  [SupportedChainId.hemi]: 'https://rpc.hemi.network/rpc',
  [SupportedChainId.hyperevm]: 'https://rpc.hyperliquid.xyz/evm',
  [SupportedChainId.ink]: 'https://ink.drpc.org',
  [SupportedChainId.ink_sepolia]: 'https://rpc-gel-sepolia.inkonchain.com',
  [SupportedChainId.katana]: 'https://rpc.katana.network',
  [SupportedChainId.kava]: 'https://evm.kava.io',
  [SupportedChainId.linea]: 'https://rpc.linea.build',
  [SupportedChainId.mainnet]: 'https://eth.llamarpc.com',
  [SupportedChainId.mantle]: 'https://rpc.mantle.xyz',
  [SupportedChainId.megaeth]: 'https://mainnet.megaeth.com/rpc',
  [SupportedChainId.mode]: 'https://mainnet.mode.network',
  [SupportedChainId.monad]: 'https://rpc-mainnet.monadinfra.com',
  [SupportedChainId.monad_testnet]: 'https://testnet-rpc.monad.xyz',
  [SupportedChainId.moonbeam]: 'https://1rpc.io/glmr',
  [SupportedChainId.nibiru]: 'https://evm-rpc.nibiru.fi',
  [SupportedChainId.polygon]: 'https://polygon-rpc.com',
  [SupportedChainId.polygon_zkevm]: 'https://zkevm-rpc.com',
  [SupportedChainId.real]: 'https://real.drpc.org',
  [SupportedChainId.rootstock]: 'https://mycrypto.rsk.co',
  [SupportedChainId.scroll]: 'https://1rpc.io/scroll',
  [SupportedChainId.skale_europa]: 'https://mainnet.skalenodes.com/v1/elated-tan-skat',
  [SupportedChainId.sonic]: 'https://rpc.soniclabs.com',
  [SupportedChainId.tac]: 'https://rpc.ankr.com/tac',
  [SupportedChainId.taiko]: 'https://rpc.mainnet.taiko.xyz',
  [SupportedChainId.taiko_hekla]: 'https://rpc.hekla.taiko.xyz',
  [SupportedChainId.unichain]: 'https://unichain-rpc.publicnode.com',
  [SupportedChainId.unreal]: 'https://rpc.unreal-orbit.gelato.digital',
  [SupportedChainId.x_layer_testnet]: 'https://testrpc.xlayer.tech',
  [SupportedChainId.zircuit]: 'https://zircuit-mainnet.drpc.org',
  [SupportedChainId.zksync_era_testnet]: 'https://testnet.era.zksync.dev',
  [SupportedChainId.zksync_era]: 'https://mainnet.era.zksync.io',
};

// --- Env var name derived from enum key ---
// e.g. SupportedChainId.arbitrum (42161) → "ARBITRUM_RPC_HOSTS"

const getEnvVarName = (chainId: SupportedChainId): string =>
  `${SupportedChainId[chainId].toUpperCase()}_RPC_HOSTS`;

// --- Cache ---

let cacheUpdateInterval = 30_000; // 30s

const cache = new Map<number, { provider: StaticJsonRpcProvider; ts: number }>();

export const setRpcCacheUpdateInterval = (ms: number) => {
  cacheUpdateInterval = ms;
};

// --- getProvider ---

export const getProvider = async (chainId: SupportedChainId): Promise<StaticJsonRpcProvider> => {
  const cached = cache.get(chainId);
  if (cached && Date.now() - cached.ts < cacheUpdateInterval) {
    return cached.provider;
  }

  // Try env var RPC hosts (comma-separated)
  const envVar = getEnvVarName(chainId);
  const hostsRaw = process.env[envVar];

  if (hostsRaw) {
    const hosts = hostsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    for (const url of hosts) {
      try {
        const provider = new StaticJsonRpcProvider({ url });
        await provider.getBlockNumber();
        cache.set(chainId, { provider, ts: Date.now() });
        return provider;
      } catch {
        // try next host
      }
    }
  }

  // Fall back to default RPC URL
  const defaultUrl = DEFAULT_RPC_URLS[chainId];
  if (!defaultUrl) {
    throw new Error(`No RPC URL available for chain ${chainId}`);
  }

  const provider = new StaticJsonRpcProvider({ url: defaultUrl });
  cache.set(chainId, { provider, ts: Date.now() });
  return provider;
};
