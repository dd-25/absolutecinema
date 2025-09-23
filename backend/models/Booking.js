const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must have a user']
  },
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: [true, 'Booking must have a show']
  },
  cinema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cinema',
    required: [true, 'Booking must have a cinema']
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Booking must have a movie']
  },
  seats: [{
    row: {
      type: Number,
      required: true,
      min: 1
    },
    column: {
      type: Number,
      required: true,
      min: 1
    },
    seatNumber: {
      type: String,
      required: true
    },
    seatType: {
      type: String,
      enum: ['regular', 'premium'],
      default: 'regular'
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  bookingStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'expired'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
      default: 'card'
    },
    paidAt: Date
  },
  contactDetails: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    }
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true
  },
  // `expiresAt` can optionally record a planned expiry time, but we no
  // longer rely on DB TTL to delete bookings. Bookings are retained and
  // their `bookingStatus` is set to 'expired' when appropriate (for
  // example when the related show completes).
  expiresAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingReference = `BKG${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for show details
bookingSchema.virtual('showDetails', {
  ref: 'Show',
  localField: 'show',
  foreignField: '_id',
  justOne: true
});

// Create indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ bookingStatus: 1 });

// Method to calculate total amount
bookingSchema.methods.calculateTotalAmount = function() {
  return this.seats.reduce((total, seat) => total + seat.price, 0);
};

// Method to check if booking is expired
bookingSchema.methods.isExpired = function() {
  return this.bookingStatus === 'pending' && new Date() > this.expiresAt;
};

module.exports = mongoose.model('Booking', bookingSchema);