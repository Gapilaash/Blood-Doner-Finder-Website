const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');
const U = require('./util');

const router = express.Router();
const SECRET = U.jwtSecret();
const sign = u => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '7d' });
const fail = (res, code, error) => res.status(code).json({ error });
const DUMMY_HASH = bcrypt.hashSync('dummy-password-1', 10);
const N = db.NOW;

/* ---------- middleware (Express 5 forwards async errors automatically) ---------- */
function auth(required = true) {
  return async (req, res, next) => {
    const h = req.headers.authorization || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!t) return required ? fail(res, 401, 'Please log in to continue.') : next();
    let p;
    try { p = jwt.verify(t, SECRET); } catch { return required ? fail(res, 401, 'Session expired. Please log in again.') : next(); }
    const u = await db.one('SELECT * FROM users WHERE id=?', p.id);
    if (!u || u.status === 'banned') return required ? fail(res, 401, 'Your account is not active. Please contact support.') : next();
    req.user = u; next();
  };
}
const roles = (...r) => (req, res, next) => r.includes(req.user.role) ? next() : fail(res, 403, 'This action is not available for your account type.');
router.adminAuth = [auth(true), roles('admin')];

/* ---------- shaping ---------- */
function nextEligible(last) {
  if (!last) return null;
  const d = new Date(String(last).slice(0, 10) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + U.ELIG_DAYS);
  return d > new Date() ? d.toISOString().slice(0, 10) : null;
}
async function me(u) {
  const o = {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, blood_group: u.blood_group,
    gender: u.gender, dob: u.dob, age: U.ageFromDob(u.dob), city: u.city, state: u.state, about: u.about,
    license_no: u.license_no, ward: u.ward, bht_no: u.bht_no, status: u.status, created_at: u.created_at
  };
  if (u.role === 'donor') {
    const d = (await db.one(`SELECT d.is_available, d.last_donation_date, ${U.ELIG_SQL} AS eligible FROM donors d WHERE d.user_id=?`, u.id)) || {};
    o.donor = { is_available: !!d.is_available, last_donation_date: d.last_donation_date || null, eligible: !!d.eligible, next_eligible_date: nextEligible(d.last_donation_date) };
  }
  o.unread = (await db.one('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0', u.id)).c;
  return o;
}
/* ---------- requests (single hospital: patient -> admin review -> admin alerts compatible donors) ---------- */
const REQ_SQL = `SELECT r.*, rq.name requester_name, rq.role requester_role, rq.phone requester_phone, rq.gender requester_gender, rq.dob requester_dob,
  (SELECT COUNT(*) FROM request_responses x WHERE x.request_id=r.id AND x.response IN('accepted','donated')) secured,
  (SELECT COUNT(*) FROM request_responses x WHERE x.request_id=r.id AND x.response='donated') donated
  FROM requests r JOIN users rq ON rq.id=r.requester_id`;
const REQ_OPEN = ['Pending', 'Accepted'];
function stageOf(r) {
  const sec = Number(r.secured || 0);
  if (r.status === 'Pending') {
    if (!r.broadcast_at) return ['review', 'Blood bank is arranging donors'];
    return sec ? ['filling', `${sec} of ${r.units} donor${r.units > 1 ? 's' : ''} confirmed`] : ['alerted', 'Donors alerted'];
  }
  if (r.status === 'Accepted') return ['confirmed', 'Donors confirmed'];
  if (r.status === 'Declined') return ['rejected', 'Not approved'];
  return [r.status.toLowerCase(), r.status];
}
function donorState(r, resp) {
  if (resp === 'donated') return 'Completed';
  if (resp === 'declined') return 'Declined';
  if (resp === 'accepted') return REQ_OPEN.includes(r.status) ? 'Accepted' : r.status;
  // only alerted (never accepted): if the request was filled or finished without this donor, show "Filled", never "Completed"
  return ['Accepted', 'Completed'].includes(r.status) ? 'Filled' : r.status === 'Declined' ? 'Cancelled' : r.status;
}
function shapeRequest(r, viewer, myResp, donors) {
  const [stage_key, stage] = stageOf(r);
  const o = {
    id: r.id, code: r.code, blood_group: r.blood_group, units: r.units, reason: r.reason, hospital: r.hospital, city: r.city, ward: r.ward,
    urgency: r.urgency, status: r.status, stage_key, stage, note: r.note, admin_note: r.admin_note, flagged: !!r.flagged, created_at: r.created_at,
    accepted_at: r.accepted_at, completed_at: r.completed_at, broadcast_at: r.broadcast_at, broadcast_count: r.broadcast_count,
    secured: Number(r.secured || 0), donated: Number(r.donated || 0), requester_id: r.requester_id, requester_name: r.requester_name,
    requester_role: r.requester_role, requester_gender: r.requester_gender, requester_age: U.ageFromDob(r.requester_dob)
  };
  const isReq = viewer.id === r.requester_id, isAdmin = viewer.role === 'admin';
  if (isReq || isAdmin) o.donors = (donors || []).map(d => ({ id: d.id, name: d.name, blood_group: d.blood_group, state: d.response, ...(isAdmin ? { phone: d.phone, eta: d.eta } : {}) }));
  if (isAdmin) o.requester_phone = r.requester_phone;
  o.my_state = viewer.role === 'donor' ? donorState(r, myResp) : r.status;
  return o;
}
async function loadDonors(ids) {
  const out = {};
  if (!ids.length) return out;
  const rows = await db.q(`SELECT x.request_id, x.response, x.eta, u.id, u.name, u.phone, u.blood_group FROM request_responses x JOIN users u ON u.id=x.donor_id
    WHERE x.response IN('accepted','donated') AND x.request_id IN (${ids.map(() => '?').join(',')}) ORDER BY x.created_at`, ...ids);
  rows.forEach(d => (out[d.request_id] = out[d.request_id] || []).push(d));
  return out;
}
const myResp = async (rid, uid) => { const x = await db.one('SELECT response FROM request_responses WHERE request_id=? AND donor_id=?', rid, uid); return x ? x.response : null; };
function canSeeRequest(r, u, resp) { return u.role === 'admin' || u.id === r.requester_id || (u.role === 'donor' && !!resp); }
const code = id => '#BR' + String(id).padStart(6, '0');
const intId = v => { const n = parseInt(v, 10); return Number.isInteger(n) && n > 0 && n < 2147483647 ? n : 0; };

/* ---------- public info ---------- */
router.get('/meta', async (req, res) => {
  const cities = (await db.q("SELECT DISTINCT city FROM users WHERE city IS NOT NULL AND city<>'' AND role IN('donor','patient','hospital') ORDER BY city")).map(r => r.city);
  const base = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Kurunegala', 'Matara', 'Batticaloa', 'Trincomalee', 'Anuradhapura', 'Badulla', 'Ratnapura', 'Vavuniya', 'Kilinochchi', 'Chennai', 'Madurai'];
  res.json({ hospital: U.HOSPITAL, bloodGroups: U.BG, reasons: U.REASONS, provinces: U.PROVINCES, eligibilityDays: U.ELIG_DAYS, cities: [...new Set([...base, ...cities])].sort() });
});
router.get('/public-stats', async (req, res) => {
  const [a, b, c] = await Promise.all([
    db.one("SELECT COUNT(*) c FROM users WHERE role='donor' AND status='active'"),
    db.one("SELECT COUNT(*) c FROM requests WHERE status='Completed'"),
    db.one("SELECT COUNT(DISTINCT lower(city)) c FROM users WHERE role='donor' AND status='active'")]);
  res.json({ donors: a.c, fulfilled: b.c, cities: c.c });
});

/* ---------- auth ---------- */
router.post('/auth/register', async (req, res) => {
  const b = req.body || {};
  const role = b.role;
  if (!['donor', 'patient'].includes(role)) return fail(res, 400, 'Choose a valid account type (donor or patient).');
  const name = U.clean(b.name, 80), email = U.clean(b.email, 120).toLowerCase(), phone = U.normPhone(b.phone);
  const city = U.clean(b.city, 60), state = U.clean(b.state, 60);
  if (name.length < 2) return fail(res, 400, role === 'hospital' ? 'Enter the hospital name.' : 'Enter your full name.');
  if (!U.emailRe.test(email)) return fail(res, 400, 'Enter a valid email address.');
  if (!phone) return fail(res, 400, 'Enter a valid phone number (7-15 digits, country code optional).');
  if (!U.passOk(b.password)) return fail(res, 400, 'Password must be at least 8 characters and include a letter and a number.');
  if (!city) return fail(res, 400, 'Enter your city.');
  let blood_group = null, dob = null, gender = null, license_no = null;
  if (role !== 'hospital') {
    blood_group = b.blood_group;
    if (!U.BG.includes(blood_group)) return fail(res, 400, 'Select a blood group.');
    gender = ['Male', 'Female', 'Other'].includes(b.gender) ? b.gender : null;
  }
  if (role === 'donor') {
    if (!gender) return fail(res, 400, 'Select your gender.');
    if (!U.isDate(b.dob)) return fail(res, 400, 'Enter your date of birth.');
    const age = U.ageFromDob(b.dob);
    if (age < 18 || age > 65) return fail(res, 400, 'Donors must be between 18 and 65 years old.');
    dob = b.dob;
  }
  if (role === 'hospital') {
    license_no = U.clean(b.license_no, 60);
    if (license_no.length < 3) return fail(res, 400, 'Enter the hospital registration number so we can verify it.');
  }
  if (await db.one('SELECT 1 x FROM users WHERE email=?', email)) return fail(res, 409, 'This email is already registered. Try logging in.');
  if (await db.one('SELECT 1 x FROM users WHERE phone=?', phone)) return fail(res, 409, 'This phone number is already registered.');
  const hash = bcrypt.hashSync(b.password, 10);
  const status = role === 'hospital' ? 'pending' : 'active';
  const id = await db.tx(async t => {
    const r = await t.one('INSERT INTO users(name,email,phone,password_hash,role,blood_group,gender,dob,city,state,license_no,status,verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id',
      name, email, phone, hash, role, blood_group, gender, dob, city, state || null, license_no, status, role === 'hospital' ? 0 : 1);
    if (role === 'patient') await t.run('UPDATE users SET ward=?, bht_no=? WHERE id=?', U.clean(b.ward, 60) || null, U.clean(b.bht_no, 40) || null, r.id);
    if (role === 'donor') await t.run('INSERT INTO donors(user_id,is_available) VALUES(?,1)', r.id);
    await U.notify(r.id, 'system', 'Welcome to Blood Donor Finder',
      role === 'hospital' ? 'Your hospital account is waiting for admin verification. You can search donors now; requests unlock after approval.' : 'Thank you for joining. Together we save lives.', null, t);
    return r.id;
  });
  const u = await db.one('SELECT * FROM users WHERE id=?', id);
  res.status(201).json({ token: sign(u), user: await me(u) });
});

router.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body || {};
  const idf = U.clean(identifier, 120);
  if (!idf || !password) return fail(res, 400, 'Enter your email or phone and password.');
  const u = await db.one('SELECT * FROM users WHERE email=? OR phone=?', idf.toLowerCase(), U.normPhone(idf) || '__none__');
  if (u && Number(u.locked_until) > Date.now()) return fail(res, 429, 'Too many wrong attempts. Try again in a few minutes.');
  const ok = bcrypt.compareSync(String(password), u ? u.password_hash : DUMMY_HASH);
  if (!u || !ok) {
    if (u) {
      const n = u.failed_logins + 1;
      await db.run('UPDATE users SET failed_logins=?, locked_until=? WHERE id=?', n >= 5 ? 0 : n, n >= 5 ? Date.now() + 15 * 60000 : 0, u.id);
    }
    return fail(res, 401, 'Email/phone or password is incorrect.');
  }
  if (u.role === 'admin') return fail(res, 403, 'Admins sign in on the admin website (/admin).');
  if (u.status === 'banned') return fail(res, 403, 'This account has been suspended by an administrator.');
  await db.run('UPDATE users SET failed_logins=0, locked_until=0 WHERE id=?', u.id);
  res.json({ token: sign(u), user: await me(u) });
});

router.post('/auth/google', async (req, res) => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  if (!cid) return fail(res, 501, 'Google sign-in is not configured on this server yet.');
  try {
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent((req.body || {}).credential || ''));
    const g = await r.json();
    if (!r.ok || g.aud !== cid || g.email_verified !== 'true') return fail(res, 401, 'Google sign-in failed.');
    const u = await db.one('SELECT * FROM users WHERE email=?', String(g.email).toLowerCase());
    if (!u) return fail(res, 404, 'No account found for this Google email. Please sign up first.');
    if (u.role === 'admin') return fail(res, 403, 'Admins sign in on the admin website (/admin).');
    if (u.status === 'banned') return fail(res, 403, 'This account has been suspended by an administrator.');
    res.json({ token: sign(u), user: await me(u) });
  } catch { fail(res, 502, 'Could not reach Google. Try again.'); }
});

router.post('/auth/forgot', async (req, res) => {
  const idf = U.clean((req.body || {}).identifier, 120);
  const u = await db.one('SELECT * FROM users WHERE role<>? AND (email=? OR phone=?)', 'admin', idf.toLowerCase(), U.normPhone(idf) || '__none__');
  const out = { message: 'If the account exists, a 6-digit reset code has been generated.' };
  if (u) {
    const c = String(crypto.randomInt(100000, 999999));
    await db.run('UPDATE users SET reset_hash=?, reset_expires=? WHERE id=?', U.hashCode(c), Date.now() + 15 * 60000, u.id);
    console.log(`[reset-code] ${u.email}: ${c} (valid 15 min)`);
    await U.sendWhatsApp(u.phone, `Blood Donor Finder password reset code: ${c}`);
    if (process.env.DEV_RESET_CODE_IN_RESPONSE !== 'false') out.devCode = c;
  }
  res.json(out);
});
router.post('/auth/reset', async (req, res) => {
  const { identifier, code: c, password } = req.body || {};
  if (!U.passOk(password)) return fail(res, 400, 'Password must be at least 8 characters and include a letter and a number.');
  const idf = U.clean(identifier, 120);
  const u = await db.one('SELECT * FROM users WHERE role<>? AND (email=? OR phone=?)', 'admin', idf.toLowerCase(), U.normPhone(idf) || '__none__');
  if (!u || !u.reset_hash || Number(u.reset_expires) < Date.now() || u.reset_hash !== U.hashCode(String(c || '').trim()))
    return fail(res, 400, 'The reset code is wrong or expired.');
  await db.run('UPDATE users SET password_hash=?, reset_hash=NULL, reset_expires=NULL, failed_logins=0, locked_until=0 WHERE id=?', bcrypt.hashSync(password, 10), u.id);
  res.json({ ok: true });
});

router.get('/me', auth(), async (req, res) => res.json({ user: await me(req.user) }));
router.put('/me', auth(), async (req, res) => {
  const u = req.user, b = req.body || {};
  const name = U.clean(b.name ?? u.name, 80), city = U.clean(b.city ?? u.city, 60), state = U.clean(b.state ?? u.state, 60);
  const phone = b.phone ? U.normPhone(b.phone) : u.phone;
  if (name.length < 2) return fail(res, 400, 'Enter a valid name.');
  if (!phone) return fail(res, 400, 'Enter a valid phone number.');
  if (!city) return fail(res, 400, 'Enter your city.');
  if (await db.one('SELECT 1 x FROM users WHERE phone=? AND id<>?', phone, u.id)) return fail(res, 409, 'This phone number is already used by another account.');
  let bg = u.blood_group, gender = u.gender, dob = u.dob;
  if (u.role !== 'hospital') {
    bg = b.blood_group || bg; if (!U.BG.includes(bg)) return fail(res, 400, 'Select a blood group.');
    if (b.gender !== undefined) gender = ['Male', 'Female', 'Other'].includes(b.gender) ? b.gender : (b.gender === '' && u.role === 'patient' ? null : gender);
  }
  if (u.role === 'donor' && b.dob) {
    if (!U.isDate(b.dob)) return fail(res, 400, 'Enter a valid date of birth.');
    const a = U.ageFromDob(b.dob); if (a < 18 || a > 65) return fail(res, 400, 'Donors must be between 18 and 65 years old.');
    dob = b.dob;
  }
  await db.run('UPDATE users SET name=?,phone=?,blood_group=?,gender=?,dob=?,city=?,state=?,about=? WHERE id=?',
    name, phone, bg, gender, dob, city, state || null, U.clean(b.about ?? u.about, 300) || null, u.id);
  if (u.role === 'patient') await db.run('UPDATE users SET ward=?, bht_no=? WHERE id=?', U.clean(b.ward ?? u.ward, 60) || null, U.clean(b.bht_no ?? u.bht_no, 40) || null, u.id);
  res.json({ user: await me(await db.one('SELECT * FROM users WHERE id=?', u.id)) });
});
router.put('/me/password', auth(), async (req, res) => {
  const { current, password } = req.body || {};
  if (!bcrypt.compareSync(String(current || ''), req.user.password_hash)) return fail(res, 400, 'Current password is incorrect.');
  if (!U.passOk(password)) return fail(res, 400, 'New password must be at least 8 characters and include a letter and a number.');
  await db.run('UPDATE users SET password_hash=? WHERE id=?', bcrypt.hashSync(password, 10), req.user.id);
  res.json({ ok: true });
});
router.delete('/me', auth(), roles('donor', 'patient', 'hospital'), async (req, res) => {
  if (!bcrypt.compareSync(String((req.body || {}).password || ''), req.user.password_hash)) return fail(res, 400, 'Password is incorrect.');
  await U.deleteUser(req.user.id); res.json({ ok: true });
});

/* ---------- donors ---------- */
router.put('/donor/availability', auth(), roles('donor'), async (req, res) => {
  const { is_available, last_donation_date } = req.body || {};
  const last = last_donation_date || null;
  if (last) {
    if (!U.isDate(last)) return fail(res, 400, 'Enter a valid last donation date.');
    if (new Date(last) > new Date(Date.now() + 14 * 3600 * 1000)) return fail(res, 400, 'Last donation date cannot be in the future.'); // tolerance for time zones ahead of UTC (e.g. Sri Lanka)
  }
  await db.run('UPDATE donors SET is_available=?, last_donation_date=? WHERE user_id=?', is_available ? 1 : 0, last, req.user.id);
  res.json({ user: await me(req.user) });
});
router.get('/donor/stats', auth(), roles('donor'), async (req, res) => {
  const c = async (resp, open) => (await db.one(`SELECT COUNT(*) c FROM request_responses x JOIN requests r ON r.id=x.request_id WHERE x.donor_id=? AND x.response=?${open ? " AND r.status IN('Pending','Accepted')" : ''}`, req.user.id, resp)).c;
  const [incoming, accepted, donations] = await Promise.all([
    db.one("SELECT COUNT(*) c FROM request_responses x JOIN requests r ON r.id=x.request_id WHERE x.donor_id=? AND x.response='alerted' AND r.status='Pending'", req.user.id),
    c('accepted', true), c('donated', false)]);
  res.json({ incoming: incoming.c, accepted, donations });
});
router.get('/donor/history', auth(), roles('donor'), async (req, res) => {
  const rows = await db.q(`SELECT q.*, x.created_at my_date FROM (${REQ_SQL}) q JOIN request_responses x ON x.request_id=q.id AND x.donor_id=? AND x.response='donated' ORDER BY x.created_at DESC`, req.user.id);
  res.json({ history: rows.map(r => ({ ...shapeRequest(r, req.user, 'donated'), completed_at: r.my_date })) });
});

/* ---------- requests ---------- */
// Patients do not request blood themselves: the blood bank team (admin) creates the request for them
router.post('/requests', auth(), (req, res) => fail(res, 403, 'Blood requests are created by the blood bank team. Please speak to the blood bank if you need blood.'));
router.get('/patient/donations', auth(), roles('patient'), async (req, res) => {
  const rows = await db.q(`SELECT u.name, u.blood_group, r.code, r.id request_id, x.created_at donated_at FROM request_responses x JOIN requests r ON r.id=x.request_id JOIN users u ON u.id=x.donor_id
    WHERE r.requester_id=? AND x.response='donated' ORDER BY x.created_at DESC`, req.user.id);
  res.json({ donations: rows, total: rows.length });
});

router.get('/requests', auth(), async (req, res) => {
  const u = req.user, st = req.query.status;
  if (u.role === 'admin') return fail(res, 403, 'Use the admin website.');
  let rows;
  if (u.role === 'donor') {
    rows = await db.q(`SELECT q.*, x.response my_resp FROM (${REQ_SQL}) q JOIN request_responses x ON x.request_id=q.id AND x.donor_id=? ORDER BY q.created_at DESC LIMIT 200`, u.id);
    rows = rows.map(r => shapeRequest(r, u, r.my_resp));
    if (st && st !== 'All') rows = rows.filter(r => r.my_state === st);
  } else {
    const raw = await db.q(`${REQ_SQL} WHERE r.requester_id=? ORDER BY r.created_at DESC LIMIT 200`, u.id);
    const dm = await loadDonors(raw.map(r => r.id));
    rows = raw.map(r => shapeRequest(r, u, null, dm[r.id]));
    if (st && st !== 'All') rows = rows.filter(r => r.status === st);
  }
  res.json({ requests: rows });
});
router.get('/requests/:id', auth(), async (req, res) => {
  const id = intId(req.params.id);
  const r = id && await db.one(`${REQ_SQL} WHERE r.id=?`, id);
  const resp = r && await myResp(r.id, req.user.id);
  if (!r || !canSeeRequest(r, req.user, resp)) return fail(res, 404, 'Request not found.');
  const dm = await loadDonors([r.id]);
  res.json({ request: shapeRequest(r, req.user, resp, dm[r.id]) });
});

const getReq = id => { const n = intId(id); return n ? db.one('SELECT * FROM requests WHERE id=?', n) : null; };
router.post('/requests/:id/accept', auth(), roles('donor'), async (req, res) => {
  const u = req.user, r = await getReq(req.params.id), resp = r && await myResp(r.id, u.id);
  if (!r || !resp) return fail(res, 404, 'Request not found.');
  if (resp === 'accepted' || resp === 'donated') return fail(res, 409, 'You have already accepted this request.');
  if (r.status !== 'Pending') return fail(res, 409, 'This request no longer needs donors.');
  const eta = ['now', '2h', 'today', 'tomorrow'].includes((req.body || {}).eta) ? req.body.eta : null; // when the donor expects to come
  const d = await db.one(`SELECT ${U.ELIG_SQL} AS eligible, d.last_donation_date FROM donors d WHERE d.user_id=?`, u.id);
  if (!d) return fail(res, 400, 'Donor profile not found.');
  if (!d.eligible) return fail(res, 400, `You can donate again after ${nextEligible(d.last_donation_date)}.`);
  const out = await db.tx(async t => {
    const lk = await t.one('SELECT id,units,status FROM requests WHERE id=? FOR UPDATE', r.id); // serialise donors accepting at the same moment
    if (lk.status !== 'Pending') return { err: 'This request no longer needs donors.' };
    const c = (await t.one("SELECT COUNT(*) c FROM request_responses WHERE request_id=? AND response IN('accepted','donated')", r.id)).c;
    if (c >= lk.units) return { err: 'Enough donors have already confirmed for this request. Thank you!' };
    await t.run(`UPDATE request_responses SET response='accepted', eta=?, created_at=${N} WHERE request_id=? AND donor_id=?`, eta, r.id, u.id);
    const secured = c + 1;
    if (secured >= lk.units) await t.run(`UPDATE requests SET status='Accepted', accepted_at=${N} WHERE id=?`, r.id);
    await U.notify(r.requester_id, 'request', 'A donor confirmed', `${u.name} agreed to donate for ${r.code}. ${secured} of ${lk.units} donor${lk.units > 1 ? 's' : ''} confirmed.`, r.id, t);
    return { secured, units: lk.units };
  });
  if (out.err) return fail(res, 409, out.err);
  res.json({ ok: true, ...out });
});
router.post('/requests/:id/decline', auth(), roles('donor'), async (req, res) => {
  const u = req.user, r = await getReq(req.params.id), resp = r && await myResp(r.id, u.id);
  if (!r || !resp) return fail(res, 404, 'Request not found.');
  if (resp === 'donated') return fail(res, 409, 'You have already donated for this request.');
  if (!REQ_OPEN.includes(r.status)) return fail(res, 409, 'This request is no longer open.');
  await db.tx(async t => {
    await t.run("UPDATE request_responses SET response='declined' WHERE request_id=? AND donor_id=?", r.id, u.id);
    if (resp === 'accepted') {
      if (r.status === 'Accepted') await t.run("UPDATE requests SET status='Pending', accepted_at=NULL WHERE id=?", r.id);
      await U.notify(r.requester_id, 'request', 'A donor withdrew', `A donor can no longer donate for ${r.code}. The hospital will try to find another donor.`, r.id, t);
    }
  });
  res.json({ ok: true });
});
router.post('/report', auth(), async (req, res) => {
  const b = req.body || {}, reason = U.clean(b.reason, 300);
  if (reason.length < 5) return fail(res, 400, 'Please describe the problem (at least 5 characters).');
  let target = null, rid = null;
  if (b.request_id) {
    const r = await getReq(b.request_id);
    if (!r || !canSeeRequest(r, req.user, await myResp(r.id, req.user.id))) return fail(res, 404, 'Request not found.');
    rid = r.id; target = r.requester_id;
  } else if (b.user_id) {
    const tid = intId(b.user_id);
    if (!tid || !await db.one('SELECT 1 x FROM users WHERE id=?', tid)) return fail(res, 404, 'User not found.');
    target = tid;
  } else return fail(res, 400, 'Nothing to report.');
  if (target === req.user.id) return fail(res, 400, 'You cannot report yourself.');
  if (rid) await db.run('UPDATE requests SET flagged=1 WHERE id=?', rid);
  await db.run('INSERT INTO reports(reporter_id,target_user_id,request_id,reason) VALUES(?,?,?,?)', req.user.id, target, rid, reason);
  res.status(201).json({ ok: true });
});

/* ---------- notifications ---------- */
router.get('/notifications', auth(), async (req, res) => {
  const t = req.query.type;
  let sql = 'SELECT * FROM notifications WHERE user_id=?';
  if (t === 'requests') sql += " AND type='request'"; else if (t === 'system') sql += " AND type<>'request'";
  res.json({ notifications: await db.q(sql + ' ORDER BY id DESC LIMIT 100', req.user.id) });
});
router.post('/notifications/read-all', auth(), async (req, res) => {
  await db.run('UPDATE notifications SET is_read=1 WHERE user_id=?', req.user.id); res.json({ ok: true });
});
router.post('/notifications/:id/read', auth(), async (req, res) => {
  await db.run('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', intId(req.params.id), req.user.id); res.json({ ok: true });
});
router.get('/unread', auth(), async (req, res) => res.json({ unread: (await db.one('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND is_read=0', req.user.id)).c }));

/* ---------- scheduled job (Vercel Cron calls this daily; needs CRON_SECRET) ---------- */
router.get('/cron', async (req, res) => {
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.authorization !== 'Bearer ' + s) return fail(res, 403, 'Forbidden.');
  res.json({ expired: await U.expireRequests(), realerted: await U.resendAlerts(), reminded: await U.sendReminders(false), eligibleAgain: await U.notifyEligibleAgain() });
});

module.exports = router;
module.exports.me = me;
module.exports.sign = sign;
module.exports.fail = fail;
module.exports.intId = intId;
module.exports.shapeRequest = shapeRequest;
module.exports.loadDonors = loadDonors;
module.exports.REQ_SQL = REQ_SQL;
