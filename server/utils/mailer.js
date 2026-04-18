const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendApprovalEmail(toEmail, toName, language) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('⚠️ EMAIL_USER/EMAIL_PASS nicht gesetzt — Email nicht gesendet');
    return;
  }

  const pin = process.env.EMERGENCY_PIN || '—';
  const appUrl = process.env.CLIENT_URL || 'https://sprachbruecke-psi.vercel.app';

  const subjects = {
    ar: '✅ تمت الموافقة على حسابك في جسر اللغة',
    de: '✅ Dein SprachBrücke-Konto wurde genehmigt',
    en: '✅ Your SprachBrücke account has been approved',
    tr: '✅ SprachBrücke hesabınız onaylandı',
    ru: '✅ Ваш аккаунт SprachBrücke одобрен',
    uk: '✅ Ваш акаунт SprachBrücke схвалено',
    fr: '✅ Votre compte SprachBrücke a été approuvé',
    fa: '✅ حساب کاربری شما در SprachBrücke تأیید شد',
  };

  const subject = subjects[language] || subjects['de'];

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563EB,#7C3AED);padding:36px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🌉</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">SprachBrücke</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">جسر اللغة · Ihr Sprachassistent</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px;">Hallo ${toName} 👋</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Dein Konto wurde vom Administrator <strong>genehmigt</strong>. Du kannst jetzt alle Funktionen von SprachBrücke nutzen — einschließlich KI-Anrufe und Notrufe.
      </p>

      <!-- PIN Box -->
      <div style="background:#FEF3C7;border:1.5px solid #FDE68A;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.05em;">🔐 Dein Notruf-PIN</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:0.2em;color:#1E293B;">${pin}</div>
        <p style="margin:8px 0 0;font-size:12px;color:#92400E;">Diesen PIN brauchst du für Notrufe (110/112). Teile ihn nicht.</p>
      </div>

      <!-- Arabic -->
      <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin-bottom:20px;text-align:right;direction:rtl;">
        <p style="margin:0 0 6px;font-size:13px;color:#64748B;">مرحباً ${toName}،</p>
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">تمت الموافقة على حسابك. يمكنك الآن استخدام جميع ميزات التطبيق بما فيها مساعد الطوارئ. رقم PIN الخاص بك: <strong>${pin}</strong></p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:700;font-size:15px;">
          App öffnen →
        </a>
      </div>

      <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">
        SprachBrücke · 8 Sprachen · KI-Assistent · Kostenlos
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"SprachBrücke" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });

  console.log(`📧 Genehmigungsmail gesendet an: ${toEmail}`);
}

async function sendPasswordResetEmail(toEmail, toName, resetUrl) {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('⚠️ EMAIL_USER/EMAIL_PASS nicht gesetzt — Email nicht gesendet');
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563EB,#7C3AED);padding:36px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🔑</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">SprachBrücke</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Passwort zurücksetzen</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px;">Hallo ${toName} 👋</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten — der Link ist <strong>1 Stunde</strong> gültig.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:700;font-size:15px;">
          🔑 Passwort zurücksetzen
        </a>
      </div>
      <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin-bottom:20px;text-align:right;direction:rtl;">
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">
          لقد طلبت إعادة تعيين كلمة المرور. انقر على الزر أعلاه. الرابط صالح لمدة ساعة واحدة.
        </p>
      </div>
      <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">
        Falls du das nicht beantragt hast, ignoriere diese Email.
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"SprachBrücke" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔑 Passwort zurücksetzen · SprachBrücke',
    html,
  });

  console.log(`📧 Reset-Email gesendet an: ${toEmail}`);
}

module.exports = { sendApprovalEmail, sendPasswordResetEmail };
