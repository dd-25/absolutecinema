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
 * /api/cinemas/{id}:
 *   get:
 *     summary: Get cinema by ID
 *     tags: [Cinemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Cinema not found
 *   put:
 *     summary: Update cinema (Admin only)
 *     tags: [Cinemas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cinema'
 *     responses:
 *       200:
 *         description: Cinema updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Cinema not found
 *   delete:
 *     summary: Delete cinema (Admin only)
 *     tags: [Cinemas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Cinema not found
 */
router.route('/:id')
  .get(getCinema)
  .put(protect, admin, updateCinema)
  .delete(protect, admin, deleteCinema);

/**
 * @swagger
 * /api/cinemas/{id}/screens:
 *   get:
 *     summary: Get all screens for a cinema
 *     tags: [Cinemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cinema ID
 *     responses:
 *       200:
 *         description: Cinema screens retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Cinema not found
 */
router.get('/:id/screens', getCinemaScreens);

module.exports = router;