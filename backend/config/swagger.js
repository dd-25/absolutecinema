const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Booking System API',
      version: '1.0.0',
      description: 'A comprehensive movie booking system API with user authentication, cinema management, movie listings, show scheduling, and ticket booking functionality.',
      contact: {
        name: 'API Support',
        email: 'support@moviebooking.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Cinema: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                pincode: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' }
                  }
                }
              }
            },
            facilities: { type: 'array', items: { type: 'string' } },
            contact: {
              type: 'object',
              properties: {
                phone: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        },
        Movie: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            genre: { type: 'array', items: { type: 'string' } },
            language: { type: 'array', items: { type: 'string' } },
            duration: { type: 'number' },
            rating: { type: 'string' },
            releaseDate: { type: 'string', format: 'date' },
            cast: { type: 'array', items: { type: 'object' } },
            poster: { type: 'object' },
            trailer: { type: 'object' },
            imdbRating: { type: 'number' },
            isNowShowing: { type: 'boolean' }
          }
        },
        Screen: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            cinema: { type: 'string' },
            screenType: { type: 'string' },
            seatLayout: { type: 'object' },
            priceStructure: { type: 'object' }
          }
        },
        Show: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            movie: { type: 'string' },
            cinema: { type: 'string' },
            screen: { type: 'string' },
            showDate: { type: 'string', format: 'date' },
            showTime: { type: 'string' },
            endTime: { type: 'string' },
            pricing: { type: 'object' },
            availableSeats: { type: 'number' },
            bookedSeats: { type: 'array', items: { type: 'string' } }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            show: { type: 'string' },
            seats: { type: 'array', items: { type: 'string' } },
            totalAmount: { type: 'number' },
            bookingStatus: { type: 'string' },
            paymentStatus: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = specs;