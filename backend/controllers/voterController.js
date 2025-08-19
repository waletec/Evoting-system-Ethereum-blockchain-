const Voter = require('../models/Voter');
const logger = require('../utils/logger');

// Get all voters
exports.getAllVoters = async (req, res) => {
  try {
    const voters = await Voter.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      voters
    });
  } catch (error) {
    logger.error('Get voters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new voter
exports.createVoter = async (req, res) => {
  try {
    const { firstName, surname, matricNumber, department, faculty } = req.body;

    // Validation
    if (!firstName || !surname || !matricNumber) {
      return res.status(400).json({
        success: false,
        message: 'First name, surname, and matric number are required'
      });
    }

    // Check if matric number already exists
    const existingVoter = await Voter.findOne({ matricNumber, isActive: true });
    if (existingVoter) {
      return res.status(400).json({
        success: false,
        message: 'A voter with this matric number already exists'
      });
    }

    // Create new voter
    const newVoter = new Voter({
      firstName,
      surname,
      matricNumber,
      department,
      faculty
    });

    await newVoter.save();

    res.status(201).json({
      success: true,
      message: 'Voter created successfully',
      voter: newVoter.toPublicJSON()
    });

  } catch (error) {
    logger.error('Create voter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Bulk create voters (for CSV upload)
exports.bulkCreateVoters = async (req, res) => {
  try {
    const { voters } = req.body;

    if (!voters || !Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Voters array is required'
      });
    }

    const createdVoters = [];
    const errors = [];

    for (const voterData of voters) {
      try {
        // Check if voter already exists
        const existingVoter = await Voter.findOne({ 
          matricNumber: voterData.matricNumber, 
          isActive: true 
        });
        
        if (existingVoter) {
          errors.push(`Voter with matric number ${voterData.matricNumber} already exists`);
          continue;
        }

        // Create new voter
        const newVoter = new Voter({
          firstName: voterData.firstName,
          surname: voterData.surname,
          matricNumber: voterData.matricNumber,
          department: voterData.department,
          faculty: voterData.faculty
        });

        await newVoter.save();
        createdVoters.push(newVoter.toPublicJSON());
      } catch (error) {
        errors.push(`Error creating voter ${voterData.matricNumber}: ${error.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdVoters.length} voters`,
      createdVoters,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('Bulk create voters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update voter
exports.updateVoter = async (req, res) => {
  try {
    const { voterId } = req.params;
    const updateData = req.body;

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    // Check if matric number already exists (if changed)
    if (updateData.matricNumber && updateData.matricNumber !== voter.matricNumber) {
      const existingVoter = await Voter.findOne({ 
        matricNumber: updateData.matricNumber, 
        _id: { $ne: voterId },
        isActive: true 
      });
      if (existingVoter) {
        return res.status(400).json({
          success: false,
          message: 'A voter with this matric number already exists'
        });
      }
    }

    // Update voter
    Object.assign(voter, updateData);
    await voter.save();

    res.json({
      success: true,
      message: 'Voter updated successfully',
      voter: voter.toPublicJSON()
    });

  } catch (error) {
    logger.error('Update voter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete voter (soft delete)
exports.deleteVoter = async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findById(voterId);
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    voter.isActive = false;
    await voter.save();

    res.json({
      success: true,
      message: 'Voter deleted successfully'
    });

  } catch (error) {
    logger.error('Delete voter error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete all voters (for reset system)
exports.deleteAllVoters = async (req, res) => {
  try {
    await Voter.updateMany({}, { isActive: false });

    res.json({
      success: true,
      message: 'All voters deleted successfully'
    });

  } catch (error) {
    logger.error('Delete all voters error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 