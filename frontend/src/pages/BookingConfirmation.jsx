import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data.data);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      alert('Booking cancelled successfully');
      navigate('/bookings');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  const formatSeats = (seats) => {
    if (!seats || seats.length === 0) return 'N/A';
    
    return seats.map(seat => {
      if (seat.seatNumber) {
        return seat.seatNumber;
      }
      // Convert row number to letter (1=A, 2=B, etc.) and add column
      const rowLetter = String.fromCharCode(64 + seat.row);
      return `${rowLetter}${seat.column}`;
    }).join(', ');
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not available';
    
    if (typeof location === 'string') {
      return location;
    }
    
    if (typeof location === 'object') {
      const { address, city, state, pincode } = location;
      const parts = [address, city, state, pincode].filter(Boolean);
      return parts.join(', ');
    }
    
    return 'Location not available';
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
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container">
        <div className="alert alert-error">Booking not found</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        margin: '2rem auto',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        
        <div style={{
          background: '#4caf50',
          color: 'white',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          margin: '0 auto 20px'
        }}>
          ✓
        </div>
        
        <h1>Booking Confirmed!</h1>
        <p style={{ color: '#666', margin: '10px 0 30px' }}>
          Booking ID: <strong>{booking._id}</strong>
        </p>
        
        <div style={{ textAlign: 'left', margin: '30px 0' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>🎬 Movie Details</h3>
            <p><strong>Movie:</strong> {booking.show?.movie?.title || booking.movie?.title}</p>
            <p><strong>Genre:</strong> {
              (() => {
                const genre = booking.show?.movie?.genre || booking.movie?.genre;
                if (Array.isArray(genre)) {
                  return genre.join(', ');
                }
                return genre || 'N/A';
              })()
            }</p>
            <p><strong>Duration:</strong> {booking.show?.movie?.duration || booking.movie?.duration} minutes</p>
            {booking.show?.movie?.rating && (
              <p><strong>Rating:</strong> {booking.show.movie.rating}/10</p>
            )}
          </div>

          <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>🏢 Theatre & Show Details</h3>
            <p><strong>Cinema:</strong> {booking.show?.screen?.cinema?.name || booking.cinema?.name}</p>
            <p><strong>Location:</strong> {formatLocation(booking.show?.screen?.cinema?.location || booking.cinema?.location)}</p>
            <p><strong>Screen:</strong> {booking.show?.screen?.name}</p>
            <p><strong>Screen Type:</strong> {booking.show?.screen?.screenType || 'Standard'}</p>
            <p><strong>Show Date & Time:</strong> {formatShowDateTime(booking)}</p>
          </div>

          <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>💺 Seat Details</h3>
            <p><strong>Seats:</strong> {formatSeats(booking.seats)}</p>
            <p><strong>Number of Seats:</strong> {booking.seats?.length || 0}</p>
            {booking.seats && booking.seats.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <p><strong>Seat Breakdown:</strong></p>
                <ul style={{ marginLeft: '20px', listStyle: 'disc' }}>
                  {booking.seats.map((seat, index) => (
                    <li key={index}>
                      Seat {seat.seatNumber || `${String.fromCharCode(64 + seat.row)}${seat.column}`} - 
                      {seat.seatType} (₹{seat.price})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>💰 Payment & Booking Details</h3>
            <p><strong>Total Amount:</strong> ₹{booking.totalAmount}</p>
            <p><strong>Booking Reference:</strong> {booking.bookingReference || booking._id}</p>
            <p><strong>Booking Time:</strong> {formatDate(booking.createdAt)}</p>
            <p><strong>Payment Status:</strong> 
              <span style={{ 
                color: booking.paymentStatus === 'completed' ? '#4caf50' : '#ff9800', 
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}>
                {booking.paymentStatus}
              </span>
            </p>
            <p><strong>Booking Status:</strong> 
              <span style={{ color: '#4caf50', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {booking.bookingStatus}
              </span>
            </p>
          </div>

          <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>📧 Contact Details</h3>
            <p><strong>Name:</strong> {booking.contactDetails?.name}</p>
            <p><strong>Email:</strong> {booking.contactDetails?.email}</p>
            <p><strong>Phone:</strong> {booking.contactDetails?.phone}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/bookings')}
          >
            View My Bookings
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
          >
            Book Another Movie
          </button>
          
          {booking.bookingStatus === 'confirmed' && (
            <button 
              className="btn btn-secondary" 
              onClick={handleCancelBooking}
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;