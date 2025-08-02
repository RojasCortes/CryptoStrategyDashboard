module.exports = (req, res) => {
  // Simple user endpoint that returns 401 for unauthenticated requests
  res.status(401).json({
    message: 'Not authenticated',
    timestamp: new Date().toISOString()
  });
};