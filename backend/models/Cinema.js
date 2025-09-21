const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide cinema name'],
    trim: true,
    maxlength: [100, 'Cinema name cannot be more than 100 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide cinema address'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Please provide state'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Please provide pincode'],
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  facilities: [{
    type: String,
    enum: ['parking', 'food_court', 'wheelchair_accessible', '3d', 'imax', 'dolby_atmos', 'recliner_seats']
  }],
  contact: {
    phone: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for screens
cinemaSchema.virtual('screens', {
  ref: 'Screen',
  localField: '_id',
  foreignField: 'cinema',
  justOne: false
});

// Create indexes
cinemaSchema.index({ 'location.city': 1 });
cinemaSchema.index({ 'location.pincode': 1 });
cinemaSchema.index({ name: 1 });

module.exports = mongoose.model('Cinema', cinemaSchema);
