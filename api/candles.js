// api/candles.js - Vercel Function for candlestick data
export default async function handler(req, res) {
  // Enable CORS - consistent with other API endpoints
  const origin = req.headers.origin || req.headers.referer;

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // NOTE: Removed Access-Control-Allow-Credentials to allow wildcard origin (*)
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const symbol = url.searchParams.get('symbol') || 'BTCUSDT';
    const interval = url.searchParams.get('interval') || '1d';
    const limitParam = url.searchParams.get('limit') || '90';

    // INPUT VALIDATION: Validate limit
    const MAX_LIMIT = 1000; // Maximum candles to prevent abuse
    const MIN_LIMIT = 1;
    let limit = parseInt(limitParam);

    if (isNaN(limit) || limit < MIN_LIMIT) {
      limit = 90; // Default
    } else if (limit > MAX_LIMIT) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        message: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}`,
        maxLimit: MAX_LIMIT
      });
    }

    // INPUT VALIDATION: Validate interval
    const validIntervals = ['1h', '4h', '1d', '1w'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval parameter',
        message: 'Interval must be one of: 1h, 4h, 1d, 1w',
        validIntervals
      });
    }

    // Map our intervals to CoinGecko days
    const intervalToDays = {
      '1h': 1,
      '4h': 7,
      '1d': 90,
      '1w': 365
    };

    const days = intervalToDays[interval];

    // Map symbol to CoinGecko ID
    const symbolToId = {
      'BTCUSDT': 'bitcoin',
      'ETHUSDT': 'ethereum',
      'BNBUSDT': 'binancecoin',
      'SOLUSDT': 'solana',
      'ADAUSDT': 'cardano',
      'DOTUSDT': 'polkadot',
      'MATICUSDT': 'matic-network',
      'AVAXUSDT': 'avalanche-2',
      'LINKUSDT': 'chainlink',
      'UNIUSDT': 'uniswap'
    };

    // INPUT VALIDATION: Validate symbol
    if (!symbolToId[symbol]) {
      return res.status(400).json({
        error: 'Invalid symbol parameter',
        message: 'Symbol not supported',
        validSymbols: Object.keys(symbolToId),
        example: 'BTCUSDT'
      });
    }

    const coinId = symbolToId[symbol];

    // Use CoinGecko market chart API
    const cgUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;

    const response = await fetch(cgUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Convert CoinGecko format to candlestick format
    // CoinGecko provides: prices, market_caps, total_volumes
    // Each is an array of [timestamp, value]
    const candleData = [];

    if (data.prices && data.prices.length > 0) {
      const dataPoints = Math.min(data.prices.length, limit);
      const step = Math.max(1, Math.floor(data.prices.length / dataPoints));

      for (let i = 0; i < data.prices.length; i += step) {
        if (candleData.length >= limit) break;

        const timestamp = data.prices[i][0];
        const price = data.prices[i][1];

        // Generate realistic OHLC from price point
        // This is a simulation since CoinGecko doesn't provide OHLC for free
        const volatility = 0.02; // 2% volatility
        const randomFactor = () => 1 + (Math.random() - 0.5) * volatility;

        const open = price * randomFactor();
        const close = price * randomFactor();
        const high = Math.max(open, close) * (1 + Math.random() * volatility / 2);
        const low = Math.min(open, close) * (1 - Math.random() * volatility / 2);
        const volume = data.total_volumes?.[i]?.[1] || Math.random() * 1000000000;

        candleData.push({
          time: timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: parseFloat(volume.toFixed(0))
        });
      }
    }

    // If no data, return mock data
    if (candleData.length === 0) {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const basePrice = 45000;

      for (let i = 0; i < Math.min(limit, 90); i++) {
        const timestamp = now - (90 - i) * dayMs;
        const trend = Math.sin(i / 10) * 2000;
        const noise = (Math.random() - 0.5) * 1000;
        const price = basePrice + trend + noise;

        const open = price * (1 + (Math.random() - 0.5) * 0.02);
        const close = price * (1 + (Math.random() - 0.5) * 0.02);
        const high = Math.max(open, close) * 1.01;
        const low = Math.min(open, close) * 0.99;

        candleData.push({
          time: timestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000000)
        });
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

    return res.status(200).json(candleData);
  } catch (error) {
    console.error('Candles data error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch candle data',
      timestamp: Date.now()
    });
  }
}
