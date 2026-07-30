import React from 'react';
import {
  LayoutDashboard, Calculator, Activity, MessageSquare, FileText, LogOut, User,
  Home, Calendar, ShieldCheck, Settings, ChevronRight
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const role = localStorage.getItem('role') || 'doctor';
  const name = localStorage.getItem('name') || 'User';
  const userId = role === 'doctor' ? localStorage.getItem('doctor_id') : localStorage.getItem('patient_id');

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const doctorMainItems = [
    { id: 'dashboard',   label: 'Overview',          icon: Home },
    { id: 'chat',        label: 'Messages',          icon: MessageSquare },
    { id: 'calculator',  label: 'Clinical Scores',   icon: Calculator },
    { id: 'reports',     label: 'Patient Reports',   icon: FileText },
    { id: 'calendar',    label: 'Calendar',          icon: Calendar },
  ];

  const doctorSecurityItems = [];

  const patientItems = [
    { id: 'dashboard', label: 'Recovery Progress', icon: LayoutDashboard },
    { id: 'rehab',     label: 'Rehab Schedule',    icon: Activity },
    { id: 'chat',      label: 'Consult Chat',       icon: MessageSquare },
    { id: 'reports',   label: 'My Records',         icon: FileText },
  ];

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.8rem 1rem',
          width: '100%',
          borderRadius: '12px',
          background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          border: 'none',
          boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Sleek icon wrapper */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          color: isActive ? 'var(--brand-secondary)' : 'rgba(255, 255, 255, 0.7)',
          transition: 'all 0.25s',
        }}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </div>

        <span style={{
          flex: 1, textAlign: 'left',
          fontSize: '0.9rem', fontWeight: isActive ? '700' : '500',
          color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
          letterSpacing: '0.3px',
          transition: 'all 0.25s',
        }}>
          {item.label}
        </span>

        <ChevronRight size={16} strokeWidth={2.5} style={{ 
          color: isActive ? '#FFFFFF' : 'transparent', 
          flexShrink: 0,
          transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
          opacity: isActive ? 1 : 0,
          transition: 'all 0.25s'
        }} />
      </button>
    );
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #059669, #34d399)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
          flexShrink: 0,
          padding: '6px'
        }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {/* Outer ring */}
            <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="3.5" fill="none" opacity="0.6" />
            {/* Brain top */}
            <path
              d="M 38 48 C 30 48, 28 36, 36 30 C 32 24, 44 18, 50 24 C 56 18, 68 24, 64 30 C 72 36, 70 48, 62 48 C 62 52, 38 52, 38 48 Z"
              fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            />
            {/* Center divide */}
            <path d="M 50 24 L 50 48" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
            {/* Left hemisphere detail */}
            <path d="M 36 38 C 42 38, 44 34, 48 36" stroke="white" strokeWidth="1.8" fill="none" />
            {/* Right hemisphere detail */}
            <path d="M 64 38 C 58 38, 56 34, 52 36" stroke="white" strokeWidth="1.8" fill="none" />
            {/* Brain stem / lower body */}
            <path
              d="M 24 56 C 24 74, 42 82, 50 82 C 58 82, 76 74, 76 56 C 76 52, 72 50, 70 54 C 66 62, 58 70, 50 70 C 42 70, 34 62, 30 54 C 28 50, 24 52, 24 56 Z"
              fill="white"
            />
            {/* Heart detail */}
            <path
              d="M 50 75 C 50 75, 47 72, 45 70 C 43 68, 45 66, 47 66 C 49 66, 50 68, 50 68 C 50 68, 51 66, 53 66 C 55 66, 57 68, 55 70 C 53 72, 50 75, 50 75 Z"
              fill="white" opacity="0.5"
            />
          </svg>
        </div>
        <div>
          <h2 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: '800', margin: 0, lineHeight: 1.1 }}>NeuroPredict</h2>
          <span style={{ fontSize: '0.6rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            Smart Management
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {role === 'doctor' ? (
          <>
            {/* Main navigation group */}
            {doctorMainItems.map(renderItem)}

            {doctorSecurityItems.map(renderItem)}
          </>
        ) : (
          <>
            {patientItems.map(renderItem)}
          </>
        )}
      </nav>

      {/* Footer: user profile + sign out */}
      <div className="sidebar-footer">
        <button
          className={`user-profile-summary ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            width: '100%', textAlign: 'left', padding: '0.5rem',
            borderRadius: '12px', transition: 'var(--transition-smooth)',
            background: activeTab === 'profile' ? 'rgba(255,255,255,0.1)' : 'transparent',
            cursor: 'pointer'
          }}
          onMouseEnter={e => { if (activeTab !== 'profile') e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { if (activeTab !== 'profile') e.currentTarget.style.background = 'transparent'; }}
        >
          <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} />
          </div>
          <div className="user-info">
            <h4 style={{ margin: 0, color: '#FFFFFF' }}>{name}</h4>
            <span style={{ color: '#A8A29E' }}>{role === 'doctor' ? `Clinician: ${userId}` : `Patient: ${userId}`}</span>
          </div>
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
