import { SupportedChainId } from '@amplifi-liquidity/amplifi-vaults-sdk';

// --- Default RPC URLs per chain ---

export const DEFAULT_RPC_URLS: Record<SupportedChainId, string> = {
  [SupportedChainId.arbitrum]: 'https://arb1.arbitrum.io/rpc',
  [SupportedChainId.arthera]: 'https://rpc.arthera.net',
  [SupportedChainId.arthera_testnet]: 'https://rpc-test.arthera.net',
  [SupportedChainId.base]: 'https://mainnet.base.org',
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
  [SupportedChainId.mainnet]: 'https://ethereum-rpc.publicnode.com',
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
  [SupportedChainId.robinhood]: 'https://rpc.mainnet.chain.robinhood.com',
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

// --- Additional public fallbacks ---
// Tried after the configured hosts and DEFAULT_RPC_URLS, so one throttled endpoint never
// leaves a chain with nowhere to go. Only list endpoints verified to serve the chain.

export const PUBLIC_FALLBACK_RPC_URLS: Partial<Record<SupportedChainId, string[]>> = {
  [SupportedChainId.bsc]: [
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
    'https://bsc-rpc.publicnode.com',
    'https://1rpc.io/bnb',
  ],
};

// --- Cache and probing ---

let cacheUpdateInterval = 5 * 60_000; // keep a healthy provider for 5 minutes
let probeTimeoutMs = 5_000;

/** Deadline for a single host health probe (default 5s). */
export const setRpcProbeTimeout = (ms: number) => {
  probeTimeoutMs = ms;
};
const HOST_COOLDOWN_MS = 5 * 60_000;

export const setRpcCacheUpdateInterval = (ms: number) => {
  cacheUpdateInterval = ms;
};

// Hosts that recently failed a probe (e.g. HTTP 429 quota exhaustion) are skipped until
// their cool-down ends, so callers don't re-probe a throttled endpoint on every request.
const coolingHosts = new Map<string, number>();

export const resetRpcHostHealth = () => {
  coolingHosts.clear();
};

// A raw JSON-RPC probe with a hard deadline. Going through ethers would inherit its
// retry/back-off on 429, which is exactly how one throttled host stalled every caller.
const probeHost = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
      signal: AbortSignal.timeout(probeTimeoutMs),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { result?: unknown };
    return typeof body.result === 'string' && /^0x[0-9a-f]+$/i.test(body.result);
  } catch {
    return false;
  }
};

const candidateUrls = (chainId: SupportedChainId): string[] => {
  const configured = (process.env[getEnvVarName(chainId)] ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const fallbacks = [DEFAULT_RPC_URLS[chainId], ...(PUBLIC_FALLBACK_RPC_URLS[chainId] ?? [])].filter(Boolean);
  return [...new Set([...configured, ...fallbacks])];
};

// --- Shared provider resolution logic ---

export interface ProviderLike {
  getBlockNumber(): Promise<number>;
  [key: string]: any;
}

type ProviderCache<T> = Map<number, { provider: T; ts: number }>;

const inFlight = new WeakMap<ProviderCache<any>, Map<number, Promise<any>>>();

const resolveProvider = async <T extends ProviderLike>(
  chainId: SupportedChainId,
  cache: ProviderCache<T>,
  createProvider: (url: string) => T,
): Promise<T> => {
  const cached = cache.get(chainId);
  if (cached && Date.now() - cached.ts < cacheUpdateInterval) {
    return cached.provider;
  }

  // One probe per chain at a time: concurrent callers share it instead of each probing.
  let pending = inFlight.get(cache);
  if (!pending) inFlight.set(cache, (pending = new Map()));
  const existing = pending.get(chainId);
  if (existing) return existing;

  const resolution = (async () => {
    const urls = candidateUrls(chainId);
    if (urls.length === 0) throw new Error(`No RPC URL available for chain ${chainId}`);
    const now = Date.now();
    const ready = urls.filter((url) => (coolingHosts.get(url) ?? 0) <= now);
    for (const url of ready) {
      if (await probeHost(url)) {
        coolingHosts.delete(url);
        const provider = createProvider(url);
        cache.set(chainId, { provider, ts: Date.now() });
        return provider;
      }
      coolingHosts.set(url, Date.now() + HOST_COOLDOWN_MS);
    }
    // Every candidate failed or is cooling down: keep the previous provider if there was
    // one, otherwise return the first candidate unprobed so callers fail on a real request.
    if (cached) return cached.provider;
    return createProvider(urls[0]);
  })();
  pending.set(chainId, resolution);
  try {
    return await resolution;
  } finally {
    pending.delete(chainId);
  }
};

// --- getProvider (ethers v5) ---

const cacheV5 = new Map<number, { provider: ProviderLike; ts: number }>();

/** Returns an ethers v5 StaticJsonRpcProvider. Requires `@ethersproject/providers`. */
export const getProvider = async (chainId: SupportedChainId): Promise<ProviderLike> => {
  return resolveProvider(chainId, cacheV5, (url) => {
    const { StaticJsonRpcProvider } = require('@ethersproject/providers');
    return new StaticJsonRpcProvider({ url });
  });
};

// --- getProviderV6 (ethers v6) ---

const cacheV6 = new Map<number, { provider: ProviderLike; ts: number }>();

/** Returns an ethers v6 JsonRpcProvider. Requires `ethers` v6. */
export const getProviderV6 = async (chainId: SupportedChainId): Promise<ProviderLike> => {
  return resolveProvider(chainId, cacheV6, (url) => {
    const { JsonRpcProvider, Network } = require('ethers');
    const network = Network.from(chainId);
    return new JsonRpcProvider(url, network, { staticNetwork: network });
  });
};
