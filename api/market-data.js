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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

    // Map CoinGecko data to match expected format
    const marketData = [
      {
        symbol: 'BTCUSDT',
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0,
        volume: data.bitcoin?.usd_24h_vol || 0,
        lastUpdate: Date.now()
      },
      {
        symbol: 'ETHUSDT',
        price: data.ethereum?.usd || 0,
        change24h: data.ethereum?.usd_24h_change || 0,
        volume: data.ethereum?.usd_24h_vol || 0,
        lastUpdate: Date.now()
      },
      {
        symbol: 'BNBUSDT',
        price: data.binancecoin?.usd || 0,
        change24h: data.binancecoin?.usd_24h_change || 0,
        volume: data.binancecoin?.usd_24h_vol || 0,
        lastUpdate: Date.now()
      },
      {
        symbol: 'SOLUSDT',
        price: data.solana?.usd || 0,
        change24h: data.solana?.usd_24h_change || 0,
        volume: data.solana?.usd_24h_vol || 0,
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