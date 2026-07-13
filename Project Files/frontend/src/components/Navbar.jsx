import React from 'react';
import { useAuth } from '../AuthContext';
import { Stethoscope, LogOut, User, Bell } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, notifications, fetchNotifications }) {
  const { user, logout } = useAuth();

  const unreadCount = notifications ? notifications.filter((n) => !n.isRead).length : 0;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Stethoscope size={28} />
        <span>MedConnect</span>
      </div>

      {user && (
        <div className="navbar-menu">
          <span
            className={`navbar-link ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            Dashboard
          </span>

          {user.role === 'patient' && (
            <>
              <span
                className={`navbar-link ${currentTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setCurrentTab('doctors')}
              >
                Find Doctors
              </span>
              <span
                className={`navbar-link ${currentTab === 'documents' ? 'active' : ''}`}
                onClick={() => setCurrentTab('documents')}
              >
                Medical Records
              </span>
            </>
          )}

          {user.role === 'doctor' && (
            <span
              className={`navbar-link ${currentTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setCurrentTab('schedule')}
            >
              My Profile & Slots
            </span>
          )}

          <span
            className={`navbar-link ${currentTab === 'notifications' ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('notifications');
              if (fetchNotifications) fetchNotifications();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <Bell size={18} />
            Notifications
            {unreadCount > 0 && <span className="notif-badge-new" />}
          </span>

          <div className="user-tag">
            <User size={14} />
            <span>
              {user.name} ({user.role})
            </span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
