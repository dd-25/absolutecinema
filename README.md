# 🎬 Movie Booking System

A full-stack movie booking application built with **Node.js/Express** (Backend) and **React** (Frontend). This system allows users to browse movies, select seats, and book tickets, while providing administrators with complete CRUD operations for managing the cinema ecosystem.

## 🚀 Features

### User Features
- **Browse Movies & Cinemas**: View available movies and cinema locations
- **Seat Selection**: Interactive seat map with real-time availability
- **Secure Booking**: JWT-based authentication and booking system
- **Booking History**: View past and upcoming bookings
- **Contact Integration**: Auto-fill contact details from user profile

### Admin Features
- **Complete CRUD Operations**: Manage movies, cinemas, screens, and shows
- **Real-time Analytics**: Monitor bookings and seat occupancy
- **User Management**: View and manage user accounts
- **Show Scheduling**: Create and manage movie showtimes

### Technical Features
- **Prevent Double Booking**: Atomic transactions prevent seat conflicts
- **Temporary Seat Locking**: Seats locked during booking process
- **Responsive Design**: Works on desktop and mobile devices
- **Data Consistency**: Real-time synchronization between frontend and backend

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **JWT** Authentication
- **bcryptjs** Password Hashing
- **CORS** enabled for cross-origin requests

### Frontend
- **React** with **React Router DOM**
- **Axios** for API communication
- **Context API** for state management
- **CSS3** for styling

## 📁 Project Structure

```
movie-booking-system/
├── backend/
│   ├── controllers/          # Business logic
│   ├── models/              # Database schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Authentication & validation
│   ├── config/              # Database configuration
│   └── server.js            # Main server file
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/          # Route components
    │   ├── contexts/       # React Context providers
    │   ├── services/       # API service layer
    │   └── App.jsx         # Main application component
    └── public/
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd movie-booking-system/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the backend directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
```

4. **Start the backend server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the frontend development server**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/users/register` | User registration | No |
| POST | `/users/login` | User login | No |
| GET | `/users/profile` | Get user profile | Yes |
| PUT | `/users/profile` | Update user profile | Yes |

### Movie Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/movies` | Get all movies | No | No |
| GET | `/movies/:id` | Get movie by ID | No | No |
| POST | `/movies` | Create new movie | Yes | Yes |
| PUT | `/movies/:id` | Update movie | Yes | Yes |
| DELETE | `/movies/:id` | Delete movie | Yes | Yes |

### Cinema Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/cinemas` | Get all cinemas | No | No |
| GET | `/cinemas/:id` | Get cinema by ID | No | No |
| POST | `/cinemas` | Create new cinema | Yes | Yes |
| PUT | `/cinemas/:id` | Update cinema | Yes | Yes |
| DELETE | `/cinemas/:id` | Delete cinema | Yes | Yes |

### Show Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/shows` | Get all shows | No | No |
| GET | `/shows/:id` | Get show by ID | No | No |
| GET | `/shows/:id/seats` | Get seat layout for show | No | No |
| POST | `/shows` | Create new show | Yes | Yes |
| PUT | `/shows/:id` | Update show | Yes | Yes |
| DELETE | `/shows/:id` | Delete show | Yes | Yes |
| POST | `/shows/:id/lock-seats` | Lock seats temporarily | Yes | No |
| POST | `/shows/:id/release-seats` | Release locked seats | Yes | No |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create new booking | Yes |
| GET | `/bookings/my-bookings` | Get user's bookings | Yes |
| GET | `/bookings/:id` | Get booking by ID | Yes |
| PUT | `/bookings/:id/cancel` | Cancel booking | Yes |
| GET | `/bookings` | Get all bookings | Yes (Admin) |

## 🌐 Frontend Routes

| Route | Component | Description | Auth Required | Admin Only |
|-------|-----------|-------------|---------------|------------|
| `/` | Home | Landing page with movies/cinemas | No | No |
| `/login` | Login | User authentication | No | No |
| `/register` | Register | User registration | No | No |
| `/cinema/:cinemaId` | CinemaDetails | Cinema information and shows | No | No |
| `/show/:showId/seats` | SeatSelection | Seat selection and booking | Yes | No |
| `/booking/:bookingId/confirmation` | BookingConfirmation | Booking success page | Yes | No |
| `/bookings` | BookingHistory | User's booking history | Yes | No |
| `/admin` | AdminPanel | Admin dashboard | Yes | Yes |

## 🔒 Authentication

The system uses **JWT (JSON Web Tokens)** for authentication:

1. **Registration/Login**: User provides credentials
2. **Token Generation**: Server generates JWT token
3. **Token Storage**: Frontend stores token in localStorage
4. **API Requests**: Token sent in Authorization header
5. **Token Validation**: Server validates token for protected routes

### Token Format
```
Authorization: Bearer <jwt_token>
```

## 📊 Data Models

### User Schema
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String (required),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin']),
  isActive: Boolean (default: true)
}
```

### Movie Schema
```javascript
{
  title: String (required),
  description: String,
  duration: Number (required, in minutes),
  genre: [String] (required),
  language: String (required),
  rating: Number (0-10),
  director: String,
  cast: [String],
  poster: String (URL),
  trailer: String (URL),
  releaseDate: Date,
  isActive: Boolean (default: true)
}
```

### Cinema Schema
```javascript
{
  name: String (required),
  location: String (required),
  address: String (required),
  phone: String,
  screens: [ObjectId] (ref: Screen),
  amenities: [String],
  isActive: Boolean (default: true)
}
```

### Show Schema
```javascript
{
  movie: ObjectId (ref: Movie, required),
  cinema: ObjectId (ref: Cinema, required),
  screen: ObjectId (ref: Screen, required),
  showDate: Date (required),
  showTime: String (required),
  endTime: String,
  pricing: {
    regular: Number (required),
    premium: Number,
    vip: Number
  },
  availableSeats: Number,
  bookedSeats: [SeatSchema],
  showStatus: String (enum: ['scheduled', 'running', 'completed', 'cancelled']),
  isActive: Boolean (default: true)
}
```

### Booking Schema
```javascript
{
  user: ObjectId (ref: User, required),
  show: ObjectId (ref: Show, required),
  cinema: ObjectId (ref: Cinema, required),
  movie: ObjectId (ref: Movie, required),
  seats: [SeatSchema] (required),
  totalAmount: Number (required),
  bookingReference: String (unique),
  contactDetails: {
    name: String (required),
    email: String (required),
    phone: String (required)
  },
  bookingStatus: String (enum: ['pending', 'confirmed', 'cancelled']),
  paymentStatus: String (enum: ['pending', 'completed', 'failed']),
  bookingDate: Date (default: now)
}
```

## 🚦 API Response Format

### Success Response
```javascript
{
  "success": true,
  "data": <response_data>,
  "message": "Operation completed successfully"
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": <error_details> // Only in development
}
```

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

### Code Linting
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build
```

## 🌟 Key Features Implementation

### Seat Locking Mechanism
- Temporary locks prevent race conditions during booking
- Locks automatically expire after 10 minutes
- Real-time seat availability updates

### Double Booking Prevention
- Database-level constraints prevent conflicts
- Atomic transactions ensure data consistency
- Duplicate booking validation per user/show

### Admin Panel Features
- Complete CRUD operations for all entities
- Real-time data updates
- Bulk operations support
- Analytics dashboard

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find and kill process using port
   lsof -ti:5000 | xargs kill -9
   ```

2. **MongoDB Connection Issues**
   - Check MongoDB service is running
   - Verify connection string in .env
   - Ensure network access for MongoDB Atlas

3. **CORS Issues**
   - Verify CLIENT_URL in backend .env
   - Check API base URL in frontend

4. **Authentication Issues**
   - Clear localStorage and retry
   - Check token expiry
   - Verify JWT_SECRET consistency