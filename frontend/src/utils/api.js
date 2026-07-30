/**
 * API Client Services for NeuroPredict Web Portal
 */

const BASE_URL = `http://${window.location.hostname}:5000/nuero_api`;

// Helper to make fetch calls
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const url = `${BASE_URL}/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Network response was not ok');
    }
    return await response.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
};

export const api = {
  // Auth Clinician
  loginClinician: async (doctor_id, password) => {
    const res = await apiCall('clinician_login.php', 'POST', { doctor_id, password });
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('role', 'doctor');
      localStorage.setItem('doctor_id', res.doctor_id);
      localStorage.setItem('name', res.name);
    }
    return res;
  },

  verifyRecovery: async (id, email, isDoctor) => {
    return await apiCall('verify_recovery.php', 'POST', { id, email, isDoctor });
  },

  resendOTP: async (id, email, isDoctor) => {
    return await apiCall('resend_otp.php', 'POST', { id, email, isDoctor });
  },

  verifyOTP: async (id, email, isDoctor, otp) => {
    return await apiCall('verify_otp.php', 'POST', { id, email, isDoctor, otp });
  },

  resetPassword: async (id, email, isDoctor, otp, newPassword) => {
    return await apiCall('reset_password.php', 'POST', { id, email, isDoctor, otp, newPassword });
  },

  registerClinician: async (data) => {
    return await apiCall('register_clinician.php', 'POST', data);
  },

  // Auth Patient
  loginPatient: async (patient_id, password) => {
    const res = await apiCall('patient_login.php', 'POST', { patient_id, password });
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('role', 'patient');
      localStorage.setItem('patient_id', res.patient_id);
      localStorage.setItem('name', res.name);
    }
    return res;
  },

  registerPatient: async (data) => {
    return await apiCall('register_patient.php', 'POST', data);
  },

  // Patient Management
  fetchNextPatientId: async () => {
    return await apiCall('next_patient_id.php', 'GET');
  },

  fetchNextId: async (role) => {
    return await apiCall(`next_id.php?role=${role}`, 'GET');
  },

  fetchPatients: async () => {
    const res = await fetch(`${BASE_URL}/get_patients.php`);
    return await res.json();
  },

  fetchDoctors: async () => {
    const res = await fetch(`${BASE_URL}/get_doctors.php`);
    return await res.json();
  },

  validatePatient: async (patient_id) => {
    return await apiCall(`get_patient_info.php?patient_id=${patient_id}`, 'GET');
  },

  updateProfile: async (id, role, updates) => {
    return await apiCall('update_profile.php', 'POST', { id, role, updates });
  },

  validateClinician: async (doctor_id) => {
    return await apiCall(`get_clinician_info.php?doctor_id=${doctor_id}`, 'GET');
  },

  deleteClinician: async (doctor_id) => {
    return await apiCall('delete_clinician.php', 'POST', { doctor_id });
  },

  deletePatientAccount: async (patient_id) => {
    return await apiCall('delete_patient.php', 'POST', { patient_id });
  },

  // Scores Assessment
  addScore: async (parameters) => {
    return await apiCall('add_score.php', 'POST', parameters);
  },

  fetchClinicianScoreCount: async (clinician_id) => {
    return apiCall(`count_clinician_scores.php?clinician_id=${encodeURIComponent(clinician_id)}`, 'GET');
  },

  fetchScores: async (patient_id) => {
    const res = await fetch(`${BASE_URL}/get_scores.php?patient_id=${patient_id}`);
    return await res.json();
  },

  // Rehabilitation
  addRehab: async (data) => {
    return await apiCall('add_rehab.php', 'POST', data);
  },

  fetchRehab: async (patient_id) => {
    const res = await fetch(`${BASE_URL}/get_rehab.php?patient_id=${patient_id}`);
    return await res.json();
  },

  updateRehabStatus: async (rehab_id, status) => {
    return await apiCall('update_rehab_status.php', 'POST', { rehab_id, status });
  },

  deleteRehab: async (rehab_id) => {
    return await apiCall('delete_rehab.php', 'POST', { rehab_id });
  },

  // Messaging
  fetchMessages: async (patient_id) => {
    const res = await fetch(`${BASE_URL}/messages.php?patient_id=${patient_id}`);
    return await res.json();
  },

  sendMessage: async (patient_id, sender, message, sender_name) => {
    return await apiCall('messages.php', 'POST', { patient_id, sender, message, sender_name });
  },

  // Reports
  fetchReports: async (patient_id) => {
    return await apiCall(`get_reports.php?patient_id=${patient_id}`, 'GET');
  },

  uploadReport: async (patient_id, title, details, imageBase64) => {
    return await apiCall('upload_report.php', 'POST', { patient_id, title, details, image: imageBase64 });
  },

  deleteReport: async (report_id) => {
    return await apiCall('delete_report.php', 'POST', { report_id });
  },

  // PDF Download Link Builder
  getPDFReportURL: (patient_id, date) => {
    return `${BASE_URL}/download_pdf.php?patient_id=${patient_id}&date=${date}`;
  },

  // Logout utility
  logout: () => {
    localStorage.clear();
    window.location.reload();
  },
  // Medications
  fetchMedications: async (patient_id) => {
    const res = await apiCall('fetch_medications.php', 'POST', { patient_id });
    return res.medications || [];
  },
  addMedication: async (patient_id, medData) => {
    return await apiCall('add_medication.php', 'POST', { patient_id, ...medData });
  },
  updateMedicationStatus: async (_id, action, date) => {
    return await apiCall('update_medication.php', 'POST', { _id, action, date });
  },
  // Clinical AI Assistant
  aiChat: async (message, history = []) => {
    return await apiCall('ai_chat.php', 'POST', { message, history });
  }
};
