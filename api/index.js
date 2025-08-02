export default function handler(req, res) {
  const { url } = req;
  
  // Simple routing based on URL path
  if (url === '/api/test' || url === '/api/test/') {
    return res.status(200).json({ 
      message: 'Hello from Vercel!',
      timestamp: new Date().toISOString()
    });
  }
  
  if (url === '/api/health' || url === '/api/health/') {
    return res.status(200).json({ 
      status: 'ok',
      message: 'API is working!',
      timestamp: new Date().toISOString()
    });
  }
  
  // Default 404 for unknown API routes
  return res.status(404).json({ 
    error: 'API route not found',
    path: url
  });
}