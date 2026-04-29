import jwt from 'jsonwebtoken';
import { sequelize } from '../models/db.js';

// Authenticate JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'emc-secret-key-2025', async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      // Support both 'id' and 'userId' in token for backwards compatibility
      const userId = decoded.userId || decoded.id;
      
      // Fetch user from database
      const [[user]] = await sequelize.query(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        { replacements: [userId] }
      );
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Require admin role
export const requireAdmin = (req, res, next) => {
  console.log('=== REQUIRE ADMIN CHECK ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('User role:', req.user.role);
  
  if (req.user.role !== 'admin') {
    console.log('User is not admin');
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('Admin check passed');
  next();
};

// Require registrar role
export const requireRegistrar = (req, res, next) => {
  console.log('=== REQUIRE REGISTRAR CHECK ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('User role:', req.user.role);
  
  if (req.user.role !== 'registrar') {
    console.log('User is not registrar');
    return res.status(403).json({ error: 'Registrar access required' });
  }
  
  console.log('Registrar check passed');
  next();
};

// Require admin or registrar role
export const requireAdminOrRegistrar = (req, res, next) => {
  console.log('=== REQUIRE ADMIN OR REGISTRAR CHECK ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('User role:', req.user.role);
  
  if (req.user.role !== 'admin' && req.user.role !== 'registrar') {
    console.log('User is neither admin nor registrar');
    return res.status(403).json({ error: 'Admin or Registrar access required' });
  }
  
  console.log('Admin or Registrar check passed');
  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'emc-secret-key-2025', async (err, decoded) => {
      if (err) {
        return next();
      }
      
      // Support both 'id' and 'userId' in token for backwards compatibility
      const userId = decoded.userId || decoded.id;
      
      const [[user]] = await sequelize.query(
        'SELECT id, email, name, role FROM users WHERE id = ?',
        { replacements: [userId] }
      );
      
      if (user) {
        req.user = user;
      }
      
      next();
    });
  } catch (error) {
    next();
  }
};
