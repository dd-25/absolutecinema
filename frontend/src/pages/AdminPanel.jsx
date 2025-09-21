import React, { useState, useEffect } from 'react';
import api from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [data, setData] = useState({ bookings: [], cinemas: [], movies: [], shows: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [currentEntity, setCurrentEntity] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [screens, setScreens] = useState([]);

  useEffect(() => { let isMounted = true; const loadData = async () => { if (isMounted) await fetchData(activeTab); }; loadData(); return () => { isMounted = false; }; }, [activeTab]);

  const fetchData = async (type) => { try { setLoading(true); setError(''); let endpoint = ''; switch (type) { case 'bookings': endpoint = '/bookings'; break; case 'cinemas': endpoint = '/cinemas'; break; case 'movies': endpoint = '/movies'; break; case 'shows': endpoint = '/shows'; break; default: return; } const response = await api.get(endpoint); const responseData = response.data.data || response.data; setData(prev => ({ ...prev, [type]: Array.isArray(responseData) ? responseData : [] })); } catch (error) { console.error(`Error fetching ${type}:`, error); if (error.response?.status === 401) setError(`Access denied. Admin privileges required to view ${type}.`); else setError(`Failed to load ${type}: ${error.response?.data?.message || error.message}`); } finally { setLoading(false); } };

  // Many admin helpers omitted for brevity - copied from source if needed

  return (
    <div className="container">
      <h1 style={{ margin: '2rem 0' }}>Admin Panel</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>{['bookings', 'cinemas', 'movies', 'shows'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? '#e50914' : 'transparent', color: activeTab === tab ? 'white' : '#333', border: 'none', padding: '1rem 2rem', cursor: 'pointer', borderRadius: '4px 4px 0 0', textTransform: 'capitalize' }}>{tab}</button>))}</div>
      {loading && (<div className="loading"><div className="spinner"></div></div>)}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && (<div>{activeTab === 'bookings' && <div><h2>Bookings</h2></div>}{activeTab === 'cinemas' && <div><h2>Cinemas</h2></div>}{activeTab === 'movies' && <div><h2>Movies</h2></div>}{activeTab === 'shows' && <div><h2>Shows</h2></div>}</div>)}
    </div>
  );
}

export default AdminPanel;
