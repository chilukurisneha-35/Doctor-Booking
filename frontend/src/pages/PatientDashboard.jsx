import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { 
  Calendar, Clock, User, DollarSign, Activity, FileText, Upload, Plus, Trash, CheckCircle, AlertTriangle 
} from 'lucide-react';

export default function PatientDashboard({ tab, setTab }) {
  const { getAuthHeaders, user } = useAuth();
  
  // States
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // Selection/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  
  // Booking modal states
  const [bookingDoc, setBookingDoc] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  
  // Loading & error handling
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Fetch Appointments
      const aptRes = await fetch('/api/patients/appointments', { headers });
      const aptData = await aptRes.json();
      if (aptData.success) setAppointments(aptData.data);
      
      // Fetch Doctors
      const docRes = await fetch('/api/patients/doctors', { headers });
      const docData = await docRes.json();
      if (docData.success) setDoctors(docData.data);
      
      // Fetch Documents
      const docuRes = await fetch('/api/patients/documents', { headers });
      const docuData = await docuRes.json();
      if (docuData.success) setDocuments(docuData.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelAppointment = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/patients/appointments/${aptId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert('Appointment cancelled successfully.');
        fetchData();
      } else {
        alert(data.message || 'Failed to cancel appointment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBookingModal = (doc) => {
    setBookingDoc(doc);
    setBookingDate(new Date().toISOString().split('T')[0]); // Default to today
    setSelectedSlot('');
    setBookingError('');
    setBookingSuccess('');
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!selectedSlot) {
      setBookingError('Please select a time slot.');
      return;
    }

    try {
      const res = await fetch('/api/patients/appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          doctorId: bookingDoc.user._id,
          date: bookingDate,
          timeSlot: selectedSlot
        })
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess('Appointment booked successfully! Awaiting doctor approval.');
        setTimeout(() => {
          setBookingDoc(null);
          fetchData();
        }, 1500);
      } else {
        setBookingError(data.message || 'Failed to book slot.');
      }
    } catch (err) {
      console.error(err);
      setBookingError('Server connection issue.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return alert('Select file to upload.');
    
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('document', fileToUpload);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/patients/documents', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Document uploaded successfully.');
        setFileToUpload(null);
        fetchData();
      } else {
        alert(data.message || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Filter Doctors list
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialization === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const specializations = ['All', 'General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Neurology', 'Orthopedics', 'Psychiatry'];

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="container">
      {/* 1. Dashboard Tab */}
      {tab === 'dashboard' && (
        <div>
          {/* Header Row */}
          <div className="section-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2>Patient Dashboard</h2>
              <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user.name}. Manage your health appointments.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setTab('doctors')}>
              <Plus size={16} /> Book Appointmemt
            </button>
          </div>

          <div className="main-wrapper" style={{ gridTemplateColumns: '1fr' }}>
            <div className="glass-panel section-card">
              <div className="section-header">
                <h3>My Scheduled Appointments</h3>
              </div>
              
              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>You have no appointments scheduled yet.</p>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={() => setTab('doctors')}>
                    Find a Doctor
                  </button>
                </div>
              ) : (
                <div className="item-list">
                  {appointments.map(apt => (
                    <div key={apt._id} className="list-item">
                      <div className="item-meta">
                        <span className="item-title">Dr. {apt.doctor.name}</span>
                        <span className="item-subtitle" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {apt.doctorProfile ? apt.doctorProfile.specialization : 'Medical Practitioner'}
                        </span>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {apt.date}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {apt.timeSlot}
                          </span>
                        </div>
                        {apt.prescription && (
                          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', borderLeft: '3px solid var(--accent)' }}>
                            <strong>Prescription Notes:</strong> {apt.prescription}
                          </div>
                        )}
                        {apt.notes && (
                          <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <strong>Notes:</strong> {apt.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="item-actions">
                        <span className={`badge badge-${apt.status}`}>
                          {apt.status}
                        </span>
                        {apt.status === 'pending' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancelAppointment(apt._id)}>
                            Cancel
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

      {/* 2. Find Doctors Tab */}
      {tab === 'doctors' && (
        <div>
          <div className="section-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2>Find Healthcare Specialists</h2>
              <p style={{ color: 'var(--text-muted)' }}>Locate and request slots with top certified doctors</p>
            </div>
          </div>

          {/* Search bar options */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name, specialization..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 2 }}
            />
            <select 
              className="form-control" 
              value={selectedSpecialty}
              onChange={e => setSelectedSpecialty(e.target.value)}
              style={{ flex: 1, minWidth: '150px' }}
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Doctor profiles list */}
          {filteredDoctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <User size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No verified doctor profiles found matching criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredDoctors.map(doc => (
                <div key={doc._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem' }}>Dr. {doc.user.name}</h3>
                        <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>{doc.specialization}</span>
                      </div>
                      <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>{doc.experience} Yrs exp</span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', minHeight: '60px' }}>
                      {doc.description || 'Dedicated family healthcare and diagnostic services.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <DollarSign size={14} /> <strong>{doc.hourlyRate}/Hr</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                        ★ {doc.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleOpenBookingModal(doc)}>
                    Book Review Slot
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Medical Records Tab */}
      {tab === 'documents' && (
        <div>
          <div className="section-header" style={{ borderBottom: 'none' }}>
            <div>
              <h2>Medical Document Upload Center</h2>
              <p style={{ color: 'var(--text-muted)' }}>Maintain records, prescriptions, and upload lab reports securely.</p>
            </div>
          </div>

          <div className="main-wrapper">
            {/* List uploads */}
            <div className="glass-panel section-card">
              <div className="section-header">
                <h3>Uploaded Records</h3>
              </div>

              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No files uploaded yet.</p>
                </div>
              ) : (
                <div className="item-list">
                  {documents.map(doc => (
                    <div key={doc._id} className="list-item">
                      <div className="item-meta">
                        <span className="item-title">{doc.originalname}</span>
                        <span className="item-subtitle">
                          Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="item-actions">
                        <a 
                          href={`/uploads/${doc.filename}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          View File
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload component */}
            <div className="glass-panel section-card" style={{ height: 'fit-content' }}>
              <div className="section-header">
                <h3>Add Document</h3>
              </div>

              <form onSubmit={handleFileUpload}>
                <div className="form-group" style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed var(--border-light)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.2)', cursor: 'pointer', position: 'relative' }}>
                  <Upload size={32} style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select PDF, Doc or Image file (Max 5MB)</p>
                  
                  <input 
                    type="file" 
                    required
                    onChange={e => setFileToUpload(e.target.files[0])} 
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
                  />
                  {fileToUpload && (
                    <div style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--primary)' }}>
                      Selected: {fileToUpload.name}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={uploadLoading || !fileToUpload} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  {uploadLoading ? 'Uploading ...' : 'Upload Medical Record'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Booking Dialog Modal */}
      {bookingDoc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setBookingDoc(null)}>✕</button>
            <h3 style={{ marginBottom: '0.5rem' }}>Schedule Appointment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Booking review request with Dr. {bookingDoc.user.name} ({bookingDoc.specialization})
            </p>

            {bookingError && <div className="alert-banner alert-banner-warning">{bookingError}</div>}
            {bookingSuccess && <div className="alert-banner alert-banner-info">{bookingSuccess}</div>}

            <form onSubmit={handleBookAppointment}>
              <div className="form-group">
                <label className="form-label">Consultation Date</label>
                <input 
                  type="date" 
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="form-control" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Available Schedule Slots</label>
                <div className="slot-grid">
                  {bookingDoc.availableSlots && bookingDoc.availableSlots.length > 0 ? (
                    bookingDoc.availableSlots.map(slot => (
                      <button
                        type="button"
                        key={slot}
                        className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No slots configured for this doctor.</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setBookingDoc(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
