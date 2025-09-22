import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [data, setData] = useState({
    bookings: [],
    cinemas: [],
    movies: [],
    shows: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create' or 'edit'
  const [currentEntity, setCurrentEntity] = useState(''); // 'movie', 'cinema', 'show'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [screens, setScreens] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchData(activeTab);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const fetchData = async (type) => {
    try {
      setLoading(true);
      setError('');
      
      let endpoint = '';
      switch (type) {
        case 'bookings':
          endpoint = '/bookings';
          break;
        case 'cinemas':
          endpoint = '/cinemas';
          break;
        case 'movies':
          endpoint = '/movies';
          break;
        case 'shows':
          endpoint = '/shows';
          break;
        default:
          return;
      }
      
      const response = await api.get(endpoint);
      
      const responseData = response.data.data || response.data;
      
      setData(prev => ({ 
        ...prev, 
        [type]: Array.isArray(responseData) ? responseData : []
      }));
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      if (error.response?.status === 401) {
        setError(`Access denied. Admin privileges required to view ${type}.`);
      } else {
        setError(`Failed to load ${type}: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

    const openModal = async (type, item = null) => {
    try {
      
      // If item is provided, we're in edit mode
      const modalType = item ? 'edit' : 'create';
      const entityType = type; // type is the entity type (movie/cinema/show)
      
      setModalType(modalType);
      setEditingItem(item);
      setCurrentEntity(entityType);
    
    // Initialize form data first
    if (item) {
      let formDataToSet = { ...item };
      
      // Special handling for show editing
      if (entityType === 'show') {
        if (item.showDate) {
          const showDate = new Date(item.showDate);
          formDataToSet.showDate = showDate.toISOString().split('T')[0];
        }
        if (item.showEndDate) {
          const showEndDate = new Date(item.showEndDate);
          formDataToSet.showEndDate = showEndDate.toISOString().split('T')[0];
        }
      }
      
      setFormData(formDataToSet);
      
      // If editing cinema, load its screens
      if (entityType === 'cinema' && item._id) {
        try {
          const screensResponse = await api.get(`/cinemas/${item._id}/screens`);
          setScreens(screensResponse.data.data || []);
        } catch (error) {
          console.error('Error loading cinema screens:', error);
          setScreens([]);
        }
      }
    } else {
      // Set default form data based on entity type
      if (entityType === 'show') {
        const today = new Date().toISOString().split('T')[0];
        const next5Days = new Date();
        next5Days.setDate(next5Days.getDate() + 4);
        const defaultEndDate = next5Days.toISOString().split('T')[0];
        
        setFormData({
          movie: '',
          screen: '',
          showDate: today,
          showTime: '09:00',
          isRecurring: false,
          showEndDate: defaultEndDate,
          pricing: null
        });
      } else if (entityType === 'cinema') {
        setFormData({});
        setScreens([{
          name: 'Screen 1',
          screenType: 'regular',
          rows: 10,
          columns: 10,
          regularPrice: 150,
          premiumPrice: 250
        }]);
      } else {
        setFormData({});
      }
    }
    
    // Load movies and cinemas for show creation/editing
    if (entityType === 'show') {
      try {
        // Load movies and cinemas if not already loaded
        if (data.movies.length === 0) {
          await fetchData('movies');
        }
        if (data.cinemas.length === 0) {
          await fetchData('cinemas');
        }
      } catch (error) {
        console.error('Error loading data for modal:', error);
      }
    }
    
    setShowModal(true);
    } catch (error) {
      console.error('Error opening modal:', error);
      alert('Error opening modal: ' + error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setCurrentEntity('');
    setEditingItem(null);
    setFormData({});
    setScreens([]);
  };

  const addScreen = () => {
    const newScreen = {
      name: `Screen ${screens.length + 1}`,
      screenType: 'regular',
      rows: 10,
      columns: 10,
      regularPrice: 150,
      premiumPrice: 250
    };
    setScreens([...screens, newScreen]);
  };

  const removeScreen = (index) => {
    setScreens(screens.filter((_, i) => i !== index));
  };

  const updateScreen = (index, field, value) => {
    const updatedScreens = [...screens];
    updatedScreens[index] = { ...updatedScreens[index], [field]: value };
    setScreens(updatedScreens);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (currentEntity === 'movie' && (!formData.title || !formData.duration)) {
      alert('Please fill in required fields: Title and Duration');
      return;
    }
    
    if (currentEntity === 'cinema') {
      if (!formData.name || !formData.location?.city) {
        alert('Please fill in required fields: Name and City');
        return;
      }
      
      if (screens.length === 0) {
        alert('Please add at least one screen');
        return;
      }
      
      // Validate screens
      for (let i = 0; i < screens.length; i++) {
        const screen = screens[i];
        if (!screen.name || !screen.regularPrice || screen.rows < 5 || screen.columns < 5) {
          alert(`Please fill in all required fields for Screen ${i + 1}`);
          return;
        }
      }
    }
    
    if (currentEntity === 'show') {
      if (!formData.movie || !formData.screen || !formData.showDate || !formData.showTime) {
        alert('Please fill in all required fields: Movie, Screen, Show Date, and Show Time');
        return;
      }
      
      // Validate date range for recurring shows
      if (formData.isRecurring && formData.showEndDate) {
        const startDate = new Date(formData.showDate);
        const endDate = new Date(formData.showEndDate);
        
        if (endDate <= startDate) {
          alert('End date must be after start date for recurring shows');
          return;
        }
        
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 30) {
          alert('Maximum 30 days allowed for recurring shows');
          return;
        }
      }
      
      // Pricing will be automatically set from screen selection
      if (!formData.pricing?.regular) {
        alert('Please select a screen to auto-set pricing, or check screen configuration');
        return;
      }
    }
    
    try {
      let endpoint = '';
      let method = modalType === 'create' ? 'post' : 'put';
      
      switch (currentEntity) {
        case 'movie':
          endpoint = modalType === 'create' ? '/movies' : `/movies/${editingItem?._id}`;
          break;
        case 'cinema':
          endpoint = modalType === 'create' ? '/cinemas' : `/cinemas/${editingItem?._id}`;
          break;
        case 'show':
          endpoint = modalType === 'create' ? '/shows' : `/shows/${editingItem?._id}`;
          break;
        default:
          alert('Unknown entity type');
          return;
      }
      
      if (modalType === 'edit' && !editingItem?._id) {
        alert('No item selected for editing');
        return;
      }
      
      console.log(`${method.toUpperCase()} request to:`, endpoint);
      console.log('Form data:', formData);
      
      let submitData = { ...formData };
      
      // Clean up show data - remove empty cinema field since it will be derived from screen
      if (currentEntity === 'show') {
        if (submitData.cinema === '' || submitData.cinema === undefined) {
          delete submitData.cinema;
        }
      }
      
      // Add screens data for cinema creation/editing
      if (currentEntity === 'cinema') {
        submitData.screens = screens.map(screen => ({
          name: screen.name,
          screenType: screen.screenType,
          seatLayout: {
            rows: parseInt(screen.rows),
            columns: parseInt(screen.columns)
          },
          priceStructure: {
            regular: parseFloat(screen.regularPrice),
            premium: parseFloat(screen.premiumPrice || screen.regularPrice * 1.5)
          }
        }));
      }
      
      console.log('Submit data:', submitData);
      
      const response = await api[method](endpoint, submitData);
      console.log('API response:', response);
      
      const entityName = currentEntity.charAt(0).toUpperCase() + currentEntity.slice(1);
      const action = modalType === 'create' ? 'created' : 'updated';
      
      // Handle multiple shows creation response
      if (currentEntity === 'show' && response.data.count && response.data.count > 1) {
        alert(`${response.data.count} shows ${action} successfully for the date range!`);
      } else {
        alert(`${entityName} ${action} successfully!`);
      }
      
      closeModal();
      
      // Refresh data for the appropriate tab
      const dataType = currentEntity === 'show' ? 'shows' : `${currentEntity}s`;
      await fetchData(dataType);
    } catch (error) {
      console.error(`Error ${modalType}ing ${currentEntity}:`, error);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      alert(`Failed to ${modalType} ${currentEntity}: ${errorMessage}`);
    }
  };

  const handleDelete = async (entity, id) => {
    if (!id) {
      alert('Invalid ID for deletion');
      return;
    }

    const entityName = entity.charAt(0).toUpperCase() + entity.slice(1);
    if (!window.confirm(`Are you sure you want to delete this ${entityName}? This action cannot be undone.`)) {
      return;
    }

    try {
      let endpoint = '';
      let dataType = '';
      
      switch (entity) {
        case 'movie':
          endpoint = `/movies/${id}`;
          dataType = 'movies';
          break;
        case 'cinema':
          endpoint = `/cinemas/${id}`;
          dataType = 'cinemas';
          break;
        case 'show':
          endpoint = `/shows/${id}`;
          dataType = 'shows';
          break;
        default:
          alert('Unknown entity type');
          return;
      }
      
      console.log(`Attempting to delete ${entity} with ID: ${id}`);
      const response = await api.delete(endpoint);
      console.log('Delete response:', response);
      
      alert(`${entityName} deleted successfully!`);
      
      // Refresh the data for the current tab
      await fetchData(dataType);
      
    } catch (error) {
      console.error(`Error deleting ${entity}:`, error);
      let errorMessage = `Failed to delete ${entityName}`;
      
      if (error.response?.status === 404) {
        errorMessage += ': Item not found';
      } else if (error.response?.status === 403) {
        errorMessage += ': Access denied';
      } else if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      alert('Booking cancelled successfully');
      fetchData('bookings');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBookings = () => (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>All Bookings</h2>
      {data.bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="grid grid-2">
          {data.bookings.map(booking => (
            <div key={booking._id} className="card">
              <div className="card-content">
                <h3 className="card-title">{booking.show?.movie?.title}</h3>
                <p><strong>User:</strong> {booking.user?.name} ({booking.user?.email})</p>
                <p><strong>Cinema:</strong> {booking.show?.screen?.cinema?.name}</p>
                <p><strong>Screen:</strong> {booking.show?.screen?.name}</p>
                <p><strong>Show Time:</strong> {formatDate(booking.show?.showTime)}</p>
                <p><strong>Seats:</strong> {booking.seats?.map(seat => `${seat.seatNumber || `${seat.row}${seat.column}`}`).join(', ') || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹{booking.totalAmount}</p>
                <p><strong>Status:</strong> {booking.bookingStatus}</p>
                
                {booking.bookingStatus === 'confirmed' && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleCancelBooking(booking._id)}
                    style={{ marginTop: '1rem' }}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCinemas = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>All Cinemas</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => openModal('cinema')}
          style={{ background: '#e50914', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Add Cinema
        </button>
      </div>
      {data.cinemas.length === 0 ? (
        <p>No cinemas found.</p>
      ) : (
        <div className="grid grid-3">
          {data.cinemas.map(cinema => (
            <div key={cinema._id} className="card">
              <div className="card-content">
                <h3 className="card-title">{cinema.name}</h3>
                <p><strong>Location:</strong> {cinema.location?.address}, {cinema.location?.city}</p>
                <p><strong>Screens:</strong> {cinema.screens?.length || 0}</p>
                {cinema.screens && cinema.screens.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <small style={{ color: '#666' }}>
                      {cinema.screens.map(screen => `${screen.name} (${screen.screenType})`).join(', ')}
                    </small>
                  </div>
                )}
                {cinema.facilities && (
                  <div style={{ marginTop: '1rem' }}>
                    {cinema.facilities.slice(0, 3).map(facility => (
                      <span 
                        key={facility}
                        style={{
                          display: 'inline-block',
                          background: '#f0f0f0',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          marginRight: '0.5rem',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => openModal('cinema', cinema)}
                    style={{ flex: 1, padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete('cinema', cinema._id)}
                    style={{ flex: 1, padding: '0.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMovies = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>All Movies</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => openModal('movie')}
          style={{ background: '#e50914', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Add Movie
        </button>
      </div>
      {!data.movies || data.movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <div className="grid grid-4">
          {data.movies.map(movie => {
            if (!movie || !movie._id) return null;
            return (
              <div key={movie._id} className="card">
                <div 
                  className="card-image"
                  style={{ 
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    backgroundImage: movie.poster?.url ? `url(${movie.poster.url})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: movie.poster?.url ? `url(${movie.poster.url}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '16px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {!movie.poster?.url && 'Movie Poster'}
                </div>
                <div className="card-content">
                  <h3 className="card-title">{movie.title || 'Untitled Movie'}</h3>
                  <p><strong>Genre:</strong> {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'N/A'}</p>
                  <p><strong>Duration:</strong> {movie.duration || 0} minutes</p>
                  <p><strong>Language:</strong> {movie.language || 'N/A'}</p>
                  <p><strong>Rating:</strong> {movie.rating || 0}/10</p>
                  <p><strong>Director:</strong> {movie.director || 'N/A'}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => openModal('movie', movie)}
                      style={{ flex: 1, padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete('movie', movie._id)}
                      style={{ flex: 1, padding: '0.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderShows = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>All Shows</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => openModal('show')}
          style={{ background: '#e50914', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Add Show
        </button>
      </div>
      {!data.shows || data.shows.length === 0 ? (
        <p>No shows found.</p>
      ) : (
        <div className="grid grid-3">
          {data.shows.map(show => {
            if (!show || !show._id) return null;
            return (
              <div key={show._id} className="card">
                <div className="card-content">
                  <h3 className="card-title">
                    {show.movie?.title || show.movieTitle || 'Movie Title'}
                    {show.isRecurring && (
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        fontSize: '0.7rem', 
                        background: '#28a745', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '3px' 
                      }}>
                        SERIES
                      </span>
                    )}
                    {show.parentShowId && (
                      <span style={{ 
                        marginLeft: '0.5rem', 
                        fontSize: '0.7rem', 
                        background: '#17a2b8', 
                        color: 'white', 
                        padding: '2px 6px', 
                        borderRadius: '3px' 
                      }}>
                        DAILY
                      </span>
                    )}
                  </h3>
                  <p><strong>Cinema:</strong> {show.cinema?.name || show.cinemaName || 'Cinema Name'}</p>
                  <p><strong>Screen:</strong> {show.screen?.name || show.screenName || 'Screen Name'}</p>
                  <p><strong>Date:</strong> {show.showDate ? new Date(show.showDate).toLocaleDateString() : 'No date set'}</p>
                  <p><strong>Time:</strong> {show.showTime || 'No time set'}</p>
                  {show.isRecurring && show.showEndDate && (
                    <p><strong>Series:</strong> Daily until {new Date(show.showEndDate).toLocaleDateString()}</p>
                  )}
                  <p><strong>Price:</strong> ₹{show.pricing?.regular || show.ticketPrice || 0}</p>
                  <p><strong>Available Seats:</strong> {show.availableSeats || 0}</p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => openModal('show', show)}
                      style={{ flex: 1, padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDelete('show', show._id)}
                      style={{ flex: 1, padding: '0.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>
            {modalType === 'create' ? 'Create' : 'Edit'} {currentEntity}
          </h2>
          
          
          <form onSubmit={handleFormSubmit}>
            {currentEntity === 'movie' && renderMovieForm()}
            {currentEntity === 'cinema' && renderCinemaForm()}
            {currentEntity === 'show' && (
              <div>
                {renderShowForm()}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                type="submit"
                style={{ flex: 1, padding: '0.75rem', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {modalType === 'create' ? 'Create' : 'Update'} {currentEntity}
              </button>
              <button 
                type="button"
                onClick={closeModal}
                style={{ flex: 1, padding: '0.75rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderMovieForm = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <input
        type="text"
        placeholder="Movie Title"
        value={formData.title || ''}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
        required
      />
      <textarea
        placeholder="Movie Description"
        value={formData.description || ''}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
      />
      <input
        type="text"
        placeholder="Genre (comma separated)"
        value={Array.isArray(formData.genre) ? formData.genre.join(', ') : formData.genre || ''}
        onChange={(e) => setFormData({...formData, genre: e.target.value.split(',').map(g => g.trim())})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="number"
        min="1"
        placeholder="Duration (minutes)"
        value={formData.duration || ''}
        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
        required
      />
      <input
        type="text"
        placeholder="Language"
        value={formData.language || ''}
        onChange={(e) => setFormData({...formData, language: e.target.value})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="Director"
        value={formData.director || ''}
        onChange={(e) => setFormData({...formData, director: e.target.value})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="text"
        placeholder="Cast (comma separated)"
        value={Array.isArray(formData.cast) ? formData.cast.join(', ') : formData.cast || ''}
        onChange={(e) => setFormData({...formData, cast: e.target.value.split(',').map(c => c.trim())})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="number"
        step="0.1"
        min="0"
        max="10"
        placeholder="Rating (0-10)"
        value={formData.rating || ''}
        onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="date"
        placeholder="Release Date"
        value={formData.releaseDate ? new Date(formData.releaseDate).toISOString().split('T')[0] : ''}
        onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="url"
        placeholder="Poster URL"
        value={formData.poster?.url || ''}
        onChange={(e) => setFormData({...formData, poster: { url: e.target.value }})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      <input
        type="url"
        placeholder="Trailer URL"
        value={formData.trailer?.url || ''}
        onChange={(e) => setFormData({...formData, trailer: { url: e.target.value }})}
        style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />
    </div>
  );

  const renderCinemaForm = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Cinema Basic Info */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        <h3 style={{ margin: '0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
          Cinema Information
        </h3>
        <input
          type="text"
          placeholder="Cinema Name *"
          value={formData.name || ''}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.location?.address || ''}
          onChange={(e) => setFormData({...formData, location: {...formData.location, address: e.target.value}})}
          style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input
            type="text"
            placeholder="City *"
            value={formData.location?.city || ''}
            onChange={(e) => setFormData({...formData, location: {...formData.location, city: e.target.value}})}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
          <input
            type="text"
            placeholder="State"
            value={formData.location?.state || ''}
            onChange={(e) => setFormData({...formData, location: {...formData.location, state: e.target.value}})}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <input
          type="text"
          placeholder="Pincode (6 digits)"
          value={formData.location?.pincode || ''}
          onChange={(e) => setFormData({...formData, location: {...formData.location, pincode: e.target.value}})}
          style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          pattern="[0-9]{6}"
        />
        <input
          type="text"
          placeholder="Facilities (comma separated) - e.g., parking, food_court, 3d, imax"
          value={Array.isArray(formData.facilities) ? formData.facilities.join(', ') : formData.facilities || ''}
          onChange={(e) => setFormData({...formData, facilities: e.target.value.split(',').map(f => f.trim()).filter(f => f)})}
          style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <input
            type="tel"
            placeholder="Phone (10 digits)"
            value={formData.contact?.phone || ''}
            onChange={(e) => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            pattern="[0-9]{10}"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.contact?.email || ''}
            onChange={(e) => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
      </div>

      {/* Screens Section */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: '0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', flex: 1 }}>
            Screens ({screens.length})
          </h3>
          <button
            type="button"
            onClick={addScreen}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            + Add Screen
          </button>
        </div>
        
        {screens.map((screen, index) => (
          <div 
            key={index}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#f8f9fa'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: '0', color: '#495057' }}>Screen {index + 1}</h4>
              {screens.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScreen(index)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
            
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Screen Name *"
                  value={screen.name}
                  onChange={(e) => updateScreen(index, 'name', e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
                <select
                  value={screen.screenType}
                  onChange={(e) => updateScreen(index, 'screenType', e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="regular">Regular</option>
                  <option value="3d">3D</option>
                  <option value="imax">IMAX</option>
                  <option value="dolby_atmos">Dolby Atmos</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Rows *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={screen.rows}
                    onChange={(e) => updateScreen(index, 'rows', e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Columns *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="20"
                    value={screen.columns}
                    onChange={(e) => updateScreen(index, 'columns', e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Regular Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={screen.regularPrice}
                    onChange={(e) => updateScreen(index, 'regularPrice', e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem', display: 'block' }}>
                    Premium Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={screen.premiumPrice || ''}
                    onChange={(e) => updateScreen(index, 'premiumPrice', e.target.value)}
                    placeholder={`${Math.round((screen.regularPrice || 150) * 1.5)}`}
                    style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                </div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                Total Seats: {(screen.rows || 0) * (screen.columns || 0)}
              </div>
            </div>
          </div>
        ))}
        
        {screens.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '1rem' }}>
            No screens added yet. Click "Add Screen" to add the first screen.
          </div>
        )}
      </div>
    </div>
  );

  const renderShowForm = () => {
    // Get the current date for minimum date selection
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    
    // Get next 5 days for default range
    const next5Days = new Date(today);
    next5Days.setDate(next5Days.getDate() + 4);
    const maxDefaultDate = next5Days.toISOString().split('T')[0];
    
    // Get selected screen pricing if available
    const selectedScreen = data.cinemas?.flatMap(cinema => 
      cinema.screens?.map(screen => ({...screen, cinemaName: cinema.name})) || []
    ).find(screen => screen._id === formData.screen);

    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <select
          value={formData.movie || ''}
          onChange={(e) => setFormData({...formData, movie: e.target.value})}
          style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        >
          <option value="">Select Movie</option>
          {data.movies && data.movies.length > 0 ? data.movies.map(movie => (
            <option key={movie._id} value={movie._id}>{movie.title || 'Untitled Movie'}</option>
          )) : <option disabled>Loading movies...</option>}
        </select>
        
        <select
          value={formData.screen || ''}
          onChange={(e) => {
            const selectedScreenId = e.target.value;
            const screen = data.cinemas?.flatMap(cinema => 
              cinema.screens?.map(s => ({...s, cinemaName: cinema.name})) || []
            ).find(s => s._id === selectedScreenId);
            
            setFormData({
              ...formData, 
              screen: selectedScreenId,
              // Auto-set pricing from screen
              pricing: screen?.priceStructure ? {
                regular: screen.priceStructure.regular,
                premium: screen.priceStructure.premium || screen.priceStructure.regular * 1.5
              } : undefined
            });
          }}
          style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
          required
        >
          <option value="">Select Screen</option>
          {data.cinemas && data.cinemas.length > 0 ? data.cinemas.map(cinema => 
            cinema.screens && cinema.screens.length > 0 ? cinema.screens.map(screen => (
              <option key={screen._id} value={screen._id}>
                {cinema.name} - {screen.name} ({screen.screenType})
              </option>
            )) : null
          ) : <option disabled>Loading cinemas...</option>}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input
            type="date"
            placeholder="Start Date"
            min={minDate}
            value={formData.showDate || ''}
            onChange={(e) => setFormData({...formData, showDate: e.target.value})}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
          <input
            type="time"
            placeholder="Show Time"
            value={formData.showTime || ''}
            onChange={(e) => setFormData({...formData, showTime: e.target.value})}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring || false}
            onChange={(e) => {
              const isRecurring = e.target.checked;
              setFormData({
                ...formData, 
                isRecurring,
                showEndDate: isRecurring ? (formData.showEndDate || maxDefaultDate) : ''
              });
            }}
            style={{ marginRight: '0.5rem' }}
          />
          <label htmlFor="isRecurring" style={{ fontSize: '0.9rem', color: '#333' }}>
            Repeat show daily for multiple days
          </label>
        </div>

        {formData.isRecurring && (
          <div style={{ 
            padding: '1rem', 
            background: '#f8f9fa', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            marginTop: '0.5rem'
          }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
              End Date (show will run daily from start date to end date):
            </label>
            <input
              type="date"
              placeholder="End Date"
              min={formData.showDate || minDate}
              value={formData.showEndDate || maxDefaultDate}
              onChange={(e) => setFormData({...formData, showEndDate: e.target.value})}
              style={{ 
                padding: '0.75rem', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                width: '100%'
              }}
            />
            <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
              Default: Next 5 days from start date. Shows will be created for each day in this range.
            </small>
          </div>
        )}

        {selectedScreen && (
          <div style={{ 
            padding: '0.75rem', 
            background: '#f8f9fa', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>Screen Details:</strong><br/>
            Cinema: {selectedScreen.cinemaName}<br/>
            Screen: {selectedScreen.name} ({selectedScreen.screenType})<br/>
            Capacity: {selectedScreen.seatLayout?.totalSeats || 'N/A'} seats<br/>
            Pricing: Regular ₹{selectedScreen.priceStructure?.regular || 'N/A'}, 
            Premium ₹{selectedScreen.priceStructure?.premium || selectedScreen.priceStructure?.regular * 1.5 || 'N/A'}
            
            {formData.isRecurring && formData.showDate && formData.showEndDate && (
              <>
                <br/><br/>
                <strong>Show Schedule:</strong><br/>
                Daily from {new Date(formData.showDate).toLocaleDateString()} 
                to {new Date(formData.showEndDate).toLocaleDateString()}<br/>
                <small style={{color: '#666'}}>
                  {Math.ceil((new Date(formData.showEndDate) - new Date(formData.showDate)) / (1000 * 60 * 60 * 24)) + 1} shows will be created
                </small>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <style jsx>{`
        .grid {
          display: grid;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .grid-2 { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
        .grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .grid-4 { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
        
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background: white;
        }
        
        .card-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
        
        .card-content {
          padding: 1rem;
        }
        
        .card-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: bold;
        }
      `}</style>
      <h1 style={{ margin: '2rem 0' }}>Admin Panel</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
        {['bookings', 'cinemas', 'movies', 'shows'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? '#e50914' : 'transparent',
              color: activeTab === tab ? 'white' : '#333',
              border: 'none',
              padding: '1rem 2rem',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {!loading && !error && (
        <div>
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'cinemas' && renderCinemas()}
          {activeTab === 'movies' && renderMovies()}
          {activeTab === 'shows' && renderShows()}
        </div>
      )}
      
      {showModal && renderModal()}
    </div>
  );
}

export default AdminPanel;