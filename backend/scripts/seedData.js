const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Cinema, Screen, Movie, Show, User } = require('../models');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie_booking_system');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Sample data
const cinemas = [
  {
    name: 'PVR Phoenix Mall',
    location: {
      address: 'Phoenix Marketcity, Kurla West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400070',
      coordinates: { latitude: 19.0821, longitude: 72.8851 }
    },
    facilities: ['parking', 'food_court', 'wheelchair_accessible', '3d', 'dolby_atmos', 'recliner_seats'],
    contact: {
      phone: '9876543210',
      email: 'phoenix@pvr.com'
    }
  },
  {
    name: 'INOX GVK One Mall',
    location: {
      address: 'GVK One Mall, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      coordinates: { latitude: 17.4239, longitude: 78.4738 }
    },
    facilities: ['parking', 'food_court', '3d', 'imax', 'dolby_atmos'],
    contact: {
      phone: '9876543211',
      email: 'gvkone@inox.com'
    }
  },
  {
    name: 'Cinepolis DLF Mall',
    location: {
      address: 'DLF Mall of India, Sector 18',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110075',
      coordinates: { latitude: 28.5697, longitude: 77.3237 }
    },
    facilities: ['parking', 'food_court', 'wheelchair_accessible', '3d', 'imax'],
    contact: {
      phone: '9876543212',
      email: 'dlf@cinepolis.com'
    }
  }
];

const movies = [
  {
    title: 'Avengers: Endgame',
    description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more to reverse Thanos\' actions and restore balance to the universe.',
    genre: ['action', 'adventure', 'sci-fi'],
    language: ['english', 'hindi'],
    duration: 181,
    rating: 'U/A',
    releaseDate: new Date('2019-04-26'),
    cast: [
      { name: 'Robert Downey Jr.', role: 'actor' },
      { name: 'Chris Evans', role: 'actor' },
      { name: 'Scarlett Johansson', role: 'actress' },
      { name: 'Anthony Russo', role: 'director' }
    ],
    poster: {
      url: 'https://example.com/avengers-endgame-poster.jpg'
    },
    trailer: {
      url: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
      platform: 'youtube'
    },
    imdbRating: 8.4,
    isNowShowing: true
  },
  {
    title: 'The Lion King',
    description: 'A young lion prince is cast out of his pride by his cruel uncle, who claims he killed his father. While the uncle rules with an iron paw, the prince grows up beyond the Savannah, living by a philosophy: No worries for the rest of your days.',
    genre: ['animation', 'adventure', 'drama'],
    language: ['english', 'hindi'],
    duration: 118,
    rating: 'U',
    releaseDate: new Date('2019-07-19'),
    cast: [
      { name: 'Donald Glover', role: 'actor' },
      { name: 'Beyoncé', role: 'actress' },
      { name: 'James Earl Jones', role: 'actor' },
      { name: 'Jon Favreau', role: 'director' }
    ],
    poster: {
      url: 'https://example.com/lion-king-poster.jpg'
    },
    trailer: {
      url: 'https://www.youtube.com/watch?v=7TavVZMewpY',
      platform: 'youtube'
    },
    imdbRating: 6.8,
    isNowShowing: true
  },
  {
    title: 'Dangal',
    description: 'Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.',
    genre: ['biography', 'drama', 'history'],
    language: ['hindi'],
    duration: 161,
    rating: 'U',
    releaseDate: new Date('2016-12-23'),
    cast: [
      { name: 'Aamir Khan', role: 'actor' },
      { name: 'Fatima Sana Shaikh', role: 'actress' },
      { name: 'Sanya Malhotra', role: 'actress' },
      { name: 'Nitesh Tiwari', role: 'director' }
    ],
    poster: {
      url: 'https://example.com/dangal-poster.jpg'
    },
    trailer: {
      url: 'https://www.youtube.com/watch?v=x_7YlGv9u1g',
      platform: 'youtube'
    },
    imdbRating: 8.3,
    isNowShowing: true
  },
  {
    title: 'Spider-Man: No Way Home',
    description: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man.',
    genre: ['action', 'adventure', 'sci-fi'],
    language: ['english', 'hindi'],
    duration: 148,
    rating: 'U/A',
    releaseDate: new Date('2021-12-17'),
    cast: [
      { name: 'Tom Holland', role: 'actor' },
      { name: 'Zendaya', role: 'actress' },
      { name: 'Benedict Cumberbatch', role: 'actor' },
      { name: 'Jon Watts', role: 'director' }
    ],
    poster: {
      url: 'https://example.com/spiderman-nwh-poster.jpg'
    },
    trailer: {
      url: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
      platform: 'youtube'
    },
    imdbRating: 8.2,
    isNowShowing: true
  }
];

// Create screens for each cinema
const createScreens = async (cinemaId, cinemaName) => {
  const screens = [
    {
      name: 'Screen 1',
      cinema: cinemaId,
      screenType: 'imax',
      seatLayout: { rows: 10, columns: 10, totalSeats: 100 },
      priceStructure: { regular: 250, premium: 400 }
    },
    {
      name: 'Screen 2',
      cinema: cinemaId,
      screenType: 'dolby_atmos',
      seatLayout: { rows: 10, columns: 10, totalSeats: 100 },
      priceStructure: { regular: 200, premium: 350 }
    },
    {
      name: 'Screen 3',
      cinema: cinemaId,
      screenType: 'regular',
      seatLayout: { rows: 10, columns: 10, totalSeats: 100 },
      priceStructure: { regular: 150, premium: 250 }
    }
  ];

  const createdScreens = await Screen.insertMany(screens);
  console.log(`Created ${createdScreens.length} screens for ${cinemaName}`);
  return createdScreens;
};

// Create shows for the next 7 days
const createShows = async (movies, screens) => {
  const shows = [];
  const showTimes = ['09:00', '12:30', '16:00', '19:30', '22:45'];
  
  // Create shows for next 7 days
  for (let day = 0; day < 7; day++) {
    const showDate = new Date();
    showDate.setDate(showDate.getDate() + day);
    
    // For each screen and day, assign different movies to different time slots to avoid duplicates
    for (const screen of screens) {
      for (let i = 0; i < Math.min(movies.length, showTimes.length); i++) {
        const movie = movies[i];
        const showTime = showTimes[i];
        
        // Calculate end time based on show time and movie duration
        const [hours, minutes] = showTime.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + movie.duration + 15; // Add 15 minutes for break
        const endHours = Math.floor(endMinutes / 60) % 24;
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        
        shows.push({
          movie: movie._id,
          cinema: screen.cinema,
          screen: screen._id,
          showDate,
          showTime,
          endTime,
          pricing: {
            regular: screen.priceStructure.regular,
            premium: screen.priceStructure.premium
          },
          availableSeats: screen.seatLayout.totalSeats,
          bookedSeats: []
        });
      }
    }
  }

  const createdShows = await Show.insertMany(shows);
  console.log(`Created ${createdShows.length} shows`);
  return createdShows;
};

// Create sample admin user
const createAdminUser = async () => {
  const adminExists = await User.findOne({ email: 'admin@moviebooking.com' });
  
  if (!adminExists) {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@moviebooking.com',
      phone: '9999999999',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Created admin user:', admin.email);
    return admin;
  }
  
  console.log('Admin user already exists');
  return adminExists;
};

// Create sample regular user
const createSampleUser = async () => {
  const userExists = await User.findOne({ email: 'user@moviebooking.com' });
  
  if (!userExists) {
    const user = await User.create({
      name: 'John Doe',
      email: 'user@moviebooking.com',
      phone: '9876543210',
      password: 'user123',
      role: 'user'
    });
    console.log('Created sample user:', user.email);
    return user;
  }
  
  console.log('Sample user already exists');
  return userExists;
};

// Main seeding function
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      Show.deleteMany({}),
      Screen.deleteMany({}),
      Movie.deleteMany({}),
      Cinema.deleteMany({})
    ]);

    console.log('Starting data seeding...');

    // Create users
    await createAdminUser();
    await createSampleUser();

    // Create cinemas
    console.log('Creating cinemas...');
    const createdCinemas = await Cinema.insertMany(cinemas);
    console.log(`Created ${createdCinemas.length} cinemas`);

    // Create screens for each cinema
    console.log('Creating screens...');
    let allScreens = [];
    for (const cinema of createdCinemas) {
      const screens = await createScreens(cinema._id, cinema.name);
      allScreens = [...allScreens, ...screens];
    }

    // Create movies
    console.log('Creating movies...');
    const createdMovies = await Movie.insertMany(movies);
    console.log(`Created ${createdMovies.length} movies`);

    // Create shows
    console.log('Creating shows...');
    await createShows(createdMovies, allScreens);

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Summary:');
    console.log(`• ${createdCinemas.length} cinemas created`);
    console.log(`• ${allScreens.length} screens created`);
    console.log(`• ${createdMovies.length} movies created`);
    console.log(`• Shows created for the next 7 days`);
    console.log('\n👤 User Accounts:');
    console.log('• Admin: admin@moviebooking.com / admin123');
    console.log('• User: user@moviebooking.com / user123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
};

// Run the seeding
seedData();