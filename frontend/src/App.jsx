import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import AiChatWidget from './components/AiChatWidget';
import Login from './pages/Login';
import Dashboards from './pages/Dashboards';
import Calculator from './pages/Calculator';
import RehabTracker from './pages/RehabTracker';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar.jsx';
import Medications from './pages/Medications';

// Global Stylesheet imports
import './styles/theme.css';
import './styles/auth.css';
import './styles/portal.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loginProps, setLoginProps] = useState({ mode: 'login', role: 'doctor' });

  // Check login state on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    window.location.hash = '';
  };

  const handleNavigateToPatientRegistration = () => {
    setActiveTab('patient-registration');
  };

  if (!isLoggedIn) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        initialMode={loginProps.mode}
        initialRole={loginProps.role}
      />
    );
  }

  // Render main portal shell
  return (
    <div className="app-container">
      {/* Top Right Floating AI Clinical Assistant */}
      <AiChatWidget />

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'dashboard' || tab === 'reports') {
            setSelectedPatientId('');
          }
        }} 
      />
      
      {activeTab === 'dashboard' && (
        <Dashboards 
          setActiveTab={setActiveTab} 
          setSelectedPatientId={setSelectedPatientId} 
          onNavigateToPatientRegistration={handleNavigateToPatientRegistration}
        />
      )}

      {activeTab === 'patient-registration' && (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          initialMode="register"
          initialRole="patient"
          initiatedByDoctor={true}
          onRegistrationCancel={() => setActiveTab('dashboard')}
          onRegistrationComplete={() => setActiveTab('dashboard')}
        />
      )}
      
      {activeTab === 'calculator' && (
        <Calculator 
          selectedPatientId={selectedPatientId} 
          onBack={() => setActiveTab('dashboard')}
        />
      )}
      
      {activeTab === 'rehab' && (
        <RehabTracker 
          patientId={selectedPatientId} 
          setSelectedPatientId={setSelectedPatientId}
          onBack={() => setActiveTab('dashboard')}
        />
      )}
      
      {activeTab === 'chat' && (
        <Chat 
          patientId={selectedPatientId} 
          onBack={() => setActiveTab('dashboard')}
        />
      )}
      
      {activeTab === 'medications' && (
        <Medications 
          patientId={selectedPatientId} 
          onBack={() => setActiveTab('dashboard')}
        />
      )}
      
      {activeTab === 'reports' && (
        <Reports 
          patientId={selectedPatientId} 
          setActiveTab={setActiveTab}
          setSelectedPatientId={setSelectedPatientId}
          onBack={() => setActiveTab('dashboard')}
        />
      )}
      
      {activeTab === 'profile' && (
        <Profile 
          patientId={selectedPatientId} 
          onBack={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'calendar' && (
        <Calendar 
          onBack={() => setActiveTab('dashboard')}
        />
      )}

      {activeTab === 'settings' && (
        <div className="main-content" style={{ padding: '2rem' }}>
          <div className="portal-header">
            <div>
              <span className="subtitle-label">Preferences &amp; Configuration</span>
              <h1 className="title-display">System Settings</h1>
            </div>
          </div>
          <div className="clinical-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>⚙️ System settings coming soon.</p>
          </div>
        </div>
      )}
    </div>
  );
}
