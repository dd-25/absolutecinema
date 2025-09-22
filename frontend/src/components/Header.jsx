import React from 'react';
import { Link } from 'react-router-dom';

function Header({ user, logout }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            MovieBooking
          </Link>
          
          <nav>
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              {user && <li><Link to="/bookings">My Bookings</Link></li>}
              {user?.role === 'admin' && <li><Link to="/admin">Admin</Link></li>}
            </ul>
          </nav>
          
          <div className="auth-buttons">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Welcome, {user.name}</span>
                <button onClick={logout} className="btn btn-secondary">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;