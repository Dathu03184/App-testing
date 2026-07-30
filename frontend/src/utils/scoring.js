/**
 * Client-Side Risk Scoring Engine for NeuroPredict
 */

const getRiskColor = (level) => {
  switch (level.toLowerCase()) {
    case 'low': return '#10B981'; // Green
    case 'moderate': return '#F59E0B'; // Amber
    case 'high': return '#EF4444'; // Red
    default: return '#78716C';
  }
};

export const interpretNIHSS = (score) => {
  if (score === 0) return 'Normal';
  if (score <= 4) return 'Minor Stroke';
  if (score <= 15) return 'Moderate Stroke';
  if (score <= 20) return 'Moderate-Severe';
  return 'Severe Stroke';
};

export const interpretMRS = (score) => {
  switch (score) {
    case 0: return 'No symptoms';
    case 1: return 'Symptoms, no disability';
    case 2: return 'Slight disability';
    case 3: return 'Moderate disability';
    case 4: return 'Moderately severe';
    case 5: return 'Severe disability';
    default: return 'Dead';
  }
};

export const calculateAllScores = (data) => {
  const results = {};

  // Extract variables with default fallbacks
  const age = parseInt(data.age || 0);
  const sex = data.sex || 'Male';
  const preStrokeMRS = parseInt(data.mrs || 0);
  const livingAlone = !!data.living_alone;
  const dependentBeforeStroke = !!data.dependent_before_stroke;
  const strokeType = data.stroke_type || 'Ischemic';
  const oxfordshire = data.oxfordshire || 'LACI';
  const toast = data.toast || 'Small Vessel';

  // Imaging & Clinical inputs
  const earlyInfarct = !!data.early_infarct;
  const denseMca = !!data.dense_mca;
  const corticalInvolvement = !!data.cortical_involvement;
  const mcaTerritory = !!data.mca_territory;
  const glucose = parseFloat(data.glucose_value || 100);
  const dysphagia = !!data.dysphagia;
  const earlySeizure = !!data.early_seizure;

  // Comorbidities
  const af = !!data.af;
  const chf = !!data.chf;
  const diabetes = !!data.diabetes;
  const hypertension = !!data.hypertension;
  const priorStroke = !!data.prior_stroke;
  const smoking = !!data.smoking;
  const vascularDisease = !!data.vascular_disease;
  const cancer = !!data.cancer;
  const dementia = !!data.dementia;
  const ckd = !!data.ckd;

  // NIHSS Items Summation
  const loc = parseInt(data.loc || 0);
  const locQuestions = parseInt(data.loc_questions || 0);
  const locCommands = parseInt(data.loc_commands || 0);
  const bestGaze = parseInt(data.best_gaze || 0);
  const visualFields = parseInt(data.visual_fields || 0);
  const facialPalsy = parseInt(data.facial_palsy || 0);
  const motorArmL = parseInt(data.motor_arm_l || 0);
  const motorArmR = parseInt(data.motor_arm_r || 0);
  const motorLegL = parseInt(data.motor_leg_l || 0);
  const motorLegR = parseInt(data.motor_leg_r || 0);
  const limbAtaxia = parseInt(data.limb_ataxia || 0);
  const sensory = parseInt(data.sensory || 0);
  const language = parseInt(data.language || 0);
  const dysarthria = parseInt(data.dysarthria || 0);
  const extinction = parseInt(data.extinction || 0);

  const nihssTotal = loc + locQuestions + locCommands + bestGaze + visualFields + facialPalsy +
                     motorArmL + motorArmR + motorLegL + motorLegR + limbAtaxia + sensory +
                     language + dysarthria + extinction;

  // 1. NIHSS
  results['NIHSS'] = {
    value: nihssTotal,
    interpretation: interpretNIHSS(nihssTotal),
    riskLevel: nihssTotal > 15 ? 'High' : (nihssTotal > 4 ? 'Moderate' : 'Low'),
    color: getRiskColor(nihssTotal > 15 ? 'High' : (nihssTotal > 4 ? 'Moderate' : 'Low'))
  };

  // 2. mRS
  results['mRS'] = {
    value: preStrokeMRS,
    interpretation: interpretMRS(preStrokeMRS),
    riskLevel: preStrokeMRS >= 3 ? 'High' : 'Low',
    color: getRiskColor(preStrokeMRS >= 3 ? 'High' : 'Low')
  };

  // 3. iScore
  let iScorePoints = 0;
  if (age >= 80) iScorePoints += 42;
  else if (age >= 70) iScorePoints += 22;
  else if (age >= 60) iScorePoints += 12;

  if (sex === 'Male') iScorePoints += 6;

  if (nihssTotal >= 15) iScorePoints += 42;
  else if (nihssTotal >= 8) iScorePoints += 24;
  else iScorePoints += 8;

  switch (oxfordshire.toUpperCase()) {
    case 'TACI': iScorePoints += 24; break;
    case 'POCI': iScorePoints += 10; break;
    case 'PACI': iScorePoints += 5; break;
    default: iScorePoints += 0;
  }

  if (af) iScorePoints += 16;
  if (chf) iScorePoints += 7;
  if (cancer) iScorePoints += 10;
  if (dementia) iScorePoints += 10;
  if (ckd) iScorePoints += 10;
  if (dependentBeforeStroke) iScorePoints += 10;

  results['iScore'] = {
    value: iScorePoints,
    interpretation: 'Predicts 30-day mortality and poor outcome',
    riskLevel: iScorePoints > 100 ? 'High' : 'Moderate',
    color: getRiskColor(iScorePoints > 100 ? 'High' : 'Moderate')
  };

  // 4. SOAR
  let soarPoints = 0;
  if (strokeType === 'Hemorrhagic') soarPoints += 1;
  if (oxfordshire.toUpperCase() === 'TACI') soarPoints += 2;
  else if (oxfordshire.toUpperCase() !== 'LACI') soarPoints += 1;

  if (age >= 85) soarPoints += 2;
  else if (age >= 65) soarPoints += 1;

  if (preStrokeMRS === 5) soarPoints += 2;
  else if (preStrokeMRS >= 3) soarPoints += 1;

  results['SOAR'] = {
    value: soarPoints,
    interpretation: 'Predicts in-hospital mortality',
    riskLevel: soarPoints >= 4 ? 'High' : 'Low',
    color: getRiskColor(soarPoints >= 4 ? 'High' : 'Low')
  };

  // 5. SPI-II
  let spiPoints = 0;
  if (age >= 75) spiPoints += 3;
  else if (age >= 65) spiPoints += 2;
  if (chf) spiPoints += 2;
  if (diabetes) spiPoints += 2;
  if (priorStroke) spiPoints += 3;
  if (vascularDisease) spiPoints += 2;
  if (livingAlone) spiPoints += 1;
  if (smoking) spiPoints += 1;
  if (hypertension) spiPoints += 1;
  if (dependentBeforeStroke) spiPoints += 3;

  results['SPI-II'] = {
    value: spiPoints,
    interpretation: '2-year risk of recurrence/death',
    riskLevel: spiPoints > 10 ? 'High' : 'Low',
    color: getRiskColor(spiPoints > 10 ? 'High' : 'Low')
  };

  // 6. A2DS2
  let a2ds2Points = 0;
  if (age >= 75) a2ds2Points += 2;
  if (af) a2ds2Points += 1;
  if (dysphagia) a2ds2Points += 2;
  if (sex === 'Male') a2ds2Points += 1;
  if (nihssTotal >= 16) a2ds2Points += 5;
  else if (nihssTotal >= 5) a2ds2Points += 3;

  results['A2DS2'] = {
    value: a2ds2Points,
    interpretation: a2ds2Points >= 5 ? 'High pneumonia risk - check swallow' : 'Standard precautions',
    riskLevel: a2ds2Points >= 5 ? 'High' : 'Low',
    color: getRiskColor(a2ds2Points >= 5 ? 'High' : 'Low')
  };

  // 7. HAT
  let hatPoints = 0;
  if (age > 65) hatPoints += 1;
  if (nihssTotal > 20) hatPoints += 2;
  if (glucose > 200) hatPoints += 1;
  if (earlyInfarct) hatPoints += 1;

  results['HAT'] = {
    value: hatPoints,
    interpretation: 'Risk of symptomatic ICH after thrombolysis',
    riskLevel: hatPoints >= 3 ? 'High' : 'Low',
    color: getRiskColor(hatPoints >= 3 ? 'High' : 'Low')
  };

  // 8. SeLECT
  let selectPoints = 0;
  if (nihssTotal >= 11) selectPoints += 2;
  if (toast.toLowerCase() === 'large artery') selectPoints += 1;
  if (corticalInvolvement) selectPoints += 1;
  if (earlySeizure) selectPoints += 3;
  if (mcaTerritory) selectPoints += 2;

  results['SeLECT'] = {
    value: selectPoints,
    interpretation: selectPoints >= 6 ? 'High epilepsy risk (~80% at 5 yrs)' : 'Low epilepsy risk',
    riskLevel: selectPoints >= 6 ? 'High' : 'Low',
    color: getRiskColor(selectPoints >= 6 ? 'High' : 'Low')
  };

  // 9. SEDAN
  let sedanPoints = 0;
  if (age >= 75) sedanPoints += 1;
  if (glucose >= 144) sedanPoints += 1;
  if (earlyInfarct) sedanPoints += 1;
  if (denseMca) sedanPoints += 1;
  
  if (nihssTotal >= 20) sedanPoints += 4;
  else if (nihssTotal >= 16) sedanPoints += 3;
  else if (nihssTotal >= 12) sedanPoints += 2;
  else if (nihssTotal >= 8) sedanPoints += 1;

  results['SEDAN'] = {
    value: sedanPoints,
    interpretation: sedanPoints >= 3 ? 'High sICH risk after tPA' : 'Low sICH risk after tPA',
    riskLevel: sedanPoints >= 3 ? 'High' : 'Low',
    color: getRiskColor(sedanPoints >= 3 ? 'High' : 'Low')
  };

  // 10. ESRS
  let esrsPoints = 0;
  if (age >= 75) esrsPoints += 2;
  else if (age >= 65) esrsPoints += 1;
  
  if (hypertension) esrsPoints += 1;
  if (diabetes) esrsPoints += 1;
  if (priorStroke) esrsPoints += 1;
  if (smoking) esrsPoints += 1;
  if (vascularDisease) esrsPoints += 1;
  if (chf) esrsPoints += 1;

  results['ESRS'] = {
    value: esrsPoints,
    interpretation: '1-yr recurrent stroke risk',
    riskLevel: esrsPoints >= 4 ? 'High' : (esrsPoints >= 2 ? 'Moderate' : 'Low'),
    color: getRiskColor(esrsPoints >= 4 ? 'High' : (esrsPoints >= 2 ? 'Moderate' : 'Low'))
  };

  return {
    results,
    nihssTotal
  };
};
