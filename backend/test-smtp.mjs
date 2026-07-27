import nodemailer from 'nodemailer';
const t = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false,
  auth: { user: 'jipnangryan237@gmail.com', pass: 'qcjlinwmyvdvcvmp' }
});
try {
  await t.sendMail({
    from: '"DHI Test Tracking" <jipnangryan237@gmail.com>',
    to: 'jipnangryan237@gmail.com',
    subject: 'Test DHI — Email de vérification',
    text: 'Si vous recevez cet email, le système de notification fonctionne correctement.',
  });
  console.log('Email envoyé ! Vérifiez votre boîte (et les spams).');
} catch(e) {
  console.error('Erreur envoi:', e.message);
}
