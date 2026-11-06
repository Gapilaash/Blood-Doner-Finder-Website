const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const U = require('./util');
const api = require('./api');

const router = express.Router();
const { fail, sign, intId } = api;
const N = db.NOW;
const STATUSES = ['Pending', 'Accepted', 'Completed', 'Declined', 'Cancelled', 'Expired'];

router.post('/login', async (req, res) => {
  const email = U.clean((req.body || {}).email, 120).toLowerCase();
  const u = await db.one("SELECT * FROM users WHERE email=? AND role='admin'", email);
  if (u && Number(u.locked_until) > Date.now()) return fail(res, 429, 'Too many wrong attempts. Try again in a few minutes.');
  if (!u || !bcrypt.compareSync(String((req.body || {}).password || ''), u.password_hash)) {
    if (u) {
      const n = u.failed_logins + 1;
      await db.run('UPDATE users SET failed_logins=?, locked_until=? WHERE id=?', n >= 5 ? 0 : n, n >= 5 ? Date.now() + 15 * 60000 : 0, u.id);
    }
    return fail(res, 401, 'Admin email or password is incorrect.');
  }
  if (u.status !== 'active') return fail(res, 403, 'This admin account is disabled.');
  await db.run('UPDATE users SET failed_logins=0, locked_until=0 WHERE id=?', u.id);
  await U.logAdmin(u, 'login', '');
  res.json({ token: sign(u), admin: { id: u.id, name: u.name, email: u.email } });
});

router.use(api.adminAuth);

router.get('/me', (req, res) => res.json({ admin: { id: req.user.id, name: req.user.name, email: req.user.email } }));

router.get('/stats', async (req, res) => {
  const c = async (sql, ...p) => (await db.one(sql, ...p)).c;
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - (6 - i)); return d.toISOString().slice(0, 10); });
  const perDay = async (table, where = 'TRUE') => {
    const rows = await db.q(`SELECT to_char(created_at,'YYYY-MM-DD') d, COUNT(*) c FROM ${table} WHERE ${where} AND created_at >= ${N} - interval '8 days' GROUP BY 1`);
    const m = Object.fromEntries(rows.map(r => [r.d, r.c]));
    return days.map(d => ({ day: d, count: m[d] || 0 }));
  };
  const awaiting = await c("SELECT COUNT(*) c FROM requests WHERE status='Pending' AND broadcast_at IS NULL");
  const [donors, patients, hospitals, banned, pendingHospitals, availableDonors, total, emergency, flagged, openReports, signups, requestsPerDay, recentRequests, byStatus, donorsByBg, reqByBg] = await Promise.all([
    c("SELECT COUNT(*) c FROM users WHERE role='donor' AND status='active'"), c("SELECT COUNT(*) c FROM users WHERE role='patient' AND status='active'"), c("SELECT COUNT(*) c FROM users WHERE role='hospital'"),
    c("SELECT COUNT(*) c FROM users WHERE status='banned'"), c("SELECT COUNT(*) c FROM users WHERE role='hospital' AND status='pending'"),
    c(`SELECT COUNT(*) c FROM users u JOIN donors d ON d.user_id=u.id WHERE u.status='active' AND d.is_available=1 AND ${U.ELIG_SQL}`),
    c('SELECT COUNT(*) c FROM requests'), c("SELECT COUNT(*) c FROM requests WHERE urgency='Emergency' AND status IN('Pending','Accepted')"),
    c('SELECT COUNT(*) c FROM requests WHERE flagged=1'), c("SELECT COUNT(*) c FROM reports WHERE status='open'"),
    perDay('users', "role<>'admin'"), perDay('requests'),
    db.q('SELECT r.id,r.code,r.blood_group,r.urgency,r.status,r.hospital,r.city,r.created_at,u.name requester FROM requests r JOIN users u ON u.id=r.requester_id ORDER BY r.id DESC LIMIT 6'),
    db.q('SELECT status, COUNT(*) c FROM requests GROUP BY status'),
    db.q("SELECT blood_group g, COUNT(*) c FROM users WHERE role='donor' AND status='active' GROUP BY blood_group"),
    db.q('SELECT blood_group g, COUNT(*) c FROM requests GROUP BY blood_group')]);
  const sm = Object.fromEntries(byStatus.map(r => [r.status, r.c])), dm = Object.fromEntries(donorsByBg.map(r => [r.g, r.c])), rm = Object.fromEntries(reqByBg.map(r => [r.g, r.c]));
  res.json({
    users: { donors, patients, hospitals, banned, pendingHospitals }, availableDonors,
    requests: { total, ...Object.fromEntries(STATUSES.map(s => [s, sm[s] || 0])), emergency, flagged, awaiting, alerted: (sm.Pending || 0) - awaiting },
    openReports, lowStock: await db.q('SELECT blood_group,units,min_units FROM blood_stock WHERE units < min_units ORDER BY blood_group'),
    byBloodGroup: U.BG.map(g => ({ group: g, donors: dm[g] || 0, requests: rm[g] || 0 })),
    signups, requestsPerDay, recentRequests
  });
});

/* ----- users ----- */
router.get('/users', async (req, res) => {
  const q = req.query, p = []; let w = "WHERE role<>'admin'";
  if (['donor', 'patient', 'hospital'].includes(q.role)) { w += ' AND role=?'; p.push(q.role); }
  if (['active', 'pending', 'banned'].includes(q.status)) { w += ' AND status=?'; p.push(q.status); }
  const s = U.clean(q.q, 60).toLowerCase();
  if (s) { w += ' AND (lower(name) LIKE ? OR lower(email) LIKE ? OR phone LIKE ? OR lower(city) LIKE ? OR lower(bht_no) LIKE ? OR lower(ward) LIKE ?)'; const t = s.replace(/[%_]/g, ''), l = '%' + t + '%', ph = '%' + t.replace(/[\s\-().]/g, '').replace(/^(\+?94|0)(?=\d)/, '') + '%'; p.push(l, l, ph, l, l, l); }
  const page = Math.max(1, parseInt(q.page) || 1), size = 15;
  const total = (await db.one(`SELECT COUNT(*) c FROM users ${w}`, ...p)).c;
  const rows = await db.q(`SELECT id,name,email,phone,role,blood_group,city,state,status,license_no,ward,bht_no,created_at FROM users ${w} ORDER BY (status='pending') DESC, id DESC LIMIT ? OFFSET ?`, ...p, size, (page - 1) * size);
  res.json({ total, page, pages: Math.ceil(total / size), users: rows });
});
router.get('/users/:id', async (req, res) => {
  const id = intId(req.params.id);
  const u = id && await db.one("SELECT id,name,email,phone,role,blood_group,gender,dob,city,state,about,license_no,status,created_at FROM users WHERE id=? AND role<>'admin'", id);
  if (!u) return fail(res, 404, 'User not found.');
  u.donor = (await db.one('SELECT is_available,last_donation_date FROM donors WHERE user_id=?', u.id)) || null;
  u.requestsMade = (await db.one('SELECT COUNT(*) c FROM requests WHERE requester_id=?', u.id)).c;
  u.donations = (await db.one("SELECT COUNT(*) c FROM request_responses WHERE donor_id=? AND response='donated'", u.id)).c;
  u.reportsAgainst = (await db.one('SELECT COUNT(*) c FROM reports WHERE target_user_id=?', u.id)).c;
  res.json({ user: u });
});
router.patch('/users/:id', async (req, res) => {
  const id = intId(req.params.id);
  const u = id && await db.one("SELECT * FROM users WHERE id=? AND role<>'admin'", id);
  if (!u) return fail(res, 404, 'User not found.');
  const st = (req.body || {}).status;
  if (!['active', 'banned'].includes(st)) return fail(res, 400, 'Invalid status.');
  // A hospital that was never verified must not become active just because it was banned and then unbanned
  let newSt = st, stillPending = false;
  if (st === 'active' && u.role === 'hospital' && !u.verified) {
    if (u.status === 'pending') await db.run('UPDATE users SET verified=1 WHERE id=?', u.id);
    else if (u.status === 'banned') { newSt = 'pending'; stillPending = true; }
  }
  await db.run('UPDATE users SET status=? WHERE id=?', newSt, u.id);
  if (u.status === 'pending' && newSt === 'active') await U.notify(u.id, 'system', 'Account verified', 'Your hospital account has been verified. You can now submit blood requests.');
  if (st === 'banned') {
    await db.run("UPDATE requests SET status='Cancelled' WHERE requester_id=? AND status IN('Pending','Accepted')", u.id);
    await db.tx(t => U.releaseDonorRequests(u.id, t, 'is no longer available'));
  }
  await U.logAdmin(req.user, st === 'banned' ? 'ban user' : (u.status === 'pending' ? 'approve user' : stillPending ? 'unban user (still awaiting verification)' : 'unban user'), `${u.name} <${u.email}>`);
  res.json({ ok: true, status: newSt });
});
router.delete('/users/:id', async (req, res) => {
  const id = intId(req.params.id);
  const u = id && await db.one("SELECT * FROM users WHERE id=? AND role<>'admin'", id);
  if (!u) return fail(res, 404, 'User not found.');
  await U.deleteUser(u.id); await U.logAdmin(req.user, 'delete user', `${u.name} <${u.email}>`);
  res.json({ ok: true });
});

/* ----- requests ----- */
// "review" = waiting for the admin, "alerted" = donors have been messaged, "filling" = some donors confirmed
const STAGE_SQL = { review: "r.status='Pending' AND r.broadcast_at IS NULL", alerted: "r.status='Pending' AND r.broadcast_at IS NOT NULL" };
router.get('/requests', async (req, res) => {
  const q = req.query, p = []; let w = 'WHERE 1=1';
  if (STAGE_SQL[q.stage]) w += ' AND ' + STAGE_SQL[q.stage];
  else if (STATUSES.includes(q.status)) { w += ' AND r.status=?'; p.push(q.status); }
  if (['Normal', 'Urgent', 'Emergency'].includes(q.urgency)) { w += ' AND r.urgency=?'; p.push(q.urgency); }
  if (U.BG.includes(q.bg)) { w += ' AND r.blood_group=?'; p.push(q.bg); }
  if (q.flagged === '1') w += ' AND r.flagged=1';
  const s = U.clean(q.q, 60).toLowerCase();
  if (s) { w += ' AND (lower(r.ward) LIKE ? OR lower(rq.name) LIKE ? OR lower(r.code) LIKE ? OR lower(rq.bht_no) LIKE ? OR rq.phone LIKE ? OR lower(r.blood_group)=?)'; const t = s.replace(/[%_]/g, ''), l = '%' + t + '%'; p.push(l, l, l, l, '%' + t.replace(/[\s\-().]/g, '').replace(/^(\+?94|0)(?=\d)/, '') + '%', t); }
  const page = Math.max(1, parseInt(q.page) || 1), size = 15;
  const base = `FROM requests r JOIN users rq ON rq.id=r.requester_id ${w}`;
  const total = (await db.one(`SELECT COUNT(*) c ${base}`, ...p)).c;
  // emergencies waiting for review first, then newest
  const rows = await db.q(`SELECT r.id,r.code,r.blood_group,r.units,r.reason,r.hospital,r.city,r.ward,r.urgency,r.status,r.flagged,r.note,r.admin_note,r.created_at,r.broadcast_at,r.broadcast_count,r.requester_id,rq.name requester,rq.phone requester_phone,
    (SELECT COUNT(*) FROM request_responses x WHERE x.request_id=r.id AND x.response IN('accepted','donated')) secured,
    (SELECT COUNT(*) FROM request_responses x WHERE x.request_id=r.id AND x.response='donated') donated
    ${base} ORDER BY r.flagged DESC, (r.status='Pending' AND r.broadcast_at IS NULL) DESC, CASE r.urgency WHEN 'Emergency' THEN 0 WHEN 'Urgent' THEN 1 ELSE 2 END, r.id DESC LIMIT ? OFFSET ?`, ...p, size, (page - 1) * size);
  const dm = await api.loadDonors(rows.map(r => r.id));
  rows.forEach(r => { r.donors = (dm[r.id] || []).map(d => ({ id: d.id, name: d.name, phone: d.phone, blood_group: d.blood_group, state: d.response, eta: d.eta })); r.stage = r.status === 'Pending' ? (r.broadcast_at ? 'alerted' : 'review') : r.status.toLowerCase(); });
  res.json({ total, page, pages: Math.ceil(total / size), requests: rows });
});
// Donors of an open request who were alerted or agreed (for the free WhatsApp click-to-chat links)
router.get('/requests/:id/wa-donors', async (req, res) => {
  const r = await db.one('SELECT id,code,blood_group,units,hospital,ward,urgency,status FROM requests WHERE id=?', intId(req.params.id));
  if (!r) return fail(res, 404, 'Request not found.');
  const donors = await db.q(`SELECT u.id, u.name, u.phone, x.response state, x.eta FROM request_responses x JOIN users u ON u.id=x.donor_id
    WHERE x.request_id=? AND x.response IN('alerted','accepted') AND u.phone IS NOT NULL ORDER BY (x.response='alerted') DESC, u.name`, r.id);
  res.json({ request: r, donors });
});
// Preview: which donors would receive the alert? (nothing is sent)
router.get('/requests/:id/matches', async (req, res) => {
  const r = await db.one('SELECT * FROM requests WHERE id=?', intId(req.params.id));
  if (!r) return fail(res, 404, 'Request not found.');
  const scope = U.SCOPES.includes(req.query.scope) ? req.query.scope : 'all';
  const m = await U.matchingDonors(r, scope);
  const byGroup = Object.fromEntries(U.COMPAT[r.blood_group].map(g => [g, 0])); m.forEach(d => byGroup[d.blood_group]++);
  const already = (await db.one('SELECT COUNT(*) c FROM request_responses WHERE request_id=?', r.id)).c;
  res.json({ total: m.length, byGroup, already, compatibleGroups: U.COMPAT[r.blood_group], scope, city: U.HOSPITAL.city, tiers: await U.matchingTiers(r), urgency: r.urgency, blood_group: r.blood_group });
});
// The admin has checked the need: send the alert to every compatible donor
router.post('/requests/:id/broadcast', async (req, res) => {
  const r = await db.one('SELECT * FROM requests WHERE id=?', intId(req.params.id));
  if (!r) return fail(res, 404, 'Request not found.');
  if (r.status !== 'Pending') return fail(res, 409, 'Only open requests can be sent to donors.');
  const b = req.body || {};
  const out = await U.alertDonors(r, b.scope, U.clean(b.message, 200), req.user);
  if (out.error) return fail(res, 409, out.error);
  res.json({ ok: true, alerted: out.alerted, whatsapp: out.whatsapp, emailed: out.emailed });
});
// The blood bank knows which patient needs blood: the admin creates the request for that patient
// Find a patient: every registered patient, with the blood request they have open right now (if any).
// Search by name, phone, ward, BHT no., request code or blood group.
router.get('/patients/search', async (req, res) => {
  const s = U.clean(req.query.q, 60).toLowerCase().replace(/[%_]/g, ''), p = [];
  let w = "u.role='patient' AND u.status='active'";
  if (s) {
    w += ' AND (lower(u.name) LIKE ? OR lower(u.bht_no) LIKE ? OR lower(u.ward) LIKE ? OR lower(r.ward) LIKE ? OR lower(r.code) LIKE ? OR u.phone LIKE ? OR lower(u.blood_group)=? OR lower(r.blood_group)=?)';
    const l = '%' + s + '%'; p.push(l, l, l, l, l, '%' + s.replace(/[\s\-().]/g, '').replace(/^(\+?94|0)(?=\d)/, '') + '%', s, s);
  }
  const rows = await db.q(`SELECT u.id patient_id, u.name, u.phone, u.bht_no, u.blood_group patient_bg, COALESCE(r.ward,u.ward) ward,
    r.id, r.code, r.blood_group, r.units, r.urgency, r.status, r.broadcast_at,
    (SELECT COUNT(*) FROM request_responses x WHERE x.request_id=r.id AND x.response IN('accepted','donated')) secured
    FROM users u LEFT JOIN requests r ON r.requester_id=u.id AND r.status IN('Pending','Accepted') WHERE ${w}
    ORDER BY (r.id IS NULL), CASE r.urgency WHEN 'Emergency' THEN 0 WHEN 'Urgent' THEN 1 ELSE 2 END, u.name LIMIT 60`, ...p);
  rows.forEach(r => { r.stage = !r.id ? 'none' : r.status === 'Pending' ? (r.broadcast_at ? 'alerted' : 'review') : 'accepted'; });
  res.json({ patients: rows });
});
router.get('/patients', async (req, res) => res.json({ patients: await db.q("SELECT id,name,phone,blood_group,city,ward,bht_no FROM users WHERE role='patient' AND status='active' ORDER BY name LIMIT 500") }));
router.post('/requests', async (req, res) => {
  const b = req.body || {}, pid = intId(b.patient_id);
  const p = pid && await db.one("SELECT * FROM users WHERE id=? AND role='patient' AND status='active'", pid);
  if (!p) return fail(res, 404, 'Choose a registered patient.');
  const bg = b.blood_group ? b.blood_group : p.blood_group;
  if (!U.BG.includes(bg)) return fail(res, 400, 'Select the blood group needed.');
  const units = parseInt(b.units);
  if (!(units >= 1 && units <= 10)) return fail(res, 400, 'Units must be between 1 and 10.');
  const urgency = ['Normal', 'Urgent', 'Emergency'].includes(b.urgency) ? b.urgency : 'Normal';
  const reason = U.REASONS.includes(b.reason) ? b.reason : 'Other';
  const open = await db.one("SELECT code FROM requests WHERE requester_id=? AND status IN('Pending','Accepted') AND blood_group=?", p.id, bg);
  if (open) return fail(res, 409, `${p.name} already has an open ${bg} request (${open.code}). Use “Alert more donors” on that request instead.`);
  const out = await db.tx(async t => {
    const r = await t.one('INSERT INTO requests(requester_id,blood_group,units,reason,hospital,city,ward,note,urgency) VALUES(?,?,?,?,?,?,?,?,?) RETURNING id',
      p.id, bg, units, reason, U.HOSPITAL.name, U.HOSPITAL.city, U.clean(b.ward, 60) || p.ward || null, U.clean(b.note, 300) || null, urgency);
    const c = '#BR' + String(r.id).padStart(6, '0');
    await t.run('UPDATE requests SET code=? WHERE id=?', c, r.id);
    await U.notify(p.id, 'request', 'Blood requested for you', `The blood bank team is arranging ${units} unit${units > 1 ? 's' : ''} of ${bg} blood for you (${c}). You can follow the progress and see who donates on your dashboard.`, r.id, t);
    return { id: r.id, code: c };
  });
  await U.logAdmin(req.user, 'create request', `${out.code} for ${p.name} (${bg} x ${units})`);
  // Emergency requests (AUTO_ALERT, default) or "alert now" ticked: donors are alerted straight away
  let auto = null;
  if ([true, 1, '1', 'true'].includes(b.alert_now) || U.autoAlertFor(urgency)) {
    try { auto = await U.alertDonors(await db.one('SELECT * FROM requests WHERE id=?', out.id), urgency === 'Emergency' ? 'all' : b.scope, '', req.user); }
    catch (e) { auto = { error: 'Auto alert failed: ' + e.message }; }
  }
  res.status(201).json({ ...out, auto_alerted: auto && !auto.error ? auto.alerted : 0, auto_alert_error: auto && auto.error ? auto.error : undefined });
});
// The donor came to the hospital and gave blood: only the blood bank records that
router.post('/requests/:id/donors/:donorId/confirm', async (req, res) => {
  const r = await db.one('SELECT * FROM requests WHERE id=?', intId(req.params.id)), did = intId(req.params.donorId);
  const x = r && did && await db.one('SELECT response FROM request_responses WHERE request_id=? AND donor_id=?', r.id, did);
  if (!r || !x) return fail(res, 404, 'Donor not found on this request.');
  if (!['Pending', 'Accepted'].includes(r.status)) return fail(res, 409, 'This request is closed.');
  if (x.response === 'donated') return fail(res, 409, 'This donation is already recorded.');
  if (x.response !== 'accepted') return fail(res, 409, 'This donor has not accepted the request.');
  const nd = new Date(); nd.setUTCDate(nd.getUTCDate() + U.ELIG_DAYS); const nextDate = nd.toISOString().slice(0, 10); let thanks = '';
  const out = await db.tx(async t => {
    await t.run(`UPDATE request_responses SET response='donated', created_at=${N} WHERE request_id=? AND donor_id=?`, r.id, did);
    await t.run("UPDATE donors SET last_donation_date=(now() at time zone 'utc')::date WHERE user_id=?", did);
    const n = (await t.one("SELECT COUNT(*) c FROM request_responses WHERE request_id=? AND response='donated'", r.id)).c;
    const done = n >= r.units;
    if (done) await t.run(`UPDATE requests SET status='Completed', completed_at=${N} WHERE id=?`, r.id);
    const d = await t.one('SELECT name FROM users WHERE id=?', did);
    const total = (await t.one("SELECT COUNT(*) c FROM request_responses WHERE donor_id=? AND response='donated'", did)).c;
    thanks = `Thank you, ${d.name}! The blood bank recorded your donation for ${r.code}. This is your donation number ${total}. You can donate again from ${nextDate}, and we will remind you then.`;
    await U.notify(did, 'request', 'Thank you for donating', thanks, r.id, t);
    await U.notify(r.requester_id, 'request', done ? 'Your blood request is complete' : 'A donor donated for you', `${d.name} donated blood for you. ${Math.min(n, r.units)} of ${r.units} unit${r.units > 1 ? 's' : ''} done${done ? '.' : '.'}`, r.id, t);
    return { donated: n, units: r.units, completed: done };
  });
  const du = await db.one('SELECT name,email FROM users WHERE id=?', did);
  if (du) await U.sendEmail(du.email, du.name, 'Thank you for donating blood', thanks);
  await U.logAdmin(req.user, 'confirm donation', `${r.code} donor #${did}`);
  res.json({ ok: true, ...out });
});
// The donor accepted but did not come: free the place so more donors can be alerted
router.post('/requests/:id/donors/:donorId/noshow', async (req, res) => {
  const r = await db.one('SELECT * FROM requests WHERE id=?', intId(req.params.id)), did = intId(req.params.donorId);
  const x = r && did && await db.one('SELECT response FROM request_responses WHERE request_id=? AND donor_id=?', r.id, did);
  if (!r || !x || x.response !== 'accepted') return fail(res, 404, 'No accepted donor found.');
  await db.tx(async t => {
    await t.run("UPDATE request_responses SET response='declined' WHERE request_id=? AND donor_id=?", r.id, did);
    if (r.status === 'Accepted') await t.run("UPDATE requests SET status='Pending', accepted_at=NULL WHERE id=?", r.id);
  });
  await U.logAdmin(req.user, 'donor did not come', `${r.code} donor #${did}`);
  res.json({ ok: true });
});
router.patch('/requests/:id', async (req, res) => {
  const r = await db.one('SELECT * FROM requests WHERE id=?', intId(req.params.id));
  if (!r) return fail(res, 404, 'Request not found.');
  const b = req.body || {};
  if (b.flagged !== undefined) { await db.run('UPDATE requests SET flagged=? WHERE id=?', b.flagged ? 1 : 0, r.id); await U.logAdmin(req.user, b.flagged ? 'flag request' : 'unflag request', r.code); }
  if (b.status) {
    if (!['Completed', 'Cancelled', 'Expired'].includes(b.status)) return fail(res, 400, 'Invalid status.');
    if (['Completed', 'Cancelled', 'Expired', 'Declined'].includes(r.status)) return fail(res, 409, 'This request is already closed.');
    const word = b.status === 'Completed' ? 'fulfilled' : b.status.toLowerCase();
    await db.tx(async t => {
      const w = await t.q("SELECT donor_id FROM request_responses WHERE request_id=? AND response='accepted'", r.id);
      if (b.status === 'Completed') {
        await t.run(`UPDATE requests SET status='Completed', completed_at=${N} WHERE id=?`, r.id);
        // the hospital saw these donors donate: record it and start their rest period
        for (const x of w) {
          await t.run(`UPDATE request_responses SET response='donated', created_at=${N} WHERE request_id=? AND donor_id=?`, r.id, x.donor_id);
          await t.run("UPDATE donors SET last_donation_date=(now() at time zone 'utc')::date WHERE user_id=?", x.donor_id);
          await U.notify(x.donor_id, 'request', 'Donation recorded', `The hospital recorded your donation for ${r.code}. Thank you for saving a life!`, r.id, t);
        }
      } else {
        await t.run('UPDATE requests SET status=? WHERE id=?', b.status, r.id);
        for (const x of w) await U.notify(x.donor_id, 'request', `Request ${word}`, `The hospital marked request ${r.code} as ${word}.`, r.id, t);
      }
      await U.notify(r.requester_id, 'request', `Request ${word}`, `The hospital marked request ${r.code} as ${word}.`, r.id, t);
    });
    await U.logAdmin(req.user, 'set request ' + b.status, r.code);
  }
  res.json({ ok: true });
});
router.delete('/requests/:id', async (req, res) => {
  const r = await db.one('SELECT * FROM requests WHERE id=?', intId(req.params.id));
  if (!r) return fail(res, 404, 'Request not found.');
  await db.run('DELETE FROM requests WHERE id=?', r.id); await U.logAdmin(req.user, 'delete request', r.code);
  res.json({ ok: true });
});
router.post('/requests/cleanup', async (req, res) => {
  const mode = (req.body || {}).mode;
  let n;
  if (mode === 'expired') n = (await db.run("DELETE FROM requests WHERE status IN('Expired','Cancelled','Declined')")).rowCount;
  else if (mode === 'flagged') n = (await db.run("DELETE FROM requests WHERE flagged=1 AND status NOT IN('Completed')")).rowCount;
  else return fail(res, 400, 'Invalid cleanup type.');
  await U.logAdmin(req.user, 'cleanup requests', `${mode}: ${n} removed`);
  res.json({ removed: n });
});

/* ----- reports ----- */
router.get('/reports', async (req, res) => {
  const st = req.query.status === 'resolved' ? 'resolved' : 'open';
  res.json({ reports: await db.q(`SELECT p.*, rp.name reporter, t.name target, t.email target_email, t.status target_status, r.code request_code
    FROM reports p LEFT JOIN users rp ON rp.id=p.reporter_id LEFT JOIN users t ON t.id=p.target_user_id LEFT JOIN requests r ON r.id=p.request_id
    WHERE p.status=? ORDER BY p.id DESC LIMIT 200`, st) });
});
router.patch('/reports/:id', async (req, res) => {
  const p = await db.one('SELECT * FROM reports WHERE id=?', intId(req.params.id));
  if (!p) return fail(res, 404, 'Report not found.');
  const action = (req.body || {}).action;
  await db.tx(async t => {
    if (action === 'ban' && p.target_user_id) {
      await t.run("UPDATE users SET status='banned' WHERE id=? AND role<>'admin'", p.target_user_id);
      await t.run("UPDATE requests SET status='Cancelled' WHERE requester_id=? AND status IN('Pending','Accepted')", p.target_user_id);
      await U.releaseDonorRequests(p.target_user_id, t, 'is no longer available');
    }
    if (action === 'delete_request' && p.request_id) await t.run('DELETE FROM requests WHERE id=?', p.request_id);
    await t.run(`UPDATE reports SET status='resolved', resolved_at=${N} WHERE id=?`, p.id);
    if (p.request_id && action !== 'delete_request') await t.run('UPDATE requests SET flagged=0 WHERE id=?', p.request_id);
  });
  await U.logAdmin(req.user, 'resolve report', `#${p.id} ${action || 'dismissed'}`);
  res.json({ ok: true });
});

/* ----- announcements / campaigns ----- */
router.get('/campaigns', async (req, res) => res.json({ campaigns: await db.q('SELECT * FROM campaigns ORDER BY id DESC LIMIT 100') }));
router.post('/campaigns', async (req, res) => {
  const b = req.body || {}, title = U.clean(b.title, 100), body = U.clean(b.body, 400);
  const aud = ['donors', 'patients', 'hospitals', 'all'].includes(b.audience) ? b.audience : 'donors';
  if (title.length < 3 || body.length < 5) return fail(res, 400, 'Enter a title and a message.');
  const roleSql = aud === 'all' ? "role<>'admin'" : `role='${aud.slice(0, -1)}'`;
  const ids = await db.q(`SELECT id FROM users WHERE ${roleSql} AND status<>'banned'`);
  await db.tx(async t => {
    if (ids.length) await t.run(`INSERT INTO notifications(user_id,type,title,body) SELECT id,'campaign',?::text,?::text FROM users WHERE ${roleSql} AND status<>'banned'`, title, body);
    await t.run('INSERT INTO campaigns(title,body,audience,sent_to) VALUES(?,?,?,?)', title, body, aud, ids.length);
  });
  await U.logAdmin(req.user, 'send announcement', `${title} -> ${ids.length} users`);
  res.status(201).json({ sent: ids.length });
});
router.delete('/campaigns/:id', async (req, res) => {
  await db.run('DELETE FROM campaigns WHERE id=?', intId(req.params.id)); res.json({ ok: true });
});

/* ----- tools ----- */
router.post('/tools/reminders', async (req, res) => {
  const n = await U.sendReminders(true); await U.logAdmin(req.user, 'send reminders', `${n} donors`); res.json({ sent: n });
});
router.post('/tools/expire', async (req, res) => {
  const n = await U.expireRequests(); await U.logAdmin(req.user, 'expire requests', `${n} requests`); res.json({ expired: n });
});
/* ----- blood stock (units in the blood bank) ----- */
router.get('/stock', async (req, res) => {
  const rows = await db.q('SELECT blood_group,units,min_units,updated_at FROM blood_stock');
  rows.sort((a, b) => U.BG.indexOf(a.blood_group) - U.BG.indexOf(b.blood_group));
  res.json({ stock: rows });
});
// body: { blood_group, units | delta, min_units? }
router.put('/stock', async (req, res) => {
  const b = req.body || {};
  if (!U.BG.includes(b.blood_group)) return fail(res, 400, 'Choose a blood group.');
  const cur = await db.one('SELECT units,min_units FROM blood_stock WHERE blood_group=?', b.blood_group);
  let units = cur.units, min = cur.min_units;
  if (b.units !== undefined && b.units !== '') units = parseInt(b.units);
  else if (b.delta !== undefined) units = cur.units + parseInt(b.delta);
  if (b.min_units !== undefined && b.min_units !== '') min = parseInt(b.min_units);
  if (!Number.isInteger(units) || units < 0 || units > 9999) return fail(res, 400, 'Units must be a number from 0 to 9999.');
  if (!Number.isInteger(min) || min < 0 || min > 9999) return fail(res, 400, 'Minimum must be a number from 0 to 9999.');
  await db.run(`UPDATE blood_stock SET units=?, min_units=?, updated_at=${N} WHERE blood_group=?`, units, min, b.blood_group);
  await U.logAdmin(req.user, 'blood stock', `${b.blood_group}: ${cur.units} -> ${units} (minimum ${min})`);
  res.json({ ok: true, blood_group: b.blood_group, units, min_units: min });
});

/* ----- monthly report ----- */
async function monthReport(q) {
  const m = /^\d{4}-(0[1-9]|1[0-2])$/.test(q || '') ? q : new Date().toISOString().slice(0, 7);
  const from = m + '-01', to = `(date '${from}' + interval '1 month')`, inR = col => `${col} >= date '${from}' AND ${col} < ${to}`;
  const [reqs, byStatus, byUrg, byBg, don, donBg, newDonors, top] = await Promise.all([
    db.one(`SELECT COUNT(*) c, COALESCE(SUM(units),0) units FROM requests r WHERE ${inR('r.created_at')}`),
    db.q(`SELECT status k, COUNT(*) c FROM requests r WHERE ${inR('r.created_at')} GROUP BY status ORDER BY status`),
    db.q(`SELECT urgency k, COUNT(*) c FROM requests r WHERE ${inR('r.created_at')} GROUP BY urgency ORDER BY urgency`),
    db.q(`SELECT blood_group k, COUNT(*) c, SUM(units) units FROM requests r WHERE ${inR('r.created_at')} GROUP BY blood_group`),
    db.one(`SELECT COUNT(*) c FROM request_responses x WHERE x.response='donated' AND ${inR('x.created_at')}`),
    db.q(`SELECT u.blood_group k, COUNT(*) c FROM request_responses x JOIN users u ON u.id=x.donor_id WHERE x.response='donated' AND ${inR('x.created_at')} GROUP BY u.blood_group`),
    db.one(`SELECT COUNT(*) c FROM users u WHERE u.role='donor' AND ${inR('u.created_at')}`),
    db.q(`SELECT u.name, u.blood_group, COUNT(*) c FROM request_responses x JOIN users u ON u.id=x.donor_id WHERE x.response='donated' AND ${inR('x.created_at')} GROUP BY u.id,u.name,u.blood_group ORDER BY c DESC, u.name LIMIT 10`)]);
  const bgRows = U.BG.map(g => ({ blood_group: g, requests: (byBg.find(x => x.k === g) || {}).c || 0, units_requested: Number((byBg.find(x => x.k === g) || {}).units || 0), donations: (donBg.find(x => x.k === g) || {}).c || 0 }));
  return { month: m, requests: reqs.c, units_requested: Number(reqs.units), donations: don.c, new_donors: newDonors.c, by_status: byStatus, by_urgency: byUrg, by_blood_group: bgRows, top_donors: top };
}
router.get('/report', async (req, res) => res.json(await monthReport(req.query.month)));
router.get('/export/report', async (req, res) => {
  const r = await monthReport(req.query.month), rows = [];
  const add = (section, item, value) => rows.push({ section, item, value });
  add('Summary', 'Month', r.month); add('Summary', 'Blood requests', r.requests); add('Summary', 'Units requested', r.units_requested);
  add('Summary', 'Donations recorded', r.donations); add('Summary', 'New donors registered', r.new_donors);
  r.by_status.forEach(x => add('Requests by status', x.k, x.c)); r.by_urgency.forEach(x => add('Requests by urgency', x.k, x.c));
  r.by_blood_group.forEach(x => { add('Blood group: requests', x.blood_group, x.requests); add('Blood group: units requested', x.blood_group, x.units_requested); add('Blood group: donations', x.blood_group, x.donations); });
  r.top_donors.forEach(x => add('Top donors', `${x.name} (${x.blood_group})`, x.c));
  sendCsv(res, `report-${r.month}.csv`, rows);
});

/* ----- backup (download everything as one JSON file) ----- */
router.get('/backup', async (req, res) => {
  const data = await require('./backup').dump();
  await U.logAdmin(req.user, 'download backup', '');
  res.set({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="blood-donor-backup-${new Date().toISOString().slice(0, 10)}.json"` });
  res.send(JSON.stringify(data));
});
router.get('/logs', async (req, res) => res.json({ logs: await db.q('SELECT * FROM admin_logs ORDER BY id DESC LIMIT 300') }));

const csvCell = v => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s) && !/^\+\d{7,15}$/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
function sendCsv(res, name, rows) {
  if (!rows.length) rows = [{ empty: '' }];
  const keys = Object.keys(rows[0]);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"` });
  res.send('\ufeff' + [keys.join(','), ...rows.map(r => keys.map(k => csvCell(r[k])).join(','))].join('\n'));
}
router.get('/export/users', async (req, res) => sendCsv(res, 'users.csv', await db.q("SELECT id,name,email,phone,role,blood_group,city,state,status,created_at FROM users WHERE role<>'admin' ORDER BY id")));
router.get('/export/requests', async (req, res) => sendCsv(res, 'requests.csv', await db.q(`SELECT r.code,r.blood_group,r.units,r.reason,r.hospital,r.city,r.urgency,r.status,r.created_at,rq.name requester,r.ward,r.broadcast_count alerted_donors,(SELECT COUNT(*) FROM request_responses x WHERE x.request_id=r.id AND x.response IN('accepted','donated')) confirmed_donors FROM requests r JOIN users rq ON rq.id=r.requester_id ORDER BY r.id`)));

router.put('/password', async (req, res) => {
  const { current, password } = req.body || {};
  if (!bcrypt.compareSync(String(current || ''), req.user.password_hash)) return fail(res, 400, 'Current password is incorrect.');
  if (!U.passOk(password)) return fail(res, 400, 'New password must be at least 8 characters and include a letter and a number.');
  await db.run('UPDATE users SET password_hash=? WHERE id=?', bcrypt.hashSync(password, 10), req.user.id);
  await U.logAdmin(req.user, 'change password', ''); res.json({ ok: true });
});
router.post('/admins', async (req, res) => {
  const b = req.body || {}, email = U.clean(b.email, 120).toLowerCase(), phone = U.normPhone(b.phone), name = U.clean(b.name, 80);
  if (name.length < 2 || !U.emailRe.test(email) || !phone) return fail(res, 400, 'Enter name, a valid email and phone.');
  if (!U.passOk(b.password)) return fail(res, 400, 'Password must be at least 8 characters and include a letter and a number.');
  if (await db.one('SELECT 1 x FROM users WHERE email=? OR phone=?', email, phone)) return fail(res, 409, 'Email or phone already in use.');
  await db.run("INSERT INTO users(name,email,phone,password_hash,role,status) VALUES(?,?,?,?, 'admin','active')", name, email, phone, bcrypt.hashSync(b.password, 10));
  await U.logAdmin(req.user, 'add admin', email); res.status(201).json({ ok: true });
});

module.exports = router;
