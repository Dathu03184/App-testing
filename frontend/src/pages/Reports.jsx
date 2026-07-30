import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { FileText, Plus, FileDown, UploadCloud, Calendar, ShieldCheck, AlertCircle, Eye, Trash2, X, Search, Calculator, Activity, MessageSquare } from 'lucide-react';

export default function Reports({ patientId, setActiveTab, setSelectedPatientId }) {
  const role = localStorage.getItem('role') || 'doctor';
  const currentUserId = role === 'doctor' ? localStorage.getItem('doctor_id') : localStorage.getItem('patient_id');
  const targetPatientId = role === 'doctor' ? patientId : currentUserId;

  const [reports, setReports] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Uploader State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Image Viewer Modal State
  // Image Viewer Modal State
  const [selectedImage, setSelectedImage] = useState(null);

  // Patient Directory State
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [patientsLoading, setPatientsLoading] = useState(false);

  useEffect(() => {
    if (targetPatientId) {
      loadReports();
      loadScores();
    } else if (role === 'doctor') {
      loadPatients();
    }
  }, [targetPatientId, role]);

  const loadPatients = async () => {
    setPatientsLoading(true);
    try {
      const data = await api.fetchPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setPatientsLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = (tab, pId) => {
    if (setSelectedPatientId && setActiveTab) {
      setSelectedPatientId(pId);
      setActiveTab(tab);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchReports(targetPatientId);
      if (res.success && Array.isArray(res.data)) {
        setReports(res.data);
      }
    } catch (err) {
      setError('Connection failure loading document registry.');
    } finally {
      setLoading(false);
    }
  };

  const loadScores = async () => {
    try {
      const data = await api.fetchScores(targetPatientId);
      if (Array.isArray(data)) {
        setScores(data);
      }
    } catch (err) {
      console.error('Failed to load scores list for PDF links', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create local URL preview
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title) {
      setError('Report Name is required.');
      return;
    }
    if (!imageFile) {
      setError('Please select a scanned document/image file.');
      return;
    }

    setSubmitting(true);

    // Read file as Base64 string
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1];
      try {
        const res = await api.uploadReport(targetPatientId, title, details, base64String);
        if (res.success) {
          setShowAddModal(false);
          setTitle('');
          setDetails('');
          setImageFile(null);
          setImagePreview(null);
          loadReports();
        } else {
          setError(res.message || 'Upload failed.');
        }
      } catch (err) {
        setError('Server connection failure.');
      } finally {
        setSubmitting(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to process image file.');
      setSubmitting(false);
    };
    reader.readAsDataURL(imageFile);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report from the registry?')) return;
    try {
      const res = await api.deleteReport(reportId);
      if (res.success) {
        loadReports();
      }
    } catch (err) {
      console.error('Failed to delete report', err);
    }
  };

  return (
    <div className="main-content">
      <div className="portal-header">
        <div>
          <span className="subtitle-label">Medical Records Registry</span>
          <h1 className="title-display">Clinical Documentation</h1>
        </div>

        {role === 'doctor' && targetPatientId && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => setSelectedPatientId && setSelectedPatientId('')}>
              ← Back to Roster
            </button>
            <button className="btn-primary" onClick={() => { setShowAddModal(true); setError(null); }}>
              <Plus size={18} />
              Upload Scan Record
            </button>
          </div>
        )}
      </div>

      {!targetPatientId && role === 'doctor' ? (
        <div className="patient-directory" style={{ padding: '2rem 2.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', background: '#FFFFFF', borderRadius: '16px', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-secondary)', margin: 0 }}>Patient Roster</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginTop: '0.3rem' }}>Select a patient to inspect their reports and scans</p>
            </div>
            <div className="search-box" style={{ width: '300px', flex: 'none' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.7rem 1.2rem 0.7rem 2.8rem' }}
              />
            </div>
          </div>

          {patientsLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="loader" style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--brand-border)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Loading patient roster...</p>
            </div>
          ) : (
            <div className="patients-table-wrapper" style={{ margin: '0 -1rem' }}>
              <table className="patients-table" style={{ width: 'calc(100% + 2rem)' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1rem' }}>Patient ID</th>
                    <th>Full Name</th>
                    <th>Demographics</th>
                    <th>Contact</th>
                    <th>Location Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Clinical Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(p => {
                      const isWard = p.address?.toLowerCase().includes('ward') || p.age > 60;
                      return (
                        <tr 
                          key={p.patient_id} 
                          style={{ transition: 'background 0.2s', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                          onClick={(e) => {
                            if (!e.target.closest('.action-btn')) {
                              handleAction('dashboard', p.patient_id);
                            }
                          }}
                        >
                          <td style={{ paddingLeft: '1rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(3, 152, 85, 0.08)', padding: '0.3rem 0.6rem', borderRadius: '6px', color: 'var(--brand-primary)', fontWeight: 'bold', fontSize: '0.8rem' }}>
                              {p.patient_id}
                            </div>
                          </td>
                          <td 
                            style={{ fontWeight: '700', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction('dashboard', p.patient_id);
                            }}
                            title="Click to view patient dashboard"
                          >
                            {p.name}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.age} yrs • {p.gender}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.phone || 'N/A'}</span>
                          </td>
                          <td>
                            <span style={{ 
                              padding: '0.3rem 0.8rem', 
                              borderRadius: '50px', 
                              fontSize: '0.75rem', 
                              fontWeight: '800', 
                              backgroundColor: isWard ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: isWard ? '#EF4444' : 'var(--brand-success)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {isWard ? 'High Acuity / Ward' : 'Outpatient'}
                            </span>
                          </td>
                          <td className="row-actions" style={{ justifyContent: 'flex-end', paddingRight: '1rem' }}>
                            <button className="action-btn" title="Calculate Risk Score" onClick={() => handleAction('calculator', p.patient_id)} style={{ background: '#F8FAFC' }}>
                              <Calculator size={16} />
                            </button>
                            <button className="action-btn" title="Rehabilitation routine" onClick={() => handleAction('rehab', p.patient_id)} style={{ background: '#F8FAFC' }}>
                              <Activity size={16} />
                            </button>
                            <button className="action-btn" title="Scans & Medical reports" onClick={() => handleAction('reports', p.patient_id)} style={{ background: '#F8FAFC' }}>
                              <FileText size={16} />
                            </button>
                            <button className="action-btn" title="Send Messages" onClick={() => handleAction('chat', p.patient_id)} style={{ background: '#F8FAFC' }}>
                              <MessageSquare size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem' }}>
                        <div style={{ display: 'inline-block', padding: '1rem', background: '#F8FAFC', borderRadius: '50%', marginBottom: '1rem' }}>
                          <Search size={32} style={{ color: '#94A3B8' }} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', color: 'var(--brand-secondary)' }}>No Patients Found</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Try adjusting your search criteria.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : !targetPatientId ? (
        <div className="clinical-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <FileText size={32} style={{ color: 'var(--brand-accent)', marginBottom: '1rem' }} />
          <h3>No Patient Selected</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Please select a patient to inspect their reports.</p>
        </div>
      ) : (
        <div className="rehab-progress-container" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', display: 'grid', alignItems: 'start' }}>
          
          {/* Timeline of Scan Reports */}
          <div className="clinical-card">
            <span className="subtitle-label">File Timeline</span>
            <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', marginBottom: '1.5rem' }}>Scanned Reports & Records</h3>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Loading documents...</p>
            ) : reports.length > 0 ? (
              <div className="reports-timeline">
                {reports.map((rep, idx) => (
                  <div className="timeline-item" key={rep.id}>
                    <div className="timeline-date">
                      {rep.created_at.substring(0, 10)}
                    </div>
                    <div className="timeline-connector">
                      <div className="timeline-node"></div>
                      {idx !== reports.length - 1 && <div className="timeline-line"></div>}
                    </div>
                    <div className="timeline-content">
                      <div className="rehab-card" style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', color: 'var(--brand-secondary)' }}>{rep.title}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>{rep.details}</p>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {rep.image_url && (
                              <button className="action-btn" title="View Document Image" onClick={() => setSelectedImage(rep.image_url)}>
                                <Eye size={14} />
                              </button>
                            )}
                            {role === 'doctor' && (
                              <button className="action-btn" style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'var(--brand-error)' }} title="Delete Record" onClick={() => handleDeleteReport(rep.id)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--brand-border)', borderRadius: '24px' }}>
                <FileText size={32} style={{ color: 'var(--brand-accent)', marginBottom: '0.5rem', display: 'inline-block' }} />
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No scanned records uploaded for this patient.</p>
              </div>
            )}
          </div>

          {/* PDF Reports download shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="clinical-card">
              <span className="subtitle-label">PDF Assessments Log</span>
              <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem', marginBottom: '1.2rem' }}>Historical Summaries</h3>

              {scores.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {scores.slice(0, 5).map((scoreItem, index) => (
                    <a
                      key={index}
                      href={api.getPDFReportURL(scoreItem.patient_id, scoreItem.assessment_date)}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.6rem 1rem', fontSize: '0.8rem', justifyContent: 'space-between', background: 'var(--brand-bg)', color: 'var(--text-primary)', border: '1px solid var(--brand-border)' }}
                    >
                      <span style={{ fontWeight: 'bold' }}>📅 Assessment {scoreItem.assessment_date}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-primary)', fontWeight: 'bold' }}>
                        <FileDown size={14} />
                        Download PDF
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No historical NIHSS scores assessed yet.</p>
              )}
            </div>

            <div className="clinical-card">
              <span className="subtitle-label">Registry Security</span>
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', alignItems: 'center' }}>
                <ShieldCheck size={20} style={{ color: 'var(--brand-success)' }} />
                <div>
                  <h4 style={{ fontSize: '0.85rem' }}>GDPR Encrypted</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Scans stored as secured Base64 blobs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload scan record Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(67,20,7,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="clinical-card" style={{ maxWidth: '500px', width: '90%', margin: '1rem', background: '#FFFFFF', padding: '2.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="subtitle-label">New Scan Attachment</span>
              <h2>Upload Report</h2>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Report Document Title</label>
                <input type="text" className="form-input" style={{ paddingLeft: '1.2rem' }} placeholder="e.g. Brain MRI Scan Report" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Key Findings Summary</label>
                <textarea className="form-input" style={{ paddingLeft: '1.2rem', minHeight: '80px', resize: 'vertical' }} placeholder="e.g. Infarction noted in right MCA territory..." value={details} onChange={(e) => setDetails(e.target.value)}></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Scanned Image File (JPG/PNG)</label>
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Scan record Preview" />
                    <button type="button" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(67,20,7,0.8)', color: '#FFFFFF', padding: '4px', borderRadius: '50%' }} onClick={() => { setImageFile(null); setImagePreview(null); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="document-dropzone">
                    <UploadCloud size={32} style={{ color: 'var(--brand-primary)', marginBottom: '0.5rem', display: 'inline-block' }} />
                    <h4>Select File</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Supported formats: JPG, JPEG, PNG</p>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} required />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Uploading scan...' : 'Commit to Registry'}
                </button>
                <button type="button" className="btn-secondary" style={{ background: '#ECEBEA', color: 'var(--text-primary)' }} onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Image Viewer Modal */}
      {selectedImage && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(67,20,7,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedImage(null)}>
          <div style={{ position: 'relative', maxWidth: '85%', maxHeight: '85%' }} onClick={(e) => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: '-40px', right: '0', color: '#FFFFFF', display: 'flex', gap: '4px', fontWeight: 'bold' }} onClick={() => setSelectedImage(null)}>
              <X size={20} />
              Close
            </button>
            <img src={selectedImage} alt="Large document scan viewer" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
