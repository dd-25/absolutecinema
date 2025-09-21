const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide screen name'],
    trim: true,
    maxlength: [50, 'Screen name cannot be more than 50 characters']
  },
  cinema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cinema',
    required: [true, 'Screen must belong to a cinema']
  },
  screenType: {
    type: String,
    enum: ['regular', '3d', 'imax', 'dolby_atmos', 'premium'],
    default: 'regular'
  },
  seatLayout: {
    rows: {
      type: Number,
      required: true,
      default: 10,
      min: [5, 'Minimum 5 rows required'],
      max: [20, 'Maximum 20 rows allowed']
    },
    columns: {
      type: Number,
      required: true,
      default: 10,
      min: [5, 'Minimum 5 columns required'],
      max: [20, 'Maximum 20 columns allowed']
    },
    totalSeats: {
      type: Number,
      default: 100
    }
  },
  priceStructure: {
    regular: {
      type: Number,
      required: true,
      min: [50, 'Minimum price should be \u20b950']
    },
    premium: {
      type: Number,
      min: [50, 'Minimum price should be \u20b950']
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

// Calculate total seats before saving
screenSchema.pre('save', function(next) {
  if (this.seatLayout && this.seatLayout.rows && this.seatLayout.columns) {
    this.seatLayout.totalSeats = this.seatLayout.rows * this.seatLayout.columns;
  }
  next();
});

// Calculate total seats before validation for updates
screenSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
  const update = this.getUpdate();
  if (update.seatLayout && update.seatLayout.rows && update.seatLayout.columns) {
    update.seatLayout.totalSeats = update.seatLayout.rows * update.seatLayout.columns;
  } else if (update.$set && update.$set.seatLayout) {
    const seatLayout = update.$set.seatLayout;
    if (seatLayout.rows && seatLayout.columns) {
      update.$set.seatLayout.totalSeats = seatLayout.rows * seatLayout.columns;
    }
  }
  next();
});

// Virtual populate for shows
screenSchema.virtual('shows', {
  ref: 'Show',
  localField: '_id',
  foreignField: 'screen',
  justOne: false
});

// Create compound index for cinema and screen name (unique within cinema)
screenSchema.index({ cinema: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Screen', screenSchema);
