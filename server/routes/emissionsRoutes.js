const express = require('express');
const router = express.Router();
const { 
  getEmissions, 
  getEmissionById, 
  createEmission, 
  deleteEmission 
} = require('../controllers/emissionsController');
const { protect } = require('../middleware/authMiddleware');

// All routes in this file are protected by authentication
router.use(protect);

// @route   GET /api/emissions
// @desc    Get all emissions for a user
// @access  Private
router.get('/', getEmissions);

// @route   GET /api/emissions/:id
// @desc    Get a single emission by ID
// @access  Private
router.get('/:id', getEmissionById);

// @route   POST /api/emissions
// @desc    Create a new emission calculation
// @access  Private
router.post('/', createEmission);

// @route   DELETE /api/emissions/:id
// @desc    Delete an emission calculation
// @access  Private
router.delete('/:id', deleteEmission);

module.exports = router; 