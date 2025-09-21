import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); if (error) clearError(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) { const from = location.state?.from || '/'; navigate(from, { replace: true }); }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit} className="form">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login</h2>
        {error && (<div className="alert alert-error">{error}</div>)}
        <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required/></div>
        <div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required/></div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '1rem' }}>{loading ? 'Logging in...' : 'Login'}</button>
        <p style={{ textAlign: 'center' }}>Don't have an account? <Link to="/register">Sign up</Link></p>
        <div className="alert alert-warning" style={{ marginTop: '2rem' }}><strong>Demo Accounts:</strong><br/>Admin: admin@moviebooking.com / admin123<br/>User: user@moviebooking.com / user123</div>
      </form>
    </div>
  );
}

export default Login;
