const Candidate = require('../models/Candidate');

// Get all candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      candidates
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new candidate
exports.createCandidate = async (req, res) => {
  try {
    const { fullName, email, phone, matricNumber, position, department, image, agreedToRules } = req.body;

    // Validation
    if (!fullName || !email || !matricNumber || !position) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, matric number, and position are required'
      });
    }

    // Check if matric number already exists
    const existingCandidate = await Candidate.findOne({ matricNumber, isActive: true });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'A candidate with this matric number already exists'
      });
    }

    // Create new candidate
    const newCandidate = new Candidate({
      fullName,
      email,
      phone,
      matricNumber,
      position,
      department,
      image,
      agreedToRules: agreedToRules || false
    });

    await newCandidate.save();

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      candidate: newCandidate.toPublicJSON()
    });

  } catch (error) {
    console.error('Create candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update candidate
exports.updateCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const updateData = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if matric number already exists (if changed)
    if (updateData.matricNumber && updateData.matricNumber !== candidate.matricNumber) {
      const existingCandidate = await Candidate.findOne({ 
        matricNumber: updateData.matricNumber, 
        _id: { $ne: candidateId },
        isActive: true 
      });
      if (existingCandidate) {
        return res.status(400).json({
          success: false,
          message: 'A candidate with this matric number already exists'
        });
      }
    }

    // Update candidate
    Object.assign(candidate, updateData);
    await candidate.save();

    res.json({
      success: true,
      message: 'Candidate updated successfully',
      candidate: candidate.toPublicJSON()
    });

  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete candidate (soft delete)
exports.deleteCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.isActive = false;
    await candidate.save();

    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete all candidates (for reset system)
exports.deleteAllCandidates = async (req, res) => {
  try {
    await Candidate.updateMany({}, { isActive: false });

    res.json({
      success: true,
      message: 'All candidates deleted successfully'
    });

  } catch (error) {
    console.error('Delete all candidates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 