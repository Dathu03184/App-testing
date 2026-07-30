const PDFDocument = require('pdfkit');
const { interpretNIHSS } = require('./scoring');

const generateAssessmentPDF = (patient, scores) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => {
      reject(err);
    });

    // Theme Colors
    const primaryColor = '#F97316'; // Orange
    const secondaryColor = '#431407'; // Espresso
    const textPrimary = '#292524'; // Stone Dark
    const border = '#E7E5E4'; // Warm Border

    // Draw header layout
    doc.fillColor(secondaryColor).fontSize(22).font('Helvetica-Bold').text('NEUROPREDICT', { tracking: 2 });
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('SMART STROKE Stratification registry', { tracking: 1.5 });
    doc.moveDown(0.5);
    
    // Draw horizontal separator rule
    doc.strokeColor(border).lineWidth(1).moveTo(50, 85).lineTo(550, 85).stroke();
    doc.moveDown(1.5);

    // Patient Information Block (Left column)
    const patientYStart = 100;
    doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('PATIENT DEMOGRAPHICS', 50, patientYStart);
    doc.fontSize(10).font('Helvetica');
    doc.fillColor(textPrimary);
    doc.moveDown(0.5);
    doc.text(`Patient ID:  ${patient.patient_id || 'N/A'}`);
    doc.text(`Full Name:   ${patient.name || 'N/A'}`);
    doc.text(`Age/Sex:     ${patient.age || 'N/A'} yrs / ${patient.gender || 'N/A'}`);
    doc.text(`DOB:         ${patient.date_of_birth || 'N/A'}`);
    doc.text(`Address:     ${patient.address || 'N/A'}`);
    doc.text(`Phone:       ${patient.phone || 'N/A'}`);

    // Clinician Assessment Info (Right column)
    doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('ASSESSMENT METADATA', 320, patientYStart);
    doc.fontSize(10).font('Helvetica');
    doc.fillColor(textPrimary);
    doc.moveDown(0.5);
    doc.text(`Record Date: ${scores.assessment_date || 'N/A'}`, 320);
    doc.text(`Assessed By: Clinician ID ${scores.clinician_id || 'Unknown'}`);
    doc.text(`Timestamp:   ${scores.submission_timestamp || 'N/A'}`);
    doc.text(`Stroke Type: ${scores.stroke_type || 'Ischemic'}`);
    doc.text(`Oxfordshire: ${scores.oxfordshire || 'LACI'}`);
    doc.text(`TOAST Class: ${scores.toast || 'Small Vessel'}`);

    doc.moveDown(2.5);
    
    // Draw horizontal separator
    const separatorY = doc.y;
    doc.strokeColor(border).lineWidth(1).moveTo(50, separatorY).lineTo(550, separatorY).stroke();
    doc.moveDown(1.5);

    // Score Calculations Headers
    const nextY = separatorY + 20;
    doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('CLINICAL SCORES SUMMARY', 50, nextY);
    doc.fontSize(10).font('Helvetica').fillColor(textPrimary);
    doc.moveDown(0.5);

    // Draw NIHSS Card
    const nihssVal = scores.nihss || 0;
    const interpretStr = interpretNIHSS(nihssVal);
    
    doc.rect(50, doc.y, 500, 40).fillAndStroke('#FFF8F5', border);
    doc.fillColor(secondaryColor).font('Helvetica-Bold').text('NIHSS Total Assessment:', 65, doc.y - 28);
    doc.fillColor(primaryColor).fontSize(18).text(`${nihssVal}`, 220, doc.y - 32);
    doc.fillColor(textPrimary).fontSize(10).font('Helvetica').text(`Interpretation: ${interpretStr}`, 270, doc.y - 26);
    
    doc.moveDown(2);

    // Risk Scores table mapping
    const riskScores = [
      { name: 'iScore', val: scores.iscore, desc: '30-day mortality / outcome', level: scores.iscore > 100 ? 'High' : 'Moderate' },
      { name: 'SOAR', val: scores.soar, desc: 'In-hospital mortality rate', level: scores.soar >= 4 ? 'High' : 'Low' },
      { name: 'SPI-II', val: scores.spiii, desc: '2-yr recurrence or mortality', level: scores.spiii > 10 ? 'High' : 'Low' },
      { name: 'A2DS2', val: scores.a2ds2, desc: 'Stroke-associated pneumonia', level: scores.a2ds2 >= 5 ? 'High' : 'Low' },
      { name: 'HAT', val: scores.hat, desc: 'sICH bleeding after tPA', level: scores.hat >= 3 ? 'High' : 'Low' },
      { name: 'SeLECT', val: scores.select_score, desc: 'Post-stroke epilepsy risk', level: scores.select_score >= 6 ? 'High' : 'Low' },
      { name: 'SEDAN', val: scores.sedan, desc: 'sICH risk after thrombolysis', level: scores.sedan >= 3 ? 'High' : 'Low' },
      { name: 'ESRS', val: scores.esrs, desc: '1-year recurrent stroke risk', level: scores.esrs >= 4 ? 'High' : (scores.esrs >= 2 ? 'Moderate' : 'Low') }
    ];

    // Draw Table Header
    const tableHeaderY = doc.y;
    doc.rect(50, tableHeaderY, 500, 20).fill(secondaryColor);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    doc.text('SCORE TYPE', 60, tableHeaderY + 5);
    doc.text('VALUE', 160, tableHeaderY + 5);
    doc.text('RISK LEVEL', 240, tableHeaderY + 5);
    doc.text('CLINICAL IMPLICATION / TARGET', 340, tableHeaderY + 5);

    let currentY = tableHeaderY + 20;

    // Draw Rows
    doc.font('Helvetica').fontSize(9);
    riskScores.forEach((score, index) => {
      // Row background zebra striping
      const rowBg = index % 2 === 0 ? '#FFFFFF' : '#FFFBF9';
      doc.rect(50, currentY, 500, 20).fillAndStroke(rowBg, border);
      
      doc.fillColor(textPrimary);
      doc.text(score.name, 60, currentY + 5);
      doc.text(`${score.val} pts`, 160, currentY + 5);
      
      // Color coded risk level
      const levelColor = score.level === 'High' ? '#EF4444' : (score.level === 'Moderate' ? '#F59E0B' : '#10B981');
      doc.fillColor(levelColor).font('Helvetica-Bold').text(score.level.toUpperCase(), 240, currentY + 5);
      
      doc.fillColor(textPrimary).font('Helvetica').text(score.desc, 340, currentY + 5);
      currentY += 20;
    });

    // Footer Block
    doc.moveDown(3);
    const footerY = doc.y;
    doc.strokeColor(border).lineWidth(1).moveTo(50, footerY).lineTo(550, footerY).stroke();
    doc.moveDown(0.8);
    doc.fontSize(8).fillColor('#78716C').font('Helvetica-Oblique').text('Confidential Clinical Registry Record - NeuroPredict stroke stratification tool. Data complies with HIPAA & GDPR security recommendations.', { align: 'center' });

    doc.end();
  });
};

module.exports = {
  generateAssessmentPDF
};
