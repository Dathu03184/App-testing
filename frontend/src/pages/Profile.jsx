import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  User, Mail, Phone, MapPin, Calendar, ShieldCheck, 
  Trash2, AlertTriangle, Clock, Hash, ShieldAlert, CheckCircle
} from 'lucide-react';

export default function Profile({ patientId }) {
  // If patientId is provided, force view to that patient's profile
  const isViewingPatient = !!patientId;
  const role = isViewingPatient ? 'patient' : (localStorage.getItem('role') || 'doctor');
  const userId = isViewingPatient ? patientId : (role === 'doctor' ? localStorage.getItem('doctor_id') : localStorage.getItem('patient_id'));

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Account Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchProfileDetails();
  }, [role, userId]);

  const fetchProfileDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (role === 'doctor') {
        res = await api.validateClinician(userId);
      } else {
        res = await api.validatePatient(userId);
      }

      if (res.success) {
        setProfileData(res);
      } else {
        setError(res.message || 'Failed to retrieve profile details.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure. Unable to contact database.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      let initialDob = profileData?.dob || profileData?.date_of_birth || '';
      if (initialDob && initialDob.includes('T')) {
        initialDob = new Date(initialDob).toLocaleDateString('en-CA');
      }

      setEditForm({
        name: profileData?.name || name,
        email: profileData?.email || '',
        phone: profileData?.phone || '',
        address: profileData?.address || '',
        dob: initialDob,
        age: profileData?.age || '',
        gender: profileData?.gender || ''
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleSaveProfile = async () => {
    setSaveLoading(true);
    setSuccess(null);
    try {
      const res = await api.updateProfile(userId, role, editForm);
      if (res.success) {
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 4000);
        fetchProfileDetails(); // reload data
        // Update local storage if we are editing our own profile
        if (!isViewingPatient) {
          if (editForm.name) localStorage.setItem('name', editForm.name);
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      let res;
      if (role === 'doctor') {
        res = await api.deleteClinician(userId);
      } else {
        res = await api.deletePatientAccount(userId);
      }

      if (res.success) {
        // Logout user completely
        localStorage.clear();
        window.location.reload();
      } else {
        setDeleteError(res.message || 'Failed to delete account. Please try again.');
        setDeleteLoading(false);
      }
    } catch (err) {
      setDeleteError('Connection failure. Unable to contact server.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid var(--brand-border)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading profile information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content" style={{ padding: '2rem' }}>
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
        <button className="btn-primary" onClick={fetchProfileDetails} style={{ marginTop: '1rem' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ background: 'var(--brand-bg)', minHeight: '100vh', padding: '2rem' }}>
      
      {/* Header Banner */}
      <div className="portal-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <span className="subtitle-label">Credentials & Access</span>
          <h1 className="title-display">My Profile</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Card: Summary & Quick Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="clinical-card" style={{ textAlign: 'center', padding: '2.5rem 1.8rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: '90px', 
              height: '90px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(3, 152, 85, 0.08)', 
              color: 'var(--brand-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '1.2rem',
              border: '2px solid rgba(3, 152, 85, 0.15)'
            }}>
              <User size={42} />
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--brand-secondary)', margin: '0 0 0.2rem 0' }}>
              {profileData?.name || name}
            </h2>
            <p style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
              {role === 'doctor' ? 'Authorized Clinician' : 'Registered Patient'}
            </p>
            
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              background: 'rgba(3, 152, 85, 0.08)', 
              color: 'var(--brand-primary)', 
              padding: '0.35rem 1rem', 
              borderRadius: '50px',
              fontSize: '0.78rem',
              fontWeight: '700'
            }}>
              <ShieldCheck size={14} />
              <span>Active Account</span>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="clinical-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--brand-secondary)', borderBottom: '1px solid var(--brand-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              System Access Details
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>System Role</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', textTransform: 'capitalize' }}>{role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Username</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>{profileData?.username || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unique ID</span>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--brand-primary)' }}>{userId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Full Credentials Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="clinical-card" style={{ padding: '2rem' }}>
            {success && (
              <div className="success-banner" style={{ display: 'flex', gap: '0.8rem', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', padding: '1.2rem', borderRadius: '16px', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--brand-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Personal Identity & Credentials
              </h2>
              {!isEditing ? (
                <button className="btn-secondary" onClick={handleEditToggle} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" onClick={handleEditToggle} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={saveLoading}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSaveProfile} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={saveLoading}>
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              
              {/* Field 1: Unique ID */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(249, 115, 22, 0.08)', color: '#F97316',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Hash size={18} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {role === 'doctor' ? 'Clinician ID' : 'Patient ID'}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {userId}
                  </h4>
                </div>
              </div>

              {/* Field 2: Full Legal Name */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <User size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Full Legal Name
                  </span>
                  {isEditing ? (
                    <input className="form-input" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} style={{ marginTop: '0.3rem', padding: '0.4rem', fontSize: '0.9rem' }} />
                  ) : (
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {profileData?.name || name}
                    </h4>
                  )}
                </div>
              </div>

              {/* Field 3: Birth Record */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Calendar size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Date of Birth (DOB)
                  </span>
                  {isEditing ? (
                    <input type="date" className="form-input" value={(() => {
                      if (!editForm.dob) return '';
                      if (editForm.dob.includes('T')) return new Date(editForm.dob).toLocaleDateString('en-CA');
                      return editForm.dob;
                    })()} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} style={{ marginTop: '0.3rem', padding: '0.4rem', fontSize: '0.9rem' }} />
                  ) : (
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {(() => {
                        const dob = profileData?.dob || profileData?.date_of_birth;
                        if (!dob) return 'N/A';
                        if (dob.includes('T')) {
                           return new Date(dob).toLocaleDateString('en-CA');
                        }
                        return dob;
                      })()}
                    </h4>
                  )}
                </div>
              </div>

              {/* Field 4: Demographics */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <User size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Demographics
                  </span>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                      <input type="number" placeholder="Age" className="form-input" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: e.target.value})} style={{ padding: '0.4rem', fontSize: '0.9rem', width: '80px' }} />
                      <select className="form-input" value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} style={{ padding: '0.4rem', fontSize: '0.9rem', flex: 1 }}>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  ) : (
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {profileData?.age ? `${profileData.age} Yrs` : 'N/A'} • {profileData?.gender || 'N/A'}
                    </h4>
                  )}
                </div>
              </div>

              {/* Field 5: Email Address */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Mail size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Email Address
                  </span>
                  {isEditing ? (
                    <input type="email" className="form-input" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} style={{ marginTop: '0.3rem', padding: '0.4rem', fontSize: '0.9rem' }} />
                  ) : (
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem', wordBreak: 'break-all' }}>
                      {profileData?.email || 'N/A'}
                    </h4>
                  )}
                </div>
              </div>

              {/* Field 6: Phone Number */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Phone size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Phone Number
                  </span>
                  {isEditing ? (
                    <input type="tel" className="form-input" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} style={{ marginTop: '0.3rem', padding: '0.4rem', fontSize: '0.9rem' }} />
                  ) : (
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {profileData?.phone || 'N/A'}
                    </h4>
                  )}
                </div>
              </div>

              {/* Field 7: Clinical Address / Location */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <MapPin size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {role === 'doctor' ? 'Clinical Address' : 'Home Location'}
                  </span>
                  {isEditing ? (
                    <input className="form-input" value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} style={{ marginTop: '0.3rem', padding: '0.4rem', fontSize: '0.9rem' }} />
                  ) : (
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                      {profileData?.address || 'N/A'}
                    </h4>
                  )}
                </div>
              </div>

              {/* Field 8: Registration Date */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  backgroundColor: 'rgba(3, 152, 85, 0.08)', color: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  <Clock size={18} />
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Registration Date
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {profileData?.createdAt || profileData?.created_at ? 
                      new Date(profileData.createdAt || profileData.created_at).toLocaleString() : 'N/A'}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access Block */}
          <div className="clinical-card" style={{ padding: '2rem', border: '1px solid rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.01)' }}>
            <h3 style={{ fontSize: '1rem', color: '#B91C1C', marginBottom: '0.5rem', fontWeight: '800' }}>
              Security & Access Actions
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
              Permanently delete your clinician account and credential keys from the database. This action is destructive and irreversible.
            </p>

            <button 
              type="button" 
              className="btn-primary" 
              style={{ 
                backgroundColor: '#DC2626', 
                backgroundImage: 'none', 
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                fontSize: '0.9rem',
                fontWeight: '700',
                padding: '0.8rem 1.6rem',
                cursor: 'pointer'
              }}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={16} />
              Delete Credentials
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal confirmation overlay */}
      {showDeleteModal && (
        <div 
          className="terms-modal-backdrop"
          onClick={() => setShowDeleteModal(false)}
          style={{ zIndex: 3000 }}
        >
          <div 
            className="terms-modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '480px', border: '2px solid rgba(239, 68, 68, 0.2)', padding: '2.5rem 2rem' }}
          >
            <button 
              type="button" 
              className="terms-close-btn"
              onClick={() => setShowDeleteModal(false)}
              aria-label="Close modal"
              style={{ top: '1rem', right: '1rem' }}
            >
              &times;
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                backgroundColor: '#FEF2F2', color: '#EF4444', 
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1rem', border: '1px solid #FCA5A5'
              }}>
                <ShieldAlert size={32} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#991B1B', margin: 0 }}>
                Permanently Delete Account?
              </h2>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', textAlign: 'center', marginBottom: '2rem', fontWeight: 600 }}>
              Are you sure you want to delete account <strong style={{ color: 'var(--text-primary)' }}>{userId}</strong>? 
              This will remove all account access keys, registered logs, and credentials from the system permanently. This action is irreversible.
            </p>

            {deleteError && (
              <div className="error-banner" style={{ margin: '0 0 1.5rem 0' }}>
                <AlertTriangle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ flex: 1, backgroundColor: '#E2E8F0', color: '#334155', boxShadow: 'none', padding: '0.8rem' }}
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              
              <button 
                type="button" 
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: '#DC2626', backgroundImage: 'none', padding: '0.8rem' }}
                onClick={handleDeleteAccountSubmit}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
