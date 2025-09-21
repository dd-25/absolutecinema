import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MoviePosterImage } from '../utils/imageUtils';

function Home() {
  const [cinemas, setCinemas] = useState([]);
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableDates, setAvailableDates] = useState([]);
  const [activeSection, setActiveSection] = useState('movies');

  useEffect(() => { fetchData(); generateAvailableDates(); }, []);
  useEffect(() => { if (activeSection === 'browse') fetchShowsForDate(selectedDate); }, [selectedDate, activeSection]);

  const generateAvailableDates = () => { const dates = []; for (let i = 0; i < 7; i++) { const date = new Date(); date.setDate(date.getDate() + i); dates.push(date.toISOString().split('T')[0]); } setAvailableDates(dates); };

  const fetchData = async () => {
    try {
      const [cinemasRes, moviesRes] = await Promise.all([api.get('/cinemas'), api.get('/movies?nowShowing=true')]);
      setCinemas(cinemasRes.data.data);
      setMovies(moviesRes.data.data);
    } catch (error) { console.error('Error fetching data:', error); } finally { setLoading(false); }
  };

  const fetchShowsForDate = async (date) => { try { setLoading(true); const showsRes = await api.get(`/shows?date=${date}`); setShows(showsRes.data.data || []); } catch (error) { console.error('Error fetching shows:', error); setShows([]); } finally { setLoading(false); } };

  const formatDateLabel = (dateStr) => { const date = new Date(dateStr); const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); if (dateStr === today.toISOString().split('T')[0]) return 'Today'; if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'; return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };

  const groupShowsByMovie = (shows) => { const grouped = {}; shows.forEach(show => { const movieId = show.movie._id; if (!grouped[movieId]) grouped[movieId] = { movie: show.movie, shows: [] }; grouped[movieId].shows.push(show); }); return Object.values(grouped); };

  const formatTime = (time) => { const [hours, minutes] = time.split(':'); const hour = parseInt(hours); const period = hour >= 12 ? 'PM' : 'AM'; const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour; return `${displayHour}:${minutes} ${period}`; };

  if (loading) return (<div className="loading"><div className="spinner"></div></div>);
  const movieGroups = groupShowsByMovie(shows);

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', margin: '2rem 0' }}>Welcome to Movie Booking System</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
        {[{ id: 'movies', label: 'Now Showing' }, { id: 'browse', label: 'Browse by Date' }, { id: 'cinemas', label: 'Cinemas' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)} style={{ background: activeSection === tab.id ? '#e50914' : 'transparent', color: activeSection === tab.id ? 'white' : '#333', border: 'none', padding: '1rem 2rem', cursor: 'pointer', borderRadius: '4px 4px 0 0', fontSize: '1rem', fontWeight: '500' }}>{tab.label}</button>
        ))}
      </div>
      {activeSection === 'movies' && (<section style={{ marginBottom: '3rem' }}><h2 style={{ marginBottom: '1.5rem' }}>Now Showing</h2><div className="grid grid-4">{movies.map(movie => (<div key={movie._id} className="card"><MoviePosterImage src={movie.poster?.url} alt={movie.title || 'Movie Poster'} width={300} height={400} className="card-image"/><div className="card-content"><h3 className="card-title">{movie.title || 'Unknown Movie'}</h3><p className="card-subtitle">{movie.genre?.join(', ') || 'Unknown Genre'} • {movie.duration || 0}min • {movie.rating || 'NR'}</p><p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>{movie.description && movie.description.length > 100 ? `${movie.description.substring(0, 100)}...` : movie.description || 'No description available'}</p></div></div>))}</div></section>)}
      {activeSection === 'browse' && (<section style={{ marginBottom: '3rem' }}><h2 style={{ marginBottom: '1rem' }}>Browse Movies by Date</h2><div style={{ marginBottom: '2rem' }}><h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Select Date:</h3><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{availableDates.map(date => (<button key={date} onClick={() => setSelectedDate(date)} style={{ padding: '0.75rem 1rem', border: selectedDate === date ? '2px solid #e50914' : '1px solid #ddd', background: selectedDate === date ? '#fff0f0' : 'white', color: selectedDate === date ? '#e50914' : '#333', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: selectedDate === date ? '600' : '400', transition: 'all 0.2s ease' }}>{formatDateLabel(date)}<br/><small style={{ fontSize: '0.7rem', opacity: 0.8 }}>{new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</small></button>))}</div></div><h3 style={{ marginBottom: '1rem' }}>Movies on {formatDateLabel(selectedDate)} ({new Date(selectedDate).toLocaleDateString()})</h3>{loading ? (<div className="loading"><div className="spinner"></div></div>) : movieGroups.length === 0 ? (<div className="alert alert-warning">No shows available for {formatDateLabel(selectedDate)}.</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>{movieGroups.map(({ movie, shows }) => (<div key={movie._id} className="card"><div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}><MoviePosterImage src={movie.poster?.url} alt={movie.title} width={120} height={160} style={{ width: '120px', height: '160px', objectFit: 'cover', borderRadius: '8px' }}/><div style={{ flex: 1 }}><h3 style={{ marginBottom: '0.5rem' }}>{movie.title}</h3><p style={{ color: '#666', marginBottom: '0.5rem' }}>{movie.genre?.join(', ') || 'Unknown Genre'} • {movie.duration || 0}min • {movie.rating || 'NR'}</p><p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>{movie.description && movie.description.length > 200 ? `${movie.description.substring(0, 200)}...` : movie.description || 'No description available'}</p><div><h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Available Shows:</h4><div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{shows.map(show => (<Link key={show._id} to={`/show/${show._id}/seats`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' }}><div style={{ fontWeight: '600' }}>{formatTime(show.showTime)}</div><div style={{ fontSize: '0.7rem', opacity: 0.9 }}>{show.cinema?.name || 'Cinema'}</div><div style={{ fontSize: '0.7rem', opacity: 0.9 }}>₹{show.pricing?.regular || 'N/A'}+</div></Link>))}</div></div></div></div></div>))}</div>)}</section>)}
      {activeSection === 'cinemas' && (<section><h2 style={{ marginBottom: '1.5rem' }}>Cinemas Near You</h2><div className="grid grid-3">{cinemas.map(cinema => (<Link key={cinema._id} to={`/cinema/${cinema._id}`} style={{ textDecoration: 'none' }}><div className="card"><div className="card-content"><h3 className="card-title">{cinema.name}</h3><p className="card-subtitle">{cinema.location?.address}, {cinema.location?.city}</p><div style={{ marginTop: '1rem' }}>{cinema.facilities.slice(0, 3).map(facility => (<span key={facility} style={{ display: 'inline-block', background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', marginRight: '0.5rem', marginBottom: '0.5rem' }}>{facility.replace('_', ' ')}</span>))}</div></div></div></Link>))}</div></section>)}
    </div>
  );
}

export default Home;
