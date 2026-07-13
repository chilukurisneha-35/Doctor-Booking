import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { 
  Calendar, Clock, User, Shield, DollarSign, Activity, FileText, CheckCircle, XCircle, FileClock, Edit 
} from 'lucide-react';

export default function DoctorDashboard({ tab, setTab }) {
  const { getAuthHeaders, user, setUser } = useAuth();

  // States
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  
  // Edit Profile States
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [description, setDescription] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  // Selected Action Appointment
  const [selectedApt, setSelectedApt] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  // Selected patient documents Modal
  const [selectedPatientDocs, setSelectedPatientDocs] = useState(null); // { patientId, name, docs: [] }
  
  // Loading flags
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  const defaultSlotsList = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Fetch Appointments
      const aptRes = await fetch('/api/doctors/appointments', { headers });
      const aptData = await aptRes.json();
      if (aptData.success) setAppointments(aptData.data);

      // Fetch Profile
      const profRes = await fetch('/api/doctors/profile', { headers });
      const profData = await profRes.json();
      if (profData.success) {
        setProfile(profData.data);
        setSpecialization(profData.data.specialization);
        setExperience(profData.data.experience);
        setHourlyRate(profData.data.hourlyRate);
        setDescription(profData.data.description || '');
        setAvailableSlots(profData.data.availableSlots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!actionStatus) return;

    try {
      const res = await fetch(`/api/doctors/appointments/${selectedApt._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: actionStatus,
          prescription: actionStatus === 'completed' ? prescription : undefined,
          notes: notes
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Appointment updated successfully.');
        setSelectedApt(null);
        setPrescription('');
        setNotes('');
        fetchData();
      } else {
        alert(data.message || 'Failed to update appointment.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFetchPatientDocs = async (patientId, patientName) => {
    try {
      const res = await fetch(`/api/doctors/patients/${patientId}/documents`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPatientDocs({
          patientId,
          name: patientName,
          docs: data.data
        });
      } else {
        alert(data.message || 'Access denied or error fetching patient documents.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching documents.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);

    try {
      const res = await fetch('/api/doctors/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          specialization,
          experience: Number(experience),
          hourlyRate: Number(hourlyRate),
          description,
          availableSlots
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile details updated successfully.');
        setProfile(data.data);
        
        // Update user state context
        setUser(prev => ({
          ...prev,
          doctorProfile: data.data
        }));
      } else {
        alert(data.message || 'Update failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSlotToggle = (slot) => {
    if (availableSlots.includes(slot)) {
      setAvailableSlots(prev => prev.filter(s => s !== slot));
    } else {
      setAvailableSlots(prev => [...prev, slot]);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  // Check if doctor registration approved by admin
  const isApproved = profile && profile.isApproved;

  return (
    <div className="container">
      {/* Pending Account Alert Banner */}
      {!isApproved && (
        <div className="alert-banner alert-banner-warning">
          <Shield size={20} />
          <div>
            <strong>Registration Pending Approval:</strong> Your credentials are currently being reviewed by the administration. 
            Once approved, you will be able to set consultation slots and receive bookings.
          </div>
        </div>
      )}

      {/* 1. Dashboard Tab */}
      {tab === 'dashboard' && (
        <div>
          <div className="section-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2>Doctor Portal Dashboard</h2>
              <p style={{ color: 'var(--text-muted)' }}>Welcome Dr. {user.name}. Manage patient requests.</p>
            </div>
            {isApproved && (
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('schedule')}>
                <Edit size={14} /> Edit Availability
              </button>
            )}
          </div>

          <div className="main-wrapper" style={{ gridTemplateColumns: '1fr' }}>
            <div className="glass-panel section-card">
              <div className="section-header">
                <h3>Appointments List</h3>
              </div>

              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No patient appointments scheduled yet.</p>
                </div>
              ) : (
                <div className="item-list">
                  {appointments.map(apt => (
                    <div key={apt._id} className="list-item">
                      <div className="item-meta">
                        <span className="item-title">Patient: {apt.patient.name}</span>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {apt.date}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {apt.timeSlot}
                          </span>
                        </div>
                        {apt.prescription && (
                          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px', borderLeft: '3px solid var(--secondary)' }}>
                            <strong>Prescription:</strong> {apt.prescription}
                          </div>
                        )}
                        {apt.notes && (
                          <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <strong>Diagnostic Notes:</strong> {apt.notes}
                          </div>
                        )}
                      </div>

                      <div className="item-actions">
                        <span className={`badge badge-${apt.status}`}>
                          {apt.status}
                        </span>

                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleFetchPatientDocs(apt.patient._id, apt.patient.name)}
                        >
                          <FileText size={14} /> Medical History
                        </button>

                        {apt.status === 'pending' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setSelectedApt(apt);
                              setActionStatus('approved');
                            }}
                          >
                            Approve
                          </button>
                        )}

                        {apt.status === 'approved' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedApt(apt);
                              setActionStatus('completed');
                            }}
                          >
                            Complete Consultation
                          </button>
                        )}

                        {['pending', 'approved'].includes(apt.status) && (
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setSelectedApt(apt);
                              setActionStatus('cancelled');
                            }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Schedule & profile Tab */}
      {tab === 'schedule' && profile && (
        <div>
          <div className="section-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2>Availability & Practitioner Profile</h2>
              <p style={{ color: 'var(--text-muted)' }}>Tailor specializations, bio details, and time booking blocks</p>
            </div>
          </div>

          <div className="main-wrapper" style={{ gridTemplateColumns: '2fr 1fr' }}>
            {/* Edit details form */}
            <div className="glass-panel section-card">
              <div className="section-header">
                <h3>Profile Details</h3>
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Medical Specialization</label>
                  <select 
                    className="form-control"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Psychiatry">Psychiatry</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Years Experience</label>
                    <input 
                      type="number" 
                      required 
                      className="form-control" 
                      value={experience}
                      onChange={e => setExperience(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consultation Rate ($/hr)</label>
                    <input 
                      type="number" 
                      required 
                      className="form-control" 
                      value={hourlyRate}
                      onChange={e => setHourlyRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Practitioner Bio / Experience Notes</label>
                  <textarea 
                    className="form-control" 
                    rows="4"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ minHeight: '100px', fontFamily: 'inherit' }}
                  />
                </div>

                {isApproved && (
                  <div className="form-group" style={{ marginTop: '1.5rem' }}>
                    <label className="form-label">Active Availability slots</label>
                    <div className="slot-grid">
                      {defaultSlotsList.map(slot => {
                        const isChecked = availableSlots.includes(slot);
                        return (
                          <button
                            type="button"
                            key={slot}
                            className={`slot-btn ${isChecked ? 'selected' : ''}`}
                            onClick={() => handleSlotToggle(slot)}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={profileSaving} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Settings'}
                </button>
              </form>
            </div>

            {/* Profile Overview card */}
            <div className="glass-panel section-card" style={{ height: 'fit-content' }}>
              <div className="section-header">
                <h3>Quick Overview</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>Consultation Fees</label>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>${profile.hourlyRate} / Hr</div>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>Specialization</label>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>{profile.specialization}</div>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>Approved Status</label>
                  <span className={`badge ${profile.isApproved ? 'badge-approved' : 'badge-pending'}`}>
                    {profile.isApproved ? 'Approved' : 'Pending Administrative Review'}
                  </span>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 0 }}>Configured Slots</label>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {availableSlots.length} slots active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Resolution Modal (Approval/Rejection/Prescription) */}
      {selectedApt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSelectedApt(null)}>✕</button>
            <h3>Update Appointment Session</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Patient: {selectedApt.patient.name} | Slot: {selectedApt.date} at {selectedApt.timeSlot}
            </p>

            <form onSubmit={handleUpdateStatus}>
              {actionStatus === 'completed' && (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <div className="form-group">
                    <label className="form-label">Medical Prescription (Drugs, dosages, schedule)</label>
                    <textarea 
                      required
                      className="form-control"
                      placeholder="e.g. Paracetamol 500mg, 1 tablet thrice daily for 3 days"
                      value={prescription}
                      onChange={e => setPrescription(e.target.value)}
                      style={{ minHeight: '80px', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Diagnostic Notes / Internal Summary</label>
                <textarea 
                  className="form-control"
                  placeholder="Record summary details of this session (can be review notes) ..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedApt(null)}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Confirm {actionStatus.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Documents Modal */}
      {selectedPatientDocs && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <button className="modal-close" onClick={() => setSelectedPatientDocs(null)}>✕</button>
            <h3>Medical History Records</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Records for patient: <strong>{selectedPatientDocs.name}</strong>
            </p>

            {selectedPatientDocs.docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <FileClock size={42} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No documents uploaded by this patient or permission revoked.</p>
              </div>
            ) : (
              <div className="item-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {selectedPatientDocs.docs.map(doc => (
                  <div key={doc._id} className="list-item">
                    <div className="item-meta">
                      <span className="item-title">{doc.originalname}</span>
                      <span className="item-subtitle">
                        Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                    <a 
                      href={`/uploads/${doc.filename}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      View Report
                    </a>
                  </div>
                ))}
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '1.5rem' }} 
              onClick={() => setSelectedPatientDocs(null)}
            >
              Close History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
