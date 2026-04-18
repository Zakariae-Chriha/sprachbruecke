const { Resend } = require('resend');

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = 'SprachBrücke <onboarding@resend.dev>';

async function sendApprovalEmail(toEmail, toName, language) {
  const resend = getResend();
  if (!resend) { console.warn('⚠️ RESEND_API_KEY nicht gesetzt'); return; }

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

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F0F4FA;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2563EB,#7C3AED);padding:36px 32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🌉</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">SprachBrücke</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">جسر اللغة · Ihr Sprachassistent</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px;">Hallo ${toName} 👋</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Dein Konto wurde vom Administrator <strong>genehmigt</strong>. Du kannst jetzt alle Funktionen nutzen — einschließlich KI-Anrufe und Notrufe.
      </p>
      <div style="background:#FEF3C7;border:1.5px solid #FDE68A;border-radius:16px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400E;text-transform:uppercase;">🔐 Dein Notruf-PIN</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:0.2em;color:#1E293B;">${pin}</div>
        <p style="margin:8px 0 0;font-size:12px;color:#92400E;">Für Notrufe (110/112). Nicht teilen.</p>
      </div>
      <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin-bottom:20px;text-align:right;direction:rtl;">
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">تمت الموافقة على حسابك. رقم PIN الخاص بك: <strong>${pin}</strong></p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:700;font-size:15px;">App öffnen →</a>
      </div>
    </div>
  </div>
</body></html>`;

  await resend.emails.send({ from: FROM, to: toEmail, subject: subjects[language] || subjects['de'], html });
  console.log(`📧 Genehmigungsmail gesendet an: ${toEmail}`);
}

async function sendPasswordResetEmail(toEmail, toName, resetUrl) {
  const resend = getResend();
  if (!resend) { console.warn('⚠️ RESEND_API_KEY nicht gesetzt'); return; }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
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
        Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Der Link ist <strong>1 Stunde</strong> gültig.
      </p>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;text-decoration:none;padding:14px 32px;border-radius:14px;font-weight:700;font-size:15px;">🔑 Passwort zurücksetzen</a>
      </div>
      <div style="background:#F8FAFC;border-radius:12px;padding:16px;margin-bottom:20px;text-align:right;direction:rtl;">
        <p style="margin:0;font-size:13px;color:#475569;line-height:1.7;">لقد طلبت إعادة تعيين كلمة المرور. انقر على الزر أعلاه. الرابط صالح لمدة ساعة.</p>
      </div>
      <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">Falls du das nicht beantragt hast, ignoriere diese Email.</p>
    </div>
  </div>
</body></html>`;

  await resend.emails.send({ from: FROM, to: toEmail, subject: '🔑 Passwort zurücksetzen · SprachBrücke', html });
  console.log(`📧 Reset-Email gesendet an: ${toEmail}`);
}

module.exports = { sendApprovalEmail, sendPasswordResetEmail };
