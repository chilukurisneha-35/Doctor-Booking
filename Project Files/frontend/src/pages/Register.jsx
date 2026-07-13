import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserPlus, User, Mail, Key, ShieldPlus, Clock, DollarSign, BookOpen } from 'lucide-react';

export default function Register({ onToggleLogin }) {
  const { register } = useAuth();
  const [role, setRole] = useState('patient'); // patient, doctor
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('General Medicine');
  const [experience, setExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const registerData = {
      name,
      email,
      password,
      role,
    };

    if (role === 'doctor') {
      registerData.specialization = specialization;
      registerData.experience = Number(experience);
      registerData.hourlyRate = Number(hourlyRate);
      registerData.description = description;

      if (!experience || !hourlyRate) {
        setError('Please fill in experience and experience hourly rates.');
        setLoading(false);
        return;
      }
    }

    try {
      const result = await register(registerData);
      if (result.success) {
        setSuccess('Registration successful!');
        if (role === 'doctor') {
          setSuccess('Doctor registration request submitted! Seeking Admin approval prior to slot active bookings.');
        }
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred. Check backend services.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '550px' }}>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join MedConnect healthcare scheduler platform</p>
        </div>

        {error && <div className="alert-banner alert-banner-warning">{error}</div>}
        {success && <div className="alert-banner alert-banner-info">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role selector tab style */}
          <div className="form-group">
            <label className="form-label">Register As</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                className={`btn ${role === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setRole('patient')}
              >
                Patient
              </button>
              <button
                type="button"
                className={`btn ${role === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setRole('doctor')}
              >
                Doctor Profile
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                required
                className="form-control"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Key
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="password"
                required
                className="form-control"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {role === 'doctor' && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Professional Details</h4>

              <div className="form-group">
                <label className="form-label">Specialization</label>
                <div style={{ position: 'relative' }}>
                  <ShieldPlus
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '12px',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <select
                    className="form-control"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    style={{ paddingLeft: '40px' }}
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <div style={{ position: 'relative' }}>
                    <Clock
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '12px',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      className="form-control"
                      placeholder="e.g. 8"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Consultation Rate ($/hr)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '12px',
                        color: 'var(--text-muted)',
                      }}
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      className="form-control"
                      placeholder="e.g. 100"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Personal Statement / Bio</label>
                <div style={{ position: 'relative' }}>
                  <BookOpen
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '12px',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <textarea
                    className="form-control"
                    placeholder="Describe your medical background, patient focus, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ paddingLeft: '40px', minHeight: '80px', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? (
              'Creating your Account...'
            ) : (
              <>
                <UserPlus size={18} />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="auth-toggle">
          Already have an account?{' '}
          <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={onToggleLogin}>
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}
