const nodemailer = require('nodemailer');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
require('dotenv').config({ path: './.env' });

console.log('--- TESTING GMAIL SMTP DIRECT DELIVERY ---');
console.log('USER:', process.env.SMTP_USER);
console.log('PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'MISSING');
console.log('FROM NAME:', process.env.SMTP_FROM_NAME);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS via STARTTLS
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: true,
  logger: true
});

(async () => {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    console.log('Sending test OTP email to:', process.env.SMTP_USER);
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Neurologist'}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '🔐 Test OTP Email from Neurologist App',
      text: 'Your test 6-digit OTP code is: 123456.',
      html: '<h2>Your 6-digit OTP is: <span style="color:#039855;">123456</span></h2>'
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ SMTP ERROR DETAILS:');
    console.error('Code:', err.code);
    console.error('Command:', err.command);
    console.error('Response:', err.response);
    console.error('Full Error:', err);
  }
})();
