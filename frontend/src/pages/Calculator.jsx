import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { calculateAllScores } from '../utils/scoring';
import { ShieldCheck, Info, FileDown, CheckCircle, AlertTriangle, AlertCircle, User, Save, Download, ArrowLeft } from 'lucide-react';

export default function Calculator({ selectedPatientId, onBack }) {
  const clinicianId = localStorage.getItem('doctor_id') || 'Doc001';
  
  // Tab control: 0: Inputs, 1: Risks
  const [tab, setTab] = useState(0);
  const [isReadOnly] = useState(localStorage.getItem('role') === 'patient');
  const actualPatientId = isReadOnly ? localStorage.getItem('patient_id') : selectedPatientId;

  // Form Parameters State
  const [patientId, setPatientId] = useState(actualPatientId || '');
  const [patientValid, setPatientValid] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);

  const [strokeType, setStrokeType] = useState('Ischemic');
  const [oxfordshire, setOxfordshire] = useState('LACI');
  const [toast, setToast] = useState('Small Vessel');

  const [glucose, setGlucose] = useState('100');
  const [earlyInfarct, setEarlyInfarct] = useState(false);
  const [denseMca, setDenseMca] = useState(false);
  const [corticalInvolvement, setCorticalInvolvement] = useState(false);
  const [mcaTerritory, setMcaTerritory] = useState(false);
  const [dysphagia, setDysphagia] = useState(false);
  const [earlySeizure, setEarlySeizure] = useState(false);

  // Comorbidities
  const [hypertension, setHypertension] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [chf, setChf] = useState(false);
  const [af, setAf] = useState(false);
  const [priorStroke, setPriorStroke] = useState(false);
  const [vascularDisease, setVascularDisease] = useState(false);
  const [cancer, setCancer] = useState(false);
  const [dementia, setDementia] = useState(false);
  const [ckd, setCkd] = useState(false);
  const [dependentBeforeStroke, setDependentBeforeStroke] = useState(false);
  const [livingAlone, setLivingAlone] = useState(false);
  const [mrs, setMrs] = useState(0);

  // NIHSS Steppers
  const [loc, setLoc] = useState(0);
  const [locQuestions, setLocQuestions] = useState(0);
  const [locCommands, setLocCommands] = useState(0);
  const [bestGaze, setBestGaze] = useState(0);
  const [visualFields, setVisualFields] = useState(0);
  const [facialPalsy, setFacialPalsy] = useState(0);
  const [motorArmL, setMotorArmL] = useState(0);
  const [motorArmR, setMotorArmR] = useState(0);
  const [motorLegL, setMotorLegL] = useState(0);
  const [motorLegR, setMotorLegR] = useState(0);
  const [limbAtaxia, setLimbAtaxia] = useState(0);
  const [sensory, setSensory] = useState(0);
  const [language, setLanguage] = useState(0);
  const [dysarthria, setDysarthria] = useState(0);
  const [extinction, setExtinction] = useState(0);

  // Calculated Results
  const [calculated, setCalculated] = useState({ results: {}, nihssTotal: 0 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().substring(0, 10));

  // Re-entry confirmation modal
  const [showReEnterModal, setShowReEnterModal] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);

  // Baseline snapshot: used to detect if user has changed any value
  const defaultBaseline = {
    strokeType: 'Ischemic', oxfordshire: 'LACI', toast: 'Small Vessel',
    glucose: '100',
    earlyInfarct: false, denseMca: false, corticalInvolvement: false,
    mcaTerritory: false, dysphagia: false, earlySeizure: false,
    hypertension: false, diabetes: false, smoking: false, chf: false, af: false,
    priorStroke: false, vascularDisease: false, cancer: false, dementia: false,
    ckd: false, dependentBeforeStroke: false, livingAlone: false, mrs: 0,
    loc: 0, locQuestions: 0, locCommands: 0, bestGaze: 0, visualFields: 0,
    facialPalsy: 0, motorArmL: 0, motorArmR: 0, motorLegL: 0, motorLegR: 0,
    limbAtaxia: 0, sensory: 0, language: 0, dysarthria: 0, extinction: 0
  };
  const [baseline, setBaseline] = useState(null);

  // Compute whether any field differs from baseline
  const hasChanges = !isReadOnly && patientValid && baseline !== null && (
    strokeType !== baseline.strokeType ||
    oxfordshire !== baseline.oxfordshire ||
    toast !== baseline.toast ||
    String(glucose) !== String(baseline.glucose) ||
    earlyInfarct !== baseline.earlyInfarct ||
    denseMca !== baseline.denseMca ||
    corticalInvolvement !== baseline.corticalInvolvement ||
    mcaTerritory !== baseline.mcaTerritory ||
    dysphagia !== baseline.dysphagia ||
    earlySeizure !== baseline.earlySeizure ||
    hypertension !== baseline.hypertension ||
    diabetes !== baseline.diabetes ||
    smoking !== baseline.smoking ||
    chf !== baseline.chf ||
    af !== baseline.af ||
    priorStroke !== baseline.priorStroke ||
    vascularDisease !== baseline.vascularDisease ||
    cancer !== baseline.cancer ||
    dementia !== baseline.dementia ||
    ckd !== baseline.ckd ||
    dependentBeforeStroke !== baseline.dependentBeforeStroke ||
    livingAlone !== baseline.livingAlone ||
    mrs !== baseline.mrs ||
    loc !== baseline.loc ||
    locQuestions !== baseline.locQuestions ||
    locCommands !== baseline.locCommands ||
    bestGaze !== baseline.bestGaze ||
    visualFields !== baseline.visualFields ||
    facialPalsy !== baseline.facialPalsy ||
    motorArmL !== baseline.motorArmL ||
    motorArmR !== baseline.motorArmR ||
    motorLegL !== baseline.motorLegL ||
    motorLegR !== baseline.motorLegR ||
    limbAtaxia !== baseline.limbAtaxia ||
    sensory !== baseline.sensory ||
    language !== baseline.language ||
    dysarthria !== baseline.dysarthria ||
    extinction !== baseline.extinction
  );

  // Auto validate patient if actualPatientId changes
  useEffect(() => {
    if (actualPatientId) {
      setPatientId(actualPatientId);
      validatePatient(actualPatientId);
      
      if (isReadOnly) {
        loadHistoricalScore(actualPatientId);
      }
    }
  }, [actualPatientId, isReadOnly]);

  const loadHistoricalScore = async (id) => {
    try {
      const scores = await api.fetchScores(id);
      if (Array.isArray(scores) && scores.length > 0) {
        // Assume API returns descending by date, so scores[0] is latest
        const latest = scores[0];
        
        // Populate state
        if (latest.stroke_type) setStrokeType(latest.stroke_type);
        if (latest.oxfordshire) setOxfordshire(latest.oxfordshire);
        if (latest.toast) setToast(latest.toast);
        if (latest.glucose_value !== undefined) setGlucose(String(latest.glucose_value));
        
        setEarlyInfarct(!!latest.early_infarct);
        setDenseMca(!!latest.dense_mca);
        setCorticalInvolvement(!!latest.cortical_involvement);
        setMcaTerritory(!!latest.mca_territory);
        setDysphagia(!!latest.dysphagia);
        setEarlySeizure(!!latest.early_seizure);
        
        setHypertension(!!latest.hypertension);
        setDiabetes(!!latest.diabetes);
        setSmoking(!!latest.smoking);
        setChf(!!latest.chf);
        setAf(!!latest.af);
        setPriorStroke(!!latest.prior_stroke);
        setVascularDisease(!!latest.vascular_disease);
        setCancer(!!latest.cancer);
        setDementia(!!latest.dementia);
        setCkd(!!latest.ckd);
        setDependentBeforeStroke(!!latest.dependent_before_stroke);
        setLivingAlone(!!latest.living_alone);
        
        if (latest.mrs !== undefined) setMrs(latest.mrs);
        if (latest.loc !== undefined) setLoc(latest.loc);
        if (latest.loc_questions !== undefined) setLocQuestions(latest.loc_questions);
        if (latest.loc_commands !== undefined) setLocCommands(latest.loc_commands);
        if (latest.best_gaze !== undefined) setBestGaze(latest.best_gaze);
        if (latest.visual_fields !== undefined) setVisualFields(latest.visual_fields);
        if (latest.facial_palsy !== undefined) setFacialPalsy(latest.facial_palsy);
        if (latest.motor_arm_l !== undefined) setMotorArmL(latest.motor_arm_l);
        if (latest.motor_arm_r !== undefined) setMotorArmR(latest.motor_arm_r);
        if (latest.motor_leg_l !== undefined) setMotorLegL(latest.motor_leg_l);
        if (latest.motor_leg_r !== undefined) setMotorLegR(latest.motor_leg_r);
        if (latest.limb_ataxia !== undefined) setLimbAtaxia(latest.limb_ataxia);
        if (latest.sensory !== undefined) setSensory(latest.sensory);
        if (latest.language !== undefined) setLanguage(latest.language);
        if (latest.dysarthria !== undefined) setDysarthria(latest.dysarthria);
        if (latest.extinction !== undefined) setExtinction(latest.extinction);
        if (latest.assessment_date) setAssessmentDate(latest.assessment_date);
        
        setHasHistoricalData(true);
      } else {
        setError('No previous assessment scores found to display.');
        setHasHistoricalData(false);
      }
    } catch (err) {
      console.error('Failed to load historical score', err);
      setError('Connection error checking for historical scores.');
    } finally {
      setDataLoaded(true);
    }
  };

  // Recalculate risk scores on any input change
  useEffect(() => {
    const input = {
      age: patientDetails?.age || 65,
      sex: patientDetails?.gender || 'Male',
      mrs,
      living_alone: livingAlone ? 1 : 0,
      dependent_before_stroke: dependentBeforeStroke ? 1 : 0,
      stroke_type: strokeType,
      oxfordshire,
      toast,
      early_infarct: earlyInfarct ? 1 : 0,
      dense_mca: denseMca ? 1 : 0,
      cortical_involvement: corticalInvolvement ? 1 : 0,
      mca_territory: mcaTerritory ? 1 : 0,
      glucose_value: parseFloat(glucose || 100),
      dysphagia: dysphagia ? 1 : 0,
      early_seizure: earlySeizure ? 1 : 0,
      af: af ? 1 : 0,
      chf: chf ? 1 : 0,
      diabetes: diabetes ? 1 : 0,
      hypertension: hypertension ? 1 : 0,
      prior_stroke: priorStroke ? 1 : 0,
      smoking: smoking ? 1 : 0,
      vascular_disease: vascularDisease ? 1 : 0,
      cancer: cancer ? 1 : 0,
      dementia: dementia ? 1 : 0,
      ckd: ckd ? 1 : 0,
      loc, loc_questions: locQuestions, loc_commands: locCommands,
      best_gaze: bestGaze, visual_fields: visualFields, facial_palsy: facialPalsy,
      motor_arm_l: motorArmL, motor_arm_r: motorArmR, motor_leg_l: motorLegL, motor_leg_r: motorLegR,
      limb_ataxia: limbAtaxia, sensory, language, dysarthria, extinction
    };
    
    setCalculated(calculateAllScores(input));
  }, [
    patientDetails, mrs, livingAlone, dependentBeforeStroke, strokeType, oxfordshire, toast,
    earlyInfarct, denseMca, corticalInvolvement, mcaTerritory, glucose, dysphagia, earlySeizure,
    af, chf, diabetes, hypertension, priorStroke, smoking, vascularDisease, cancer, dementia, ckd,
    loc, locQuestions, locCommands, bestGaze, visualFields, facialPalsy,
    motorArmL, motorArmR, motorLegL, motorLegR, limbAtaxia, sensory, language, dysarthria, extinction
  ]);

  const validatePatient = async (id) => {
    if (!id) return;
    setError(null);
    setShowReEnterModal(false);
    setExistingRecord(null);
    try {
      const res = await api.validatePatient(id);
      if (res.success) {
        setPatientValid(true);
        setPatientDetails(res);

        // In doctor mode: check if patient already has a submitted record
        if (!isReadOnly) {
          try {
            const scores = await api.fetchScores(id);
            if (Array.isArray(scores) && scores.length > 0) {
              setExistingRecord(scores[0]);
              setShowReEnterModal(true);
              // Don't set baseline yet — wait for re-entry confirmation
            } else {
              // New patient — set blank baseline so any input enables submit
              setBaseline({ ...defaultBaseline });
            }
          } catch (_) {
            setBaseline({ ...defaultBaseline });
          }
        }
      } else {
        setPatientValid(false);
        setPatientDetails(null);
        setError('Invalid Patient ID — Patient details not registered.');
      }
    } catch (err) {
      setError('Connection failure checking Patient ID.');
    }
  };

  // Called when clinician confirms they want to overwrite existing data
  const handleConfirmReEnter = () => {
    setShowReEnterModal(false);
    // Pre-fill form with existing record values so clinician can edit
    if (existingRecord) {
      const r = existingRecord;
      const newBaseline = {
        strokeType: r.stroke_type || 'Ischemic',
        oxfordshire: r.oxfordshire || 'LACI',
        toast: r.toast || 'Small Vessel',
        glucose: String(r.glucose_value ?? 100),
        earlyInfarct: !!r.early_infarct,
        denseMca: !!r.dense_mca,
        corticalInvolvement: !!r.cortical_involvement,
        mcaTerritory: !!r.mca_territory,
        dysphagia: !!r.dysphagia,
        earlySeizure: !!r.early_seizure,
        hypertension: !!r.hypertension,
        diabetes: !!r.diabetes,
        smoking: !!r.smoking,
        chf: !!r.chf,
        af: !!r.af,
        priorStroke: !!r.prior_stroke,
        vascularDisease: !!r.vascular_disease,
        cancer: !!r.cancer,
        dementia: !!r.dementia,
        ckd: !!r.ckd,
        dependentBeforeStroke: !!r.dependent_before_stroke,
        livingAlone: !!r.living_alone,
        mrs: r.mrs ?? 0,
        loc: r.loc ?? 0,
        locQuestions: r.loc_questions ?? 0,
        locCommands: r.loc_commands ?? 0,
        bestGaze: r.best_gaze ?? 0,
        visualFields: r.visual_fields ?? 0,
        facialPalsy: r.facial_palsy ?? 0,
        motorArmL: r.motor_arm_l ?? 0,
        motorArmR: r.motor_arm_r ?? 0,
        motorLegL: r.motor_leg_l ?? 0,
        motorLegR: r.motor_leg_r ?? 0,
        limbAtaxia: r.limb_ataxia ?? 0,
        sensory: r.sensory ?? 0,
        language: r.language ?? 0,
        dysarthria: r.dysarthria ?? 0,
        extinction: r.extinction ?? 0,
      };
      // Set baseline FIRST so hasChanges starts as false
      setBaseline(newBaseline);
      // Then fill form fields to match existing record
      if (r.stroke_type) setStrokeType(r.stroke_type);
      if (r.oxfordshire) setOxfordshire(r.oxfordshire);
      if (r.toast) setToast(r.toast);
      if (r.glucose_value !== undefined) setGlucose(String(r.glucose_value));
      setEarlyInfarct(!!r.early_infarct);
      setDenseMca(!!r.dense_mca);
      setCorticalInvolvement(!!r.cortical_involvement);
      setMcaTerritory(!!r.mca_territory);
      setDysphagia(!!r.dysphagia);
      setEarlySeizure(!!r.early_seizure);
      setHypertension(!!r.hypertension);
      setDiabetes(!!r.diabetes);
      setSmoking(!!r.smoking);
      setChf(!!r.chf);
      setAf(!!r.af);
      setPriorStroke(!!r.prior_stroke);
      setVascularDisease(!!r.vascular_disease);
      setCancer(!!r.cancer);
      setDementia(!!r.dementia);
      setCkd(!!r.ckd);
      setDependentBeforeStroke(!!r.dependent_before_stroke);
      setLivingAlone(!!r.living_alone);
      if (r.mrs !== undefined) setMrs(r.mrs);
      if (r.loc !== undefined) setLoc(r.loc);
      if (r.loc_questions !== undefined) setLocQuestions(r.loc_questions);
      if (r.loc_commands !== undefined) setLocCommands(r.loc_commands);
      if (r.best_gaze !== undefined) setBestGaze(r.best_gaze);
      if (r.visual_fields !== undefined) setVisualFields(r.visual_fields);
      if (r.facial_palsy !== undefined) setFacialPalsy(r.facial_palsy);
      if (r.motor_arm_l !== undefined) setMotorArmL(r.motor_arm_l);
      if (r.motor_arm_r !== undefined) setMotorArmR(r.motor_arm_r);
      if (r.motor_leg_l !== undefined) setMotorLegL(r.motor_leg_l);
      if (r.motor_leg_r !== undefined) setMotorLegR(r.motor_leg_r);
      if (r.limb_ataxia !== undefined) setLimbAtaxia(r.limb_ataxia);
      if (r.sensory !== undefined) setSensory(r.sensory);
      if (r.language !== undefined) setLanguage(r.language);
      if (r.dysarthria !== undefined) setDysarthria(r.dysarthria);
      if (r.extinction !== undefined) setExtinction(r.extinction);
      if (r.assessment_date) setAssessmentDate(r.assessment_date);
    }
  };

  const handleNIHSSStepper = (val, setter, max, dir) => {
    const nextVal = val + dir;
    if (nextVal >= 0 && nextVal <= max) {
      setter(nextVal);
    }
  };

  const handleSaveScore = async () => {
    setError(null);
    setSuccess(null);

    if (!patientValid) {
      setError('Please bind a valid Patient ID first.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (parseFloat(glucose) <= 0) {
      setError('Glucose must be a valid numeric level greater than zero.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const timeString = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dateString = new Date().toISOString().substring(0, 10);

    const payload = {
      patient_id: patientId,
      assessment_date: dateString,
      clinician_id: clinicianId,
      submission_timestamp: timeString,
      mrs,
      stroke_type: strokeType,
      oxfordshire,
      toast,
      early_infarct: earlyInfarct ? 1 : 0,
      dense_mca: denseMca ? 1 : 0,
      cortical_involvement: corticalInvolvement ? 1 : 0,
      mca_territory: mcaTerritory ? 1 : 0,
      glucose_value: parseFloat(glucose),
      dysphagia: dysphagia ? 1 : 0,
      af: af ? 1 : 0,
      chf: chf ? 1 : 0,
      diabetes: diabetes ? 1 : 0,
      hypertension: hypertension ? 1 : 0,
      prior_stroke: priorStroke ? 1 : 0,
      smoking: smoking ? 1 : 0,
      loc, loc_questions: locQuestions, loc_commands: locCommands,
      best_gaze: bestGaze, visual_fields: visualFields, facial_palsy: facialPalsy,
      motor_arm_l: motorArmL, motor_arm_r: motorArmR, motor_leg_l: motorLegL, motor_leg_r: motorLegR,
      limb_ataxia: limbAtaxia, sensory, language, dysarthria, extinction,
      overwrite: 1 // Automatically overwrite existing assessment logs for this date
    };

    try {
      const res = await api.addScore(payload);
      if (res.success) {
        setSuccess(res.message || 'Diagnostic assessment submitted successfully!');
      } else {
        setError(res.message || 'Failure writing score assessment.');
      }
    } catch (err) {
      setError('Server connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const getPDFDownloadLink = () => {
    // Ensure we only pass the YYYY-MM-DD part to match the database string
    const formattedDate = assessmentDate ? assessmentDate.substring(0, 10) : new Date().toISOString().substring(0, 10);
    return api.getPDFReportURL(patientId, formattedDate);
  };

  const nihssList = [
    { label: 'LOC Consciousness', val: loc, setter: setLoc, max: 3 },
    { label: 'LOC Questions', val: locQuestions, setter: setLocQuestions, max: 2 },
    { label: 'LOC Commands', val: locCommands, setter: setLocCommands, max: 2 },
    { label: 'Best Gaze', val: bestGaze, setter: setBestGaze, max: 2 },
    { label: 'Visual Fields', val: visualFields, setter: setVisualFields, max: 3 },
    { label: 'Facial Palsy', val: facialPalsy, setter: setFacialPalsy, max: 3 },
    { label: 'Motor Arm (Left)', val: motorArmL, setter: setMotorArmL, max: 4 },
    { label: 'Motor Arm (Right)', val: motorArmR, setter: setMotorArmR, max: 4 },
    { label: 'Motor Leg (Left)', val: motorLegL, setter: setMotorLegL, max: 4 },
    { label: 'Motor Leg (Right)', val: motorLegR, setter: setMotorLegR, max: 4 },
    { label: 'Limb Ataxia', val: limbAtaxia, setter: setLimbAtaxia, max: 2 },
    { label: 'Sensory', val: sensory, setter: setSensory, max: 2 },
    { label: 'Language Aphasia', val: language, setter: setLanguage, max: 3 },
    { label: 'Dysarthria', val: dysarthria, setter: setDysarthria, max: 2 },
    { label: 'Extinction/Neglect', val: extinction, setter: setExtinction, max: 2 }
  ];

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
          <span className="subtitle-label">{isReadOnly ? 'Your Records' : 'Complication Prediction'}</span>
          <h1 className="title-display">{isReadOnly ? 'Clinical Assessment Details' : 'Stroke Stratification'}</h1>
        </div>

        <div className="segmented-picker">
          <button className={`segmented-option ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>
            Diagnostic Inputs
          </button>
          <button className={`segmented-option ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>
            Risk Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-banner" style={{ display: 'flex', gap: '0.8rem', background: 'rgba(16,185,129,0.1)', color: 'var(--brand-success)', padding: '1.2rem', borderRadius: '16px', fontWeight: 'bold', marginBottom: '2rem' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {isReadOnly && dataLoaded && !hasHistoricalData ? (
        <div className="clinical-card" style={{ textAlign: 'center', padding: '5rem 2rem', marginTop: '2rem' }}>
          <ShieldCheck size={48} style={{ color: 'var(--brand-border)', margin: '0 auto 1.5rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>No Assessment Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            We could not find any securely submitted clinical assessment scores matching your patient ID <strong>({patientId})</strong>. 
            If you believe this is an error, please ensure your doctor has successfully committed your score to the registry.
          </p>
          <button className="btn-primary" style={{ marginTop: '2rem', padding: '1rem 2rem' }} onClick={() => window.location.hash = ''}>
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div className="calculator-layout" style={{ pointerEvents: isReadOnly ? 'none' : 'auto', opacity: isReadOnly ? 0.95 : 1 }}>
        {/* Left Input Pane */}
        {tab === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Patient Binding */}
            <div className="clinical-card">
              <span className="subtitle-label">{actualPatientId ? 'Linked Subject' : 'Select Subject'}</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', marginBottom: '1.2rem' }}>Patient Identity</h3>
              
              {!actualPatientId && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="input-wrapper" style={{ flex: 1 }}>
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter Patient ID (e.g. PidXXXXX)"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      onBlur={() => validatePatient(patientId)}
                    />
                  </div>
                  {!isReadOnly && (
                    <button className="btn-secondary" style={{ padding: '0 1.5rem' }} onClick={() => validatePatient(patientId)}>
                      Verify ID
                    </button>
                  )}
                </div>
              )}

              {patientValid && patientDetails && (
                <div style={{ marginTop: !actualPatientId ? '1rem' : '0', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--brand-success)' }}>✓ {isReadOnly ? 'Your Identity Verified' : 'Patient Linked Successfully'}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>{patientDetails.name} ({patientDetails.age} yrs / {patientDetails.gender})</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--brand-success)', fontWeight: 800 }}>ID: {patientId}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stroke Classification */}
            <div className="clinical-card">
              <span className="subtitle-label">Classification</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', marginBottom: '1.2rem' }}>Stroke Types</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stroke Type</label>
                  <div className="segmented-picker">
                    <button className={`segmented-option ${strokeType === 'Ischemic' ? 'active' : ''}`} onClick={() => setStrokeType('Ischemic')}>Ischemic</button>
                    <button className={`segmented-option ${strokeType === 'Hemorrhagic' ? 'active' : ''}`} onClick={() => setStrokeType('Hemorrhagic')}>Hemorrhagic</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Oxfordshire Classification</label>
                    <select className="form-select" value={oxfordshire} onChange={(e) => setOxfordshire(e.target.value)}>
                      <option value="LACI">LACI (Lacunar Infarct)</option>
                      <option value="PACI">PACI (Partial Anterior)</option>
                      <option value="POCI">POCI (Posterior Circulation)</option>
                      <option value="TACI">TACI (Total Anterior)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">TOAST Subtype</label>
                    <select className="form-select" value={toast} onChange={(e) => setToast(e.target.value)}>
                      <option value="Small Vessel">Small Vessel Occlusion</option>
                      <option value="Large Artery">Large Artery Atherosclerosis</option>
                      <option value="Cardioembolic">Cardioembolism</option>
                      <option value="Other">Other Determined Etiology</option>
                      <option value="Undetermined">Undetermined Etiology</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* NIHSS Stepper Rows */}
            <div className="clinical-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'center' }}>
                <div>
                  <span className="subtitle-label">Neurological Scale</span>
                  <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>NIHSS Assessment Score</h3>
                </div>
                <div style={{ background: 'var(--brand-bg)', border: '1px solid var(--brand-border)', borderRadius: '12px', padding: '6px 16px', fontWeight: 'bold' }}>
                  Total NIHSS: <span style={{ color: 'var(--brand-primary)', fontSize: '1.2rem' }}>{calculated.nihssTotal}</span>
                </div>
              </div>

              <div className="stepper-container">
                {nihssList.map((item, index) => (
                  <div className="nihss-row" key={index}>
                    <div className="nihss-info">
                      <h4>{item.label}</h4>
                      <p>Range: 0–{item.max} points</p>
                    </div>
                    <div className="stepper-controls">
                      <button className="step-btn" onClick={() => handleNIHSSStepper(item.val, item.setter, item.max, -1)} disabled={item.val <= 0}>-</button>
                      <span>{item.val}</span>
                      <button className="step-btn" style={{ background: item.val < item.max ? 'var(--brand-primary)' : 'var(--brand-bg)', color: item.val < item.max ? '#FFFFFF' : 'var(--brand-primary)' }} onClick={() => handleNIHSSStepper(item.val, item.setter, item.max, 1)} disabled={item.val >= item.max}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Imaging & Lab values */}
            <div className="clinical-card">
              <span className="subtitle-label">Imaging & Lab Metrics</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', marginBottom: '1.2rem' }}>Clinical Data Points</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Random Glucose (mg/dL)</label>
                  <input type="number" className="form-input" style={{ paddingLeft: '1.2rem' }} value={glucose} onChange={(e) => setGlucose(e.target.value)} required />
                </div>

                <div className="toggle-grid">
                  <div className={`toggle-card ${earlyInfarct ? 'active' : ''}`} onClick={() => setEarlyInfarct(!earlyInfarct)}>
                    <span>Early Infarct Signs</span>
                    <span>{earlyInfarct ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className={`toggle-card ${denseMca ? 'active' : ''}`} onClick={() => setDenseMca(!denseMca)}>
                    <span>Dense MCA Sign</span>
                    <span>{denseMca ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className={`toggle-card ${corticalInvolvement ? 'active' : ''}`} onClick={() => setCorticalInvolvement(!corticalInvolvement)}>
                    <span>Cortical Involvement</span>
                    <span>{corticalInvolvement ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className={`toggle-card ${mcaTerritory ? 'active' : ''}`} onClick={() => setMcaTerritory(!mcaTerritory)}>
                    <span>MCA Territory</span>
                    <span>{mcaTerritory ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className={`toggle-card ${dysphagia ? 'active' : ''}`} onClick={() => setDysphagia(!dysphagia)}>
                    <span>Swallow Dysphagia</span>
                    <span>{dysphagia ? 'ON' : 'OFF'}</span>
                  </div>
                  <div className={`toggle-card ${earlySeizure ? 'active' : ''}`} onClick={() => setEarlySeizure(!earlySeizure)}>
                    <span>Early Seizures</span>
                    <span>{earlySeizure ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comorbidities */}
            <div className="clinical-card">
              <span className="subtitle-label">Prior Conditions</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.2rem', marginBottom: '1.2rem' }}>Comorbidities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Pre-Stroke mRS (0-5)</label>
                  <select className="form-select" value={mrs} onChange={(e) => setMrs(parseInt(e.target.value))}>
                    <option value={0}>0 (No symptoms)</option>
                    <option value={1}>1 (No disability)</option>
                    <option value={2}>2 (Slight disability)</option>
                    <option value={3}>3 (Moderate disability)</option>
                    <option value={4}>4 (Moderately severe)</option>
                    <option value={5}>5 (Severe disability)</option>
                  </select>
                </div>

                <div className="toggle-grid">
                  <div className={`toggle-card ${hypertension ? 'active' : ''}`} onClick={() => setHypertension(!hypertension)}>
                    <span>Hypertension</span>
                    <span>{hypertension ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${diabetes ? 'active' : ''}`} onClick={() => setDiabetes(!diabetes)}>
                    <span>Diabetes</span>
                    <span>{diabetes ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${smoking ? 'active' : ''}`} onClick={() => setSmoking(!smoking)}>
                    <span>Smoking</span>
                    <span>{smoking ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${chf ? 'active' : ''}`} onClick={() => setChf(!chf)}>
                    <span>Heart Failure (CHF)</span>
                    <span>{chf ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${af ? 'active' : ''}`} onClick={() => setAf(!af)}>
                    <span>Atrial Fib (AF)</span>
                    <span>{af ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${priorStroke ? 'active' : ''}`} onClick={() => setPriorStroke(!priorStroke)}>
                    <span>Prior Stroke/TIA</span>
                    <span>{priorStroke ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${vascularDisease ? 'active' : ''}`} onClick={() => setVascularDisease(!vascularDisease)}>
                    <span>Vascular Disease</span>
                    <span>{vascularDisease ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${cancer ? 'active' : ''}`} onClick={() => setCancer(!cancer)}>
                    <span>Cancer History</span>
                    <span>{cancer ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${dementia ? 'active' : ''}`} onClick={() => setDementia(!dementia)}>
                    <span>Dementia</span>
                    <span>{dementia ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${ckd ? 'active' : ''}`} onClick={() => setCkd(!ckd)}>
                    <span>CKD Nephropathy</span>
                    <span>{ckd ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${dependentBeforeStroke ? 'active' : ''}`} onClick={() => setDependentBeforeStroke(!dependentBeforeStroke)}>
                    <span>Pre-Dependent</span>
                    <span>{dependentBeforeStroke ? 'YES' : 'NO'}</span>
                  </div>
                  <div className={`toggle-card ${livingAlone ? 'active' : ''}`} onClick={() => setLivingAlone(!livingAlone)}>
                    <span>Living Alone</span>
                    <span>{livingAlone ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            {!isReadOnly && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setTab(1)}
                >
                  Review Risks Summary →
                </button>
                <button
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '1.1rem',
                    fontSize: '1rem',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    boxShadow: '0 4px 18px rgba(5,150,105,0.35)',
                    gap: '0.6rem'
                  }}
                  onClick={handleSaveScore}
                  disabled={loading || !patientValid || !hasChanges}
                >
                  <Save size={20} />
                  {loading ? 'Saving…' : 'Submit & Save to Registry'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Risk Dashboard View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="clinical-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <span className="subtitle-label">Complications Dashboard</span>
                  <h3 style={{ fontSize: '1.3rem', marginTop: '0.2rem' }}>Calculated Admission Analysis</h3>
                </div>
              </div>

              {/* Sub summaries grids */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h4 className="subtitle-label" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Section A: Early Complications (0–14 Days)</h4>
                  <div className="risk-complication-grid">
                    {calculated.results['A2DS2'] && (
                      <div className={`risk-item-row ${calculated.results['A2DS2'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>A2DS2 Score (Pneumonia)</h4>
                          <p>{calculated.results['A2DS2'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['A2DS2'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['A2DS2'].riskLevel.toLowerCase()}`}>{calculated.results['A2DS2'].riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {calculated.results['SEDAN'] && (
                      <div className={`risk-item-row ${calculated.results['SEDAN'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>SEDAN Score (sICH Bleeding)</h4>
                          <p>{calculated.results['SEDAN'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['SEDAN'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['SEDAN'].riskLevel.toLowerCase()}`}>{calculated.results['SEDAN'].riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {calculated.results['HAT'] && (
                      <div className={`risk-item-row ${calculated.results['HAT'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>HAT Score (Symptomatic ICH)</h4>
                          <p>{calculated.results['HAT'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['HAT'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['HAT'].riskLevel.toLowerCase()}`}>{calculated.results['HAT'].riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {calculated.results['SOAR'] && (
                      <div className={`risk-item-row ${calculated.results['SOAR'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>SOAR Score (Mortality Risk)</h4>
                          <p>{calculated.results['SOAR'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['SOAR'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['SOAR'].riskLevel.toLowerCase()}`}>{calculated.results['SOAR'].riskLevel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="subtitle-label" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Section B: Late Complications / Long-Term (&gt;14 Days)</h4>
                  <div className="risk-complication-grid">
                    {calculated.results['ESRS'] && (
                      <div className={`risk-item-row ${calculated.results['ESRS'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>ESRS Score (1-Yr Recurrence)</h4>
                          <p>{calculated.results['ESRS'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['ESRS'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['ESRS'].riskLevel.toLowerCase()}`}>{calculated.results['ESRS'].riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {calculated.results['SeLECT'] && (
                      <div className={`risk-item-row ${calculated.results['SeLECT'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>SeLECT Score (Post-Stroke Epilepsy)</h4>
                          <p>{calculated.results['SeLECT'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['SeLECT'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['SeLECT'].riskLevel.toLowerCase()}`}>{calculated.results['SeLECT'].riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {calculated.results['SPI-II'] && (
                      <div className={`risk-item-row ${calculated.results['SPI-II'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>SPI-II Score (2-Yr Recurrence/Death)</h4>
                          <p>{calculated.results['SPI-II'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['SPI-II'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['SPI-II'].riskLevel.toLowerCase()}`}>{calculated.results['SPI-II'].riskLevel}</span>
                        </div>
                      </div>
                    )}

                    {calculated.results['iScore'] && (
                      <div className={`risk-item-row ${calculated.results['iScore'].riskLevel.toLowerCase()}`}>
                        <div className="risk-info">
                          <h4>iScore Composite Index</h4>
                          <p>{calculated.results['iScore'].interpretation}</p>
                        </div>
                        <div className="risk-score-value">
                          <h3>{calculated.results['iScore'].value} <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>pts</span></h3>
                          <span className={`risk-badge ${calculated.results['iScore'].riskLevel.toLowerCase()}`}>{calculated.results['iScore'].riskLevel}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {!isReadOnly && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setTab(0)}>
                  ← Adjust Diagnostic Inputs
                </button>
                <button
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '1.1rem',
                    fontSize: '1rem',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #059669, #34d399)',
                    boxShadow: '0 4px 18px rgba(5,150,105,0.35)',
                    gap: '0.6rem'
                  }}
                  onClick={handleSaveScore}
                  disabled={loading || !patientValid || !hasChanges}
                >
                  <Save size={20} />
                  {loading ? 'Saving…' : 'Submit & Save to Registry'}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', borderTop: '1px solid var(--brand-border)', paddingTop: '2rem', pointerEvents: 'auto', opacity: 1 }}>
          {!isReadOnly && (
            <button className="btn-primary" onClick={handleSaveScore} disabled={loading || !hasChanges} style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', justifyContent: 'center' }}>
              <Save size={20} />
              {loading ? 'Saving...' : 'Commit Score to Registry'}
            </button>
          )}
          {patientId && (
            <button className={isReadOnly ? "btn-primary" : "btn-secondary"} onClick={() => window.open(getPDFDownloadLink(), '_blank')} style={{ flex: isReadOnly ? 1 : 'none', padding: '1.2rem 2rem', fontSize: '1.1rem', justifyContent: 'center' }}>
              <Download size={20} />
              Export PDF Report
            </button>
          )}
        </div>

        {/* ─────── Re-Entry Confirmation Modal ─────── */}
        {showReEnterModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem'
          }}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: '24px',
              padding: '2.5rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              border: '1px solid var(--brand-border)',
              textAlign: 'center'
            }}>
              {/* Icon */}
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <AlertTriangle size={30} style={{ color: '#f59e0b' }} />
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Existing Record Found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                Patient <strong style={{ color: 'var(--text-primary)' }}>{patientDetails?.name}</strong> already has a submitted assessment record.
              </p>
              {existingRecord?.assessment_date && (
                <p style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: '1.5rem' }}>
                  Last submission: {existingRecord.assessment_date}
                </p>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Do you want to re-enter and overwrite the patient data?
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => { setShowReEnterModal(false); setPatientValid(false); setPatientDetails(null); setPatientId(''); }}
                  style={{
                    flex: 1, padding: '0.9rem', borderRadius: '12px',
                    background: 'var(--brand-bg)', border: '1px solid var(--brand-border)',
                    color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReEnter}
                  style={{
                    flex: 1, padding: '0.9rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    border: 'none', color: '#fff',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
                    boxShadow: '0 4px 14px rgba(239,68,68,0.35)'
                  }}
                >
                  Yes, Re-enter Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Sticky Summary panel */}
        <div className="risk-sidebar-sticky">
          <div className="risk-summary-card">
            <h3>Calculated Stroke Severity</h3>
            <div className="risk-large-number">{calculated.nihssTotal}</div>
            <div className="risk-classification-text">
              {calculated.results['NIHSS']?.interpretation}
            </div>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '1rem', fontWeight: 600 }}>NIHSS range: 0 (Normal) to 42 (Severe stroke). Calculated dynamically based on LOC, gaze, and motor arm/leg scores.</p>
          </div>

          <div className="clinical-card">
            <span className="subtitle-label">Assessment Registry Information</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <h4 style={{ fontSize: '0.85rem' }}>HIPAA Standard Log</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assessed under Clinician Doc ID {clinicianId}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
              <Info size={20} style={{ color: 'var(--brand-primary)' }} />
              <div>
                <h4 style={{ fontSize: '0.85rem' }}>Auto-Overwrite Enabled</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Commit scores updates existing records automatically.</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
