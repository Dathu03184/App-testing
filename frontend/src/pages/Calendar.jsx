import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X,
  Trash2, CheckCircle2, Circle, Clock, Tag, User, Search,
  Filter, Grid, List, CalendarDays, Activity, ArrowLeft
} from 'lucide-react';
import '../styles/portal.css';

const CATEGORIES = [
  { id: 'consultation', label: 'Consultation', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'rehab', label: 'Rehab Session', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'medication', label: 'Medication Review', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'imaging', label: 'Imaging & Labs', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'urgent', label: 'Urgent Check', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
];

export default function Calendar({ onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day' | 'agenda'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('consultation');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const storageKey = 'neuropredict_clinical_schedules_v2';

  // Seed default clinical demo events if empty
  useEffect(() => {
    const data = localStorage.getItem(storageKey);
    if (data) {
      try {
        const decoded = JSON.parse(data);
        setSchedules(decoded.map(s => ({
          ...s,
          dateStr: s.dateStr,
        })));
      } catch (e) {
        console.error("Failed to parse calendar storage", e);
      }
    } else {
      // Demo schedules for current month
      const today = new Date();
      const formatIso = (d) => d.toISOString().substring(0, 10);
      
      const d1 = new Date(today); d1.setDate(today.getDate() - 1);
      const d2 = new Date(today);
      const d3 = new Date(today); d3.setDate(today.getDate() + 2);
      const d4 = new Date(today); d4.setDate(today.getDate() + 5);

      const demo = [
        {
          id: 'demo-1',
          title: 'Initial Clinical Assessment',
          category: 'consultation',
          dateStr: formatIso(d1),
          startTime: '09:30',
          endTime: '10:30',
          isAllDay: false,
          patientId: 'Pid00001',
          notes: 'Pre-stroke mRS evaluation and NIHSS baseline check.',
          completed: true,
        },
        {
          id: 'demo-2',
          title: 'Motor Rehab & Gait Session',
          category: 'rehab',
          dateStr: formatIso(d2),
          startTime: '11:00',
          endTime: '12:00',
          isAllDay: false,
          patientId: 'Pid00001',
          notes: 'Upper limb range of motion & balance exercises.',
          completed: false,
        },
        {
          id: 'demo-3',
          title: 'Brain MRI Follow-up Imaging',
          category: 'imaging',
          dateStr: formatIso(d3),
          startTime: '14:00',
          endTime: '15:00',
          isAllDay: false,
          patientId: 'Pid00002',
          notes: 'Check for ischemic penumbra evolution.',
          completed: false,
        },
        {
          id: 'demo-4',
          title: 'Medication Reconciliation',
          category: 'medication',
          dateStr: formatIso(d4),
          startTime: '10:00',
          endTime: '10:30',
          isAllDay: false,
          patientId: 'Pid00001',
          notes: 'Review Dual Antiplatelet Therapy (DAPT) protocol.',
          completed: false,
        },
      ];
      setSchedules(demo);
      localStorage.setItem(storageKey, JSON.stringify(demo));
    }
  }, []);

  const saveSchedules = (updated) => {
    setSchedules(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const toDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (d1, d2) => toDateStr(d1) === toDateStr(d2);

  // Month navigation helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  // Add event logic
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Please provide an event title');
      return;
    }

    const newEvent = {
      id: 'sch_' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      dateStr: toDateStr(selectedDate),
      startTime: isAllDay ? '00:00' : newStartTime,
      endTime: isAllDay ? '23:59' : newEndTime,
      isAllDay,
      patientId: patientId.trim(),
      notes: notes.trim(),
      completed: false,
    };

    const updated = [...schedules, newEvent];
    saveSchedules(updated);
    
    // Reset form
    setNewTitle('');
    setNotes('');
    setPatientId('');
    setShowAddModal(false);
    setErrorMsg('');
  };

  const toggleComplete = (id) => {
    const updated = schedules.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    saveSchedules(updated);
  };

  const deleteSchedule = (id) => {
    const updated = schedules.filter(s => s.id !== id);
    saveSchedules(updated);
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter(s => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.patientId && s.patientId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedDaySchedules = filteredSchedules.filter(s => s.dateStr === toDateStr(selectedDate));

  // Build month calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  const calendarCells = [];
  // Blank padding cells for days before start of month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ key: `empty-${i}`, day: null });
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const dateStr = toDateStr(cellDate);
    const dayEvents = filteredSchedules.filter(s => s.dateStr === dateStr);
    calendarCells.push({
      key: `day-${d}`,
      day: d,
      date: cellDate,
      dateStr,
      events: dayEvents,
      isToday: isSameDay(cellDate, new Date()),
      isSelected: isSameDay(cellDate, selectedDate),
    });
  }

  const getCategoryMeta = (catId) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];

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
      {/* Header */}
      <div className="portal-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="subtitle-label">Clinical Scheduling</span>
          <h1 className="title-display">Rehab &amp; Care Calendar</h1>
        </div>

        {/* View Switcher & Actions */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={handleToday}
            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
          >
            Today
          </button>

          <div className="segmented-picker" style={{ margin: 0 }}>
            <button
              className={`segmented-option ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              <Grid size={15} style={{ marginRight: '6px' }} /> Month
            </button>
            <button
              className={`segmented-option ${viewMode === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewMode('agenda')}
            >
              <List size={15} style={{ marginRight: '6px' }} /> Agenda
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.65rem 1.4rem',
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #059669, #34d399)',
              boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
            }}
          >
            <Plus size={18} /> Schedule Appointment
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="clinical-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search appointments, patients, or notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.85rem', borderRadius: '12px' }}
            />
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                background: selectedCategory === 'all' ? 'var(--brand-primary)' : 'rgba(255,255,255,0.06)',
                color: selectedCategory === 'all' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              All Events ({schedules.length})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: `1px solid ${cat.color}`,
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: selectedCategory === cat.id ? cat.color : cat.bg,
                  color: selectedCategory === cat.id ? '#fff' : cat.color,
                  transition: 'all 0.2s',
                }}
              >
                ● {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid View Layout */}
      {viewMode === 'month' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Month Calendar Grid Card */}
          <div className="clinical-card" style={{ padding: '1.5rem' }}>
            {/* Month Header Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CalendarDays size={22} style={{ color: 'var(--brand-primary)' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>
                  {monthName} <span style={{ opacity: 0.6, fontWeight: '400' }}>{year}</span>
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={handlePrevMonth} style={{ padding: '0.5rem 0.75rem' }}>
                  <ChevronLeft size={18} />
                </button>
                <button className="btn-secondary" onClick={handleNextMonth} style={{ padding: '0.5rem 0.75rem' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '0.5rem' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <div key={d} style={{
                  fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase',
                  color: i === 0 || i === 6 ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  padding: '0.5rem 0',
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* 7x6 Calendar Cells Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {calendarCells.map(cell => {
                if (!cell.day) {
                  return <div key={cell.key} style={{ minHeight: '90px', background: 'transparent' }} />;
                }

                return (
                  <div
                    key={cell.key}
                    onClick={() => setSelectedDate(cell.date)}
                    style={{
                      minHeight: '94px',
                      borderRadius: '14px',
                      padding: '0.5rem',
                      background: cell.isSelected
                        ? 'rgba(5, 150, 105, 0.15)'
                        : cell.isToday
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: cell.isSelected
                        ? '2px solid #059669'
                        : cell.isToday
                        ? '2px solid #3B82F6'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: cell.isToday || cell.isSelected ? '900' : '600',
                        width: '24px', height: '24px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: cell.isToday ? '#3B82F6' : cell.isSelected ? '#059669' : 'transparent',
                        color: cell.isToday || cell.isSelected ? '#fff' : 'inherit',
                      }}>
                        {cell.day}
                      </span>

                      {cell.events.length > 0 && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: '800',
                          padding: '1px 5px', borderRadius: '10px',
                          background: 'rgba(5,150,105,0.2)', color: '#34d399',
                        }}>
                          {cell.events.length}
                        </span>
                      )}
                    </div>

                    {/* Event Dots/Pills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                      {cell.events.slice(0, 2).map(evt => {
                        const meta = getCategoryMeta(evt.category);
                        return (
                          <div
                            key={evt.id}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: '700',
                              padding: '2px 5px',
                              borderRadius: '6px',
                              background: meta.bg,
                              color: meta.color,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              borderLeft: `3px solid ${meta.color}`,
                              opacity: evt.completed ? 0.5 : 1,
                              textDecoration: evt.completed ? 'line-through' : 'none',
                            }}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                      {cell.events.length > 2 && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                          +{cell.events.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Selected Date Sidebar Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="clinical-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--brand-border)', pb: '0.75rem' }}>
                <div>
                  <span className="subtitle-label">Selected Timeline</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>
                    {selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </h3>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddModal(true)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {/* Day Events List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '480px', overflowY: 'auto' }}>
                {selectedDaySchedules.length > 0 ? (
                  selectedDaySchedules.map(evt => {
                    const meta = getCategoryMeta(evt.category);
                    return (
                      <div
                        key={evt.id}
                        style={{
                          padding: '1rem',
                          borderRadius: '16px',
                          background: meta.bg,
                          borderLeft: `4px solid ${meta.color}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          position: 'relative',
                          opacity: evt.completed ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => toggleComplete(evt.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: meta.color, padding: 0 }}
                            >
                              {evt.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <h4 style={{
                              margin: 0, fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary)',
                              textDecoration: evt.completed ? 'line-through' : 'none'
                            }}>
                              {evt.title}
                            </h4>
                          </div>

                          <button
                            onClick={() => deleteSchedule(evt.id)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: 0.7 }}
                            title="Delete appointment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Meta time + patient */}
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> {evt.isAllDay ? 'All Day' : `${evt.startTime} – ${evt.endTime}`}
                          </span>
                          {evt.patientId && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <User size={13} /> {evt.patientId}
                            </span>
                          )}
                        </div>

                        {evt.notes && (
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                            {evt.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <CalendarIcon size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No appointments scheduled for this date.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="clinical-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>All Scheduled Clinical Appointments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredSchedules.length > 0 ? (
              filteredSchedules.sort((a, b) => a.dateStr.localeCompare(b.dateStr)).map(evt => {
                const meta = getCategoryMeta(evt.category);
                return (
                  <div
                    key={evt.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1.1rem 1.4rem', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--brand-border)',
                      borderLeft: `5px solid ${meta.color}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => toggleComplete(evt.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: meta.color }}
                      >
                        {evt.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                      </button>

                      <div>
                        <h4 style={{
                          margin: 0, fontSize: '1rem', fontWeight: '800',
                          textDecoration: evt.completed ? 'line-through' : 'none', opacity: evt.completed ? 0.6 : 1
                        }}>
                          {evt.title}
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
                          <span>📅 {evt.dateStr}</span>
                          <span>⏰ {evt.isAllDay ? 'All Day' : `${evt.startTime} - ${evt.endTime}`}</span>
                          {evt.patientId && <span>👤 {evt.patientId}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px',
                        borderRadius: '12px', background: meta.bg, color: meta.color,
                      }}>
                        {meta.label}
                      </span>
                      <button
                        onClick={() => deleteSchedule(evt.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                <p>No appointments match your search filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--surface, #1e1e2e)',
            borderRadius: '24px', padding: '2rem',
            maxWidth: '500px', width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            border: '1px solid var(--brand-border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CalendarIcon size={22} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Schedule Appointment</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Appointment Title *</label>
                <input
                  type="text" className="form-input" placeholder="e.g. Stroke Assessment Follow-up"
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Patient ID (Optional)</label>
                  <input type="text" className="form-input" placeholder="e.g. Pid00001" value={patientId} onChange={e => setPatientId(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} disabled={isAllDay} />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} disabled={isAllDay} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-input" style={{ height: '80px', padding: '0.75rem' }} placeholder="Add clinical goals or patient instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #059669, #34d399)', justifyContent: 'center' }}>Save Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
