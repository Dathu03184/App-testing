import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Activity, Plus, Clock, RotateCcw, AlertCircle, ChevronDown, ChevronUp, CheckCircle, Trash2, Bell, ArrowLeft } from 'lucide-react';

export default function RehabTracker({ patientId, onBack }) {
  const role = localStorage.getItem('role') || 'doctor';
  const currentUserId = role === 'doctor' ? localStorage.getItem('doctor_id') : localStorage.getItem('patient_id');
  const targetPatientId = role === 'doctor' ? patientId : currentUserId;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Add Routine Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    activity_name: '',
    duration: '',
    durationUnit: 'mins',
    frequency: '1',
    timing: 'Morning',
    body_part: 'Full Body',
    notes: '',
    reminders_enabled: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetPatientId) {
      loadActivities();
    }
  }, [targetPatientId]);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchRehab(targetPatientId);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Connection failure. Unable to fetch rehabilitation schedule.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const handleMarkCompleted = async (rehabId) => {
    try {
      const res = await api.updateRehabStatus(rehabId, 'Completed');
      if (res.success) {
        loadActivities();
      }
    } catch (err) {
      console.error('Failed to update rehab status', err);
    }
  };

  const handleDeleteActivity = async (rehabId) => {
    if (!window.confirm('Are you sure you want to delete this rehabilitation routine?')) return;
    try {
      const res = await api.deleteRehab(rehabId);
      if (res.success) {
        loadActivities();
      }
    } catch (err) {
      console.error('Failed to delete routine', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
  };

  const handleAddRoutine = async (e) => {
    e.preventDefault();
    setError(null);
    const { activity_name, duration, durationUnit, frequency, timing, body_part, notes, reminders_enabled } = formData;

    if (!activity_name || activity_name.trim().length < 3) {
      setError('Activity Name must be at least 3 characters.');
      return;
    }

    const durationVal = parseInt(duration);
    if (isNaN(durationVal) || durationVal < 1) {
      setError('Please enter a valid numeric duration.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        patient_id: targetPatientId,
        activity_name: activity_name.trim(),
        duration: `${durationVal} ${durationUnit}`,
        frequency: `${frequency} times`,
        timing,
        body_part,
        notes: notes.trim(),
        reminders_enabled: reminders_enabled ? 1 : 0
      };

      const res = await api.addRehab(payload);
      if (res.success) {
        setShowAddModal(false);
        setFormData({
          activity_name: '',
          duration: '',
          durationUnit: 'mins',
          frequency: '1',
          timing: 'Morning',
          body_part: 'Full Body',
          notes: '',
          reminders_enabled: true
        });
        loadActivities();
      } else {
        setError(res.message || 'Failed to add activity.');
      }
    } catch (err) {
      setError('Server connection failure.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations for progress ring
  const completedCount = activities.filter(act => act.isCompleted).length;
  const totalCount = activities.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="main-content">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'transparent', border: '1px solid var(--brand-border)',
            color: 'var(--text-primary)', padding: '0.4rem 0.9rem', borderRadius: '12px',
            fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', marginBottom: '1rem',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={16} /> Back to Overview
        </button>
      )}
      <div className="portal-header">
        <div>
          <span className="subtitle-label">Daily Exercise Routine</span>
          <h1 className="title-display">Rehab Schedule</h1>
        </div>

        {role === 'doctor' && targetPatientId && (
          <button className="btn-primary" onClick={() => { setShowAddModal(true); setError(null); }}>
            <Plus size={18} />
            Add Rehab Routine
          </button>
        )}
      </div>

      {!targetPatientId ? (
        <div className="clinical-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Activity size={32} style={{ color: 'var(--brand-accent)', marginBottom: '1rem' }} />
          <h3>No Patient Selected</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Go back to Clinician Dashboard to select a patient.</p>
        </div>
      ) : (
        <div className="rehab-progress-container">
          {/* Progress Ring & Exercises list */}
          <div>
            <div className="progress-header-ring" style={{ marginBottom: '2rem' }}>
              <div>
                <span className="subtitle-label" style={{ color: 'var(--brand-primary)' }}>Today's Progress</span>
                <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{progressPercent}% Completed</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{completedCount} of {totalCount} exercises done</p>
              </div>

              <div className="circular-progress">
                <svg>
                  <circle className="bg" cx="50" cy="50" r="40" />
                  <circle 
                    className="bar" 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                  />
                </svg>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading active routines...</p>
              </div>
            ) : (
              <div className="rehab-list">
                {activities.length > 0 ? (
                  activities.map(act => {
                    const isExpanded = expandedCardId === act.id;
                    return (
                      <div className={`rehab-card ${act.isCompleted ? 'completed' : ''}`} key={act.id}>
                        <div className="rehab-main" onClick={() => handleToggleExpand(act.id)}>
                          <div className="rehab-icon">
                            <Activity size={20} />
                          </div>
                          <div className="rehab-card-info">
                            <h4>{act.activity_name}</h4>
                            <div className="rehab-meta">
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={12} /> {act.duration}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><RotateCcw size={12} /> {act.frequency}</span>
                              <span style={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}>{act.timing}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>

                        {isExpanded && (
                          <div className="rehab-details">
                            <h5>Instruction notes</h5>
                            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{act.performance_notes || 'No specific instructions provided.'}</p>
                            
                            <div className="rehab-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.8rem' }}>
                                {!act.isCompleted && role === 'patient' && (
                                  <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => handleMarkCompleted(act.id)}>
                                    Mark Finished
                                  </button>
                                )}
                                {role === 'doctor' && (
                                  <button className="btn-secondary" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--brand-error)', padding: '0.5rem 1.2rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => handleDeleteActivity(act.id)}>
                                    <Trash2 size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                    Delete
                                  </button>
                                )}
                              </div>
                              {act.reminders_enabled && (
                                <span className="status-tag low" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--brand-info)', fontSize: '9px' }}>
                                  <Bell size={10} style={{ marginRight: '3px', display: 'inline' }} />
                                  Push Alerts ON
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', background: '#FFFFFF', border: '1px dashed var(--brand-border)', borderRadius: '24px' }}>
                    <Activity size={32} style={{ color: 'var(--brand-accent)', marginBottom: '0.5rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No exercises routine assigned.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="clinical-card">
              <span className="subtitle-label" style={{ color: 'var(--brand-primary)' }}>Therapeutic Milestones</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', marginBottom: '1.2rem' }}>Rehab Insights</h3>
              <div style={{ background: 'rgba(var(--brand-primary-rgb), 0.04)', border: '1px solid rgba(var(--brand-primary-rgb), 0.1)', padding: '1.2rem', borderRadius: '16px' }}>
                <h4 style={{ color: 'var(--brand-primary)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>AI recovery Tip</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>Based on clinical guidelines for motor recovery, consistency is key. Ensure patient takes a 5-minute rest between exercises and monitors blood pressure levels before therapy sessions.</p>
              </div>
            </div>

            <div className="clinical-card">
              <span className="subtitle-label">Schedule Targets</span>
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-primary)' }}></div>
                <div>
                  <h4 style={{ fontSize: '0.85rem' }}>Morning session focus</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Fine-motor exercises (Hands / Grip)</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand-success)' }}></div>
                <div>
                  <h4 style={{ fontSize: '0.85rem' }}>Evening session focus</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Mobility training (Legs / Walks)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Rehab Routine Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(67,20,7,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="clinical-card" style={{ maxWidth: '500px', width: '90%', margin: '1rem', background: '#FFFFFF', padding: '2.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="subtitle-label">Therapeutic Entry</span>
              <h2>Add Rehab Routine</h2>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddRoutine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Name</label>
                <input type="text" name="activity_name" className="form-input" style={{ paddingLeft: '1.2rem' }} placeholder="e.g. Morning Hand Squeeze" value={formData.activity_name} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input type="number" name="duration" className="form-input" style={{ paddingLeft: '1.2rem', flex: 1 }} placeholder="e.g. 15" value={formData.duration} onChange={handleChange} required />
                    <select name="durationUnit" className="form-select" style={{ width: '80px', padding: '0.8rem 0.5rem' }} value={formData.durationUnit} onChange={handleChange}>
                      <option value="mins">mins</option>
                      <option value="hours">hours</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Frequency (per day)</label>
                  <input type="number" name="frequency" className="form-input" style={{ paddingLeft: '1.2rem' }} min="1" max="10" value={formData.frequency} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Timing session</label>
                  <select name="timing" className="form-select" value={formData.timing} onChange={handleChange}>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Body Part Focus</label>
                  <select name="body_part" className="form-select" value={formData.body_part} onChange={handleChange}>
                    <option value="Hands">Hands/Fingers</option>
                    <option value="Legs">Legs/Ankles</option>
                    <option value="Speech">Speech/Face</option>
                    <option value="Balance">Core/Balance</option>
                    <option value="Full Body">Full Body</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions / Notes</label>
                <textarea name="notes" className="form-input" style={{ paddingLeft: '1.2rem', minHeight: '80px', resize: 'vertical' }} placeholder="Specific details or milestones..." value={formData.notes} onChange={handleChange}></textarea>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
                <input type="checkbox" name="reminders_enabled" id="reminders_enabled" checked={formData.reminders_enabled} onChange={handleChange} />
                <label htmlFor="reminders_enabled" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable Daily Push Reminders</label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Saving routine...' : 'Save Activity'}
                </button>
                <button type="button" className="btn-secondary" style={{ background: '#ECEBEA', color: 'var(--text-primary)' }} onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
