// api/market-data.js - Vercel Function for polling fallback
export default async function handler(req, res) {
  // Enable CORS - consistent with other API endpoints
  const origin = req.headers.origin || req.headers.referer;

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // NOTE: Removed Access-Control-Allow-Credentials to allow wildcard origin (*)
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Use CoinGecko API instead of Binance (no geo-restrictions)
    const coins = 'bitcoin,ethereum,binancecoin,solana';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Map CoinGecko data to match expected format (MarketData[] interface)
    const marketData = [
      {
        symbol: 'BTCUSDT',
        price: String(data.bitcoin?.usd || 0),
        priceChangePercent: String((data.bitcoin?.usd_24h_change || 0).toFixed(2)),
        change24h: data.bitcoin?.usd_24h_change || 0,
        volume: String(Math.round(data.bitcoin?.usd_24h_vol || 0)),
        lastUpdate: Date.now()
      },
      {
        symbol: 'ETHUSDT',
        price: String(data.ethereum?.usd || 0),
        priceChangePercent: String((data.ethereum?.usd_24h_change || 0).toFixed(2)),
        change24h: data.ethereum?.usd_24h_change || 0,
        volume: String(Math.round(data.ethereum?.usd_24h_vol || 0)),
        lastUpdate: Date.now()
      },
      {
        symbol: 'BNBUSDT',
        price: String(data.binancecoin?.usd || 0),
        priceChangePercent: String((data.binancecoin?.usd_24h_change || 0).toFixed(2)),
        change24h: data.binancecoin?.usd_24h_change || 0,
        volume: String(Math.round(data.binancecoin?.usd_24h_vol || 0)),
        lastUpdate: Date.now()
      },
      {
        symbol: 'SOLUSDT',
        price: String(data.solana?.usd || 0),
        priceChangePercent: String((data.solana?.usd_24h_change || 0).toFixed(2)),
        change24h: data.solana?.usd_24h_change || 0,
        volume: String(Math.round(data.solana?.usd_24h_vol || 0)),
        lastUpdate: Date.now()
      }
    ];

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    return res.status(200).json(marketData);
  } catch (error) {
    console.error('Market data error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch market data',
      timestamp: Date.now()
    });
  }
}