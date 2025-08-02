module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Serverless function working'
  });
};