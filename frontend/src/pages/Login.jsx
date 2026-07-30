import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  User, Mail, ShieldCheck, KeyRound, Phone, MapPin, 
  Calendar, Heart, AlertCircle, ArrowLeft, Brain, 
  TrendingUp, ClipboardList, Lock, Eye, EyeOff, AtSign, Hash,
  Clock, RotateCcw
} from 'lucide-react';

export default function Login({ 
  onLoginSuccess, 
  initialMode = 'login', 
  initialRole = 'doctor',
  initiatedByDoctor = false,
  onRegistrationCancel = () => {},
  onRegistrationComplete = () => {}
}) {
  const [mode, setMode] = useState(initialMode); // 'login', 'register'

  // 1. Sign In States
  const [isDoctor, setIsDoctor] = useState(initialRole === 'doctor');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // 2. Recovery States
  const [recoveryStep, setRecoveryStep] = useState('request');
  const [recoveryId, setRecoveryId] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [otpTimer, setOtpTimer] = useState(600); // 10 mins countdown (600 seconds)
  const [resendCooldown, setResendCooldown] = useState(30); // 30s cooldown
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState(null);

  // 3. Registration States
  const [regRole, setRegRole] = useState(initialRole); // 'doctor', 'patient'
  const [autoId, setAutoId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminShowPassword, setAdminShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [regData, setRegData] = useState({
    name: '',
    email: '',
    username: '',
    age: '',
    gender: 'Male',
    dob: '',
    address: '',
    phone: '',
    password: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(false);

  // Fetch sequential auto-generated ID from MySQL database
  useEffect(() => {
    if (mode === 'register') {
      const getNextId = async () => {
        try {
          const res = await api.fetchNextId(regRole);
          if (res && res.success) {
            setAutoId(res.next_id);
          } else {
            setAutoId(regRole === 'doctor' ? 'Did00003' : 'Pid00003');
          }
        } catch (err) {
          setAutoId(regRole === 'doctor' ? 'Did00003' : 'Pid00003');
        }
      };
      getNextId();
    }
  }, [mode, regRole]);

  // 10-Minute OTP Validity Timer (600 seconds)
  useEffect(() => {
    let timer;
    if (mode === 'recovery' && recoveryStep === 'verify' && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, recoveryStep, otpTimer]);

  // 30-Second Resend Cooldown Timer
  useEffect(() => {
    let cooldownTimer;
    if (mode === 'recovery' && recoveryStep === 'verify' && resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [mode, recoveryStep, resendCooldown]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Unlock check: patient unlocks immediately; doctor requires admin verification (admin@1234 / 1234)
  const isFormUnlocked = regRole === 'patient' || (adminId.toLowerCase() === 'admin@1234' && adminPassword === '1234');

  // --- HANDLERS ---

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setLoginError('Please fill in all credentials.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      let res;
      if (isDoctor) {
        res = await api.loginClinician(userId, password);
      } else {
        res = await api.loginPatient(userId, password);
      }

      if (res.success) {
        onLoginSuccess();
      } else {
        setLoginError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setLoginError('Connection failure. Unable to reach server.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Recovery Submit (Step 1)
  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (!recoveryId || !recoveryEmail) {
      setRecoveryError('ID and Email are required.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError(null);
    setRecoverySuccess(false);

    try {
      const res = await api.verifyRecovery(recoveryId, recoveryEmail, isDoctor);
      if (res.success) {
        setRecoverySuccess(true);
        setOtpTimer(600); // 10 minutes
        setResendCooldown(30); // 30 seconds cooldown
        setResendMessage(null);
        setRecoveryStep('verify');
      } else {
        setRecoveryError(res.message || 'Invalid ID or Email combination.');
      }
    } catch (err) {
      setRecoveryError('Connection failure. Unable to reach server.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setRecoveryError(null);
    setResendMessage(null);

    try {
      const res = await api.resendOTP(recoveryId, recoveryEmail, isDoctor);
      if (res.success) {
        setOtpTimer(600); // Reset 10-minute timer
        setResendCooldown(30); // Reset 30-second cooldown
        setResendMessage(res.message || 'A new security code has been sent to your email.');
      } else {
        setRecoveryError(res.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setRecoveryError('Connection failure. Unable to reach server.');
    } finally {
      setResendLoading(false);
    }
  };

  // Handle OTP Verify (Step 2)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryOtp) {
      setRecoveryError('Please enter the OTP.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError(null);

    try {
      const res = await api.verifyOTP(recoveryId, recoveryEmail, isDoctor, recoveryOtp);
      if (res.success) {
        setRecoveryError(null);
        setRecoveryStep('reset');
      } else {
        setRecoveryError(res.message || 'Invalid OTP.');
      }
    } catch (err) {
      setRecoveryError('Connection failure. Unable to reach server.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Handle Password Reset (Step 3) — full client-side validation before API call
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!recoveryNewPassword || !recoveryConfirmPassword) {
      setRecoveryError('Both password fields are required.');
      return;
    }
    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('Passwords do not match. Please re-enter both fields.');
      return;
    }

    // Client-side strength check (mirrors backend validatePasswordStrength)
    const strengthErrors = [];
    if (recoveryNewPassword.length < 6)                         strengthErrors.push('at least 6 characters');
    if (!/[A-Z]/.test(recoveryNewPassword))                     strengthErrors.push('one uppercase letter');
    if (!/[a-z]/.test(recoveryNewPassword))                     strengthErrors.push('one lowercase letter');
    if (!/[0-9]/.test(recoveryNewPassword))                     strengthErrors.push('one number');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(recoveryNewPassword))
                                                                 strengthErrors.push('one special character');
    if (strengthErrors.length > 0) {
      setRecoveryError(`Password must contain: ${strengthErrors.join(', ')}.`);
      return;
    }

    setRecoveryLoading(true);

    try {
      const res = await api.resetPassword(recoveryId, recoveryEmail, isDoctor, recoveryOtp, recoveryNewPassword);
      if (res.success) {
        // Clear any cached auth tokens — old password is now invalid (req #15)
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('doctor_id');
        localStorage.removeItem('patient_id');
        localStorage.removeItem('name');
        setRecoveryStep('success');
      } else {
        setRecoveryError(res.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setRecoveryError('Connection failure. Unable to reach server.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Handle Clinician & Patient Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);
    setValidationErrors({});

    // If doctor registration, check admin verification first
    if (regRole === 'doctor' && !isFormUnlocked) {
      setRegError('Please verify administrative credentials first.');
      return;
    }

    const { name, email, username, age, gender, dob, address, password } = regData;
    const errors = {};

    // 1. Full Legal Name
    if (!name) {
      errors.name = 'Enter the full name';
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      errors.name = 'Full Name must contain only alphabets and spaces.';
    } else if (name.trim().length < 3 || name.trim().length > 50) {
      errors.name = 'Full Name must be between 3 and 50 characters.';
    }

    // 2. Email Address
    if (!email) {
      errors.email = 'Enter the email address';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 3. Phone Number
    if (!regData.phone) {
      errors.phone = 'Enter the mobile number';
    } else if (!/^[6-9][0-9]{9}$/.test(regData.phone)) {
      errors.phone = 'Phone number must be a 10-digit number starting with 6-9.';
    }

    // 4. Username
    if (!username) {
      errors.username = 'Enter the username';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username must contain only letters, numbers, and underscores.';
    } else if (username.length < 4 || username.length > 20) {
      errors.username = 'Username must be between 4 and 20 characters.';
    }

    // 5. Age
    const ageNum = parseInt(age, 10);
    if (!age) {
      errors.age = 'Enter the age';
    } else if (isNaN(ageNum)) {
      errors.age = 'Age must be a valid number.';
    } else if (regRole === 'doctor' && (ageNum < 18 || ageNum > 110)) {
      errors.age = 'Clinician age must be between 18 and 110.';
    } else if (regRole === 'patient' && (ageNum < 1 || ageNum > 110)) {
      errors.age = 'Patient age must be between 1 and 110.';
    }

    // 6. Date of Birth
    if (!dob) {
      errors.dob = 'Enter the date of birth';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate > today) {
        errors.dob = 'Date of Birth cannot be in the future.';
      } else {
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (Math.abs(calculatedAge - ageNum) > 1) {
          errors.dob = 'Age and Date of Birth do not match.';
        }
      }
    }

    // 7. Address
    if (!address) {
      errors.address = 'Enter the address';
    } else if (address.trim().length < 10) {
      errors.address = 'Address must be at least 10 characters long.';
    }

    // 8. Password
    if (!password) {
      errors.password = 'Enter the password';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    } else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      errors.password = 'Password must contain at least one letter and one number.';
    }

    // 9. Confirm Password
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm the password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // 10. Terms Checkbox
    if (!acceptTerms) {
      errors.acceptTerms = 'You must accept the Privacy Policy & Terms to register.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setRegLoading(true);

    try {
      let res;
      if (regRole === 'doctor') {
        res = await api.registerClinician({
          name,
          email,
          username,
          age: ageNum,
          gender,
          dob,
          address,
          phone: regData.phone,
          doctor_id: autoId,
          password
        });
      } else {
        res = await api.registerPatient({
          patient_id: autoId,
          name,
          email,
          username,
          age: ageNum,
          gender,
          phone: regData.phone,
          address,
          date_of_birth: dob,
          password
        });
      }

      if (res.success) {
        setRegSuccess(true);
        setTimeout(() => {
          setRegSuccess(false);
          // Reset data
          setRegData({
            name: '',
            email: '',
            username: '',
            age: '',
            gender: 'Male',
            dob: '',
            address: '',
            phone: '',
            password: ''
          });
          setConfirmPassword('');
          setAcceptTerms(false);
          setAdminId('');
          setAdminPassword('');
          setValidationErrors({});
          if (initiatedByDoctor) {
            onRegistrationComplete();
          } else {
            setMode('login');
          }
        }, 3000);
      } else {
        setRegError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setRegError('Connection failure. Unable to contact authentication server.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setRegRole(role);
    setRegError(null);
    setValidationErrors({});
    setRegData({
      name: '',
      email: '',
      username: '',
      age: '',
      gender: 'Male',
      dob: '',
      address: '',
      phone: '',
      password: ''
    });
    setConfirmPassword('');
    setAcceptTerms(false);
    setAdminId('');
    setAdminPassword('');
  };

  const handleRegChange = (e) => {
    setRegData({
      ...regData,
      [e.target.name]: e.target.value
    });
    
    // Clear validation error for this field
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: null
      });
    }
  };

  if (initiatedByDoctor) {
    return (
      <div className="main-content" style={{ background: 'var(--brand-bg)', padding: '2rem' }}>
        <div className="login-form-card" style={{ maxWidth: '100%', width: '100%', margin: '0' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem', textAlign: 'left' }}>
            <button 
              type="button" 
              className="terms-back-btn" 
              onClick={onRegistrationCancel}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="subtitle-label">Onboarding</span>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.2rem', color: 'var(--brand-secondary)' }}>
                New Patient Registration
              </h2>
            </div>
          </div>

          {/* Dynamic Auto-Generated ID Card */}
          <div style={{ 
            background: 'rgba(249, 115, 22, 0.04)', 
            border: '1.5px solid rgba(249, 115, 22, 0.15)', 
            borderRadius: '20px', 
            padding: '1rem 1.2rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.2rem', 
            marginBottom: '1.5rem',
            boxShadow: '0 4px 10px rgba(249, 115, 22, 0.02)'
          }}>
            <div style={{ 
              width: '52px', 
              height: '52px', 
              borderRadius: '14px', 
              backgroundColor: '#F97316', 
              color: '#FFFFFF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Heart size={26} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span className="subtitle-label" style={{ fontSize: '0.68rem', letterSpacing: '1px', color: '#F97316' }}>
                PATIENT ID
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1E293B', marginTop: '0.1rem', lineHeight: '1.1' }}>
                {autoId || 'Pid00003'}
              </h2>
            </div>
          </div>

          {regSuccess ? (
            <div className="success-banner" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', padding: '1.5rem', borderRadius: '12px', fontWeight: 'bold' }}>
              <ShieldCheck size={24} />
              <div>
                <h4>Registration has been successfully done</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Returning to doctor dashboard...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {regError && (
                <div className="error-banner" style={{ margin: '0 0 1rem 0' }}>
                  <AlertCircle size={18} />
                  <span>{regError}</span>
                </div>
              )}

              {/* FORM FIELDS WRAPPER */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* SECTION 1: IDENTITY */}
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem' }}>
                    Patient Identity
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Full Legal Name</label>
                      <div className="input-wrapper">
                        <User className="input-icon" style={{ color: validationErrors.name ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="text" name="name" className={`form-input ${validationErrors.name ? 'input-error' : ''}`} placeholder="Full Legal Name" value={regData.name} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.name && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.name && <span className="error-helper-text">{validationErrors.name}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Email Address</label>
                      <div className="input-wrapper">
                        <Mail className="input-icon" style={{ color: validationErrors.email ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="email" name="email" className={`form-input ${validationErrors.email ? 'input-error' : ''}`} placeholder="Email Address" value={regData.email} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.email && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.email && <span className="error-helper-text">{validationErrors.email}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Phone Number</label>
                      <div className="input-wrapper">
                        <Phone className="input-icon" style={{ color: validationErrors.phone ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="text" name="phone" className={`form-input ${validationErrors.phone ? 'input-error' : ''}`} placeholder="Phone Number" value={regData.phone} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.phone && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.phone && <span className="error-helper-text">{validationErrors.phone}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Username</label>
                      <div className="input-wrapper">
                        <AtSign className="input-icon" style={{ color: validationErrors.username ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="text" name="username" className={`form-input ${validationErrors.username ? 'input-error' : ''}`} placeholder="Username" value={regData.username} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.username && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.username && <span className="error-helper-text">{validationErrors.username}</span>}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PERSONAL DETAILS */}
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem' }}>
                    Personal Details
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Age</label>
                      <div className="input-wrapper">
                        <Hash className="input-icon" style={{ color: validationErrors.age ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="number" name="age" className={`form-input ${validationErrors.age ? 'input-error' : ''}`} placeholder="Age" value={regData.age} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.age && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.age && <span className="error-helper-text">{validationErrors.age}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Gender</label>
                      <select name="gender" className={`form-select ${validationErrors.gender ? 'input-error' : ''}`} value={regData.gender} onChange={handleRegChange} style={{ padding: '0.8rem 2rem 0.8rem 1.2rem', fontSize: '0.88rem', height: '45px' }}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors.gender && <span className="error-helper-text">{validationErrors.gender}</span>}
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Date of Birth</label>
                      <div className="input-wrapper">
                        <Calendar className="input-icon" style={{ color: validationErrors.dob ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="date" name="dob" className={`form-input ${validationErrors.dob ? 'input-error' : ''}`} value={regData.dob} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.dob && <AlertCircle size={16} style={{ position: 'absolute', right: '2.5rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.dob && <span className="error-helper-text">{validationErrors.dob}</span>}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: CONTACT & SECURITY */}
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem' }}>
                    Contact & Security
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>Address</label>
                      <div className="input-wrapper">
                        <MapPin className="input-icon" style={{ color: validationErrors.address ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                        <input type="text" name="address" className={`form-input ${validationErrors.address ? 'input-error' : ''}`} placeholder="Address" value={regData.address} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                        {validationErrors.address && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                      </div>
                      {validationErrors.address && <span className="error-helper-text">{validationErrors.address}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Password</label>
                        <div className="input-wrapper">
                          <Lock className="input-icon" style={{ color: validationErrors.password ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                          <input 
                            type={showRegPassword ? "text" : "password"} 
                            name="password" 
                            className={`form-input ${validationErrors.password ? 'input-error' : ''}`} 
                            placeholder="Password" 
                            value={regData.password} 
                            onChange={handleRegChange} 
                            style={{ padding: '0.8rem 4rem 0.8rem 2.6rem', fontSize: '0.88rem' }} 
                          />
                          {validationErrors.password && <AlertCircle size={16} style={{ position: 'absolute', right: '3.1rem', color: '#EF4444' }} />}
                          <button 
                            type="button" 
                            className="password-toggle-btn"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                          >
                            {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {validationErrors.password && <span className="error-helper-text">{validationErrors.password}</span>}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem' }}>Confirm Password</label>
                        <div className="input-wrapper">
                          <Lock className="input-icon" style={{ color: validationErrors.confirmPassword ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                          <input 
                            type={showRegConfirmPassword ? "text" : "password"} 
                            className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`} 
                            placeholder="Confirm Password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            style={{ padding: '0.8rem 4rem 0.8rem 2.6rem', fontSize: '0.88rem' }} 
                          />
                          {validationErrors.confirmPassword && <AlertCircle size={16} style={{ position: 'absolute', right: '3.1rem', color: '#EF4444' }} />}
                          <button 
                            type="button" 
                            className="password-toggle-btn"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          >
                            {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {validationErrors.confirmPassword && <span className="error-helper-text">{validationErrors.confirmPassword}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', textAlign: 'left' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={acceptTerms} 
                    onChange={(e) => setAcceptTerms(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>I accept the <a href="#privacy" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>Privacy Policy & Terms</a></span>
                </label>
                {validationErrors.acceptTerms && <span className="error-helper-text">{validationErrors.acceptTerms}</span>}
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  marginTop: '0.75rem', 
                  height: '52px', 
                  borderRadius: '14px', 
                  backgroundColor: '#F97316', 
                  backgroundImage: 'none', 
                  boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }} 
                disabled={regLoading}
              >
                {regLoading ? 'Registering...' : 'REGISTER PATIENT →'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* 1. LEFT BRANDING FLYER */}
      <div className="login-banner">
        <div className="login-banner-content">
          <div className="banner-logo-container">
            <svg viewBox="0 0 100 100" className="banner-logo-svg">
              <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="3.5" fill="none" />
              <path d="M 38 48 C 30 48, 28 36, 36 30 C 32 24, 44 18, 50 24 C 56 18, 68 24, 64 30 C 72 36, 70 48, 62 48 C 62 52, 38 52, 38 48 Z" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 50 24 L 50 48" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M 36 38 C 42 38, 44 34, 48 36" stroke="white" strokeWidth="2" fill="none" />
              <path d="M 64 38 C 58 38, 56 34, 52 36" stroke="white" strokeWidth="2" fill="none" />
              <path d="M 40 44 C 44 42, 46 44, 48 42" stroke="white" strokeWidth="2" fill="none" />
              <path d="M 60 44 C 56 42, 54 44, 52 42" stroke="white" strokeWidth="2" fill="none" />
              <path d="M 24 56 C 24 74, 42 82, 50 82 C 58 82, 76 74, 76 56 C 76 52, 72 50, 70 54 C 66 62, 58 70, 50 70 C 42 70, 34 62, 30 54 C 28 50, 24 52, 24 56 Z" fill="white" />
              <path d="M 50 75 C 50 75, 47 72, 45 70 C 43 68, 45 66, 47 66 C 49 66, 50 68, 50 68 C 50 68, 51 66, 53 66 C 55 66, 57 68, 55 70 C 53 72, 50 75, 50 75 Z" fill="white" />
            </svg>
          </div>
          <h1 className="banner-title">NeuroPredict</h1>
          <span className="banner-subtitle">Predict. Monitor. Recover.</span>
          <div className="banner-pulse-container">
            <svg viewBox="0 0 200 30" className="banner-pulse-svg">
              <path d="M 10 15 L 75 15 L 82 5 L 88 25 L 94 15 L 105 15 L 110 10 L 115 20 L 120 15 L 190 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
            </svg>
          </div>
          <p className="banner-tagline">Smart Stroke Management for a Better Tomorrow</p>
          <div className="banner-illustration-wrapper">
            <img src="/stroke_illustration.png" alt="NeuroPredict Dashboard Illustration" className="banner-illustration-img" />
          </div>
          <div className="banner-features-grid">
            <div className="banner-feature-item">
              <div className="feature-icon-circle">
                <Brain size={20} />
              </div>
              <span className="feature-text">Early Detection</span>
            </div>
            <div className="banner-feature-item">
              <div className="feature-icon-circle">
                <TrendingUp size={20} />
              </div>
              <span className="feature-text">Risk Prediction</span>
            </div>
            <div className="banner-feature-item">
              <div className="feature-icon-circle">
                <ClipboardList size={20} />
              </div>
              <span className="feature-text">Treatment Monitoring</span>
            </div>
            <div className="banner-feature-item">
              <div className="feature-icon-circle">
                <Heart size={20} />
              </div>
              <span className="feature-text">Better Recovery</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIGHT CARD CONTAINER */}
      <div className="login-form-container">
        <div 
          className="login-form-card" 
          style={{ 
maxWidth: mode === 'register' ? '600px' : '450px', 
            width: '100%', 
            transition: 'max-width 0.3s ease' 
          }}
        >
          {/* C. RECOVERY INTERFACE */}
          {mode === 'recovery' && (
            <div style={{ padding: '0.5rem 0' }}>
              {/* Header with Back button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => {
                    if (recoveryStep === 'request') {
                      setMode('login');
                    } else if (recoveryStep === 'verify') {
                      setRecoveryStep('request');
                      setRecoveryError(null);
                    } else if (recoveryStep === 'reset') {
                      setRecoveryStep('verify');
                      setRecoveryError(null);
                    }
                  }}
                  style={{ 
                    position: 'absolute', left: '-15px', top: '0', 
                    width: '36px', height: '36px', borderRadius: '12px',
                    background: '#FFFFFF', border: '1px solid var(--brand-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                    color: 'var(--text-primary)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <ArrowLeft size={18} />
                </button>
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--brand-secondary)', margin: 0 }}>Account Recovery</h2>
                  <span className="subtitle-label" style={{ marginTop: '0.4rem', display: 'inline-block' }}>Security Infrastructure</span>
                </div>
              </div>

              {/* Shield Icon Graphic */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem 0' }}>
                <div style={{ 
                  width: '84px', height: '84px', borderRadius: '50%',
                  background: 'var(--brand-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(3,152,85,0.15)'
                }}>
                  <div style={{ 
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'var(--sunset-gradient)', color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(3,152,85,0.25)'
                  }}>
                    <ShieldCheck size={26} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {recoveryStep === 'request' && (
                <>
                  {/* Identity Form using premium app classes */}
                  <div style={{ marginBottom: '1rem', paddingLeft: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Identity Check</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div className="input-wrapper">
                        <AtSign className="input-icon" size={18} />
                        <input 
                          type="text" 
                          className="form-input"
                          placeholder={isDoctor ? "Clinician ID (DidXXXXX)" : "Patient ID (PidXXXXX)"}
                          value={recoveryId}
                          onChange={(e) => setRecoveryId(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input 
                          type="email" 
                          className="form-input"
                          placeholder="Registered Email"
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
                      <AlertCircle size={18} />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button 
                    type="button" 
                    className="btn-login-submit"
                    onClick={handleRecoverySubmit}
                    disabled={recoveryLoading}
                  >
                    {recoveryLoading ? 'Verifying...' : 'Send Security Code'}
                  </button>
                </>
              )}

              {recoveryStep === 'verify' && (
                <>
                  <div style={{ marginBottom: '1rem', paddingLeft: '0.2rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Security Verification</span>
                  </div>

                  {/* 10-Minute Countdown Timer Display */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    padding: '0.75rem 1rem',
                    background: otpTimer > 0 ? 'rgba(3, 152, 85, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                    color: otpTimer > 0 ? '#039855' : '#EF4444',
                    border: otpTimer > 0 ? '1px solid rgba(3, 152, 85, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    <Clock size={18} />
                    <span>
                      {otpTimer > 0 
                        ? `OTP Valid For: ${formatTime(otpTimer)}` 
                        : 'OTP Expired! Please click Resend OTP.'}
                    </span>
                  </div>

                  <div style={{ 
                    background: '#FFFFFF', 
                    borderRadius: '20px', 
                    padding: '1.5rem', 
                    boxShadow: '0 8px 30px rgba(0,0,0,0.04)', 
                    marginBottom: '1.25rem',
                    border: '1px solid rgba(0,0,0,0.02)'
                  }}>
                    <p style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                      A 6-digit security code was sent to<br/>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{recoveryEmail}</span>
                    </p>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div className="input-wrapper" style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', background: '#FFFFFF' }}>
                        <Lock className="input-icon" size={18} style={{ color: 'var(--brand-primary)' }} />
                        <input 
                          type="text" 
                          className="form-input"
                          style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                          placeholder="Enter 6-Digit Code"
                          value={recoveryOtp}
                          onChange={(e) => setRecoveryOtp(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  {resendMessage && (
                    <div style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      textAlign: 'center',
                      marginBottom: '1.25rem'
                    }}>
                      {resendMessage}
                    </div>
                  )}

                  {recoveryError && (
                    <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
                      <AlertCircle size={18} />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button 
                    type="button" 
                    className="btn-login-submit"
                    onClick={handleOtpSubmit}
                    disabled={recoveryLoading || otpTimer === 0}
                    style={{
                      marginBottom: '1.25rem',
                      background: otpTimer === 0 ? '#94a3b8' : 'var(--brand-primary)',
                      boxShadow: otpTimer === 0 ? 'none' : '0 8px 20px rgba(3,152,85,0.3)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {recoveryLoading ? 'Verifying...' : 'Verify Identity'}
                  </button>

                  {/* Resend OTP Button */}
                  <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || resendLoading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: (resendCooldown > 0 || resendLoading) ? '#94a3b8' : 'var(--brand-primary)',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: (resendCooldown > 0 || resendLoading) ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textDecoration: 'none'
                      }}
                    >
                      <RotateCcw size={16} className={resendLoading ? 'animate-spin' : ''} />
                      {resendLoading 
                        ? 'Resending OTP...' 
                        : resendCooldown > 0 
                          ? `Resend OTP in ${resendCooldown}s` 
                          : 'Resend OTP'}
                    </button>
                  </div>
                </>
              )}

              {recoveryStep === 'reset' && (
                <>
                  <div style={{ marginBottom: '0.75rem', paddingLeft: '0.2rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Create New Password</span>
                  </div>

                  {/* Password rules reminder */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#166534', fontWeight: '600', lineHeight: '1.7' }}>
                    <strong>Password must contain:</strong>
                    <ul style={{ margin: '4px 0 0 1rem', padding: 0 }}>
                      {[
                        ['len',   recoveryNewPassword.length >= 6,         'At least 6 characters'],
                        ['upper', /[A-Z]/.test(recoveryNewPassword),       'One uppercase letter (A-Z)'],
                        ['lower', /[a-z]/.test(recoveryNewPassword),       'One lowercase letter (a-z)'],
                        ['num',   /[0-9]/.test(recoveryNewPassword),       'One number (0-9)'],
                        ['spec',  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(recoveryNewPassword), 'One special character (!@#$%^&*)'],
                      ].map(([k, ok, label]) => (
                        <li key={k} style={{ color: ok ? '#166534' : '#94a3b8', transition: 'color 0.2s' }}>
                          {ok ? '✓' : '○'} {label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* New Password */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">New Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="New Password"
                          value={recoveryNewPassword}
                          onChange={(e) => setRecoveryNewPassword(e.target.value)}
                          style={{ paddingRight: '3rem' }}
                        />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Confirm Password</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Confirm New Password"
                          value={recoveryConfirmPassword}
                          onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                          style={{ paddingRight: '3rem' }}
                        />
                      </div>
                      {recoveryConfirmPassword && (
                        <span style={{ fontSize: '0.76rem', fontWeight: '700', marginTop: '4px', display: 'block',
                          color: recoveryNewPassword === recoveryConfirmPassword ? '#059669' : '#ef4444' }}>
                          {recoveryNewPassword === recoveryConfirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                        </span>
                      )}
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
                      <AlertCircle size={18} />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-login-submit"
                    onClick={handleResetSubmit}
                    disabled={recoveryLoading}
                  >
                    {recoveryLoading ? 'Updating Password...' : '🔒 Set New Password'}
                  </button>
                </>
              )}

              {recoveryStep === 'success' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    color: '#fff', marginBottom: '1.25rem',
                    boxShadow: '0 8px 24px rgba(3,152,85,0.3)'
                  }}>
                    <ShieldCheck size={34} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#064e3b', marginBottom: '0.75rem' }}>
                    Password Updated!
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '2rem' }}>
                    Your password has been updated successfully.<br />
                    Please log in with your new password.
                  </p>
                  <button
                    type="button"
                    className="btn-login-submit"
                    onClick={() => {
                      setMode('login');
                      setRecoveryStep('request');
                      setRecoveryId('');
                      setRecoveryEmail('');
                      setRecoveryOtp('');
                      setRecoveryNewPassword('');
                      setRecoveryConfirmPassword('');
                      setRecoveryError(null);
                    }}
                  >
                    Return to Login →
                  </button>
                </div>
              )}
            </div>
          )}


          {/* A. SIGN IN INTERFACE */}
          {mode === 'login' && (
            <>
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <span className="subtitle-label">Welcome back</span>
                <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', color: 'var(--brand-secondary)' }}>Sign In to Portal</h2>
              </div>

              {loginError && (
                <div className="error-banner">
                  <AlertCircle size={18} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <div className="input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder={isDoctor ? "Doctor ID" : "Patient ID"}
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="auth-options">
                  <label className="checkbox-container">
                    <input type="checkbox" defaultChecked />
                    Remember Me
                  </label>
                  <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); setMode('recovery'); }}>Forgot Password?</a>
                </div>

                <button type="submit" className="btn-login-submit" disabled={loginLoading}>
                  {loginLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="register-redirect">
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); handleRoleChange(isDoctor ? 'doctor' : 'patient'); }}>Register</a>
              </div>

              {/* Role selector Cards */}
              <div className="role-selector-row">
                <button
                  type="button"
                  className={`role-card ${isDoctor ? 'active' : ''}`}
                  onClick={() => { setIsDoctor(true); setLoginError(null); }}
                >
                  <div className="role-card-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="role-card-info">
                    <h4>Doctor</h4>
                    <p>Access patient records & manage treatment</p>
                  </div>
                </button>
                <button
                  type="button"
                  className={`role-card ${!isDoctor ? 'active' : ''}`}
                  onClick={() => { setIsDoctor(false); setLoginError(null); }}
                >
                  <div className="role-card-icon">
                    <User size={18} />
                  </div>
                  <div className="role-card-info">
                    <h4>Patient</h4>
                    <p>View health records & track recovery</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* B. CLINICIAN / PATIENT DETAILS REGISTRATION FORM */}
          {mode === 'register' && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginBottom: '1.5rem' }}>
                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  style={{ 
                    position: 'absolute', left: '-15px', top: '0', 
                    width: '36px', height: '36px', borderRadius: '12px',
                    background: '#FFFFFF', border: '1px solid var(--brand-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                    color: 'var(--text-primary)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                  aria-label="Back to login"
                >
                  <ArrowLeft size={18} />
                </button>
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <span className="subtitle-label">Onboarding</span>
                  <h2 style={{ fontSize: '1.8rem', marginTop: '0.2rem', color: 'var(--brand-secondary)' }}>
                    New {regRole === 'doctor' ? 'Clinician' : 'Patient'} Registration
                  </h2>
                </div>
              </div>


              {/* Administrative verification section for Doctor only */}
              {regRole === 'doctor' && (
                <div className="admin-verification-section" style={{ background: '#F9FAFC', border: '1px dashed var(--brand-border)', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--brand-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Systems Access Required
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0, textAlign: 'left' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: '800' }}>Admin ID</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={14} />
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ padding: '0.6rem 0.8rem 0.6rem 2.2rem', fontSize: '0.82rem', borderRadius: '12px' }} 
                          placeholder="Administration ID" 
                          value={adminId} 
                          onChange={(e) => setAdminId(e.target.value)} 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ margin: 0, textAlign: 'left' }}>
                      <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: '800' }}>Security Token</label>
                      <div className="input-wrapper">
                        <KeyRound className="input-icon" size={14} />
                        <input 
                          type={adminShowPassword ? "text" : "password"} 
                          className="form-input" 
                          style={{ padding: '0.6rem 2.2rem 0.6rem 2.2rem', fontSize: '0.82rem', borderRadius: '12px' }} 
                          placeholder="••••••••" 
                          value={adminPassword} 
                          onChange={(e) => setAdminPassword(e.target.value)} 
                        />
                        <button 
                          type="button" 
                          className="password-toggle-btn"
                          style={{ right: '0.75rem' }}
                          onClick={() => setAdminShowPassword(!adminShowPassword)}
                        >
                          {adminShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    {isFormUnlocked ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--brand-success)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        <ShieldCheck size={14} />
                        <span>Administrative credentials verified. Registration unlocked.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        <Lock size={14} />
                        <span>Please enter correct administrative credentials to unlock registration.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Auto-Generated ID Card */}
              <div style={{ 
                background: 'rgba(249, 115, 22, 0.04)', 
                border: '1.5px solid rgba(249, 115, 22, 0.15)', 
                borderRadius: '20px', 
                padding: '1rem 1.2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.2rem', 
                marginBottom: '1.5rem',
                boxShadow: '0 4px 10px rgba(249, 115, 22, 0.02)'
              }}>
                <div style={{ 
                  width: '52px', 
                  height: '52px', 
                  borderRadius: '14px', 
                  backgroundColor: '#F97316', 
                  color: '#FFFFFF', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Heart size={26} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span className="subtitle-label" style={{ fontSize: '0.68rem', letterSpacing: '1px', color: '#F97316' }}>
                    {regRole === 'doctor' ? 'CLINICIAN ID' : 'PATIENT ID'}
                  </span>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1E293B', marginTop: '0.1rem', lineHeight: '1.1' }}>
                    {autoId || (regRole === 'doctor' ? 'Did00003' : 'Pid00003')}
                  </h2>
                </div>
              </div>

              {regSuccess ? (
                <div className="success-banner" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', padding: '1.5rem', borderRadius: '12px', fontWeight: 'bold' }}>
                  <ShieldCheck size={24} />
                  <div>
                    <h4>Registration Successful!</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Redirecting you to login portal...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  
                  {regError && (
                    <div className="error-banner" style={{ margin: '0 0 1rem 0' }}>
                      <AlertCircle size={18} />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* FORM FIELDS WRAPPER (LOCKED IF NOT VERIFIED) */}
                  <div style={{ 
                    opacity: isFormUnlocked ? 1 : 0.4, 
                    pointerEvents: isFormUnlocked ? 'auto' : 'none', 
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem'
                  }}>
                    
                    {/* SECTION 1: CLINICIAN/PATIENT IDENTITY */}
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem' }}>
                        {regRole === 'doctor' ? 'Clinician Identity' : 'Patient Identity'}
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Full Legal Name</label>
                          <div className="input-wrapper">
                            <User className="input-icon" style={{ color: validationErrors.name ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="text" name="name" className={`form-input ${validationErrors.name ? 'input-error' : ''}`} placeholder="Full Legal Name" value={regData.name} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.name && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.name && <span className="error-helper-text">{validationErrors.name}</span>}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Email Address</label>
                          <div className="input-wrapper">
                            <Mail className="input-icon" style={{ color: validationErrors.email ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="email" name="email" className={`form-input ${validationErrors.email ? 'input-error' : ''}`} placeholder="Email Address" value={regData.email} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.email && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.email && <span className="error-helper-text">{validationErrors.email}</span>}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Phone Number</label>
                          <div className="input-wrapper">
                            <Phone className="input-icon" style={{ color: validationErrors.phone ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="text" name="phone" className={`form-input ${validationErrors.phone ? 'input-error' : ''}`} placeholder="Phone Number" value={regData.phone} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.phone && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.phone && <span className="error-helper-text">{validationErrors.phone}</span>}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Username</label>
                          <div className="input-wrapper">
                            <AtSign className="input-icon" style={{ color: validationErrors.username ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="text" name="username" className={`form-input ${validationErrors.username ? 'input-error' : ''}`} placeholder="Username" value={regData.username} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.username && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.username && <span className="error-helper-text">{validationErrors.username}</span>}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: PERSONAL DETAILS */}
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem' }}>
                        Personal Details
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Age</label>
                          <div className="input-wrapper">
                            <Hash className="input-icon" style={{ color: validationErrors.age ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="number" name="age" className={`form-input ${validationErrors.age ? 'input-error' : ''}`} placeholder="Age" value={regData.age} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.age && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.age && <span className="error-helper-text">{validationErrors.age}</span>}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Gender</label>
                          <select name="gender" className={`form-select ${validationErrors.gender ? 'input-error' : ''}`} value={regData.gender} onChange={handleRegChange} style={{ padding: '0.8rem 2rem 0.8rem 1.2rem', fontSize: '0.88rem', height: '45px' }}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          {validationErrors.gender && <span className="error-helper-text">{validationErrors.gender}</span>}
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Date of Birth</label>
                          <div className="input-wrapper">
                            <Calendar className="input-icon" style={{ color: validationErrors.dob ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="date" name="dob" className={`form-input ${validationErrors.dob ? 'input-error' : ''}`} value={regData.dob} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.dob && <AlertCircle size={16} style={{ position: 'absolute', right: '2.5rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.dob && <span className="error-helper-text">{validationErrors.dob}</span>}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: WORKSTATION & ACCESS / CONTACT DETAILS */}
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.35rem' }}>
                        {regRole === 'doctor' ? 'Workstation & Access' : 'Contact & Security'}
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>Address</label>
                          <div className="input-wrapper">
                            <MapPin className="input-icon" style={{ color: validationErrors.address ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                            <input type="text" name="address" className={`form-input ${validationErrors.address ? 'input-error' : ''}`} placeholder="Address" value={regData.address} onChange={handleRegChange} style={{ padding: '0.8rem 2.6rem 0.8rem 2.6rem', fontSize: '0.88rem' }} />
                            {validationErrors.address && <AlertCircle size={16} style={{ position: 'absolute', right: '1.1rem', color: '#EF4444' }} />}
                          </div>
                          {validationErrors.address && <span className="error-helper-text">{validationErrors.address}</span>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Password</label>
                            <div className="input-wrapper">
                              <Lock className="input-icon" style={{ color: validationErrors.password ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                              <input 
                                type={showRegPassword ? "text" : "password"} 
                                name="password" 
                                className={`form-input ${validationErrors.password ? 'input-error' : ''}`} 
                                placeholder="Password" 
                                value={regData.password} 
                                onChange={handleRegChange} 
                                style={{ padding: '0.8rem 4rem 0.8rem 2.6rem', fontSize: '0.88rem' }} 
                              />
                              {validationErrors.password && <AlertCircle size={16} style={{ position: 'absolute', right: '3.1rem', color: '#EF4444' }} />}
                              <button 
                                type="button" 
                                className="password-toggle-btn"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                              >
                                {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {validationErrors.password && <span className="error-helper-text">{validationErrors.password}</span>}
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Confirm Password</label>
                            <div className="input-wrapper">
                              <Lock className="input-icon" style={{ color: validationErrors.confirmPassword ? '#EF4444' : 'var(--brand-primary)' }} size={16} />
                              <input 
                                type={showRegConfirmPassword ? "text" : "password"} 
                                className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`} 
                                placeholder="Confirm Password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                style={{ padding: '0.8rem 4rem 0.8rem 2.6rem', fontSize: '0.88rem' }} 
                              />
                              {validationErrors.confirmPassword && <AlertCircle size={16} style={{ position: 'absolute', right: '3.1rem', color: '#EF4444' }} />}
                              <button 
                                type="button" 
                                className="password-toggle-btn"
                                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                              >
                                {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {validationErrors.confirmPassword && <span className="error-helper-text">{validationErrors.confirmPassword}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', textAlign: 'left' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={acceptTerms} 
                          onChange={(e) => setAcceptTerms(e.target.checked)} 
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>I accept the <a href="#privacy" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>Privacy Policy & Terms</a></span>
                      </label>
                      {validationErrors.acceptTerms && <span className="error-helper-text">{validationErrors.acceptTerms}</span>}
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ 
                        width: '100%', 
                        marginTop: '0.75rem', 
                        height: '52px', 
                        borderRadius: '14px', 
                        backgroundColor: '#F97316', 
                        backgroundImage: 'none', 
                        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.25)',
                        fontSize: '1rem',
                        fontWeight: '700'
                      }} 
                      disabled={regLoading}
                    >
                      {regLoading ? 'Registering...' : 'REGISTER →'}
                    </button>
                  </div>
                </form>
              )}

              <div className="register-redirect" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Login</a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. GLOBAL FOOTER */}
      <div className="login-footer">
        <div className="footer-secure">
          <ShieldCheck size={16} />
          <span>Your health data is secure with us.</span>
        </div>
        <div>
          <span>© 2026 NeuroPredict. All rights reserved.</span>
        </div>
      </div>

      {/* Terms and Conditions Modal Overlay */}
      {showTermsModal && (
        <div 
          className="terms-modal-backdrop"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="terms-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className="terms-close-btn"
              onClick={() => setShowTermsModal(false)}
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="terms-modal-header">
              <h2 className="terms-modal-title">Privacy Policy & Terms of Service</h2>
            </div>
            
            <div className="terms-modal-body">
              <div className="terms-section">
                <h3 className="terms-section-title">1. Acceptance of Terms</h3>
                <p className="terms-section-text">
                  By using the NeuroPredict application, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use our services.
                </p>
              </div>

              <div className="terms-section">
                <h3 className="terms-section-title">2. Privacy Policy</h3>
                <p className="terms-section-text">
                  We take your privacy seriously. All clinical data entered into the NeuroPredict system is handled in accordance with medical data protection standards. We collect patient identifiers, clinical scores (NIHSS, mRS, etc.), and treatment details to provide risk assessment and prognostic modeling.
                </p>
                <p className="terms-section-text">
                  Your data is stored securely on our infrastructure and is only accessible by authorized medical personnel.
                </p>
              </div>

              <div className="terms-section">
                <h3 className="terms-section-title">3. Medical Disclaimer</h3>
                <p className="terms-section-text">
                  NeuroPredict is a clinical decision support tool. It provides risk calculations based on published medical scales. These scores are for informational purposes only and should not replace professional medical judgment. Always consult with a qualified physician for diagnosis and treatment decisions.
                </p>
              </div>

              <div className="terms-section">
                <h3 className="terms-section-title">4. User Responsibilities</h3>
                <p className="terms-section-text">
                  As a user, you are responsible for maintaining the confidentiality of your login credentials. Clinicians must ensure that they have obtained appropriate patient consent before entering data into the system.
                </p>
              </div>

              <div className="terms-section">
                <h3 className="terms-section-title">5. Data Accuracy</h3>
                <p className="terms-section-text">
                  While we strive for accuracy, we cannot guarantee that all calculations are error-free. The system relies on the data entered by the user. Incorrect data entry will result in incorrect risk assessments.
                </p>
              </div>
            </div>

            <div className="terms-modal-footer">
              <button 
                type="button" 
                className="btn-terms-agree"
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
              >
                Agree and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
