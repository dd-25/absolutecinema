import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_ERROR: 'REGISTER_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER'
};

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return { ...state, loading: false, user: action.payload.user, token: action.payload.token, isAuthenticated: true, error: null };
    case AUTH_ACTIONS.LOGIN_ERROR:
    case AUTH_ACTIONS.REGISTER_ERROR:
      return { ...state, loading: false, user: null, token: null, isAuthenticated: false, error: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { ...initialState };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case AUTH_ACTIONS.SET_USER:
      return { ...state, user: action.payload.user, token: action.payload.token, isAuthenticated: true };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { user: parsedUser, token } });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await api.post('/users/login', credentials);
      const userData = response.data.data;
      const token = userData.token;
      const user = { _id: userData._id, name: userData.name, email: userData.email, phone: userData.phone, role: userData.role };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, token } });
      return { success: true, user, token };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    try {
      const response = await api.post('/users/register', userData);
      const registrationData = response.data.data;
      const token = registrationData.token;
      const user = { _id: registrationData._id, name: registrationData.name, email: registrationData.email, phone: registrationData.phone, role: registrationData.role };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: { user, token } });
      return { success: true, user, token };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.REGISTER_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  const clearError = () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

  const updateProfile = async (updateData) => {
    try {
      const response = await api.put('/users/profile', updateData);
      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { user: updatedUser, token: state.token } });
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const getContactDetails = () => {
    if (!state.user) return null;
    return { name: state.user.name || '', email: state.user.email || '', phone: state.user.phone || '' };
  };

  const hasCompleteContactDetails = () => {
    const contact = getContactDetails();
    if (!contact) return false;
    return !!(contact.name && contact.email && contact.phone && /^[0-9]{10}$/.test(contact.phone) && /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(contact.email));
  };

  const value = { user: state.user, token: state.token, loading: state.loading, error: state.error, isAuthenticated: state.isAuthenticated, login, register, logout, clearError, updateProfile, getContactDetails, hasCompleteContactDetails };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
