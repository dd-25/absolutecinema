const express = require('express');
const {
  createBooking,
  confirmBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  getAllBookings
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.route('/')
  .post(protect, createBooking)
  .get(protect, admin, getAllBookings);

router.get('/my-bookings', protect, getUserBookings);

router.route('/:id')
  .get(protect, getBooking);

router.put('/:id/confirm', protect, confirmBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;

