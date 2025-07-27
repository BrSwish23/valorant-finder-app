// Simple test API function
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Test API is working!', 
    method: req.method,
    timestamp: new Date().toISOString() 
  });
}; 