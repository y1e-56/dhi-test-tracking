import nodemailer from 'nodemailer';

let transporter = null;

export function initMailTransport() {
  if (transporter) return;

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log('[email] SMTP non configuré — emails désactivés');
    return;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('[email] Transport SMTP initialisé');
}

export async function sendEmail({ to, subject, html }) {
  initMailTransport();

  if (!transporter) {
    console.log(`[email] SMTP non configuré — email non envoyé à ${to}`);
    return;
  }

  const from = process.env.EMAIL_FROM || '"DHI Test Tracking" <noreply@dhi-test-tracking.com>';

  await transporter.sendMail({ from, to, subject, html });
}

const loginCooldowns = new Map();

export function canSendLoginEmail(userId) {
  const now = Date.now();
  const last = loginCooldowns.get(userId);
  if (last && now - last < 3600000) return false;
  loginCooldowns.set(userId, now);
  return true;
}
