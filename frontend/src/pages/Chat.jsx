import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../utils/api';
import { MessageSquare, Send, User, Search, Stethoscope, ArrowLeft } from 'lucide-react';

export default function Chat({ patientId, onBack }) {
  const role = localStorage.getItem('role') || 'doctor';
  const name = localStorage.getItem('name') || 'User';
  const currentUserId = role === 'doctor' ? localStorage.getItem('doctor_id') : localStorage.getItem('patient_id');

  // Channel & Contacts selections
  const [contacts, setContacts] = useState([]);
  const [activePatientId, setActivePatientId] = useState(role === 'doctor' ? (patientId || '') : currentUserId);
  const [activePatientName, setActivePatientName] = useState('Select Contact');
  const [activeContactRole, setActiveContactRole] = useState('patient');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'patients', 'doctors'

  // Messages log
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Setup socket connection
  useEffect(() => {
    const hostname = window.location.hostname || 'localhost';
    const newSocket = io(`http://${hostname}:5000`);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected locally.');
    });

    return () => newSocket.disconnect();
  }, []);

  // 2. Load roster contacts (patients + doctors)
  useEffect(() => {
    loadContacts();
  }, [role]);

  const loadContacts = async () => {
    try {
      const [patientsData, doctorsData] = await Promise.all([
        api.fetchPatients().catch(() => []),
        api.fetchDoctors().catch(() => [])
      ]);

      const formattedPatients = (Array.isArray(patientsData) ? patientsData : []).map(p => ({
        id: p.patient_id,
        name: p.name || 'Patient ' + p.patient_id,
        displayId: p.patient_id,
        type: 'patient',
        subtitle: `Patient ID: ${p.patient_id}`
      }));

      const formattedDoctors = (Array.isArray(doctorsData) ? doctorsData : [])
        .filter(d => d.doctor_id !== currentUserId) // exclude self
        .map(d => ({
          id: d.doctor_id,
          name: d.name ? `Dr. ${d.name}` : `Clinician ${d.doctor_id}`,
          displayId: d.doctor_id,
          type: 'doctor',
          subtitle: `Clinician ID: ${d.doctor_id}`
        }));

      const allContacts = [...formattedPatients, ...formattedDoctors];
      setContacts(allContacts);

      if (!activePatientId && allContacts.length > 0) {
        setActivePatientId(allContacts[0].id);
        setActivePatientName(allContacts[0].name);
        setActiveContactRole(allContacts[0].type);
      } else if (activePatientId) {
        const found = allContacts.find(c => c.id === activePatientId);
        if (found) {
          setActivePatientName(found.name);
          setActiveContactRole(found.type);
        }
      }
    } catch (err) {
      console.error('Failed to load roster contacts', err);
    }
  };

  // 3. Switch rooms when activePatientId changes
  useEffect(() => {
    if (activePatientId) {
      loadMessages(activePatientId);
      
      if (socket) {
        socket.emit('join_patient', activePatientId);
      }
      
      const found = contacts.find(c => c.id === activePatientId);
      if (found) {
        setActivePatientName(found.name);
        setActiveContactRole(found.type);
      }
    }
  }, [activePatientId, socket, contacts]);

  // 4. Subscribe to socket events for real-time updates
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (msg) => {
        if (msg.patient_id === activePatientId) {
          setMessages(prev => [...prev, msg]);
        }
      };

      socket.on('new_message', handleNewMessage);
      return () => socket.off('new_message', handleNewMessage);
    }
  }, [socket, activePatientId]);

  // Fallback Polling (polls every 5s if WebSocket isn't live)
  useEffect(() => {
    const timer = setInterval(() => {
      if (activePatientId) {
        pollMessages(activePatientId);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activePatientId]);

  // Auto-scroll chat log
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (pid) => {
    setLoading(true);
    try {
      const data = await api.fetchMessages(pid);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch message logs', err);
    } finally {
      setLoading(false);
    }
  };

  const pollMessages = async (pid) => {
    try {
      const data = await api.fetchMessages(pid);
      if (Array.isArray(data) && data.length !== messages.length) {
        setMessages(data);
      }
    } catch (err) {
      // Silently catch polling errors
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePatientId) return;

    const msgText = text.trim();
    setText('');

    try {
      await api.sendMessage(activePatientId, currentUserId, msgText, name);
      if (!socket || !socket.connected) {
        loadMessages(activePatientId);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Filter contacts by search & category tab
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.displayId.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'patients' && c.type === 'patient') ||
                       (activeTab === 'doctors' && c.type === 'doctor');
    return matchesSearch && matchesTab;
  });

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
          <span className="subtitle-label">Instant Clinical sync</span>
          <h1 className="title-display">Communication Portal</h1>
        </div>
      </div>

      <div className="chat-layout">
        {/* Roster Sidebar with Search & Contacts */}
        <div className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRight: '1px solid var(--brand-border)' }}>
          
          {/* Search Box */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', color: '#64748B' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search patient or doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  paddingLeft: '2.5rem', 
                  paddingRight: '0.8rem',
                  fontSize: '0.85rem',
                  height: '40px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF'
                }}
              />
            </div>

            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'patients', label: 'Patients' },
                { id: 'doctors', label: 'Doctors' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--brand-primary)' : '#E2E8F0',
                    color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roster List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
            {filteredContacts.length > 0 ? (
              filteredContacts.map(c => {
                const isActive = activePatientId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActivePatientId(c.id);
                      setActivePatientName(c.name);
                      setActiveContactRole(c.type);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(3, 152, 85, 0.08)' : 'transparent',
                      borderLeft: isActive ? '4px solid var(--brand-primary)' : '4px solid transparent',
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: c.type === 'doctor' ? '#3B82F6' : '#039855',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}>
                      {c.type === 'doctor' ? <Stethoscope size={18} /> : <User size={18} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.name}
                        </h4>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          background: c.type === 'doctor' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(3, 152, 85, 0.1)',
                          color: c.type === 'doctor' ? '#2563EB' : '#039855'
                        }}>
                          {c.type}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>
                        {c.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                No contacts found
              </div>
            )}
          </div>
        </div>

        {/* Main Conversation Window */}
        <div className="chat-window">
          {activePatientId ? (
            <>
              {/* Chat Header */}
              <div className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="user-avatar" style={{
                  width: '40px',
                  height: '40px',
                  background: activeContactRole === 'doctor' ? '#3B82F6' : 'var(--brand-primary)',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {activeContactRole === 'doctor' ? <Stethoscope size={20} /> : <User size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: 0 }}>{activePatientName}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    {activeContactRole === 'doctor' ? `Clinician ID: ${activePatientId}` : `Patient ID: ${activePatientId}`}
                  </span>
                </div>
              </div>

              {/* Chat Log */}
              <div className="chat-messages">
                {messages.length > 0 ? (
                  messages.map((msg, index) => {
                    const isOutgoing = msg.sender === currentUserId;
                    const date = new Date(msg.createdAt || msg.timestamp);
                    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    const senderInitial = isOutgoing
                      ? (name || 'Y')[0].toUpperCase()
                      : (msg.sender_name || activePatientName || '?')[0].toUpperCase();
                    const avatarBg = isOutgoing ? 'var(--brand-primary)' : (activeContactRole === 'doctor' ? '#3B82F6' : '#7C3AED');

                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: '0.6rem',
                          flexDirection: isOutgoing ? 'row-reverse' : 'row',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {/* Avatar beside message */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: avatarBg,
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                          {senderInitial}
                        </div>

                        {/* Bubble */}
                        <div className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                          <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.2rem', fontWeight: 'bold' }}>
                            {isOutgoing ? 'You' : msg.sender_name}
                          </span>
                          {msg.message}
                          <span className="message-meta">{formattedTime}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem' }}>
                    <MessageSquare size={32} style={{ color: 'var(--brand-accent)', marginBottom: '0.5rem', display: 'inline-block' }} />
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Conversation started with {activePatientName}. Send a message to coordinate care.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-form">
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '1.2rem' }}
                    placeholder="Type clinical notes or chat update..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button type="submit" className="send-btn" disabled={!text.trim()}>
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '3rem' }}>
              <MessageSquare size={44} style={{ color: 'var(--brand-accent)', marginBottom: '1rem', display: 'inline-block' }} />
              <h3>Select Conversation</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Search and choose a patient or clinician contact from the roster sidebar to start communication.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
