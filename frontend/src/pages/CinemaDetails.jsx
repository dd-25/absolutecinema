import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { MoviePosterImage } from '../utils/imageUtils';

function CinemaDetails() {
  const { cinemaId } = useParams();
  const [cinema, setCinema] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    fetchCinemaData();
  }, [cinemaId]);

  useEffect(() => {
    if (cinema) {
      fetchShowsForDate(selectedDate);
    }
  }, [selectedDate, cinema]);

  const fetchCinemaData = async () => {
    try {
      const cinemaRes = await api.get(`/cinemas/${cinemaId}`);
      setCinema(cinemaRes.data.data);
      
      // Generate available dates (today + next 7 days)
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(dates);
      
      // Fetch shows for today initially
      await fetchShowsForDate(selectedDate);
    } catch (error) {
      console.error('Error fetching cinema data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShowsForDate = async (date) => {
    try {
      setLoading(true);
      const showsRes = await api.get(`/shows?cinema=${cinemaId}&date=${date}`);
      setShows(showsRes.data.data);
    } catch (error) {
      console.error('Error fetching shows:', error);
      setShows([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const groupShowsByMovie = (shows) => {
    const grouped = {};
    shows.forEach(show => {
      const movieId = show.movie._id;
      if (!grouped[movieId]) {
        grouped[movieId] = {
          movie: show.movie,
          shows: []
        };
      }
      grouped[movieId].shows.push(show);
    });
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!cinema) {
    return <div className="container">Cinema not found</div>;
  }

  const movieGroups = groupShowsByMovie(shows);

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{cinema.name}</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          {cinema.location?.address}, {cinema.location?.city}, {cinema.location?.state}
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {cinema.facilities.map(facility => (
            <span 
              key={facility}
              style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.8rem'
              }}
            >
              {facility.replace('_', ' ').toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Select Date</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {availableDates.map(date => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: '0.75rem 1rem',
                border: selectedDate === date ? '2px solid #e50914' : '1px solid #ddd',
                background: selectedDate === date ? '#fff0f0' : 'white',
                color: selectedDate === date ? '#e50914' : '#333',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: selectedDate === date ? '600' : '400',
                transition: 'all 0.2s ease'
              }}
            >
              {formatDateLabel(date)}
              <br />
              <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                {new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </small>
            </button>
          ))}
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>
        Shows for {formatDateLabel(selectedDate)} ({new Date(selectedDate).toLocaleDateString()})
      </h2>
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : movieGroups.length === 0 ? (
        <div className="alert alert-warning">
          No shows available for {formatDateLabel(selectedDate)} at this cinema.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {movieGroups.map(({ movie, shows }) => (
            <div key={movie._id} className="card">
              <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
                <MoviePosterImage
                  src={movie.poster?.url}
                  alt={movie.title}
                  width={120}
                  height={160}
                  style={{
                    width: '120px',
                    height: '160px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: '0.5rem' }}>{movie.title}</h3>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    {movie.genre?.join(', ') || 'Unknown Genre'} • {movie.duration || 0}min • {movie.rating || 'NR'}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {movie.description && movie.description.length > 200 
                      ? `${movie.description.substring(0, 200)}...`
                      : movie.description || 'No description available'
                    }
                  </p>
                  
                  <div>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Show Times:</h4>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {shows.map(show => (
                        <Link
                          key={show._id}
                          to={`/show/${show._id}/seats`}
                          className="btn btn-primary"
                          style={{
                            textDecoration: 'none',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          {formatTime(show.showTime)}
                          <br />
                          <small style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                            ₹{show.pricing.regular}+
                          </small>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CinemaDetails;