import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Bell, Heart, CheckCircle2, MessageSquare } from 'lucide-react';

function AppContent() {
  const { user, loading, getAuthHeaders } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user || user.role === 'admin') return; // Admin notifications are omitted for simplicity
    setNotifLoading(true);
    try {
      const endpoint = user.role === 'patient' 
        ? '/api/patients/notifications' 
        : '/api/doctors/notifications';
        
      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set default tab on login
      setCurrentTab('dashboard');
    }
  }, [user]);

  const handleMarkAsRead = async (notifId) => {
    try {
      const endpoint = user.role === 'patient'
        ? `/api/patients/notifications/${notifId}/read`
        : `/api/doctors/notifications/${notifId}/read`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="spinner" style={{ marginTop: '20vh' }}></div>;
  }

  // Not logged in: show Login/Register Page
  if (!user) {
    return isRegister ? (
      <Register onToggleLogin={() => setIsRegister(false)} />
    ) : (
      <Login onToggleRegister={() => setIsRegister(true)} />
    );
  }

  return (
    <div>
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        notifications={notifications}
        fetchNotifications={fetchNotifications}
      />

      <main>
        {/* Dashboard Tabs for Patient */}
        {user.role === 'patient' && (
          <>
            {['dashboard', 'doctors', 'documents'].includes(currentTab) && (
              <PatientDashboard tab={currentTab} setTab={setCurrentTab} />
            )}
          </>
        )}

        {/* Dashboard Tabs for Doctor */}
        {user.role === 'doctor' && (
          <>
            {['dashboard', 'schedule'].includes(currentTab) && (
              <DoctorDashboard tab={currentTab} setTab={setCurrentTab} />
            )}
          </>
        )}

        {/* Dashboard Tabs for Admin */}
        {user.role === 'admin' && currentTab === 'dashboard' && (
          <AdminDashboard />
        )}

        {/* Unified Notifications view (For patients & doctors) */}
        {currentTab === 'notifications' && (
          <div className="container">
            <div className="section-header" style={{ borderBottom: 'none' }}>
              <div>
                <h2>Alert & Message Notifications</h2>
                <p style={{ color: 'var(--text-muted)' }}>Keep track of booking approval updates and appointment notes</p>
              </div>
            </div>

            <div className="glass-panel section-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="section-header">
                <h3>Inbox Log</h3>
                {notifications.some(n => !n.isRead) && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>You have unread updates</span>
                )}
              </div>

              {notifLoading ? (
                <div className="spinner"></div>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>You have no notifications at this time.</p>
                </div>
              ) : (
                <div className="item-list">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className="list-item"
                      style={{ 
                        borderLeft: notif.isRead ? '1px solid var(--border-light)' : '4px solid var(--primary)',
                        background: notif.isRead ? 'rgba(15, 23, 42, 0.2)' : 'rgba(6, 182, 212, 0.05)'
                      }}
                    >
                      <div className="item-meta">
                        <span className="item-title" style={{ fontWeight: notif.isRead ? 400 : 700 }}>
                          {notif.message}
                        </span>
                        <span className="item-subtitle">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {!notif.isRead && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMarkAsRead(notif._id)}
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
