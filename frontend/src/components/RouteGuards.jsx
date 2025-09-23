import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth({ children }) {
  const { isAuthenticated, loading, initialized } = useAuth();
  const loc = useLocation();
  if (!initialized) return <div className="loading"><div className="spinner" /></div>;
  // Pass full location object so login can reconstruct pathname + search + hash
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { isAuthenticated, loading, user, initialized } = useAuth();
  const loc = useLocation();
  if (!initialized) return <div className="loading"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export function PublicOnly({ children }) {
  const { isAuthenticated, loading, initialized } = useAuth();
  if (!initialized) return <div className="loading"><div className="spinner" /></div>;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}
