const { Booking, Show, User } = require('../models');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { showId, seats, contactDetails } = req.body;

  if (!seats || seats.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please select at least one seat'
    });
  }
  
  if (seats.length > 6) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 6 seats can be booked at once'
    });
  }

  // Start a MongoDB session for atomic transaction
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      // Get show details with session for consistent read and locking

      const show = await Show.findById(showId)
        .populate('movie', 'title duration')
        .populate('cinema', 'name')
        .populate('screen', 'seatLayout')
        .session(session);

      if (!show) {
        throw new Error('Show not found');
      }



      // Check if show date is in the past
      const now = new Date();
      const showDateTime = new Date(show.showDate);
      const [hours, minutes] = show.showTime.split(':');
      showDateTime.setHours(parseInt(hours), parseInt(minutes));

      if (showDateTime < now) {

        throw new Error('Cannot book tickets for past shows');
      }
      


      // Check for duplicate booking by same user for same show
      const existingBooking = await Booking.findOne({
        user: req.user.id,
        show: showId,
        bookingStatus: { $in: ['confirmed', 'pending'] }
      }).session(session);

      if (existingBooking) {
        // Check if any of the requested seats overlap with existing booking
        const requestedSeatKeys = seats.map(s => `${s.row}-${s.column}`);
        const bookedSeatKeys = existingBooking.seats.map(s => `${s.row}-${s.column}`);
        const overlap = requestedSeatKeys.some(seat => bookedSeatKeys.includes(seat));
        
        if (overlap) {
          throw new Error('You have already booked seats for this show');
        }
      }

      // Check if seats are available (within transaction for consistency)
      const unavailableSeats = [];
      const seatDetails = [];
      let totalAmount = 0;

      for (const seat of seats) {
        const { row, column } = seat;
        
        // Check if seat exists in screen layout
        if (row > show.screen.seatLayout.rows || column > show.screen.seatLayout.columns) {
          throw new Error(`Invalid seat position: ${row},${column}`);
        }

        // Check if seat is already booked (atomic check within transaction)


        
        const existingSeat = show.bookedSeats.find(seat => 
          seat.row === row && seat.column === column
        );
        
        if (existingSeat) {
          // If seat has a bookingId, it's permanently booked (regardless of isTemporarilyBlocked)
          if (existingSeat.bookingId) {
            unavailableSeats.push(`${show.generateSeatNumber(row, column)}`);
            continue;
          }
          
          // If seat is temporarily blocked by someone else and not expired, it's unavailable
          if (existingSeat.isTemporarilyBlocked && 
              existingSeat.blockedBy && 
              existingSeat.blockedBy.toString() !== req.user._id.toString() &&
              existingSeat.blockExpiry > now) {
            unavailableSeats.push(`${show.generateSeatNumber(row, column)}`);
            continue;
          }
          
          // Seat is either blocked by current user or block has expired - AVAILABLE
        }
        // Seat is completely free - AVAILABLE

        const seatNumber = show.generateSeatNumber(row, column);
        const seatType = row <= 3 ? 'premium' : 'regular'; // First 3 rows are premium
        const price = row <= 3 ? (show.pricing.premium || show.pricing.regular) : show.pricing.regular;

        seatDetails.push({
          row,
          column,
          seatNumber,
          seatType,
          price
        });

        totalAmount += price;
      }

      if (unavailableSeats.length > 0) {
        throw new Error(`Seats ${unavailableSeats.join(', ')} are not available`);
      }

      // Validate contact details
      
      if (!contactDetails) {
        throw new Error('Contact details are required');
      }

      const { name, email, phone } = contactDetails;
      
      if (!name || !name.trim()) {
        throw new Error('Name is required');
      }

      if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        throw new Error('Please provide a valid email');
      }

      if (!phone || !/^[0-9]{10}$/.test(phone)) {
        throw new Error('Please provide a valid 10-digit phone number');
      }
      

      // Generate booking reference
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      const bookingReference = `BKG${timestamp}${random}`.toUpperCase();

      // Create booking within transaction
      // Validate required show data
      if (!show.cinema) {
        throw new Error(`Show ${showId} is missing cinema information. Show data: ${JSON.stringify(show)}`);
      }
      
      if (!show.movie) {
        throw new Error(`Show ${showId} is missing movie information. Show data: ${JSON.stringify(show)}`);
      }
      
      if (!show.screen) {
        throw new Error(`Show ${showId} is missing screen information. Show data: ${JSON.stringify(show)}`);
      }


      
      const booking = await Booking.create([{
        user: req.user.id,
        show: showId,
        cinema: show.cinema?._id,
        movie: show.movie?._id,
        seats: seatDetails,
        totalAmount,
        bookingReference,
        bookingStatus: 'confirmed',
        paymentStatus: 'completed',
        contactDetails: {
          name: contactDetails.name.trim(),
          email: contactDetails.email.trim(),
          phone: contactDetails.phone.trim()
        }
      }], { session });
      


      // Remove any existing temporary blocks for these seats by this user first
      show.bookedSeats = show.bookedSeats.filter(seat => 
        !(seats.some(s => s.row === seat.row && s.column === seat.column) && 
          seat.blockedBy?.toString() === req.user._id.toString())
      );

      // Add seats to show's booked seats as permanently booked
      for (const seat of seatDetails) {
        show.bookedSeats.push({
          row: seat.row,
          column: seat.column,
          seatNumber: seat.seatNumber,
          seatType: seat.seatType,
          bookedBy: req.user.id,
          bookingId: booking[0]._id,
          isTemporarilyBlocked: false, // Permanently booked since payment is completed
          bookedAt: new Date()
        });
      }
      


      await show.save({ session });

      return booking[0]; // Return the created booking
    }, {
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' }
    });

    // Handle transaction result - it might return operation result instead of booking
    let bookingId;
    if (result && result._id) {
      bookingId = result._id;
    } else if (result && typeof result === 'object' && result.ok) {
      // Transaction returned operation result, need to find the booking
      // Use the booking reference to find the most recent booking for this user/show
      const latestBooking = await Booking.findOne({
        user: req.user.id,
        show: showId,
        bookingReference: { $exists: true }
      }).sort({ createdAt: -1 });
      
      if (!latestBooking) {
        throw new Error('Booking was created but could not be retrieved');
      }
      bookingId = latestBooking._id;
    } else {
      throw new Error('Transaction completed but booking ID could not be determined');
    }

    // Populate booking details outside transaction
    const populatedBooking = await Booking.findById(bookingId)
      .populate('movie', 'title duration poster')
      .populate('cinema', 'name location')
      .populate('show', 'showDate showTime screen')
      .populate({
        path: 'show',
        populate: {
          path: 'screen',
          select: 'name screenType'
        }
      });

    if (!populatedBooking) {
      throw new Error('Booking was created but could not be retrieved for response');
    }

    // Ensure we always return a valid booking with ID
    const responseData = populatedBooking;
    
    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Booking created successfully!'
    });

  } catch (error) {
    console.error('Transaction failed:', error);
    
    // Handle specific error types
    if (error.message.includes('not available') || 
        error.message.includes('past show') ||
        error.message.includes('required') ||
        error.message.includes('valid') ||
        error.message.includes('Invalid seat')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Handle duplicate key errors (concurrent booking attempts)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'These seats are already booked by another user. Please select different seats.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Booking failed. Please try again.'
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Confirm booking (simulate payment)
// @route   PUT /api/bookings/:id/confirm
// @access  Private
const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking belongs to user
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to confirm this booking'
    });
  }

  // Check if booking is already confirmed or expired
  if (booking.bookingStatus === 'confirmed') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already confirmed'
    });
  }

  if (booking.isExpired()) {
    return res.status(400).json({
      success: false,
      message: 'Booking has expired'
    });
  }

  // Update booking status
  booking.bookingStatus = 'confirmed';
  booking.paymentStatus = 'completed';
  booking.paymentDetails = {
    transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
    paymentMethod: req.body.paymentMethod || 'card',
    paidAt: new Date()
  };

  await booking.save();

  // Update show seats (remove temporary block)
  const show = await Show.findById(booking.show);
  if (show) {
    show.bookedSeats = show.bookedSeats.map(seat => {
      if (seat.bookingId?.toString() === booking._id.toString()) {
        seat.isTemporarilyBlocked = false;
      }
      return seat;
    });
    await show.save();
  }

  const populatedBooking = await Booking.findById(booking._id)
    .populate('movie', 'title duration poster')
    .populate('cinema', 'name location')
    .populate('show', 'showDate showTime screen')
    .populate({
      path: 'show',
      populate: {
        path: 'screen',
        select: 'name screenType'
      }
    });

  res.json({
    success: true,
    data: populatedBooking,
    message: 'Booking confirmed successfully!'
  });
});

// @desc    Get user bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getUserBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  let query = { user: req.user.id };
  
  if (status) {
    query.bookingStatus = status;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .populate('movie', 'title duration poster rating genre')
    .populate('cinema', 'name location address')
    .populate({
      path: 'show',
      select: 'showDate showTime screen movie cinema pricing',
      populate: [
        {
          path: 'screen',
          select: 'name screenType seatLayout',
          populate: {
            path: 'cinema',
            select: 'name location address'
          }
        },
        {
          path: 'movie',
          select: 'title duration genre poster rating'
        },
        {
          path: 'cinema',
          select: 'name location address'
        }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limitNum);

  const pagination = {};
  
  if (startIndex + limitNum < total) {
    pagination.next = pageNum + 1;
  }
  
  if (startIndex > 0) {
    pagination.prev = pageNum - 1;
  }

  res.json({
    success: true,
    count: bookings.length,
    total,
    pagination,
    data: bookings
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('movie', 'title duration poster rating genre')
    .populate('cinema', 'name location')
    .populate({
      path: 'show',
      select: 'showDate showTime screen movie',
      populate: [
        {
          path: 'screen',
          select: 'name screenType',
          populate: {
            path: 'cinema',
            select: 'name location'
          }
        },
        {
          path: 'movie',
          select: 'title duration genre'
        }
      ]
    });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user owns this booking or is admin
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this booking'
    });
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user owns this booking
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking'
    });
  }

  // Check if booking can be cancelled
  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled'
    });
  }

  // Update booking status
  booking.bookingStatus = 'cancelled';
  booking.cancelledAt = new Date();
  booking.cancellationReason = req.body.reason || 'Cancelled by user';
  
  if (booking.paymentStatus === 'completed') {
    booking.paymentStatus = 'refunded';
  }

  await booking.save();

  // Remove seats from show
  const show = await Show.findById(booking.show);
  if (show) {
    show.bookedSeats = show.bookedSeats.filter(seat => 
      seat.bookingId?.toString() !== booking._id.toString()
    );
    await show.save();
  }

  res.json({
    success: true,
    data: booking,
    message: 'Booking cancelled successfully'
  });
});

// @desc    Get all bookings (Admin only)
// @route   GET /api/bookings
// @access  Private (Admin)
const getAllBookings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, cinema, movie } = req.query;

  let query = {};
  
  if (status) query.bookingStatus = status;
  if (cinema) query.cinema = cinema;
  if (movie) query.movie = movie;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await Booking.countDocuments(query);

  const bookings = await Booking.find(query)
    .populate('user', 'name email phone')
    .populate('movie', 'title')
    .populate('cinema', 'name location')
    .populate('show', 'showDate showTime')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limitNum);

  const pagination = {};
  
  if (startIndex + limitNum < total) {
    pagination.next = pageNum + 1;
  }
  
  if (startIndex > 0) {
    pagination.prev = pageNum - 1;
  }

  res.json({
    success: true,
    count: bookings.length,
    total,
    pagination,
    data: bookings
  });
});

module.exports = {
  createBooking,
  confirmBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  getAllBookings
};

