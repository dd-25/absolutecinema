import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';

export default function MainLayout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <Header user={user} logout={logout} />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
