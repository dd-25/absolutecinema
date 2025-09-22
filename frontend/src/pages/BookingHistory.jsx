import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('⚠️ Are you sure you want to cancel this booking?\n\nThis action cannot be undone. You may be charged a cancellation fee based on the cinema policy.')) {
      return;
    }

    try {
      setLoading(true);
      await api.put(`/bookings/${bookingId}/cancel`);
      alert('✅ Booking cancelled successfully!\n\nYour refund will be processed within 3-5 business days.');
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel booking. Please try again.';
      alert(`❌ Cancellation Failed\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatShowDateTime = (booking) => {
    try {
      if (!booking.show?.showDate || !booking.show?.showTime) {
        return 'Date/Time not available';
      }
      
      const showDate = new Date(booking.show.showDate);
      const [hours, minutes] = booking.show.showTime.split(':');
      
      if (isNaN(showDate.getTime()) || !hours || !minutes) {
        return 'Invalid Date/Time';
      }
      
      showDate.setHours(parseInt(hours, 10));
      showDate.setMinutes(parseInt(minutes, 10));
      
      return showDate.toLocaleDateString() + ' ' + showDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting show date/time:', error);
      return 'Invalid Date/Time';
    }
  };

  const canCancelBooking = (booking) => {
    try {
      if (!booking.show?.showDate || !booking.show?.showTime) {
        return false;
      }
      
      const showDate = new Date(booking.show.showDate);
      const [hours, minutes] = booking.show.showTime.split(':');
      
      if (isNaN(showDate.getTime()) || !hours || !minutes) {
        return false;
      }
      
      showDate.setHours(parseInt(hours, 10));
      showDate.setMinutes(parseInt(minutes, 10));
      
      const now = new Date();
      const timeDifference = showDate.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 3600);
      return hoursDifference > 2; // Allow cancellation only if show is more than 2 hours away
    } catch (error) {
      console.error('Error checking cancellation eligibility:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ margin: '2rem 0' }}>My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="alert alert-warning">
          <p>You haven't made any bookings yet.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Book Your First Movie
          </Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {bookings.map(booking => (
            <div key={booking._id} className="card">
              <div className="card-content">
                <h3 className="card-title">{booking.show?.movie?.title || booking.movie?.title}</h3>
                <p className="card-subtitle">
                  {booking.show?.screen?.cinema?.name || booking.cinema?.name} - {booking.show?.screen?.name}
                </p>
                
                <div style={{ margin: '1rem 0' }}>
                  <p><strong>🎬 Movie:</strong> {booking.show?.movie?.title || booking.movie?.title}</p>
                  <p><strong>🏢 Theatre:</strong> {booking.show?.screen?.cinema?.name || booking.cinema?.name}</p>
                  <p><strong>🎭 Screen:</strong> {booking.show?.screen?.name}</p>
                  <p><strong>🕐 Show Time:</strong> {formatShowDateTime(booking)}</p>
                  <p><strong>💺 Seats:</strong> {booking.seats?.map(seat => `${seat.seatNumber || `${String.fromCharCode(64 + seat.row)}${seat.column}`}`).join(', ') || 'N/A'}</p>
                  <p><strong>💰 Total Amount:</strong> ₹{booking.totalAmount}</p>
                  <p><strong>📋 Status:</strong> 
                    <span style={{
                      color: booking.bookingStatus === 'confirmed' ? '#4caf50' : 
                            booking.bookingStatus === 'pending' ? '#ff9800' : 
                            booking.bookingStatus === 'cancelled' ? '#dc3545' : '#f44336',
                      fontWeight: 'bold',
                      textTransform: 'capitalize'
                    }}>
                      {booking.bookingStatus === 'confirmed' ? '✅ Confirmed' :
                       booking.bookingStatus === 'pending' ? '⏳ Pending' :
                       booking.bookingStatus === 'cancelled' ? '❌ Cancelled' : booking.bookingStatus}
                    </span>
                  </p>
                  <p><strong>🆔 Booking Reference:</strong> {booking.bookingReference || booking._id}</p>
                  {booking.show?.movie?.genre && (
                    <p><strong>🎨 Genre:</strong> {booking.show.movie.genre.join(', ')}</p>
                  )}
                  {booking.show?.movie?.duration && (
                    <p><strong>⏱️ Duration:</strong> {booking.show.movie.duration} minutes</p>
                  )}
                  {booking.bookingStatus === 'cancelled' && booking.cancelledAt && (
                    <p><strong>🗑️ Cancelled On:</strong> {formatDate(booking.cancelledAt)}</p>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {booking.bookingStatus === 'confirmed' && canCancelBooking(booking) && (
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleCancelBooking(booking._id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: '1px solid #dc3545',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem'
                        }}
                      >
                        🗑️ Cancel Booking
                      </button>
                    )}
                    
                    {booking.bookingStatus === 'cancelled' && (
                      <span style={{
                        color: '#dc3545',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        ❌ Cancelled
                      </span>
                    )}
                    
                    {booking.bookingStatus === 'confirmed' && !canCancelBooking(booking) && (
                      <span style={{
                        color: '#6c757d',
                        fontSize: '0.85rem',
                        fontStyle: 'italic'
                      }}>
                        ⚠️ Cannot cancel (show starts in less than 2 hours)
                      </span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Booked: {formatDate(booking.createdAt)}
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

export default BookingHistory;