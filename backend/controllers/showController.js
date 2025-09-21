const { Show, Movie, Cinema, Screen } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all shows
// @route   GET /api/shows
// @access  Public
const getShows = asyncHandler(async (req, res) => {
  const { 
    date, 
    cinema, 
    movie, 
    screen,
    page = 1,
    limit = 20
  } = req.query;

  let query = { isActive: true };

  if (date) {
    const showDate = new Date(date);
    query.showDate = {
      $gte: new Date(showDate.setHours(0, 0, 0, 0)),
      $lt: new Date(showDate.setHours(23, 59, 59, 999))
    };
  }

  if (cinema) query.cinema = cinema;
  if (movie) query.movie = movie;
  if (screen) query.screen = screen;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await Show.countDocuments(query);

  const shows = await Show.find(query)
    .populate('movie', 'title duration rating poster language genre')
    .populate('cinema', 'name location')
    .populate('screen', 'name screenType')
    .sort({ showDate: 1, showTime: 1 })
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
    count: shows.length,
    total,
    pagination,
    data: shows
  });
});

// @desc    Get single show
// @route   GET /api/shows/:id
// @access  Public
const getShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('movie')
    .populate('cinema')
    .populate('screen');

  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found'
    });
  }

  res.json({
    success: true,
    data: show
  });
});

// @desc    Get show seat layout
// @route   GET /api/shows/:id/seats
// @access  Public
const getShowSeats = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('screen', 'seatLayout')
    .populate('movie', 'title duration')
    .populate('cinema', 'name');

  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found'
    });
  }
  
  // Verify the show ID matches what was requested
  if (show._id.toString() !== req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Show ID mismatch'
    });
  }

  const { rows, columns } = show.screen.seatLayout;
  
  // Create seat layout grid
  const seatLayout = [];
  for (let row = 1; row <= rows; row++) {
    const rowSeats = [];
    for (let column = 1; column <= columns; column++) {
      const seatNumber = show.generateSeatNumber(row, column);
      const bookedSeat = show.bookedSeats.find(seat => 
        seat.row === row && seat.column === column
      );
      
      if (bookedSeat) {
      }
      
      const seatInfo = {
        row,
        column,
        seatNumber,
        isBooked: !!bookedSeat && !bookedSeat.isTemporarilyBlocked,
        isTemporarilyBlocked: bookedSeat?.isTemporarilyBlocked || false,
        blockedBy: bookedSeat?.blockedBy || null,
        blockExpiry: bookedSeat?.blockExpiry || null,
        seatType: row <= 3 ? 'premium' : 'regular', // First 3 rows are premium
        price: row <= 3 ? show.pricing.premium || show.pricing.regular : show.pricing.regular
      };
      
      rowSeats.push(seatInfo);
    }
    seatLayout.push(rowSeats);
  }

  res.json({
    success: true,
    data: {
      showId: show._id,
      showDate: show.showDate,
      showTime: show.showTime,
      totalSeats: show.screen.seatLayout.totalSeats,
      availableSeats: show.availableSeats,
      seatLayout,
      pricing: show.pricing,
      movie: {
        _id: show.movie._id,
        title: show.movie.title,
        duration: show.movie.duration
      },
      cinema: {
        _id: show.cinema._id,
        name: show.cinema.name
      }
    }
  });
});

// @desc    Create show
// @route   POST /api/shows
// @access  Private (Admin only)
const createShow = asyncHandler(async (req, res) => {
  let { movie, cinema, screen, showDate, showTime, showEndDate, isRecurring, recurringDays, pricing } = req.body;

  // Validate required fields
  if (!movie || !screen || !showDate || !showTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: movie, screen, showDate, showTime'
    });
  }

  // Ensure showDate is a proper Date object
  if (typeof showDate === 'string') {
    showDate = new Date(showDate);
  }

  // Handle end date for recurring shows
  if (showEndDate && typeof showEndDate === 'string') {
    showEndDate = new Date(showEndDate);
  }

  // If no end date provided and isRecurring is true, default to 5 days from start
  if (isRecurring && !showEndDate) {
    showEndDate = new Date(showDate);
    showEndDate.setDate(showEndDate.getDate() + 4); // 5 days total including start date
  }

  // Check if movie and screen exist, and get cinema from screen
  const movieExists = await Movie.findById(movie);
  const screenExists = await Screen.findById(screen).populate('cinema');
  
  if (!movieExists || !screenExists) {
    return res.status(400).json({
      success: false,
      message: 'Invalid movie or screen ID'
    });
  }

  // Get cinema from screen if not provided
  const cinemaId = cinema || screenExists.cinema._id;

  // Validate date range for recurring shows
  if (isRecurring && showEndDate) {
    const daysDiff = Math.ceil((showEndDate - showDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return res.status(400).json({
      success: false,
      message: 'Maximum 30 days allowed for recurring shows'
      });
    }
    if (showEndDate <= showDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
  }

  // Use screen pricing if no pricing provided
  const showPricing = pricing || screenExists.priceStructure;
  
  if (!showPricing || !showPricing.regular) {
    return res.status(400).json({
      success: false,
      message: 'Pricing information is required. Please check screen configuration.'
    });
  }

  const createdShows = [];

  if (isRecurring && showEndDate) {
    // Create multiple shows for the date range
    const currentDate = new Date(showDate);
    const endDate = new Date(showEndDate);
    
    // Create parent show first
    const parentShowData = {
      movie,
      cinema: cinemaId,
      screen,
      showDate: new Date(currentDate),
      showTime,
      showEndDate: new Date(endDate),
      isRecurring: true,
      recurringDays: recurringDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      pricing: showPricing,
      bookedSeats: [],
      availableSeats: screenExists.seatLayout?.totalSeats || 100,
      endTime: showTime
    };

    const parentShow = await Show.create(parentShowData);
    createdShows.push(parentShow);

    // Create child shows for subsequent dates
    currentDate.setDate(currentDate.getDate() + 1); // Start from next day
    
    while (currentDate <= endDate) {
      // Check for conflicting shows on this specific date and time
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      
      const conflictingShow = await Show.findOne({
        screen,
        showDate: {
          $gte: startOfDay,
          $lt: endOfDay
    },
    showTime: showTime,
    isActive: true
  });

  if (!conflictingShow) {
    const childShowData = {
      movie,
      cinema: cinemaId,
      screen,
      showDate: new Date(currentDate),
      showTime,
      showEndDate,
      isRecurring: false, // Child shows are not recurring themselves
      parentShowId: parentShow._id,
      pricing: showPricing,
      bookedSeats: [],
      availableSeats: screenExists.seatLayout?.totalSeats || 100,
      endTime: showTime
    };

    const childShow = await Show.create(childShowData);
    createdShows.push(childShow);
  }

  currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    // Check for conflicting shows for single show
    const startOfDay = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate());
    const endOfDay = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate() + 1);
    
    const conflictingShow = await Show.findOne({
      screen,
      showDate: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      showTime: showTime,
      isActive: true
    });

    if (conflictingShow) {
      return res.status(400).json({
        success: false,
        message: 'Show time conflicts with existing show'
      });
    }

    // Create single show
    const showData = {
      movie,
      cinema: cinemaId,
      screen,
      showDate,
      showTime,
      showEndDate,
      isRecurring: false,
      pricing: showPricing,
      bookedSeats: [],
      availableSeats: screenExists.seatLayout?.totalSeats || 100,
      endTime: showTime
    };

    const show = await Show.create(showData);
    createdShows.push(show);
  }

  // Populate all created shows
  const populatedShows = await Promise.all(
    createdShows.map(show => 
      Show.findById(show._id)
        .populate('movie', 'title duration')
        .populate('cinema', 'name location')
        .populate('screen', 'name screenType')
    )
  );

  res.status(201).json({
    success: true,
    data: isRecurring ? populatedShows : populatedShows[0],
    count: createdShows.length,
    message: isRecurring 
      ? `${createdShows.length} shows created successfully for the date range`
      : 'Show created successfully'
  });
});

// @desc    Update show
// @route   PUT /api/shows/:id
// @access  Private (Admin only)
const updateShow = asyncHandler(async (req, res) => {
  let show = await Show.findById(req.params.id);

  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found'
    });
  }

  show = await Show.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('movie cinema screen');

  res.json({
    success: true,
    data: show,
    message: 'Show updated successfully'
  });
});

// @desc    Delete show
// @route   DELETE /api/shows/:id
// @access  Private (Admin only)
const deleteShow = asyncHandler(async (req, res) => {
  const { deleteAll } = req.query; // Query parameter to delete all recurring shows
  const show = await Show.findById(req.params.id);

  if (!show) {
    return res.status(404).json({
      success: false,
      message: 'Show not found'
    });
  }

  let deletedCount = 1;

  if (deleteAll === 'true') {
    // Delete all shows in the recurring series
    if (show.isRecurring) {
      // This is a parent show, delete all child shows
      await Show.deleteMany({ parentShowId: show._id });
      const childCount = await Show.countDocuments({ parentShowId: show._id });
      deletedCount += childCount;
    } else if (show.parentShowId) {
      // This is a child show, delete parent and all siblings
The response is too long; only the first 200000 characters are shown. I'll continue in the next tool call.