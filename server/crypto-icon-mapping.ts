// Mapping from crypto symbols to CoinGecko IDs
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  // Major cryptocurrencies
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  TRX: 'tron',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LTC: 'litecoin',
  SHIB: 'shiba-inu',
  AVAX: 'avalanche-2',
  UNI: 'uniswap',
  LINK: 'chainlink',
  XLM: 'stellar',
  ATOM: 'cosmos',
  XMR: 'monero',
  ETC: 'ethereum-classic',
  BCH: 'bitcoin-cash',

  // Stablecoins
  USDT: 'tether',
  USDC: 'usd-coin',
  BUSD: 'binance-usd',
  DAI: 'dai',
  TUSD: 'true-usd',

  // DeFi tokens
  AAVE: 'aave',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  SNX: 'havven',
  YFI: 'yearn-finance',
  SUSHI: 'sushi',
  CAKE: 'pancakeswap-token',

  // Exchange tokens
  FTT: 'ftx-token',
  CRO: 'crypto-com-chain',
  OKB: 'okb',
  HT: 'huobi-token',
  LEO: 'leo-token',

  // Others
  FTM: 'fantom',
  ALGO: 'algorand',
  XTZ: 'tezos',
  EOS: 'eos',
  NEAR: 'near',
  NEO: 'neo',
  DASH: 'dash',
  ZEC: 'zcash',
  VET: 'vechain',
  FIL: 'filecoin',
  ICP: 'internet-computer',
  APE: 'apecoin',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  THETA: 'theta-token',
  EGLD: 'elrond-erd-2',
  FLOW: 'flow',
  APT: 'aptos',
  OP: 'optimism',
  ARB: 'arbitrum',
  LDO: 'lido-dao',
  IMX: 'immutable-x',
  QNT: 'quant-network',
  RUNE: 'thorchain',
  GRT: 'the-graph',
  INJ: 'injective-protocol',
  STX: 'blockstack',
  KCS: 'kucoin-shares',

  // New additions
  PEPE: 'pepe',
  WLD: 'worldcoin-wld',
  SEI: 'sei-network',
  TIA: 'celestia',
  SUI: 'sui',
  BLUR: 'blur',
  MNT: 'mantle',
  RNDR: 'render-token',
  FET: 'fetch-ai',
  AGIX: 'singularitynet',
  OCEAN: 'ocean-protocol',
  ROSE: 'oasis-network',
  LRC: 'loopring',
  CHZ: 'chiliz',
  ENJ: 'enjincoin',
  GALA: 'gala',
  GMT: 'stepn',

  // Additional tokens
  ONE: 'harmony',
  ZIL: 'zilliqa',
  QTUM: 'qtum',
  ICX: 'icon',
  ZRX: '0x',
  BAT: 'basic-attention-token',
  REV: 'revain',
  HOT: 'holotoken',
  OMG: 'omisego',
  WAVES: 'waves',
  IOTA: 'iota',
  ONT: 'ontology',
  NANO: 'nano',
  SC: 'siacoin',
  DGB: 'digibyte',
  RVN: 'ravencoin',
  DCR: 'decred'
};

// Cache for icon URLs (valid for 24 hours)
const iconCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function getIconUrl(symbol: string): string | null {
  const coingeckoId = SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()];

  if (!coingeckoId) {
    return null;
  }

  // Check cache
  const cached = iconCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }

  // CoinGecko icon URL (small size, 64x64)
  const url = `https://assets.coingecko.com/coins/images/1/small/${coingeckoId}.png`;

  // Cache it
  iconCache.set(symbol, { url, timestamp: Date.now() });

  return url;
}
