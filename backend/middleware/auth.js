const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');

// Authentication middleware
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Authentication required.' 
      });
    }
    
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: error.message || 'Invalid or expired token' 
    });
  }
}

module.exports = {
  authenticate
};

