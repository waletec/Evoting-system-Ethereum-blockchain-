const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Middleware to check if admin is authenticated
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.adminToken ||
                  req.session?.adminToken;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please login to continue.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or inactive admin account.' 
      });
    }

    // Check if admin has been inactive for more than 30 minutes
    const lastActivity = admin.lastActivity || admin.createdAt;
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (Date.now() - lastActivity.getTime() > inactiveThreshold) {
      // Mark admin as inactive
      admin.isActive = false;
      await admin.save();
      
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired due to inactivity. Please login again.' 
      });
    }

    // Update last activity
    admin.lastActivity = new Date();
    await admin.save();

    // Add admin info to request
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please login again.' 
    });
  }
};

// Middleware to check if admin is super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!req.admin.isSuperAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Super admin access required.' 
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error.' 
    });
  }
};

module.exports = {
  requireAuth,
  requireSuperAdmin
}; 