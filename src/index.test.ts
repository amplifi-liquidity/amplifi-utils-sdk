import { SupportedChainId } from '@ichidao/ichi-vaults-sdk';
import { getProvider, getProviderV6, setRpcCacheUpdateInterval, DEFAULT_RPC_URLS } from './index';

// Mock ethers v5
jest.mock('@ethersproject/providers', () => {
  const mockProvider = {
    getBlockNumber: jest.fn().mockResolvedValue(12345),
  };
  return {
    StaticJsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
  };
});

// Mock ethers v6
jest.mock('ethers', () => {
  const mockProvider = {
    getBlockNumber: jest.fn().mockResolvedValue(12345),
  };
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
    Network: { from: jest.fn().mockImplementation((chainId: number) => ({ chainId })) },
  };
});

const { StaticJsonRpcProvider } = require('@ethersproject/providers');
const { JsonRpcProvider } = require('ethers');

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
});

describe('getProvider (ethers v5)', () => {
  beforeEach(() => {
    setRpcCacheUpdateInterval(0);
    jest.clearAllMocks();
  });

  afterAll(() => {
    setRpcCacheUpdateInterval(30_000);
  });

  it('should return a provider for a valid chain', async () => {
    const provider = await getProvider(SupportedChainId.mainnet);
    expect(provider).toBeDefined();
    expect(StaticJsonRpcProvider).toHaveBeenCalled();
  });

  it('should use the default RPC URL when no env var is set', async () => {
    await getProvider(SupportedChainId.polygon);
    expect(StaticJsonRpcProvider).toHaveBeenCalledWith({
      url: DEFAULT_RPC_URLS[SupportedChainId.polygon],
    });
  });

  it('should use env var RPC host when set', async () => {
    process.env.ARBITRUM_RPC_HOSTS = 'https://custom-rpc.example.com';
    await getProvider(SupportedChainId.arbitrum);
    expect(StaticJsonRpcProvider).toHaveBeenCalledWith({
      url: 'https://custom-rpc.example.com',
    });
    delete process.env.ARBITRUM_RPC_HOSTS;
  });

  it('should support comma-separated env var hosts', async () => {
    process.env.BASE_RPC_HOSTS = 'https://rpc1.example.com, https://rpc2.example.com';
    await getProvider(SupportedChainId.base);
    expect(StaticJsonRpcProvider).toHaveBeenCalledWith({
      url: 'https://rpc1.example.com',
    });
    delete process.env.BASE_RPC_HOSTS;
  });

  it('should fall back to next host if first fails', async () => {
    const mockGetBlockNumber = jest.fn()
      .mockRejectedValueOnce(new Error('connection failed'))
      .mockResolvedValueOnce(99999);

    StaticJsonRpcProvider.mockImplementation(() => ({
      getBlockNumber: mockGetBlockNumber,
    }));

    process.env.BSC_RPC_HOSTS = 'https://bad-rpc.example.com,https://good-rpc.example.com';
    await getProvider(SupportedChainId.bsc);

    expect(StaticJsonRpcProvider).toHaveBeenCalledTimes(2);
    expect(StaticJsonRpcProvider).toHaveBeenNthCalledWith(1, { url: 'https://bad-rpc.example.com' });
    expect(StaticJsonRpcProvider).toHaveBeenNthCalledWith(2, { url: 'https://good-rpc.example.com' });
    delete process.env.BSC_RPC_HOSTS;
  });

  it('should return cached provider within TTL', async () => {
    setRpcCacheUpdateInterval(60_000);
    const provider1 = await getProvider(SupportedChainId.scroll);
    const provider2 = await getProvider(SupportedChainId.scroll);
    expect(provider1).toBe(provider2);
    expect(StaticJsonRpcProvider).toHaveBeenCalledTimes(1);
  });
});

describe('getProviderV6 (ethers v6)', () => {
  beforeEach(() => {
    setRpcCacheUpdateInterval(0);
    jest.clearAllMocks();
  });

  afterAll(() => {
    setRpcCacheUpdateInterval(30_000);
  });

  it('should return a provider for a valid chain', async () => {
    const provider = await getProviderV6(SupportedChainId.mainnet);
    expect(provider).toBeDefined();
    expect(JsonRpcProvider).toHaveBeenCalled();
  });

  it('should use the default RPC URL when no env var is set', async () => {
    await getProviderV6(SupportedChainId.polygon);
    expect(JsonRpcProvider).toHaveBeenCalledWith(
      DEFAULT_RPC_URLS[SupportedChainId.polygon],
      expect.objectContaining({ chainId: SupportedChainId.polygon }),
      expect.objectContaining({ staticNetwork: expect.any(Object) }),
    );
  });

  it('should use env var RPC host when set', async () => {
    process.env.LINEA_RPC_HOSTS = 'https://custom-v6-rpc.example.com';
    await getProviderV6(SupportedChainId.linea);
    expect(JsonRpcProvider).toHaveBeenCalledWith(
      'https://custom-v6-rpc.example.com',
      expect.objectContaining({ chainId: SupportedChainId.linea }),
      expect.objectContaining({ staticNetwork: expect.any(Object) }),
    );
    delete process.env.LINEA_RPC_HOSTS;
  });

  it('should fall back to next host if first fails', async () => {
    const mockGetBlockNumber = jest.fn()
      .mockRejectedValueOnce(new Error('connection failed'))
      .mockResolvedValueOnce(99999);

    JsonRpcProvider.mockImplementation(() => ({
      getBlockNumber: mockGetBlockNumber,
    }));

    process.env.SONIC_RPC_HOSTS = 'https://bad-rpc.example.com,https://good-rpc.example.com';
    await getProviderV6(SupportedChainId.sonic);

    expect(JsonRpcProvider).toHaveBeenCalledTimes(2);
    expect(JsonRpcProvider).toHaveBeenNthCalledWith(1, 'https://bad-rpc.example.com', expect.any(Object), expect.any(Object));
    expect(JsonRpcProvider).toHaveBeenNthCalledWith(2, 'https://good-rpc.example.com', expect.any(Object), expect.any(Object));
    delete process.env.SONIC_RPC_HOSTS;
  });

  it('should return cached provider within TTL', async () => {
    setRpcCacheUpdateInterval(60_000);
    const provider1 = await getProviderV6(SupportedChainId.scroll);
    const provider2 = await getProviderV6(SupportedChainId.scroll);
    expect(provider1).toBe(provider2);
    expect(JsonRpcProvider).toHaveBeenCalledTimes(1);
  });

  it('should use separate cache from v5', async () => {
    setRpcCacheUpdateInterval(60_000);
    const v5 = await getProvider(SupportedChainId.mainnet);
    const v6 = await getProviderV6(SupportedChainId.mainnet);
    expect(v5).not.toBe(v6);
  });
});

describe('env var derivation', () => {
  it('should derive correct env var names from chain enum', () => {
    expect(SupportedChainId[SupportedChainId.mainnet].toUpperCase() + '_RPC_HOSTS').toBe('MAINNET_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.polygon_zkevm].toUpperCase() + '_RPC_HOSTS').toBe('POLYGON_ZKEVM_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.zksync_era].toUpperCase() + '_RPC_HOSTS').toBe('ZKSYNC_ERA_RPC_HOSTS');
    expect(SupportedChainId[SupportedChainId.base_sepolia].toUpperCase() + '_RPC_HOSTS').toBe('BASE_SEPOLIA_RPC_HOSTS');
  });
});
