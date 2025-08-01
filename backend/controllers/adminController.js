const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Admin Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin by username
    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Return admin data (without password)
    res.json({
      success: true,
      message: 'Login successful',
      admin: admin.toPublicJSON()
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new admin (super admin only)
exports.createAdmin = async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;

    // Validation
    if (!username || !password || !email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if username already exists
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      username,
      password,
      email,
      fullName,
      role: role || 'admin'
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: newAdmin.toPublicJSON()
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all admins (super admin only)
exports.getAllAdmins = async (req, res) => {
  try {
    // Only return active admins (exclude deactivated ones)
    const admins = await Admin.find({ isActive: true }, '-password');
    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset admin password
exports.resetPassword = async (req, res) => {
  try {
    const { adminId, newPassword } = req.body;

    if (!adminId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID and new password are required'
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change admin password (for logged-in admin)
exports.changePassword = async (req, res) => {
  try {
    const { adminId, currentPassword, newPassword } = req.body;

    if (!adminId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { username, email, fullName, role, password } = req.body;

    // Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if username already exists (if changed)
    if (username && username !== admin.username) {
      const existingUsername = await Admin.findOne({ username, _id: { $ne: adminId } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check if email already exists (if changed)
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ email, _id: { $ne: adminId } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update fields
    if (username) admin.username = username;
    if (email) admin.email = email;
    if (fullName) admin.fullName = fullName;
    if (role) admin.role = role;

    // Update password if provided
    if (password && password.trim() !== '') {
      admin.password = password;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin: admin.toPublicJSON()
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Deactivate admin (soft delete)
exports.deactivateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.isActive = false;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete admin (permanent delete)
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent deleting the last super admin
    if (admin.role === 'super_admin') {
      const superAdminCount = await Admin.countDocuments({ role: 'super_admin', isActive: true });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last super admin'
        });
      }
    }

    // Permanently delete the admin
    await Admin.findByIdAndDelete(adminId);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Deactivate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Initialize default super admin
exports.initializeSuperAdmin = async (req, res) => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Super admin already exists'
      });
    }

    // Create default super admin
    const superAdmin = new Admin({
      username: 'superadmin',
      password: 'superadmin123',
      email: 'superadmin@votingsystem.com',
      fullName: 'Super Administrator',
      role: 'super_admin'
    });

    await superAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Super admin initialized successfully',
      admin: superAdmin.toPublicJSON()
    });

  } catch (error) {
    console.error('Initialize super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 