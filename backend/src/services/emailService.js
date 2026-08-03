import dotenv from 'dotenv';

dotenv.config();

function htmlToText(html) {
  const links = [];
  const stripped = html
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi, (m, url) => { links.push(url); return ' '; })
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const text = stripped.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  return links.length ? `${text}\n\n${links.join('\n')}` : text;
}

let sendMail = null;

const rsKey = process.env.RESEND_API_KEY;

if (rsKey) {
  const { Resend } = await import('resend');
  const resend = new Resend(rsKey);
  sendMail = ({ to, subject, html }) => {
    const from = process.env.EMAIL_FROM || '"DHI Test Tracking" <onboarding@resend.dev>';
    return resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: htmlToText(html),
    });
  };
  console.log('[email] Resend initialisé');
} else if (process.env.SMTP_HOST) {
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  sendMail = ({ to, subject, html }) => {
    const from = process.env.EMAIL_FROM || `"DHI Test Tracking" <${process.env.SMTP_USER}>`;
    return transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: htmlToText(html),
      replyTo: process.env.EMAIL_REPLY_TO || process.env.SMTP_USER,
    });
  };
  console.log('[email] SMTP initialisé');
}

export async function sendEmail({ to, subject, html }) {
  if (!sendMail) {
    console.log(`[email] Email non envoyé à ${to} — aucun service configuré`);
    return;
  }
  try {
    await sendMail({ to, subject, html });
    console.log(`[email] Email envoyé à ${to}`);
  } catch (err) {
    console.error(`[email] Erreur envoi à ${to}:`, err.message);
    throw err;
  }
}

export function initMailTransport() {}

const loginCooldowns = new Map();

export function canSendLoginEmail(userId) {
  const now = Date.now();
  const last = loginCooldowns.get(userId);
  if (last && now - last < 3600000) return false;
  loginCooldowns.set(userId, now);
  return true;
}
