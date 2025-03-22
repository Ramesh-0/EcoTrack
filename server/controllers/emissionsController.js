const Emission = require('../models/Emission');

/**
 * @desc    Get all emissions for a user
 * @route   GET /api/emissions
 * @access  Private
 */
exports.getEmissions = async (req, res) => {
  try {
    const emissions = await Emission.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json(emissions);
  } catch (error) {
    console.error('Error in getEmissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get a single emission by ID
 * @route   GET /api/emissions/:id
 * @access  Private
 */
exports.getEmissionById = async (req, res) => {
  try {
    const emission = await Emission.findById(req.params.id);
    
    if (!emission) {
      return res.status(404).json({ message: 'Emission not found' });
    }
    
    // Check if emission belongs to logged in user
    if (emission.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.status(200).json(emission);
  } catch (error) {
    console.error('Error in getEmissionById:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Emission not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create a new emission calculation
 * @route   POST /api/emissions
 * @access  Private
 */
exports.createEmission = async (req, res) => {
  try {
    const { calculationType, input, result } = req.body;
    
    // Validate required fields
    if (!calculationType || !input || !result) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    const newEmission = new Emission({
      user: req.user.id,
      calculationType,
      input,
      result
    });
    
    const savedEmission = await newEmission.save();
    
    res.status(201).json(savedEmission);
  } catch (error) {
    console.error('Error in createEmission:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete an emission calculation
 * @route   DELETE /api/emissions/:id
 * @access  Private
 */
exports.deleteEmission = async (req, res) => {
  try {
    const emission = await Emission.findById(req.params.id);
    
    if (!emission) {
      return res.status(404).json({ message: 'Emission not found' });
    }
    
    // Check if emission belongs to logged in user
    if (emission.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await emission.remove();
    
    res.status(200).json({ message: 'Emission calculation deleted' });
  } catch (error) {
    console.error('Error in deleteEmission:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Emission not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
}; 