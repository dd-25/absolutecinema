const { Movie, Show } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
const getMovies = asyncHandler(async (req, res) => {
  const { 
    search, 
    genre, 
    language, 
    rating, 
    nowShowing,
    sortBy = 'releaseDate',
    sortOrder = 'desc',
    page = 1,
    limit = 20 
  } = req.query;

  let query = { isActive: true };

  if (nowShowing === 'true') {
    query.isNowShowing = true;
  }

  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { 'cast.name': new RegExp(search, 'i') }
    ];
  }

  if (genre) {
    query.genre = { $in: genre.split(',') };
  }

  if (language) {
    query.language = { $in: language.split(',') };
  }

  if (rating) {
    query.rating = rating;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * limitNum;

  const total = await Movie.countDocuments(query);
  
  const movies = await Movie.find(query)
    .sort(sort)
    .skip(startIndex)
    .limit(limitNum);

  // Pagination result
  const pagination = {};
  
  if (startIndex + limitNum < total) {
    pagination.next = pageNum + 1;
  }
  
  if (startIndex > 0) {
    pagination.prev = pageNum - 1;
  }

  res.json({
    success: true,
    count: movies.length,
    total,
    pagination,
    data: movies
  });
});

// @desc    Get single movie
// @route   GET /api/movies/:id
// @access  Public
const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found'
    });
  }

  res.json({
    success: true,
    data: movie
  });
});

// @desc    Create movie
// @route   POST /api/movies
// @access  Private (Admin only)
const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);

  res.status(201).json({
    success: true,
    data: movie,
    message: 'Movie created successfully'
  });
});

// @desc    Update movie
// @route   PUT /api/movies/:id
// @access  Private (Admin only)
const updateMovie = asyncHandler(async (req, res) => {
  let movie = await Movie.findById(req.params.id);

  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found'
    });
  }

  movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    data: movie,
    message: 'Movie updated successfully'
  });
});

// @desc    Delete movie
// @route   DELETE /api/movies/:id
// @access  Private (Admin only)
const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) {
    return res.status(404).json({
      success: false,
      message: 'Movie not found'
    });
  }

  // Soft delete
  movie.isActive = false;
  await movie.save();

  res.json({
    success: true,
    message: 'Movie deleted successfully'
  });
});

// @desc    Get movie shows
// @route   GET /api/movies/:id/shows
// @access  Public
const getMovieShows = asyncHandler(async (req, res) => {
  const { date, cinema } = req.query;
  
  let query = { 
    movie: req.params.id, 
    isActive: true 
  };

  if (date) {
    const showDate = new Date(date);
    query.showDate = {
      $gte: new Date(showDate.setHours(0, 0, 0, 0)),
      $lt: new Date(showDate.setHours(23, 59, 59, 999))
    };
  }

  if (cinema) {
    query.cinema = cinema;
  }

  const shows = await Show.find(query)
    .populate('cinema', 'name location')
    .populate('screen', 'name screenType')
    .sort({ showDate: 1, showTime: 1 });

  res.json({
    success: true,
    count: shows.length,
    data: shows
  });
});

module.exports = {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieShows
};
