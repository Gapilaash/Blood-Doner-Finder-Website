const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const BG = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
// recipient group -> donor groups that can safely give to them
const COMPAT = {
  'A+': ['A+', 'A-', 'O+', 'O-'], 'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'], 'B-': ['B-', 'O-'],
  'O+': ['O+', 'O-'], 'O-': ['O-'],
  'AB+': BG, 'AB-': ['A-', 'B-', 'O-', 'AB-']
};
const ELIG_DAYS = Number(process.env.ELIGIBILITY_DAYS || 90);
// "d" must be the alias of the donors table
const ELIG_SQL = `(d.last_donation_date IS NULL OR (current_date - d.last_donation_date) >= ${ELIG_DAYS})`;
const PROVINCES = ['Central Province', 'Eastern Province', 'Northern Province', 'North Central Province', 'North Western Province', 'Sabaragamuwa Province', 'Southern Province', 'Uva Province', 'Western Province'];
const REASONS = ['Accident', 'Surgery', 'Cancer treatment', 'Thalassemia / Anaemia', 'Delivery / Pregnancy', 'Dengue / Fever', 'Other'];

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.VERCEL) throw new Error('JWT_SECRET environment variable is required on Vercel.');
  const f = path.join(__dirname, '..', 'data', 'secret.txt');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(48).toString('hex'));
  return fs.readFileSync(f, 'utf8').trim();
}
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// One canonical format: 0771234567 / 94771234567 / 00 94... / +94771234567 all become +94771234567
const normPhone = p => {
  let s = String(p || '').replace(/[\s\-().]/g, '');
  if (!/^\+?\d{7,15}$/.test(s)) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  else if (/^0\d{9}$/.test(s)) s = '+94' + s.slice(1);
  else if (/^94\d{9}$/.test(s)) s = '+' + s;
  return /^\+?\d{7,15}$/.test(s) ? s : null;
};
const passOk = p => typeof p === 'string' && p.length >= 8 && p.length <= 100 && /[A-Za-z]/.test(p) && /\d/.test(p);
const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const ageFromDob = dob => {
  if (!dob) return null; const d = new Date(String(dob).slice(0, 10) + 'T00:00:00'); if (isNaN(d)) return null;
  const n = new Date(); let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a;
};
const maskName = n => { const p = String(n).trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };
const hashCode = c => crypto.createHash('sha256').update(String(c)).digest('hex');
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s));

// x = db or a transaction object
// The one hospital this installation serves (change with HOSPITAL_NAME / HOSPITAL_CITY)
const HOSPITAL = { name: process.env.HOSPITAL_NAME || 'Batticaloa Hospital', city: process.env.HOSPITAL_CITY || 'Batticaloa', phone: process.env.HOSPITAL_PHONE || '' };
const notify = (userId, type, title, body, requestId = null, x = db) =>
  x.run('INSERT INTO notifications(user_id,type,title,body,request_id) VALUES(?,?,?,?,?)', userId, type, title, body, requestId);
const logAdmin = (admin, action, detail = '') =>
  db.run('INSERT INTO admin_logs(admin_id,admin_name,action,detail) VALUES(?,?,?,?)', admin.id, admin.name, action, detail);

// Optional WhatsApp through Twilio (only when credentials exist in the environment)
async function sendWhatsApp(phone, text) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: tok, TWILIO_WHATSAPP_FROM: from } = process.env;
  if (!sid || !tok) return false;
  try {
    const body = new URLSearchParams({ From: 'whatsapp:' + from, To: 'whatsapp:' + phone, Body: text });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST', body, headers: { Authorization: 'Basic ' + Buffer.from(sid + ':' + tok).toString('base64') }
    });
    return r.ok;
  } catch { return false; }
}

// Donors who may give blood to this request: compatible group, active, available, rested,
// and not contacted yet for this request.
// scope: 'all'        = every compatible group (default)
//        'city'       = compatible groups, only donors living in the hospital's city
//        'exact'      = only the SAME blood group as the request (keeps rare O-/B- for those who need them)
//        'exact_city' = same blood group AND living in the hospital's city
const SCOPES = ['all', 'city', 'exact', 'exact_city'];
async function matchingDonors(r, scope = 'all', x = db) {
  const compat = COMPAT[r.blood_group] || [];
  if (!compat.length) return [];
  const exact = scope === 'exact' || scope === 'exact_city', inCity = scope === 'city' || scope === 'exact_city';
  const g = exact ? [r.blood_group] : compat;
  const p = [...g, r.requester_id, r.id];
  let sql = `SELECT u.id,u.name,u.phone,u.email,u.blood_group,u.city FROM users u JOIN donors d ON d.user_id=u.id
    WHERE u.role='donor' AND u.status='active' AND u.blood_group IN (${g.map(() => '?').join(',')}) AND d.is_available=1 AND ${ELIG_SQL}
    AND u.id<>? AND NOT EXISTS (SELECT 1 FROM request_responses q WHERE q.request_id=? AND q.donor_id=u.id)`;
  if (inCity) { sql += ' AND lower(u.city)=lower(?)'; p.push(HOSPITAL.city); }
  return x.q(sql + ' ORDER BY u.id', ...p);
}
// How many donors each scope would reach (for the "who to alert" choice in the admin dashboard)
async function matchingTiers(r, x = db) {
  const out = {};
  for (const sc of SCOPES) out[sc] = (await matchingDonors(r, sc, x)).length;
  return out;
}
// Send the same text to many phones (WhatsApp through Twilio when configured); never throws
async function sendBulk(phones, text, max = 200) {
  if (!process.env.TWILIO_ACCOUNT_SID) return 0;
  let sent = 0; const list = phones.slice(0, max);
  for (let i = 0; i < list.length; i += 10) {
    const r = await Promise.allSettled(list.slice(i, i + 10).map(ph => sendWhatsApp(ph, text)));
    sent += r.filter(x => x.status === 'fulfilled' && x.value).length;
  }
  return sent;
}
// Free e-mail alerts. Two ways (Gmail is checked first):
//  1) Gmail  - GMAIL_USER + GMAIL_APP_PASSWORD (Google "App password", needs 2-Step Verification on that account)
//  2) Brevo  - BREVO_API_KEY + MAIL_FROM_EMAIL (free plan, 300 e-mails/day)
// Nothing is sent when neither is set. These functions never throw.
const mailMode = () => (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ? 'gmail'
  : (process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL) ? 'brevo' : null;
const mailEsc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mailHtml = (name, text) => {
  const url = process.env.APP_URL, link = url ? `<p><a href="${mailEsc(url)}">Open Blood Donor Finder to respond</a></p>` : '';
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><p>Hello ${mailEsc(name || '')},</p><p>${mailEsc(text)}</p>${link}<p style="color:#6b7280;font-size:12px">You get this because you registered as a blood donor. You can switch off availability in the app any time.</p></div>`;
};
let gmailTx = null;
async function sendEmail(to, name, subject, text) {
  const mode = mailMode(); if (!mode || !to) return false;
  const fromName = process.env.MAIL_FROM_NAME || HOSPITAL.name;
  try {
    if (mode === 'gmail') {
      if (!gmailTx) gmailTx = require('nodemailer').createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: String(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, '') } });
      await gmailTx.sendMail({ from: `"${fromName.replace(/"/g, '')}" <${process.env.GMAIL_USER}>`, to: name ? `"${String(name).replace(/["\r\n]/g, '')}" <${to}>` : to, subject, text: `Hello ${name || ''},\n\n${text}\n\n${process.env.APP_URL || ''}`, html: mailHtml(name, text) });
      return true;
    }
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: fromName, email: process.env.MAIL_FROM_EMAIL }, to: [{ email: to, name: name || undefined }], subject, htmlContent: mailHtml(name, text) })
    });
    return r.ok;
  } catch (e) { console.warn('e-mail failed:', e.message); return false; }
}
// Same message to many donors ({email, name}); returns how many were accepted by the mail service
async function sendEmails(donors, subject, text, max = 300) {
  const mode = mailMode(); if (!mode) return 0;
  const step = mode === 'gmail' ? 3 : 10; // Gmail dislikes many parallel connections
  let sent = 0; const list = donors.filter(d => d.email).slice(0, max);
  for (let i = 0; i < list.length; i += step) {
    const r = await Promise.allSettled(list.slice(i, i + step).map(d => sendEmail(d.email, d.name, subject, text)));
    sent += r.filter(x => x.status === 'fulfilled' && x.value).length;
  }
  return sent;
}
// Pending requests nobody answered become Expired
async function expireRequests() {
  const N = db.NOW;
  const T = `COALESCE(broadcast_at, created_at)`;
  const rows = await db.q(`SELECT id,requester_id,code FROM requests WHERE status='Pending'
    AND NOT EXISTS (SELECT 1 FROM request_responses x WHERE x.request_id=requests.id AND x.response IN('accepted','donated')) AND (
    (urgency='Emergency' AND ${T} < ${N} - interval '2 days') OR
    (urgency='Urgent' AND ${T} < ${N} - interval '4 days') OR
    (urgency='Normal' AND ${T} < ${N} - interval '7 days'))`);
  await db.tx(async t => {
    for (const r of rows) {
      await t.run("UPDATE requests SET status='Expired' WHERE id=?", r.id);
      await notify(r.requester_id, 'request', 'Request expired', `Request ${r.code} had no response and has expired. Please tell the blood bank team if you still need blood.`, r.id, t);
    }
  });
  return rows.length;
}
// Keep reminding donors who were alerted but have not answered yet (in-app + e-mail).
// Gap: Emergency 5 min, Urgent 10 min, Normal 15 min. Stops after REMINDER_MAX alerts in total (default 10),
// or when the request is no longer open, or the donor is unavailable / not yet rested.
async function resendAlerts() {
  const N = db.NOW, max = +process.env.REMINDER_MAX || 10;
  const rows = await db.q(`SELECT rr.request_id, rr.donor_id, r.blood_group, r.units, r.urgency, r.ward, r.hospital, u.name, u.email
    FROM request_responses rr JOIN requests r ON r.id=rr.request_id JOIN users u ON u.id=rr.donor_id JOIN donors d ON d.user_id=u.id
    WHERE rr.response='alerted' AND r.status='Pending' AND r.broadcast_at IS NOT NULL
    AND u.status='active' AND d.is_available=1 AND ${ELIG_SQL} AND rr.alert_count < ?
    AND COALESCE(rr.last_alert_at, r.broadcast_at) < ${N} - (CASE r.urgency WHEN 'Emergency' THEN interval '5 minutes' WHEN 'Urgent' THEN interval '10 minutes' ELSE interval '15 minutes' END)`, max);
  const byReq = new Map();
  for (const x of rows) {
    const emerg = x.urgency === 'Emergency';
    const title = `Reminder: ${emerg ? 'EMERGENCY: ' : ''}${x.blood_group} blood still needed at ${x.hospital}`;
    const body = `${x.units} unit${x.units > 1 ? 's' : ''} of ${x.blood_group} still needed${x.ward ? ` (${x.ward})` : ''}. Please open the app and accept or decline.`;
    await notify(x.donor_id, 'request', title, body, x.request_id);
    await db.run(`UPDATE request_responses SET last_alert_at=${N}, alert_count=alert_count+1 WHERE request_id=? AND donor_id=?`, x.request_id, x.donor_id);
    if (!byReq.has(x.request_id)) byReq.set(x.request_id, { title, body, donors: [] });
    byReq.get(x.request_id).donors.push({ email: x.email, name: x.name });
  }
  for (const g of byReq.values()) await sendEmails(g.donors, g.title, g.body);
  return rows.length;
}
// Alert the matching donors for a request (in-app + WhatsApp/SMS(Twilio) + e-mail). Used by the admin button and by auto-alert.
// Returns { error } or { alerted, whatsapp, emailed, first }.
async function alertDonors(r, scope = 'all', extra = '', admin = null) {
  const N = db.NOW, first = !r.broadcast_at;
  const m = await matchingDonors(r, SCOPES.includes(scope) ? scope : 'all');
  if (!m.length) return { error: first ? 'No eligible donors found for this blood group right now.' : 'Every eligible donor has already been alerted for this request.' };
  const emerg = r.urgency === 'Emergency';
  const title = `${emerg ? 'EMERGENCY: ' : ''}${r.blood_group} blood needed at ${r.hospital}`;
  const body = `${r.units} unit${r.units > 1 ? 's' : ''} of ${r.blood_group} needed${r.ward ? ` (${r.ward})` : ''}. Your blood group can help. Open the app to accept.${extra ? ' ' + extra : ''}`;
  await db.tx(async t => {
    for (const d of m) {
      await t.run(`INSERT INTO request_responses(request_id,donor_id,response,last_alert_at) VALUES(?,?,'alerted',${N}) ON CONFLICT DO NOTHING`, r.id, d.id);
      await notify(d.id, 'request', title, body, r.id, t);
    }
    await t.run(`UPDATE requests SET broadcast_at=COALESCE(broadcast_at, ${N}), broadcast_count=broadcast_count+? WHERE id=?`, m.length, r.id);
    if (first) await notify(r.requester_id, 'request', 'Donors alerted for you', `The blood bank alerted ${m.length} matching donor${m.length > 1 ? 's' : ''} for request ${r.code}. You will see who donates on your dashboard.`, r.id, t);
  });
  const whatsapp = await sendBulk(m.map(d => d.phone), `${title}. ${r.units} unit(s). Open Blood Donor Finder to respond.`);
  const emailed = await sendEmails(m, title, body);
  await logAdmin(admin || { id: null, name: 'System (auto alert)' }, first ? 'alert donors' : 'alert more donors', `${r.code} (${r.blood_group}) -> ${m.length} donor(s), ${scope}`);
  return { alerted: m.length, whatsapp, emailed, first };
}
// AUTO_ALERT in .env: "emergency" (default) = Emergency requests alert donors at once, "all" = every new request, "off" = admin always clicks
const autoAlertFor = urgency => { const m = String(process.env.AUTO_ALERT || 'emergency').toLowerCase(); return m === 'all' || (m === 'emergency' && urgency === 'Emergency'); };

// Tell donors when they can donate again (once per donation)
async function notifyEligibleAgain() {
  const rows = await db.q(`SELECT u.id, u.name, u.email, d.last_donation_date FROM donors d JOIN users u ON u.id=d.user_id
    WHERE u.role='donor' AND u.status='active' AND d.last_donation_date IS NOT NULL AND (current_date - d.last_donation_date) >= ${ELIG_DAYS}
    AND (d.eligible_notified_for IS NULL OR d.eligible_notified_for < d.last_donation_date)`);
  for (const x of rows) {
    const text = `It has been ${ELIG_DAYS} days since your last donation, so you can donate blood again. If you are well and available, please keep your availability switched on. Thank you for being a donor!`;
    await notify(x.id, 'reminder', 'You can donate again', text);
    await db.run('UPDATE donors SET eligible_notified_for=? WHERE user_id=?', String(x.last_donation_date).slice(0, 10), x.id);
    await sendEmail(x.email, x.name, 'You can donate blood again', text);
  }
  return rows.length;
}
// Monthly "please update your availability" reminders
async function sendReminders(force = false) {
  const N = db.NOW;
  const rows = await db.q(`SELECT u.id,u.phone FROM users u WHERE u.role='donor' AND u.status='active' AND
    (u.last_reminder_at IS NULL OR u.last_reminder_at < ${N} - interval '30 days')
    ${force ? '' : `AND u.created_at < ${N} - interval '30 days'`}`);
  for (const r of rows) {
    await notify(r.id, 'reminder', 'Update your availability', 'Please confirm whether you are available to donate blood this month.');
    await db.run(`UPDATE users SET last_reminder_at=${N} WHERE id=?`, r.id);
    await sendWhatsApp(r.phone, 'Blood Donor Finder: please open the app and update your availability this month.');
  }
  return rows.length;
}
// A donor leaves (deleted or banned): free the places they had accepted and tell the requesters
async function releaseDonorRequests(id, t, why) {
  const acc = await t.q("SELECT r.* FROM requests r JOIN request_responses x ON x.request_id=r.id WHERE x.donor_id=? AND x.response='accepted' AND r.status IN('Pending','Accepted')", id);
  for (const r of acc) {
    await t.run("DELETE FROM request_responses WHERE request_id=? AND donor_id=?", r.id, id);
    if (r.status === 'Accepted') await t.run("UPDATE requests SET status='Pending', accepted_at=NULL WHERE id=?", r.id);
    await notify(r.requester_id, 'request', 'A donor is no longer available', `A donor for request ${r.code} ${why}. The hospital will find another donor for you.`, r.id, t);
  }
  await t.run("DELETE FROM request_responses WHERE donor_id=? AND response='alerted'", id);
}
// Remove a user and keep other people's requests consistent
const deleteUser = id => db.tx(async t => {
  await releaseDonorRequests(id, t, 'has left the platform');
  await t.run('DELETE FROM users WHERE id=?', id);
});
module.exports = { HOSPITAL, PROVINCES, BG, COMPAT, ELIG_DAYS, ELIG_SQL, REASONS, jwtSecret, emailRe, normPhone, passOk, clean, ageFromDob, maskName, hashCode, isDate, notify, logAdmin, sendWhatsApp, SCOPES, matchingDonors, matchingTiers, sendEmail, sendEmails, sendBulk, expireRequests, resendAlerts, alertDonors, autoAlertFor, notifyEligibleAgain, sendReminders, deleteUser, releaseDonorRequests };
