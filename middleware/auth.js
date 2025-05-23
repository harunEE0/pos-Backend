//E:\learn-code\backend-pos\middleware\auth.js

const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('../config/env');
const User = require('../models/User');
const SessionManager = require('../utils/sessionManager');
const{ErrorResponse} = require('../utils/ErrorResponse')


 const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requireAuth = async (req, res , next) => {
  try {

    
    const token = req.cookies?.session_token || req.headers?.authorization?.split(' ')[1];
    if (!token) {
      throw new ErrorResponse('No token provided', 401);
    }

    const session = await SessionManager.verifySession(token);
    if (!session) {
      throw new ErrorResponse('Invalid session', 401);
    }

    req.user = session;
    req.token = token;
    next();
  } catch (error) {
    next(err);
    
  }
}




module.exports = {authorize, protect, auth,requireAuth};