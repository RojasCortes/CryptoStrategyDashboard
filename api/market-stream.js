// api/market-stream.js - Vercel Function
export default async function handler(req, res) {
  // Enable CORS for SSE
  const origin = req.headers.origin || req.headers.referer;

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Configurar SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Enviar datos cada 30 segundos
  const sendMarketData = async () => {
    try {
      const marketData = await getBinanceData();
      // ERROR HANDLING: Check if response is still writable
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(marketData)}\n\n`);
      }
    } catch (error) {
      console.error('Error in sendMarketData:', error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({error: error.message, type: 'stream_error'})}\n\n`);
      }
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (interval) {
      clearInterval(interval);
    }
    if (!res.writableEnded) {
      res.end();
    }
  };

  // Enviar inmediatamente
  try {
    await sendMarketData();
  } catch (error) {
    console.error('Initial sendMarketData failed:', error);
    return res.status(500).json({ error: 'Failed to initialize market stream' });
  }

  // Programar updates cada 30s
  const interval = setInterval(sendMarketData, 30000);

  // ERROR HANDLING: Limpiar al desconectar o error
  req.on('close', cleanup);
  req.on('error', (err) => {
    console.error('SSE request error:', err);
    cleanup();
  });

  // ERROR HANDLING: Response error handling
  res.on('error', (err) => {
    console.error('SSE response error:', err);
    cleanup();
  });
}

async function getBinanceData() {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`;

  try {
    const response = await fetch(url, {
      timeout: 5000 // 5 second timeout
    });

    // ERROR HANDLING: Check if response is ok
    if (!response.ok) {
      console.error(`Binance API error: ${response.status} ${response.statusText}`);
      throw new Error(`Binance API returned ${response.status}`);
    }

    const data = await response.json();

    // ERROR HANDLING: Validate response is array
    if (!Array.isArray(data)) {
      console.error('Binance API returned non-array data:', data);
      throw new Error('Invalid data format from Binance API');
    }

    // ERROR HANDLING: Validate each item has required fields
    return data
      .filter(item => item && item.symbol && item.lastPrice)
      .map(item => ({
        symbol: item.symbol,
        price: parseFloat(item.lastPrice) || 0,
        change24h: parseFloat(item.priceChangePercent) || 0,
        volume: parseFloat(item.volume) || 0,
        lastUpdate: Date.now()
      }));
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    // Return empty array on error to prevent stream from crashing
    return [];
  }
}