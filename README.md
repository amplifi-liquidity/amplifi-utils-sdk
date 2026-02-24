# @amplifi-liquidity/amplifi-utils-sdk

Shared utilities for Amplifi Liquidity services.

## Installation

```bash
npm install @amplifi-liquidity/amplifi-utils-sdk
```

### Peer dependencies

- `@ichidao/ichi-vaults-sdk` (>=0.1.0)
- `@ethersproject/providers` (^5.0.0) — optional, needed for `getProvider`
- `ethers` (^6.0.0) — optional, needed for `getProviderV6`

You only need the ethers version you use. Both can coexist.

## Usage

### getProvider (ethers v5)

Returns a cached `StaticJsonRpcProvider` for a given chain.

```typescript
import { SupportedChainId } from '@ichidao/ichi-vaults-sdk';
import { getProvider } from '@amplifi-liquidity/amplifi-utils-sdk';

const provider = await getProvider(SupportedChainId.polygon);
const blockNumber = await provider.getBlockNumber();
```

### getProviderV6 (ethers v6)

Returns a cached `JsonRpcProvider` for a given chain.

```typescript
import { SupportedChainId } from '@ichidao/ichi-vaults-sdk';
import { getProviderV6 } from '@amplifi-liquidity/amplifi-utils-sdk';

const provider = await getProviderV6(SupportedChainId.polygon);
const blockNumber = await provider.getBlockNumber();
```

### RPC resolution order

1. **Environment variable** — reads `<CHAIN_NAME>_RPC_HOSTS` (comma-separated). If a host fails, the next one is tried.
2. **Default RPC URL** — falls back to a built-in public RPC endpoint.

Providers are cached for 30 seconds by default. The v5 and v6 functions use separate caches.

### Environment variables

Each chain maps to an env var derived from its `SupportedChainId` enum key:

```
MAINNET_RPC_HOSTS=https://rpc1.example.com,https://rpc2.example.com
POLYGON_RPC_HOSTS=https://my-polygon-rpc.example.com
ARBITRUM_RPC_HOSTS=https://my-arb-rpc.example.com
```

### Configuration

```typescript
import { setRpcCacheUpdateInterval } from '@amplifi-liquidity/amplifi-utils-sdk';

// Change cache TTL to 60 seconds
setRpcCacheUpdateInterval(60_000);
```

### Default RPC URLs

The full map of default RPC URLs is exported as `DEFAULT_RPC_URLS` for inspection:

```typescript
import { DEFAULT_RPC_URLS } from '@amplifi-liquidity/amplifi-utils-sdk';
```

## Development

```bash
npm install
npm run build
npm test
```
