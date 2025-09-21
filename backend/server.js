const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// CORS - Enable CORS before other middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More requests in dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Handle preflight OPTIONS requests
app.options('*', cors());

// Swagger API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Movie Booking API Documentation"
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Movie Booking API is running',
    timestamp: new Date().toISOString()
  });
});

// Quick auth tokens for testing (DEVELOPMENT ONLY)
app.get('/api/dev-tokens', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  try {
    const { User } = require('./models');
    const jwt = require('jsonwebtoken');
    
    const user = await User.findOne({ email: 'user@moviebooking.com' });
    const admin = await User.findOne({ email: 'admin@moviebooking.com' });
    
    const userToken = user ? jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }) : null;
    const adminToken = admin ? jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }) : null;
    
    res.json({
      message: 'Development tokens (copy the Bearer format)',
      user: {
        email: 'user@moviebooking.com',
        token: userToken,
        bearerToken: `Bearer ${userToken}`
      },
      admin: {
        email: 'admin@moviebooking.com', 
        token: adminToken,
        bearerToken: `Bearer ${adminToken}`
      },
      instructions: [
        '1. Copy the bearerToken value',
        '2. Click Authorize button in Swagger UI',
        '3. Paste the Bearer token',
        '4. Click Authorize'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not generate tokens' });
  }
});

// Test contact validation endpoint (DEVELOPMENT ONLY)
app.post('/api/test-contact-validation', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  const { contactDetails } = req.body;
  const validation = {};
  
  if (!contactDetails) {
    return res.json({ error: 'No contact details provided' });
  }
  
  const { name, email, phone } = contactDetails;
  
  validation.name = {
    value: name,
    valid: !!(name && name.trim()),
    error: !name || !name.trim() ? 'Name is required' : null
  };
  
  validation.email = {
    value: email,
    valid: !!(email && /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)),
    error: !email ? 'Email is required' : 
           !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email) ? 'Invalid email format' : null
  };
  
  validation.phone = {
    value: phone,
    valid: !!(phone && /^[0-9]{10}$/.test(phone)),
    error: !phone ? 'Phone is required' : 
           !/^[0-9]{10}$/.test(phone) ? 'Phone must be exactly 10 digits' : null
  };
  
  validation.allValid = validation.name.valid && validation.email.valid && validation.phone.valid;
  
  res.json({
    message: 'Contact details validation result',
    validation,
    contactDetails
  });
});

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/cinemas', require('./routes/cinemas'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/shows', require('./routes/shows'));
app.use('/api/bookings', require('./routes/bookings'));

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;