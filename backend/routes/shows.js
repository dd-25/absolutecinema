const express = require('express');
const {
  getShows,
  getShow,
  getShowSeats,
  createShow,
  updateShow,
  deleteShow,
  lockSeats,
  releaseSeats
} = require('../controllers/showController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.route('/')
  .get(getShows)
  .post(protect, admin, createShow);

router.route('/:id')
  .get(getShow)
  .put(protect, admin, updateShow)
  .delete(protect, admin, deleteShow);

// Show-specific routes
router.get('/:id/seats', getShowSeats);
router.post('/:id/lock-seats', protect, lockSeats);
router.post('/:id/release-seats', protect, releaseSeats);

module.exports = router;
