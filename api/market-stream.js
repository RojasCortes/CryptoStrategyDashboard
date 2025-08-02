// api/market-stream.js - Vercel Function
export default async function handler(req, res) {
  // Configurar SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Enviar datos cada 30 segundos
  const sendMarketData = async () => {
    try {
      const marketData = await getBinanceData();
      res.write(`data: ${JSON.stringify(marketData)}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({error: error.message})}\n\n`);
    }
  };

  // Enviar inmediatamente
  await sendMarketData();

  // Programar updates cada 30s
  const interval = setInterval(sendMarketData, 30000);

  // Limpiar al desconectar
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}

async function getBinanceData() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return data.map(item => ({
    symbol: item.symbol,
    price: parseFloat(item.lastPrice),
    change24h: parseFloat(item.priceChangePercent),
    volume: parseFloat(item.volume),
    lastUpdate: Date.now()
  }));
}