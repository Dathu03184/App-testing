import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, UserPlus, Calculator, Activity, MessageSquare, FileText, User, Calendar, Phone, MapPin, Plus, Heart, Pill, Bell, TrendingUp, Target } from 'lucide-react';

export default function Dashboards({ setActiveTab, setSelectedPatientId, selectedPatientId, onNavigateToPatientRegistration }) {
  const role = localStorage.getItem('role') || 'doctor';
  const name = localStorage.getItem('name') || 'User';
  const currentUserId = role === 'doctor' ? localStorage.getItem('doctor_id') : localStorage.getItem('patient_id');

  // Clinician States
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [clinicianScoresCount, setClinicianScoresCount] = useState(0);

  // Patient States
  const [scoresHistory, setScoresHistory] = useState([]);
  const [rehabProgress, setRehabProgress] = useState(0);
  const [recentReportsCount, setRecentReportsCount] = useState(0);
  const [patientProfile, setPatientProfile] = useState(null);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [alarmForm, setAlarmForm] = useState({ date: '', time: '', note: '' });

  useEffect(() => {
    if (role === 'doctor') {
      loadPatients();
      if (selectedPatientId) {
        loadPatientDetails(selectedPatientId);
      }
    } else {
      loadPatientDetails();
    }
  }, [role, selectedPatientId]);

  // --- Clinician Actions ---
  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.fetchPatients();
      setPatients(Array.isArray(data) ? data : []);
      
      const scoresRes = await api.fetchClinicianScoreCount(currentUserId);
      if (scoresRes && scoresRes.success) {
        setClinicianScoresCount(scoresRes.count || 0);
      }
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (tab, patientId) => {
    setSelectedPatientId(patientId);
    setActiveTab(tab);
  };

  // --- Patient Actions ---
  const loadPatientDetails = async (targetId = null) => {
    const target = targetId || (role === 'doctor' ? selectedPatientId : currentUserId);
    if (!target) return;
    setLoading(true);
    try {
      // Fetch Profile
      const profileRes = await api.validatePatient(target);
      if (profileRes.success) {
        setPatientProfile(profileRes);
      }

      const scoresData = await api.fetchScores(target);
      if (Array.isArray(scoresData)) {
        // Format for Recharts (reverse to get chronological order)
        const sorted = [...scoresData]
          .reverse()
          .map(item => ({
            date: item.assessment_date,
            NIHSS: item.nihss || item.total_score,
            iScore: item.iscore || 0,
            a2ds2: item.a2ds2 || 0
          }));
        setScoresHistory(sorted);
      }

      // Fetch Rehab Progress
      const rehabData = await api.fetchRehab(target);
      if (Array.isArray(rehabData)) {
        const total = rehabData.length;
        const completed = rehabData.filter(item => item.isCompleted).length;
        setRehabProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
      }

      // Fetch Reports count
      const reportsRes = await api.fetchReports(target);
      if (reportsRes.success && Array.isArray(reportsRes.data)) {
        setRecentReportsCount(reportsRes.data.length);
      }
    } catch (err) {
      console.error('Failed to load patient analytics', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Patients Search
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  // ----------------------------------------------------
  // CLINICIAN INTERFACE (OVERVIEW ROSTER)
  // ----------------------------------------------------
  if (role === 'doctor' && !selectedPatientId) {
    return (
      <div className="main-content" style={{ background: 'var(--brand-bg)', minHeight: '100vh', padding: '2rem' }}>
        <div className="portal-header" style={{ alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <span className="subtitle-label">Overview Portal</span>
            <h1 className="title-display">Welcome, Dr. {name.split(' ')[0]}</h1>
            <p style={{ color: 'var(--text-secondary)', fontWeight: '600', marginTop: '0.5rem', fontSize: '0.95rem' }}>Here is your clinical summary and active patient roster for today.</p>
          </div>
          <button className="btn-primary" onClick={onNavigateToPatientRegistration} style={{ padding: '0.8rem 1.5rem', boxShadow: '0 4px 14px rgba(3, 152, 85, 0.3)' }}>
            <UserPlus size={18} />
            Admit New Patient
          </button>
        </div>

        {/* Dashboard Cards Metrics */}
        <div className="clinician-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <div className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.8rem' }}>
            <div style={{ background: 'rgba(3, 152, 85, 0.1)', padding: '1.2rem', borderRadius: '14px', color: 'var(--brand-primary)' }}>
              <User size={32} />
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Patients</span>
              <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '2rem', color: 'var(--brand-secondary)', background: 'none', WebkitTextFillColor: 'var(--brand-secondary)' }}>{patients.length}</h3>
            </div>
          </div>
          
          <div className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.8rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1.2rem', borderRadius: '14px', color: '#EF4444' }}>
              <Activity size={32} />
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Ward Cases</span>
              <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '2rem', color: 'var(--brand-secondary)', background: 'none', WebkitTextFillColor: 'var(--brand-secondary)' }}>{patients.filter(p => p.address?.toLowerCase().includes('ward') || p.age > 60).length}</h3>
            </div>
          </div>

          <div className="metric-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.8rem' }}>
            <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '1.2rem', borderRadius: '14px', color: '#F97316' }}>
              <FileText size={32} />
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessments Logged</span>
              <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '2rem', color: 'var(--brand-secondary)', background: 'none', WebkitTextFillColor: 'var(--brand-secondary)' }}>{clinicianScoresCount}</h3>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // ----------------------------------------------------
  // PATIENT INTERFACE
  // ----------------------------------------------------
  return (
    <div className="main-content" style={{ background: '#FFFAFA', minHeight: '100vh', padding: '3rem 4rem' }}>
      
      {role === 'doctor' && selectedPatientId && (
        <div style={{ marginBottom: '2rem' }}>
          <button className="btn-secondary" onClick={() => setSelectedPatientId('')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: 'bold' }}>
            ← Back to Patient Roster
          </button>
        </div>
      )}

      {/* Mobile App Style Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <span style={{ color: '#10B981', fontWeight: '800', fontSize: '1rem', letterSpacing: '0.5px' }}>Good to see you again</span>
          <h1 style={{ fontSize: '2.8rem', color: '#431407', margin: '0.5rem 0', lineHeight: 1.1, fontWeight: '900' }}>
            Hello,<br />{role === 'doctor' && selectedPatientId ? (patientProfile?.name || 'Patient') : name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.2rem' }}>
            <div style={{ background: '#431407', color: 'white', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={14} /> ID: {patientProfile?.patient_id || selectedPatientId || 'PidXXXXX'}
            </div>
            <span style={{ color: '#10B981', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient Dashboard</span>
          </div>
        </div>
        
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)' }}>
          <User size={40} />
        </div>
      </div>

      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: '1.5rem' }}>MY HEALTH SERVICES</span>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        <div className="health-card-app" onClick={() => setActiveTab('medications')}>
          <div className="hc-icon" style={{ background: '#FFF7ED', color: '#F97316' }}>
            <Pill size={24} />
          </div>
          <h3>Medications</h3>
          <p>Daily Log</p>
        </div>

        <div className="health-card-app" onClick={() => setActiveTab('reports')}>
          <div className="hc-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <FileText size={24} />
          </div>
          <h3>Reports</h3>
          <p>Recent Results</p>
        </div>

        <div className="health-card-app" onClick={() => setActiveTab('rehab')}>
          <div className="hc-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <Activity size={24} />
          </div>
          <h3>Rehab</h3>
          <p>Stay Active</p>
        </div>

        <div className="health-card-app" onClick={() => setShowAlarmModal(true)}>
          <div className="hc-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <Bell size={24} />
          </div>
          <h3>Alerts & Recom...</h3>
          <p>Safety Updates & Alarms</p>
        </div>

        <div className="health-card-app" onClick={() => {
            const el = document.getElementById('health-trends-graph');
            if(el) el.scrollIntoView({ behavior: 'smooth' });
        }}>
          <div className="hc-icon" style={{ background: '#F3F4F6', color: '#4B5563' }}>
            <TrendingUp size={24} />
          </div>
          <h3>Graph</h3>
          <p>Health Trends</p>
        </div>

        <div className="health-card-app" onClick={() => setActiveTab('calculator')}>
          <div className="hc-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
            <Target size={24} />
          </div>
          <h3>View Score</h3>
          <p>Latest NIHSS: {scoresHistory.length > 0 ? scoresHistory[scoresHistory.length - 1].NIHSS : 'N/A'}</p>
        </div>

      </div>

      {/* Analytics charts panel & Existing widgets moved to bottom */}
      <div id="health-trends-graph" style={{ gridTemplateColumns: '1fr', gap: '2rem', display: 'grid', alignItems: 'start' }}>
        <div className="clinical-card">
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="subtitle-label">Risk Stratification Trends</span>
            <h3 style={{ fontSize: '1.3rem', marginTop: '0.2rem' }}>Health Trends Graph</h3>
          </div>
          
          {scoresHistory.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={scoresHistory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-border)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', borderColor: 'var(--brand-border)', fontFamily: 'var(--font-family)', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="NIHSS" stroke="var(--brand-primary)" strokeWidth={3} activeDot={{ r: 8 }} name="NIHSS Score" />
                  <Line type="monotone" dataKey="iScore" stroke="var(--brand-secondary)" strokeWidth={2} name="iScore Mortality" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-bg)', borderRadius: '16px', border: '1px dashed var(--brand-border)', textAlign: 'center', padding: '1rem' }}>
              <Activity size={32} style={{ color: 'var(--brand-accent)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No stratification scores recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Alarm Modal */}
      {showAlarmModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(67,20,7,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="clinical-card" style={{ maxWidth: '400px', width: '90%', background: '#FFFFFF', padding: '2.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="subtitle-label">Notifications</span>
              <h2>Set Patient Alarm</h2>
            </div>
            
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={alarmForm.date} onChange={(e) => setAlarmForm({...alarmForm, date: e.target.value})} style={{ paddingLeft: '1.2rem' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input type="time" className="form-input" value={alarmForm.time} onChange={(e) => setAlarmForm({...alarmForm, time: e.target.value})} style={{ paddingLeft: '1.2rem' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Reminder Note</label>
              <textarea className="form-input" placeholder="E.g., Take medication, Check blood pressure..." value={alarmForm.note} onChange={(e) => setAlarmForm({...alarmForm, note: e.target.value})} style={{ paddingLeft: '1.2rem', minHeight: '80px', resize: 'vertical' }}></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                alert('Alarm set successfully!');
                setShowAlarmModal(false);
                setAlarmForm({ date: '', time: '', note: '' });
              }}>
                Save Alarm
              </button>
              <button className="btn-secondary" style={{ background: '#ECEBEA', color: 'var(--text-primary)' }} onClick={() => setShowAlarmModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .health-card-app {
          background: #FFFFFF;
          padding: 2rem;
          border-radius: 28px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(0,0,0,0.02);
        }
        .health-card-app:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .health-card-app .hc-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .health-card-app h3 {
          font-size: 1.3rem;
          color: #1F2937;
          margin: 0 0 0.3rem 0;
          font-weight: 800;
        }
        .health-card-app p {
          color: #9CA3AF;
          font-weight: 700;
          font-size: 0.85rem;
          margin: 0;
        }
      `}} />

    </div>
  );
}
