// backend/src/services/gmailSender.js
// Sends emails via Gmail REST API (HTTPS port 443) — bypasses ISP SMTP port blocking
const { google } = require('googleapis');

let oauth2ClientInstance = null;

const getOAuth2Client = () => {
  if (oauth2ClientInstance) return oauth2ClientInstance;

  const clientId     = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken ||
      clientId === 'your_google_oauth2_client_id') {
    return null;
  }

  const client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  client.setCredentials({ refresh_token: refreshToken });
  oauth2ClientInstance = client;
  return client;
};

// Encode email to RFC 2822 base64url format required by Gmail API
const buildRawMessage = (to, subject, htmlBody, fromName, fromEmail) => {
  const boundary = `boundary_${Date.now()}`;
  const msg = [
    `From: "${fromName}" <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    `Your OTP has been sent. Please check the HTML version of this email.`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    htmlBody,
    ``,
    `--${boundary}--`
  ].join('\n');

  return Buffer.from(msg)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendGmailEmail = async (to, subject, htmlBody) => {
  const auth = getOAuth2Client();
  if (!auth) throw new Error('Gmail OAuth2 not configured');

  const fromName  = process.env.SMTP_FROM_NAME || 'Neurologist';
  const fromEmail = process.env.SMTP_USER || 'lekkaladathukumar03184@gmail.com';

  const gmail = google.gmail({ version: 'v1', auth });
  const raw   = buildRawMessage(to, subject, htmlBody, fromName, fromEmail);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });

  return response.data;
};

const isGmailConfigured = () => !!getOAuth2Client();

module.exports = { sendGmailEmail, isGmailConfigured };
