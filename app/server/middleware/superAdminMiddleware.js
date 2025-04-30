const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./authMiddleware');

// Verify super admin token middleware
const verifySuperAdmin = (req, res, next) => {
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
    
    // Check if the token belongs to a super admin
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    // Add admin info to request
    req.admin = decoded;
    
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  verifySuperAdmin
}; 