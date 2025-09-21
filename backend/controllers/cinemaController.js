const { Cinema, Screen } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all cinemas
// @route   GET /api/cinemas
// @access  Public
const getCinemas = asyncHandler(async (req, res) => {
  const { city, search } = req.query;
  
  let query = { isActive: true };
  
  if (city) {
    query['location.city'] = new RegExp(city, 'i');
  }
  
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { 'location.address': new RegExp(search, 'i') }
    ];
  }

  const cinemas = await Cinema.find(query)
    .populate('screens')
    .sort({ name: 1 });

  res.json({
    success: true,
    count: cinemas.length,
    data: cinemas
  });
});

// @desc    Get single cinema
// @route   GET /api/cinemas/:id
// @access  Public
const getCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id)
    .populate('screens');

  if (!cinema) {
    return res.status(404).json({
      success: false,
      message: 'Cinema not found'
    });
  }

  res.json({
    success: true,
    data: cinema
  });
});

// @desc    Create cinema
// @route   POST /api/cinemas
// @access  Private (Admin only)
const createCinema = asyncHandler(async (req, res) => {
  const { screens, ...cinemaData } = req.body;
  
  // Create cinema first
  const cinema = await Cinema.create(cinemaData);

  // Create screens if provided
  if (screens && Array.isArray(screens) && screens.length > 0) {
    const screenPromises = screens.map(screenData => {
      // Ensure totalSeats is calculated properly
      const processedScreenData = { ...screenData };
      if (processedScreenData.seatLayout && 
          processedScreenData.seatLayout.rows && 
          processedScreenData.seatLayout.columns) {
        processedScreenData.seatLayout.totalSeats = 
          processedScreenData.seatLayout.rows * processedScreenData.seatLayout.columns;
      }
      
      return Screen.create({
        ...processedScreenData,
        cinema: cinema._id
      });
    });
    
    await Promise.all(screenPromises);
  }

  // Fetch created cinema with populated screens
  const populatedCinema = await Cinema.findById(cinema._id).populate('screens');

  res.status(201).json({
    success: true,
    data: populatedCinema,
    message: 'Cinema created successfully'
  });
});

// @desc    Update cinema
// @route   PUT /api/cinemas/:id
// @access  Private (Admin only)
const updateCinema = asyncHandler(async (req, res) => {
  let cinema = await Cinema.findById(req.params.id);

  if (!cinema) {
    return res.status(404).json({
      success: false,
      message: 'Cinema not found'
    });
  }

  const { screens, ...cinemaData } = req.body;

  // Update cinema data
  cinema = await Cinema.findByIdAndUpdate(req.params.id, cinemaData, {
    new: true,
    runValidators: true
  });

  // Handle screens update if provided
  if (screens && Array.isArray(screens)) {
    // Get existing screens
    const existingScreens = await Screen.find({ cinema: req.params.id });
    
    // Delete existing screens that are not in the new screens array
    const screenIdsToKeep = screens
      .filter(screen => screen._id)
      .map(screen => screen._id);
    
    await Screen.deleteMany({
      cinema: req.params.id,
      _id: { $nin: screenIdsToKeep }
    });
    
    // Update existing screens and create new ones
    const screenPromises = screens.map(async (screenData) => {
      // Ensure totalSeats is calculated properly
      const processedScreenData = { ...screenData };
      if (processedScreenData.seatLayout && 
          processedScreenData.seatLayout.rows && 
          processedScreenData.seatLayout.columns) {
        processedScreenData.seatLayout.totalSeats = 
          processedScreenData.seatLayout.rows * processedScreenData.seatLayout.columns;
      }
      
      if (screenData._id) {
        // Update existing screen
        return Screen.findByIdAndUpdate(screenData._id, {
          ...processedScreenData,
          cinema: req.params.id
        }, { new: true, runValidators: true });
      } else {
        // Create new screen
        return Screen.create({
          ...processedScreenData,
          cinema: req.params.id
        });
      }
    });
    
    await Promise.all(screenPromises);
  }

  // Fetch updated cinema with populated screens
  const populatedCinema = await Cinema.findById(cinema._id).populate('screens');

  res.json({
    success: true,
    data: populatedCinema,
    message: 'Cinema updated successfully'
  });
});

// @desc    Delete cinema
// @route   DELETE /api/cinemas/:id
// @access  Private (Admin only)
const deleteCinema = asyncHandler(async (req, res) => {
  const cinema = await Cinema.findById(req.params.id);

  if (!cinema) {
    return res.status(404).json({
      success: false,
      message: 'Cinema not found'
    });
  }

  // Soft delete by setting isActive to false for both cinema and its screens
  cinema.isActive = false;
  await cinema.save();
  
  // Also deactivate all screens of this cinema
  await Screen.updateMany(
    { cinema: req.params.id },
    { isActive: false }
  );

  res.json({
    success: true,
    message: 'Cinema deleted successfully'
  });
});

// @desc    Get cinema screens
// @route   GET /api/cinemas/:id/screens
// @access  Public
const getCinemaScreens = asyncHandler(async (req, res) => {
  const screens = await Screen.find({ 
    cinema: req.params.id, 
    isActive: true 
  }).populate('cinema');

  res.json({
    success: true,
    count: screens.length,
    data: screens
  });
});

module.exports = {
  getCinemas,
  getCinema,
  createCinema,
  updateCinema,
  deleteCinema,
  getCinemaScreens
};
