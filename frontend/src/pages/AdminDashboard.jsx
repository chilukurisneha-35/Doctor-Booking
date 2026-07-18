import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { 
  Users, UserCheck, Calendar, ShieldCheck, Heart, Trash2, Award, ClipboardList 
} from 'lucide-react';

export default function AdminDashboard() {
  const { getAuthHeaders } = useAuth();
  
  // States
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Fetch Stats
      const statsRes = await fetch('/api/admins/stats', { headers });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch All Doctors
      const docsRes = await fetch('/api/admins/doctors/all', { headers });
      const docsData = await docsRes.json();
      if (docsData.success) setDoctors(docsData.data);
    } catch (err) {
      console.error('Error fetching admin dashboard fields:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveDoctor = async (profileId) => {
    if (!window.confirm('Are you sure you want to approve this doctor credentials?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admins/doctors/${profileId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert('Doctor registration approved successfully.');
        fetchAdminData();
      } else {
        alert(data.message || 'Approval failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoctor = async (profileId) => {
    if (!window.confirm('Are you sure you want to REJECT and DELETE this doctor profile? This action will purge corresponding login records.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admins/doctors/${profileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert('Doctor profile deleted successfully.');
        fetchAdminData();
      } else {
        alert(data.message || 'Deletion failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  // Filter pending and approved doctors
  const pendingDoctors = doctors.filter(doc => !doc.isApproved);
  const approvedDoctors = doctors.filter(doc => doc.isApproved);

  return (
    <div className="container">
      {/* Header */}
      <div className="section-header" style={{ borderBottom: 'none' }}>
        <div>
          <h2>System Administration Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor system-wide metrics and review doctor registration profiles</p>
        </div>
      </div>

      {/* Stats Counter Row */}
      {stats && (
        <div className="dashboard-grid">
          <div className="glass-panel stats-card">
            <div className="stats-icon"><Users /></div>
            <div className="stats-info">
              <span className="stats-value">{stats.totalPatients}</span>
              <span className="stats-label">Registered Patients</span>
            </div>
          </div>

          <div className="glass-panel stats-card">
            <div className="stats-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--secondary)' }}><UserCheck /></div>
            <div className="stats-info">
              <span className="stats-value">{stats.totalDoctors}</span>
              <span className="stats-label">Total Doctor Profiles</span>
            </div>
          </div>

          <div className="glass-panel stats-card">
            <div className="stats-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)' }}><Calendar /></div>
            <div className="stats-info">
              <span className="stats-value">{stats.totalAppointments}</span>
              <span className="stats-label">Active Bookings</span>
            </div>
          </div>

          <div className="glass-panel stats-card">
            <div className="stats-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}><ClipboardList /></div>
            <div className="stats-info">
              <span className="stats-value">{stats.totalDocuments}</span>
              <span className="stats-label">Medical Records</span>
            </div>
          </div>
        </div>
      )}

      {/* Split view: Pending doctor reviews & All active practitioners */}
      <div className="main-wrapper" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        {/* Pending approvals section */}
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Pending Doctor Registrations ({pendingDoctors.length})</h3>
          </div>

          {pendingDoctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No doctor applications are pending review.</p>
            </div>
          ) : (
            <div className="item-list">
              {pendingDoctors.map(doc => (
                <div key={doc._id} className="list-item" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="item-meta">
                    <span className="item-title">Dr. {doc.user?.name || 'Unknown'}</span>
                    <span className="item-subtitle" style={{ color: 'var(--primary)', fontWeight: 600 }}>{doc.specialization}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Experience: {doc.experience} Years | Rate: ${doc.hourlyRate}/Hr
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Email: {doc.user?.email || 'N/A'}
                    </span>
                    {doc.description && (
                      <p style={{ marginTop: '5px', fontSize: '0.8rem', fontStyle: 'italic', background: 'rgba(15, 23, 42, 0.25)', padding: '5px', borderRadius: '4px' }}>
                        Bio: "{doc.description}"
                      </p>
                    )}
                  </div>

                  <div className="item-actions" style={{ width: '100%', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '5px' }}>
                    <button 
                      className="btn btn-success btn-sm"
                      disabled={actionLoading}
                      onClick={() => handleApproveDoctor(doc._id)}
                    >
                      Approve Doctor
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      disabled={actionLoading}
                      onClick={() => handleRejectDoctor(doc._id)}
                    >
                      Decline & Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Active Doctors */}
        <div className="glass-panel section-card">
          <div className="section-header">
            <h3>Registered Practitioners ({approvedDoctors.length})</h3>
          </div>

          {approvedDoctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Heart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No approved doctors registered yet.</p>
            </div>
          ) : (
            <div className="item-list">
              {approvedDoctors.map(doc => (
                <div key={doc._id} className="list-item">
                  <div className="item-meta">
                    <span className="item-title">Dr. {doc.user?.name || 'Unknown'}</span>
                    <span className="item-subtitle" style={{ color: 'var(--accent)', fontWeight: 600 }}>{doc.specialization}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Rating: ★ {doc.rating.toFixed(1)} | fees: ${doc.hourlyRate}/Hr
                    </span>
                  </div>

                  <div className="item-actions">
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRejectDoctor(doc._id)}
                      style={{ padding: '0.3rem' }}
                      title="De-register doctor profile"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
