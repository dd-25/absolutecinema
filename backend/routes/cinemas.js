const express = require('express');
const {
  getCinemas,
  getCinema,
  createCinema,
  updateCinema,
  deleteCinema,
  getCinemaScreens
} = require('../controllers/cinemaController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/cinemas:
 *   get:
 *     summary: Get all cinemas
 *     tags: [Cinemas]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter cinemas by city
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of cinemas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *   post:
 *     summary: Create a new cinema (Admin only)
 *     tags: [Cinemas]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cinema'
 *     responses:
 *       201:
 *         description: Cinema created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.route('/')
  .get(getCinemas)
  .post(protect, admin, createCinema);

/**
 * @swagger
 * /api/cinemas/{id}:
 *   get:
 *     summary: Get cinema by ID
 *     tags: [Cinemas]
 *     parameters:
 *       - in: path
{