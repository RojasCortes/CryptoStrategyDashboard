// api/market-data.js - Vercel Function for polling fallback
export default async function handler(req, res) {
  try {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const marketData = data.map(item => ({
      symbol: item.symbol,
      price: parseFloat(item.lastPrice),
      change24h: parseFloat(item.priceChangePercent),
      volume: parseFloat(item.volume),
      lastUpdate: Date.now()
    }));

    res.setHeader('Cache-Control', 'no-cache');
    res.json(marketData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}