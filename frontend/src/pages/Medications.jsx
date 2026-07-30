import React, { useState, useEffect } from 'react';
import { Pill, Plus, CheckCircle2, Circle, Clock, Info } from 'lucide-react';
import { api } from '../utils/api';

export default function Medications({ patientId }) {
  const role = localStorage.getItem('role') || 'doctor';
  const currentUserId = role === 'doctor' ? (patientId || '') : localStorage.getItem('patient_id');
  
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [timeOfDay, setTimeOfDay] = useState('Morning');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (currentUserId) {
      loadMedications();
    }
  }, [currentUserId]);

  const loadMedications = async () => {
    setLoading(true);
    try {
      const data = await api.fetchMedications(currentUserId);
      setMedications(data);
    } catch (err) {
      console.error('Failed to fetch medications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!medName || !dosage) return;

    try {
      await api.addMedication(currentUserId, {
        name: medName,
        dosage,
        frequency,
        timeOfDay,
        notes
      });
      setShowModal(false);
      setMedName(''); setDosage(''); setNotes('');
      loadMedications();
    } catch (err) {
      alert('Failed to add medication');
    }
  };

  const handleMarkTaken = async (id) => {
    try {
      await api.updateMedicationStatus(id, 'take', todayStr);
      loadMedications();
    } catch (err) {
      console.error('Failed to mark taken', err);
    }
  };

  const handleDiscontinue = async (id) => {
    if (window.confirm('Are you sure you want to discontinue this medication?')) {
      try {
        await api.updateMedicationStatus(id, 'discontinue', '');
        loadMedications();
      } catch (err) {
        console.error('Failed to discontinue', err);
      }
    }
  };

  const activeMeds = medications.filter(m => m.status === 'Active');
  
  const renderMedicationCard = (med) => {
    const isTaken = med.taken_dates && med.taken_dates.includes(todayStr);

    return (
      <div key={med._id} style={{
        background: '#FFFFFF', padding: '1.5rem', borderRadius: '16px',
        border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '1rem',
        opacity: isTaken ? 0.6 : 1
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isTaken ? '#ECFDF5' : '#FFF7ED', color: isTaken ? '#10B981' : '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Pill size={24} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#1F2937' }}>{med.name}</h4>
          <span style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: 600 }}>{med.dosage} • {med.frequency}</span>
          {med.notes && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}><Info size={12} style={{display:'inline', marginRight:'4px'}}/>{med.notes}</p>}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {role === 'doctor' && (
             <button onClick={() => handleDiscontinue(med._id)} style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
               Discontinue
             </button>
          )}

          <button 
            onClick={() => !isTaken && handleMarkTaken(med._id)}
            disabled={isTaken}
            style={{
              background: isTaken ? '#ECFDF5' : '#F97316',
              color: isTaken ? '#10B981' : '#FFFFFF',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px',
              cursor: isTaken ? 'default' : 'pointer', fontSize: '0.9rem', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
            }}
          >
            {isTaken ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {isTaken ? 'Taken Today' : 'Mark Taken'}
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (title, time) => {
    const meds = activeMeds.filter(m => m.timeOfDay === time);
    if (meds.length === 0) return null;

    return (
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#4B5563', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
          <Clock size={18} /> {title}
        </h3>
        {meds.map(renderMedicationCard)}
      </div>
    );
  };

  if (!currentUserId) {
    return (
      <div className="main-content">
        <div style={{ margin: 'auto', textAlign: 'center', padding: '3rem' }}>
          <Pill size={44} style={{ color: 'var(--brand-accent)', marginBottom: '1rem' }} />
          <h3>No Patient Selected</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Select a patient from the overview to view their medications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ background: '#FFFAFA', minHeight: '100vh', padding: '3rem 4rem' }}>
      <div className="portal-header" style={{ alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <span className="subtitle-label" style={{ color: '#F97316' }}>Daily Health Routine</span>
          <h1 className="title-display">Medications Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem', fontSize: '0.95rem' }}>Track and manage daily prescribed medications.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Medication
        </button>
      </div>

      <div style={{ maxWidth: '900px' }}>
        {loading ? (
          <p>Loading medications...</p>
        ) : activeMeds.length > 0 ? (
          <>
            {renderSection('Morning Routine', 'Morning')}
            {renderSection('Afternoon Routine', 'Afternoon')}
            {renderSection('Evening Routine', 'Evening')}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#FFFFFF', borderRadius: '16px', border: '1px dashed #D1D5DB' }}>
            <Pill size={48} style={{ color: '#D1D5DB', marginBottom: '1rem' }} />
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>No Active Medications</h3>
            <p style={{ color: '#9CA3AF' }}>You have no medications currently logged for today.</p>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setShowModal(true)}>Add Your First Medication</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Add New Medication</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddMedication}>
              <div className="form-group">
                <label>Medication Name</label>
                <input type="text" className="form-input" required value={medName} onChange={e => setMedName(e.target.value)} placeholder="e.g. Aspirin" />
              </div>
              <div className="form-group">
                <label>Dosage</label>
                <input type="text" className="form-input" required value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 81mg" />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Frequency</label>
                  <select className="form-input" value={frequency} onChange={e => setFrequency(e.target.value)}>
                    <option>Daily</option>
                    <option>Twice Daily</option>
                    <option>As Needed</option>
                  </select>
                </div>
                <div>
                  <label>Time of Day</label>
                  <select className="form-input" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Instructions / Notes</label>
                <textarea className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Take with food" rows="2" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                Save Prescription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
