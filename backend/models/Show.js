const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Show must have a movie']
  },
  cinema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cinema',
    required: [true, 'Show must have a cinema']
  },
  screen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screen',
    required: [true, 'Show must have a screen']
  },
  showDate: {
    type: Date,
    required: [true, 'Please provide show date']
  },
  showTime: {
    type: String,
    required: [true, 'Please provide show time'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  // New fields for show scheduling
  showEndDate: {
    type: Date,
    default: null // If null, it's a single show
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: {
    type: [String],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  parentShowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    default: null // For recurring shows, this points to the original show
  },
  endTime: {
    type: String,
    default: ''
  },
  pricing: {
    regular: {
      type: Number,
      required: true,
      min: [50, 'Minimum price should be ₹50']
    },
    premium: {
      type: Number,
      min: [50, 'Minimum price should be ₹50']
    }
  },
  availableSeats: {
    type: Number,
    default: 0
  },
  bookedSeats: [{
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
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    isTemporarilyBlocked: {
      type: Boolean,
      default: false
    },
    blockedAt: Date,
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    blockExpiry: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      }
    }
  }],
  showStatus: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
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

// Pre-save middleware to calculate end time and available seats
showSchema.pre('save', async function(next) {
  try {
    // Always calculate end time if movie and showTime exist
    if (this.movie && this.showTime && (this.isNew || this.isModified('showTime') || this.isModified('movie'))) {
      const Movie = mongoose.model('Movie');
      const movie = await Movie.findById(this.movie);
      
      if (movie && movie.duration) {
        const [hours, minutes] = this.showTime.split(':').map(Number);
        const showStart = new Date();
        showStart.setHours(hours, minutes, 0, 0);
        
        const showEnd = new Date(showStart.getTime() + movie.duration * 60000); // Add duration in milliseconds
        this.endTime = `${showEnd.getHours().toString().padStart(2, '0')}:${showEnd.getMinutes().toString().padStart(2, '0')}`;
      } else {
        // Default endTime if movie duration not found
        this.endTime = this.showTime;
      }
    }
    
    // Always calculate available seats if screen exists
    if (this.screen && (this.isNew || this.isModified('screen') || this.isModified('bookedSeats'))) {
      const Screen = mongoose.model('Screen');
      const screen = await Screen.findById(this.screen);
      
      if (screen && screen.seatLayout && screen.seatLayout.totalSeats) {
        this.availableSeats = screen.seatLayout.totalSeats - (this.bookedSeats?.length || 0);
      } else {
        // Default available seats if screen not found
        this.availableSeats = 100;
      }
    }
    
    // Ensure bookedSeats is always an array
    if (!this.bookedSeats) {
      this.bookedSeats = [];
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to generate seat number (e.g., A1, B5, etc.)
showSchema.methods.generateSeatNumber = function(row, column) {
  const rowLetter = String.fromCharCode(64 + row); // A=1, B=2, etc.
  return `${rowLetter}${column}`;
};

// Method to check if seat is available
showSchema.methods.isSeatAvailable = function(row, column) {
  return !this.bookedSeats.some(seat => 
    seat.row === row && seat.column === column
  );
};

// Virtual populate for bookings
showSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'show',
  justOne: false
});

// Create compound indexes
showSchema.index({ cinema: 1, screen: 1, showDate: 1, showTime: 1 }, { unique: true });
showSchema.index({ movie: 1, showDate: 1 });
showSchema.index({ showDate: 1, showTime: 1 });
showSchema.index({ showDate: 1, cinema: 1 });
showSchema.index({ showStatus: 1, showDate: 1 });
showSchema.index({ parentShowId: 1 }); // For recurring shows
showSchema.index({ isRecurring: 1, showDate: 1 }); // For series management

module.exports = mongoose.model('Show', showSchema);