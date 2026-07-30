const nodemailer = require('nodemailer');

(async () => {
  try {
    console.log('Creating Ethereal test account...');
    let testAccount = await nodemailer.createTestAccount();
    console.log('Test Account created:', testAccount.user);

    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Sending test 6-digit OTP email:', otp);

    let info = await transporter.sendMail({
      from: '"NeuroPredict Security" <security@neuropredict.com>',
      to: 'lekkaladathukumar03184@gmail.com',
      subject: 'Your Account Recovery OTP - NeuroPredict',
      text: `Your OTP for account recovery is: ${otp}. It is valid for 10 minutes.`,
      html: `<div style="font-family: Arial; padding: 20px;"><h2>NeuroPredict Security</h2><p>Your 6-digit OTP: <strong style="font-size: 24px; color: #039855;">${otp}</strong></p></div>`
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Ethereal Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('Email send error:', err);
  }
})();
