import { SupportedChainId } from '@amplifi-liquidity/amplifi-vaults-sdk';
import {
  getProvider, getProviderV6, setRpcCacheUpdateInterval, setRpcProbeTimeout, resetRpcHostHealth,
  DEFAULT_RPC_URLS, PUBLIC_FALLBACK_RPC_URLS,
} from './index';

// Providers are plain objects; host health comes from the fetch-based probe.
jest.mock('@ethersproject/providers', () => ({
  StaticJsonRpcProvider: jest.fn().mockImplementation(({ url }: { url: string }) => ({ url, getBlockNumber: jest.fn() })),
}));
jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockImplementation((url: string) => ({ url, getBlockNumber: jest.fn() })),
  Network: { from: jest.fn().mockImplementation((chainId: number) => ({ chainId })) },
}));

const { StaticJsonRpcProvider } = require('@ethersproject/providers');
const { JsonRpcProvider } = require('ethers');

// Probe behaviour per host: healthy unless listed. 'hang' never answers until aborted.
let hostBehaviour: Record<string, 'ok' | '429' | 'down' | 'hang'> = {};
const probes: string[] = [];
const fetchMock = jest.fn(async (url: string, init: { signal: AbortSignal }) => {
  probes.push(url);
  const mode = hostBehaviour[url] ?? 'ok';
  if (mode === 'down') throw new TypeError('fetch failed');
  if (mode === 'hang') {
    return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
  }
  if (mode === '429') return { ok: false, status: 429, json: async () => ({ error: { message: 'daily request limit reached' } }) };
  return { ok: true, status: 200, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x3039' }) };
});

const ENV_KEYS = ['ARBITRUM_RPC_HOSTS', 'BASE_RPC_HOSTS', 'BSC_RPC_HOSTS', 'LINEA_RPC_HOSTS', 'MANTLE_RPC_HOSTS', 'SONIC_RPC_HOSTS'];

beforeAll(() => { (global as any).fetch = fetchMock; });
beforeEach(() => {
  setRpcCacheUpdateInterval(0);
  setRpcProbeTimeout(5_000);
  resetRpcHostHealth();
  hostBehaviour = {};
  probes.length = 0;
  jest.clearAllMocks();
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('DEFAULT_RPC_URLS', () => {
  it('should have an entry for every SupportedChainId', () => {
    const enumKeys = Object.keys(SupportedChainId).filter((k) => isNaN(Number(k)));
    for (const key of enumKeys) {
      const chainId = SupportedChainId[key as keyof typeof SupportedChainId];
      expect(DEFAULT_RPC_URLS[chainId]).toBeDefined();
      expect(typeof DEFAULT_RPC_URLS[chainId]).toBe('string');
      expect(DEFAULT_RPC_URLS[chainId].startsWith('https://')).toBe(true);
    }
  });

  it('should use the official Robinhood Chain mainnet RPC URL', () => {
    expect(DEFAULT_RPC_URLS[SupportedChainId.robinhood]).toBe('https://rpc.mainnet.chain.robinhood.com');
  });

  it('public fallbacks are https and never repeat the default', () => {
    for (const [chainId, urls] of Object.entries(PUBLIC_FALLBACK_RPC_URLS)) {
      for (const url of urls!) {
        expect(url.startsWith('https://')).toBe(true);
        expect(url).not.toBe(DEFAULT_RPC_URLS[Number(chainId) as SupportedChainId]);
      }
    }
  });
});

describe('getProvider (ethers v5)', () => {
  it('uses the default RPC URL when no env var is set', async () => {
    await getProvider(SupportedChainId.polygon);
    expect(StaticJsonRpcProvider).toHaveBeenCalledWith({ url: DEFAULT_RPC_URLS[SupportedChainId.polygon] });
  });

  it('prefers the configured host, in order', async () => {
    process.env.BASE_RPC_HOSTS = 'https://rpc1.example.com, https://rpc2.example.com';
    await getProvider(SupportedChainId.base);
    expect(StaticJsonRpcProvider).toHaveBeenCalledTimes(1);
    expect(StaticJsonRpcProvider).toHaveBeenCalledWith({ url: 'https://rpc1.example.com' });
  });

  it('falls back to the next host when the first is down, building only the healthy provider', async () => {
    process.env.BSC_RPC_HOSTS = 'https://bad-rpc.example.com,https://good-rpc.example.com';
    hostBehaviour['https://bad-rpc.example.com'] = 'down';
    await getProvider(SupportedChainId.bsc);
    expect(StaticJsonRpcProvider).toHaveBeenCalledTimes(1);
    expect(StaticJsonRpcProvider).toHaveBeenCalledWith({ url: 'https://good-rpc.example.com' });
  });

  it('returns the cached provider within the TTL without probing again', async () => {
    setRpcCacheUpdateInterval(60_000);
    const first = await getProvider(SupportedChainId.scroll);
    const second = await getProvider(SupportedChainId.scroll);
    expect(first).toBe(second);
    expect(probes).toHaveLength(1);
  });
});

describe('getProviderV6 (ethers v6)', () => {
  it('builds a static-network provider for the chosen host', async () => {
    process.env.LINEA_RPC_HOSTS = 'https://custom-v6-rpc.example.com';
    await getProviderV6(SupportedChainId.linea);
    expect(JsonRpcProvider).toHaveBeenCalledWith(
      'https://custom-v6-rpc.example.com',
      expect.objectContaining({ chainId: SupportedChainId.linea }),
      expect.objectContaining({ staticNetwork: expect.any(Object) }),
    );
  });

  it('uses a separate cache from v5', async () => {
    setRpcCacheUpdateInterval(60_000);
    const v5 = await getProvider(SupportedChainId.mainnet);
    const v6 = await getProviderV6(SupportedChainId.mainnet);
    expect(v5).not.toBe(v6);
  });
});

describe('resilience to throttled or hanging hosts', () => {
  it('a quota-exhausted (429) host is skipped and cooled down instead of re-probed', async () => {
    process.env.BSC_RPC_HOSTS = 'https://quota.example.com';
    hostBehaviour['https://quota.example.com'] = '429';
    const provider = await getProviderV6(SupportedChainId.bsc);
    expect(provider.url).toBe(DEFAULT_RPC_URLS[SupportedChainId.bsc]);
    probes.length = 0;
    await getProviderV6(SupportedChainId.bsc); // TTL 0: resolve again
    expect(probes).not.toContain('https://quota.example.com');
  });

  it('BSC falls through to its public fallbacks when the configured host and default fail', async () => {
    process.env.BSC_RPC_HOSTS = 'https://quota.example.com';
    hostBehaviour['https://quota.example.com'] = '429';
    hostBehaviour[DEFAULT_RPC_URLS[SupportedChainId.bsc]] = 'down';
    const provider = await getProviderV6(SupportedChainId.bsc);
    expect(provider.url).toBe(PUBLIC_FALLBACK_RPC_URLS[SupportedChainId.bsc]![0]);
  });

  it('a hanging host is abandoned at the probe deadline', async () => {
    setRpcProbeTimeout(50);
    process.env.ARBITRUM_RPC_HOSTS = 'https://hang.example.com,https://ok.example.com';
    hostBehaviour['https://hang.example.com'] = 'hang';
    const started = Date.now();
    const provider = await getProviderV6(SupportedChainId.arbitrum);
    expect(provider.url).toBe('https://ok.example.com');
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('concurrent callers share one probe per chain', async () => {
    setRpcCacheUpdateInterval(60_000);
    process.env.SONIC_RPC_HOSTS = 'https://sonic.example.com';
    const providers = await Promise.all(Array.from({ length: 15 }, () => getProviderV6(SupportedChainId.sonic)));
    expect(new Set(providers).size).toBe(1);
    expect(probes.filter((url) => url === 'https://sonic.example.com')).toHaveLength(1);
  });

  it('when every candidate fails on a fresh chain it returns promptly instead of stalling', async () => {
    process.env.MANTLE_RPC_HOSTS = 'https://quota.example.com';
    hostBehaviour['https://quota.example.com'] = '429';
    hostBehaviour[DEFAULT_RPC_URLS[SupportedChainId.mantle]] = 'down';
    const provider = await getProviderV6(SupportedChainId.mantle);
    expect(provider.url).toBe('https://quota.example.com');
    probes.length = 0;
    await getProviderV6(SupportedChainId.mantle); // everything cooling: no probes, no wait
    expect(probes).toHaveLength(0);
    delete process.env.MANTLE_RPC_HOSTS;
  });

  it('keeps the last known-good provider when every candidate later fails', async () => {
    process.env.SONIC_RPC_HOSTS = 'https://sonic-a.example.com';
    const good = await getProviderV6(SupportedChainId.sonic);
    hostBehaviour['https://sonic-a.example.com'] = '429';
    hostBehaviour[DEFAULT_RPC_URLS[SupportedChainId.sonic]] = 'down';
    expect(await getProviderV6(SupportedChainId.sonic)).toBe(good);
  });
});

describe('env var derivation', () => {
  it('should derive correct env var names from chain enum', () => {
    expect(SupportedChainId[SupportedChainId.mainnet].toUpperCase() + '_RPC_HOSTS').toBe('MAINNET_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.polygon_zkevm].toUpperCase() + '_RPC_HOSTS').toBe('POLYGON_ZKEVM_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.zksync_era].toUpperCase() + '_RPC_HOSTS').toBe('ZKSYNC_ERA_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.base_sepolia].toUpperCase() + '_RPC_HOSTS').toBe('BASE_SEPOLIA_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.robinhood].toUpperCase() + '_RPC_HOSTS').toBe('ROBINHOOD_RPC_HOSTS');
  });
});
