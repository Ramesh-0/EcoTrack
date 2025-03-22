const mongoose = require('mongoose');

const EmissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calculationType: {
    type: String,
    required: true,
    enum: ['electricity', 'transportation', 'water', 'waste']
  },
  input: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    country: String,
    vehicleType: String,
    notes: String
  },
  result: {
    co2e: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    calculation: String,
    source: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Emission', EmissionSchema); 