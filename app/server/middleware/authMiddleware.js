const jwt = require('jsonwebtoken');

// Secret key for JWT (should be in an environment variable in production)
const JWT_SECRET = 'meditation-center-secret-key';

// Create JWT token for a center
const generateToken = (center) => {
  return jwt.sign(
    { id: center.id, center_id: center.center_id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Extract token
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add center info to request
    req.center = decoded;
    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
}; 