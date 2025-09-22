const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide movie title'],
    trim: true,
    maxlength: [200, 'Movie title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide movie description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  genre: [{
    type: String,
    required: true,
    enum: [
      'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
      'drama', 'fantasy', 'horror', 'mystery', 'romance', 'sci-fi',
      'thriller', 'war', 'western', 'biography', 'history', 'musical'
    ]
  }],
  language: [{
    type: String,
    required: true,
    enum: ['hindi', 'english', 'tamil', 'telugu', 'malayalam', 'kannada', 'bengali', 'punjabi', 'gujarati', 'marathi']
  }],
  duration: {
    type: Number,
    required: [true, 'Please provide movie duration in minutes'],
    min: [30, 'Minimum duration should be 30 minutes'],
    max: [300, 'Maximum duration should be 300 minutes']
  },
  rating: {
    type: String,
    enum: ['U', 'U/A', 'A', 'S'],
    required: [true, 'Please provide movie rating']
  },
  releaseDate: {
    type: Date,
    required: [true, 'Please provide release date']
  },
  cast: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['actor', 'actress', 'director', 'producer', 'music_director'],
      required: true
    }
  }],
  poster: {
    url: {
      type: String,
      required: [true, 'Please provide poster URL']
    },
    alt: {
      type: String,
      default: function() {
        return `${this.title} movie poster`;
      }
    }
  },
  trailer: {
    url: String,
    platform: {
      type: String,
      enum: ['youtube', 'vimeo', 'other'],
      default: 'youtube'
    }
  },
  imdbRating: {
    type: Number,
    min: 0,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isNowShowing: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for shows
movieSchema.virtual('shows', {
  ref: 'Show',
  localField: '_id',
  foreignField: 'movie',
  justOne: false
});

// Create indexes
movieSchema.index({ title: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ isNowShowing: 1, isActive: 1 });

module.exports = mongoose.model('Movie', movieSchema);