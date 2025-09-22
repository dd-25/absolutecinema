import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, getContactDetails, hasCompleteContactDetails, updateProfile } = useAuth();
  
  const [show, setShow] = useState(null);
  const [seatLayout, setSeatLayout] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  useEffect(() => {
    const userContactDetails = getContactDetails();
    if (userContactDetails) {
      setContactDetails(userContactDetails);
    }
  }, [user, getContactDetails]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { from: `/show/${showId}/seats` }
      });
      return;
    }
  }, [user, navigate, showId]);

  useEffect(() => {
    fetchShowSeats();
    // Set up interval to refresh seats every 30 seconds
    const interval = setInterval(fetchShowSeats, 30000);
    return () => clearInterval(interval);
  }, [showId]);

  useEffect(() => {
    // Auto-release locked seats when component unmounts
    return () => {
      if (selectedSeats.length > 0) {
        // Only release if seats were actually locked (we'll track this with a ref later)
        api.post(`/shows/${showId}/release-seats`, { seats: selectedSeats })
          .catch(err => console.error('Error releasing seats on unmount:', err));
      }
    };
  }, [selectedSeats, showId]);

  const fetchShowSeats = async () => {
    try {
      const response = await api.get(`/shows/${showId}/seats`);
      const { data } = response.data;
      
      // Debug logging
      
      // Check for any blocked seats (debug code removed)
      
      setSeatLayout(data.seatLayout || []);
      setShow({
        _id: showId,
        showDate: data.showDate,
        showTime: data.showTime,
        pricing: data.pricing,
        totalSeats: data.totalSeats,
        availableSeats: data.availableSeats,
        movie: data.movie,
        cinema: data.cinema
      });
    } catch (error) {
      setError('Error fetching seat layout');
      console.error('Error fetching seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isShowPast = () => {
    if (!show?.showDate || !show?.showTime) return false;
    
    const now = new Date();
    const showDateTime = new Date(show.showDate);
    const [hours, minutes] = show.showTime.split(':');
    showDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    return showDateTime < now;
  };

  const handleSeatClick = (seat) => {
    // Debug code removed

    // Check if show is in the past
    if (isShowPast()) {
      setError('Cannot book seats for past shows');
      return;
    }

    if (seat.isBooked) {
      return;
    }

    if (seat.isTemporarilyBlocked && seat.blockedBy !== user?._id) {
      return;
    }

    // Toggle seat selection
    const isSelected = selectedSeats.some(s => s.row === seat.row && s.column === seat.column);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => !(s.row === seat.row && s.column === seat.column)));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleContactDetailsChange = (e) => {
    const { name, value } = e.target;
    setContactDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateContactDetails = () => {
    const { name, email, phone } = contactDetails;
    
    if (!name || !name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handleContactFormSubmit = async () => {
    if (validateContactDetails()) {
      try {
        // Update user profile with contact details if needed
        const userContact = getContactDetails();
        
        // Only update if the contact details are different
        if (!userContact || 
            userContact.name !== contactDetails.name ||
            userContact.email !== contactDetails.email ||
            userContact.phone !== contactDetails.phone) {
          
          const result = await updateProfile({
            name: contactDetails.name.trim(),
            email: contactDetails.email.trim(),
            phone: contactDetails.phone.trim()
          });
          
          if (!result.success) {
            setError(result.error);
            return;
          }
        }
        
        setShowContactForm(false);
        setError('');
        // Proceed with booking after contact details are validated
        setTimeout(() => handleBooking(), 100);
      } catch (error) {
        setError('Failed to update contact details');
      }
    }
  };

  const lockSelectedSeats = async () => {
    if (selectedSeats.length === 0) return false;

    try {
      const response = await api.post(`/shows/${showId}/lock-seats`, { seats: selectedSeats });
      return true;
    } catch (error) {
      console.error('Lock seats error:', error.response?.data);
      setError(error.response?.data?.message || 'Some seats are no longer available');
      // Refresh seat layout to get latest status
      fetchShowSeats();
      return false;
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => {
      const price = seat.row <= 3 ? (show.pricing?.premium || show.pricing?.regular) : show.pricing?.regular;
      return total + price;
    }, 0);
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    // Check authentication first
    if (!isAuthenticated || !user) {
      navigate('/login', { 
        state: { from: `/show/${showId}/seats` }
      });
      return;
    }

    // Check if user has complete contact details or show contact form
    if (!hasCompleteContactDetails()) {
      setShowContactForm(true);
      return;
    }

    setBooking(true);
    setError('');

    try {
      // Step 1: Lock the selected seats on the backend
      const seatsLocked = await lockSelectedSeats();
      if (!seatsLocked) {
        setBooking(false);
        return; // Error message already set in lockSelectedSeats
      }

      // Step 2: Create the booking with locked seats
      const seatDetails = selectedSeats.map(seat => ({
        row: seat.row,
        column: seat.column
      }));

      // Use contact details from auth context (already validated)
      const userContactDetails = getContactDetails();

      const finalContactDetails = userContactDetails || {
        name: contactDetails.name.trim(),
        email: contactDetails.email.trim(),
        phone: contactDetails.phone.trim()
      };


      const bookingData = {
        showId: showId,
        seats: seatDetails,
        contactDetails: finalContactDetails
      };


      const response = await api.post('/bookings', bookingData);
      
      // Check if the API call was successful
      if (!response.data || !response.data.success) {
        throw new Error('Booking API returned unsuccessful response');
      }
      
      // Extract booking data
      const booking = response.data.data;
      
      if (!booking) {
        console.error('Full response:', response);
        throw new Error('No booking data received from server');
      }
      
      // Get booking ID with better error handling
      const bookingId = booking._id || booking.id;
      
      if (!bookingId) {
        console.error('Booking object without ID:', booking);
        console.error('Booking object type:', typeof booking);
        console.error('Booking object keys:', Object.keys(booking || {}));
        throw new Error('Booking was created but no ID was returned');
      }
      
      // Success! Navigate to confirmation
      navigate(`/booking/${bookingId}/confirmation`);
    } catch (error) {
      console.error('Booking error:', error); // Debug log
      console.error('Error response:', error.response); // More detailed error info
      console.error('Error response data:', error.response?.data); // Specific server error message
      
      let errorMessage = 'Booking failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Release locked seats in case of booking failure
      try {
        await api.post(`/shows/${showId}/release-seats`, { seats: selectedSeats });
      } catch (releaseError) {
        console.error('Error releasing seats:', releaseError);
      }
      
      // Refresh seats to get latest status
      fetchShowSeats();
    } finally {
      setBooking(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="alert alert-warning">
          Please log in to book seats.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!show) {
    return <div className="container">Show not found</div>;
  }

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>Select Your Seats</h2>
        {show?.movie && (
          <div style={{ color: '#666', marginTop: '0.5rem' }}>
            <h3 style={{ margin: '0.5rem 0' }}>{show.movie.title}</h3>
            <p style={{ margin: '0.25rem 0' }}>
              {show.cinema?.name} • {new Date(show.showDate).toLocaleDateString()} • {show.showTime}
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {isShowPast() && (
        <div className="alert alert-warning">
          ⚠️ This show has already ended. Seat selection is not available.
        </div>
      )}

      <div className="seat-layout">
        <div className="screen"></div>
        
        <div className="seat-grid">
          {seatLayout.map((row, rowIndex) => 
            row.map((seat, colIndex) => {
              const isSelected = selectedSeats.some(s => s.row === seat.row && s.column === seat.column);
              let seatClass = 'seat';
              let title = `${seat.seatNumber} - ₹${seat.price}`;
              let isClickable = true;
              
              // Check if show is in the past
              const showIsPast = isShowPast();
              
              // Debug logging removed
              
              if (showIsPast) {
                seatClass += ' past-show';
                title = `${seat.seatNumber} - Show has ended`;
                isClickable = false;
              } else if (seat.isBooked) {
                seatClass += ' booked';
                title = `${seat.seatNumber} - Permanently Booked`;
                isClickable = false;
              } else if (seat.isTemporarilyBlocked) {
                if (seat.blockedBy && seat.blockedBy.toString() === user?._id?.toString()) {
                  // Current user's locked seat - allow selection
                  seatClass += isSelected ? ' selected' : ' locked-by-me';
                  title = `${seat.seatNumber} - Locked by you - ₹${seat.price}`;
                } else {
                  // Another user's locked seat - not selectable
                  seatClass += ' locked-by-other';
                  title = `${seat.seatNumber} - Temporarily held by another user`;
                  isClickable = false;
                }
              } else if (isSelected) {
                seatClass += ' selected';
              } else {
                seatClass += ' available';
              }
              
              if (seat.seatType === 'premium') {
                seatClass += ' premium';
              }


              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={seatClass}
                  title={title}
                  onClick={isClickable ? () => handleSeatClick(seat) : undefined}
                  style={{
                    cursor: isClickable ? 'pointer' : 'not-allowed',
                    opacity: isClickable ? 1 : 0.6,
                    backgroundColor: !isClickable ? '#ccc' : undefined
                  }}
                >
                  {seat.seatNumber}
                </div>
              );
            })
          )}
        </div>

        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-seat available" style={{ borderColor: '#4caf50', background: '#e8f5e8' }}></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat selected" style={{ borderColor: '#e50914', background: '#e50914' }}></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat booked" style={{ borderColor: '#999', background: '#999', color: '#fff' }}></div>
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat locked-by-other" style={{ borderColor: '#ff9800', background: '#fff3e0', color: '#f57c00' }}></div>
            <span>Held by Others</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat premium" style={{ borderColor: '#ff9800', background: '#fff8e1', color: '#f57c00' }}></div>
            <span>Premium (₹Extra)</span>
          </div>
          {isShowPast() && (
            <div className="legend-item">
              <div className="legend-seat past-show" style={{ borderColor: '#616161', background: '#f5f5f5', color: '#616161' }}></div>
              <span>Show Ended</span>
            </div>
          )}
        </div>
      </div>

      {selectedSeats.length > 0 && !isShowPast() && (
        <div className="booking-summary">
          <h3 style={{ marginBottom: '1rem' }}>Booking Summary</h3>
          
          <div className="summary-item">
            <span>Selected Seats:</span>
            <span>
              {selectedSeats.map(seat => {
                const rowLetter = String.fromCharCode(64 + seat.row);
                return `${rowLetter}${seat.column}`;
              }).join(', ')}
            </span>
          </div>
          
          <div className="summary-item">
            <span>Number of Seats:</span>
            <span>{selectedSeats.length}</span>
          </div>
          
          <div className="summary-item">
            <span>Total Amount:</span>
            <span>₹{calculateTotal()}</span>
          </div>
          
          <button 
            onClick={handleBooking}
            disabled={booking || selectedSeats.length === 0}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '1rem', 
              fontSize: '1.1rem',
              opacity: booking || selectedSeats.length === 0 ? 0.6 : 1
            }}
          >
            {booking ? 'Processing Booking...' : `Book ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''}`}
          </button>
          
          <p style={{ 
            fontSize: '0.9rem', 
            color: '#666', 
            textAlign: 'center', 
            marginTop: '0.5rem' 
          }}>
            Seats will be locked when you click "Book". You'll have 15 minutes to complete payment.
          </p>
        </div>
      )}

      {/* Contact Details Modal */}
      {showContactForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Contact Details</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={contactDetails.name}
                onChange={handleContactDetailsChange}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={contactDetails.email}
                onChange={handleContactDetailsChange}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={contactDetails.phone}
                onChange={handleContactDetailsChange}
                placeholder="10-digit phone number"
                maxLength="10"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowContactForm(false);
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleContactFormSubmit}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Continue Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SeatSelection;