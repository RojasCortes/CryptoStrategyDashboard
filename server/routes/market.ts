// Additional market data endpoints for real Binance data
import { Router } from 'express';
import { createBinanceService } from '../binance';

const router = Router();

// Get historical candle data for charts
router.get('/candles', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const { symbol = 'BTCUSDT', interval = '1d', limit = '90' } = req.query;
    const user = req.user;
    const apiKey = user.apiKey || "";
    const apiSecret = user.apiSecret || "";

    console.log(`Fetching candle data for ${symbol} with interval ${interval}`);
    
    // Use public Binance API for candle data (no auth required)
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to more usable format
    const candles = data.map((candle: any[]) => ({
      openTime: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      closeTime: candle[6],
    }));

    res.set({
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      'X-Data-Source': 'Binance-API-Real-Candles'
    });
    res.json(candles);
  } catch (error) {
    console.error("Error fetching candle data:", error);
    res.status(500).json({ 
      error: "No se pudieron obtener los datos de velas",
      message: "Los datos históricos provienen directamente de Binance. Reintenta en unos momentos.",
      requiresApiKey: false
    });
  }
});

// Get account balance data
router.get('/account/balance', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = req.user;
    const apiKey = user.apiKey || "";
    const apiSecret = user.apiSecret || "";

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ 
        error: "API credentials required",
        message: "Para acceder a los datos de tu cuenta, configura tus claves API de Binance en la sección de Ajustes.",
        requiresApiKey: true
      });
    }

    console.log("Fetching real account balance from Binance");
    const binanceService = createBinanceService(apiKey, apiSecret);
    const accountData = await binanceService.getAccountInfo();

    res.set({
      'Cache-Control': 'private, max-age=30', // Cache privately for 30 seconds
      'X-Data-Source': 'Binance-API-Real-Account'
    });
    res.json(accountData);
  } catch (error) {
    console.error("Error fetching account balance:", error);
    res.status(500).json({ 
      error: "No se pudieron obtener los datos de la cuenta",
      message: "Verifica que tus claves API de Binance sean correctas y tengan los permisos necesarios. Configúralas en Ajustes.",
      requiresApiKey: true
    });
  }
});

export default router;