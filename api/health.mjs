export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'API Working!',
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasBinance: !!process.env.BINANCE_API_KEY
    }
  });
}