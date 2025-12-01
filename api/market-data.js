// api/market-data.js - Vercel Function for polling fallback
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from Binance API');
    }

    const marketData = data.map(item => ({
      symbol: item.symbol,
      price: parseFloat(item.lastPrice),
      change24h: parseFloat(item.priceChangePercent),
      volume: parseFloat(item.volume),
      lastUpdate: Date.now()
    }));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json(marketData);
  } catch (error) {
    console.error('Market data error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch market data',
      timestamp: Date.now()
    });
  }
}