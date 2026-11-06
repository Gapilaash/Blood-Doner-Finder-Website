/* Blood Donor Finder – Admin website */
const CFG = window.APP_CONFIG || { API: '/api' };
const S = { token: localStorage.getItem('bdf_admin_token'), admin: null, counts: { review: 0, reports: 0 } };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BG = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  dash: ic('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
  users: ic('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 010 8M22 21c0-3-2-5-4-5.6"/>'),
  req: ic('<path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z"/>'),
  flag: ic('<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>'),
  mega: ic('<path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M15 9a4 4 0 010 6"/>'),
  tool: ic('<path d="M14.7 6.3a4 4 0 005 5L21 10l-3-3 1.3-1.3a4 4 0 00-4.6.6z"/><path d="M14 10L3 21"/>'),
  log: ic('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  cog: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  menu: ic('<path d="M3 6h18M3 12h18M3 18h18"/>'),
  stock: ic('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M7 8V5a2 2 0 012-2h6a2 2 0 012 2v3M12 12v5M9.5 14.5h5"/>'),
  chart: ic('<path d="M4 20V4"/><path d="M4 20h16"/><rect x="8" y="11" width="3" height="6"/><rect x="14" y="7" width="3" height="10"/>')
};
const drop = '<svg viewBox="0 0 40 52"><path d="M20 2C20 2 4 22 4 34a16 16 0 0032 0C36 22 20 2 20 2z" fill="#D6002A"/><path d="M11 34a9 9 0 006.5 8.2" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
const tel = p => p ? `<a href="tel:${esc(String(p).replace(/[^\d+]/g, ''))}" title="Call">${esc(p)}</a>` : '';
const ETA_L = { now: 'coming now', '2h': 'within 2 hours', today: 'today', tomorrow: 'tomorrow' };
const etaTag = e => ETA_L[e] ? ` <span class="badge b-blue" title="When the donor said they will come">${ETA_L[e]}</span>` : '';
const utc = s => new Date(String(s).replace(' ', 'T') + 'Z');
const fmt = s => s ? utc(s).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
const fmtD = s => s ? utc(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const STB = { review: 'b-amber', alerted: 'b-amber', Pending: 'b-amber', Accepted: 'b-blue', Completed: 'b-green', Declined: 'b-red', Cancelled: 'b-grey', Expired: 'b-grey', active: 'b-green', pending: 'b-amber', banned: 'b-red' };
const stLabel = s => s === 'Completed' ? 'Fulfilled' : s;
const badge = (s, label) => `<span class="badge ${STB[s] || 'b-grey'}">${esc(label || stLabel(s))}</span>`;
const urg = u => `<span class="badge ${u === 'Emergency' ? 'b-red' : u === 'Urgent' ? 'b-amber' : 'b-grey'}">${esc(u)}</span>`;
const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function toast(m, t = '') { const d = document.createElement('div'); d.className = 'toast ' + t; d.textContent = m; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 3800); }
function dialog({ title, text = '', html = '', confirm = 'Confirm', cancel = 'Cancel', danger = false, hideConfirm = false }) {
  return new Promise(res => {
    const r = $('#modal-root');
    r.innerHTML = `<div class="overlay" role="dialog" aria-modal="true"><form class="modal"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}${html}
      <div class="row"><button type="button" class="btn gray" data-x>${esc(cancel)}</button>${hideConfirm ? '' : `<button class="btn ${danger ? '' : ''}" ${danger ? 'style="background:#9B1C1C;border-color:#9B1C1C"' : ''}>${esc(confirm)}</button>`}</div></form></div>`;
    const done = v => { r.innerHTML = ''; document.removeEventListener('keydown', k); res(v); };
    const k = e => e.key === 'Escape' && done(false);
    document.addEventListener('keydown', k);
    $('form', r).onsubmit = e => { e.preventDefault(); done(Object.fromEntries(new FormData(e.target)) || true); };
    $('[data-x]', r).onclick = () => done(false);
    $('.overlay', r).addEventListener('click', e => { if (e.target.classList.contains('overlay')) done(false); });
  });
}
const confirmBox = (title, text, confirm = 'Confirm', danger = false) => dialog({ title, text, confirm, danger });

async function api(path, { method = 'GET', body, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' }; if (S.token) headers.Authorization = 'Bearer ' + S.token;
  let r; try { r = await fetch(CFG.API + '/admin' + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); } catch { throw new Error('Cannot reach the server.'); }
  if (raw && r.ok) return r;
  let j = {}; try { j = await r.json(); } catch { }
  if (r.status === 401 && S.token) { signOut(); throw new Error('Session expired. Please sign in again.'); }
  if (!r.ok) throw new Error(j.error || 'Something went wrong.');
  return j;
}
function signOut() { S.token = null; S.admin = null; localStorage.removeItem('bdf_admin_token'); location.hash = '#/login'; }

/* ---------- layout ---------- */
const NAV = [['/', 'Dashboard', 'dash'], ['/users', 'Users', 'users'], ['/requests', 'Blood Requests', 'req'], ['/stock', 'Blood Stock', 'stock'], ['/summary', 'Monthly Report', 'chart'], ['/reports', 'Reports', 'flag'], ['/announcements', 'Announcements', 'mega'], ['/tools', 'Tools & Export', 'tool'], ['/logs', 'Activity Log', 'log'], ['/settings', 'Settings', 'cog']];
function shell(path, html) {
  const side = `<aside class="side" id="side"><div class="brand">${drop}<div>Blood Donor Finder<small>Admin Dashboard</small></div></div>
   ${NAV.map(([h, t, i]) => `<a class="nl ${(h === '/' ? path === '/' : path.startsWith(h)) ? 'on' : ''}" href="#${h}" data-nav>${ICON[i]}${t}${h === '/requests' && S.counts.review ? `<span class="cnt" title="Requests waiting for your review">${S.counts.review}</span>` : ''}${h === '/reports' && S.counts.reports ? `<span class="cnt">${S.counts.reports}</span>` : ''}</a>`).join('')}
   <div class="foot">Signed in as<br><b>${esc(S.admin.name)}</b><br>${esc(S.admin.email)}<button class="btn out sm" data-act="signout">Sign out</button></div></aside>`;
  return `<div class="shell">${side}<div class="content"><div class="mbar"><button data-act="menu" aria-label="Open menu">${ICON.menu}</button><b>Admin Dashboard</b></div><main class="main" id="main">${html}</main></div></div>`;
}

/* ---------- router ---------- */
const PAGES = {}; let rid = 0;
async function render() {
  const id = ++rid, raw = location.hash.slice(1) || '/', [path, qs] = raw.split('?'), q = Object.fromEntries(new URLSearchParams(qs || ''));
  if (!S.token) { if (path !== '/login') return (location.hash = '#/login'); return $('#app').innerHTML = loginView(); }
  if (path === '/login') return (location.hash = '#/');
  if (!S.admin) { try { S.admin = (await api('/me')).admin; } catch (e) { if (S.token) $('#app').innerHTML = `<div class="loginwrap"><div class="card"><b>Cannot load the dashboard</b><p class="muted small" style="margin:8px 0 14px">${esc(e.message)}</p><button class="btn" onclick="location.reload()">Try again</button></div></div>`; return; } }
  const fn = PAGES[path]; if (!fn) return (location.hash = '#/');
  $('#app').innerHTML = shell(path, '<div class="spin"></div>');
  let html, mount;
  try { const r = await fn(q); html = r.html; mount = r.mount; } catch (e) { html = `<div class="empty"><b>Something went wrong</b><br>${esc(e.message)}</div>`; }
  if (id !== rid) return;
  if (path !== '/') refreshCounts();
  const fresh = S.animPath !== path; S.animPath = path;
  $('#main').innerHTML = html; window.scrollTo(0, 0); mount && mount(); if (fresh) countUp();
}
function countUp() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  $$('.kpi b').forEach(el => {
    const n = Number(el.textContent.trim()); if (!Number.isInteger(n) || n < 2) return;
    const t0 = performance.now(), d = 900;
    const step = now => { const k = Math.min(1, (now - t0) / d); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  });
}
async function refreshCounts() {
  try { const s = await api('/stats'); S.counts = { review: s.requests.awaiting, reports: s.openReports }; paintCounts(); } catch { }
}
function paintCounts() {
  try {
    $$('#side a.nl').forEach(a => { const h = a.getAttribute('href').slice(1); a.querySelector('.cnt')?.remove(); const n = h === '/requests' ? S.counts.review : h === '/reports' ? S.counts.reports : 0; if (n) a.insertAdjacentHTML('beforeend', `<span class="cnt">${n}</span>`); }); } catch { }
}
window.addEventListener('hashchange', render);
const ACT = {};
document.addEventListener('click', e => {
  if (e.target.closest('[data-nav]')) $('#side')?.classList.remove('open'), $('.scrim')?.remove();
  const a = e.target.closest('[data-act]'); if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a, e); }
});
ACT.menu = () => { const s = $('#side'); s.classList.add('open'); const d = document.createElement('div'); d.className = 'scrim'; d.onclick = () => { s.classList.remove('open'); d.remove(); }; document.body.appendChild(d); };
ACT.signout = async () => { if (await confirmBox('Sign out?', 'You will need to sign in again.', 'Sign out')) signOut(); };

/* ---------- login ---------- */
const loginView = () => `<div class="loginwrap"><form class="card" id="lf"><div style="width:34px">${drop}</div><h1>Admin sign in</h1><p class="muted small" style="margin-bottom:18px">Blood Donor Finder control panel</p><div class="formerr"></div>
  <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="username"></label>
  <label class="field"><span>Password</span><input name="password" type="password" required autocomplete="current-password"></label>
  <button class="btn" style="width:100%">Sign in</button></form></div>`;
document.addEventListener('submit', async e => {
  if (e.target.id !== 'lf') return; e.preventDefault();
  const f = e.target, b = $('button', f); b.disabled = true; $('.formerr', f).innerHTML = '';
  try { const r = await api('/login', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); S.token = r.token; S.admin = r.admin; localStorage.setItem('bdf_admin_token', r.token); location.hash = '#/'; render(); }
  catch (ex) { $('.formerr', f).innerHTML = `<div class="e" role="alert">${esc(ex.message)}</div>`; b.disabled = false; }
});

/* ---------- dashboard ---------- */
const bars = (rows, key) => { const max = Math.max(1, ...rows.map(r => r[key])); return `<div class="chart">${rows.map(r => `<div class="col"><b>${r[key]}</b><i style="height:${Math.round(r[key] / max * 100)}%"></i><span>${new Date(r.day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}</span></div>`).join('')}</div>`; };
/* ---------- review queue: the heart of the hospital flow ---------- */
const alertBtns = x => `<button class="btn sm" data-act="r-alert" data-id="${x.id}" data-c="${esc(x.code)}" data-bg="${x.blood_group}" data-u="${x.units}" data-urg="${esc(x.urgency || 'Normal')}" data-more="${x.broadcast_at ? 1 : 0}">${x.broadcast_at ? 'Alert more donors' : 'Alert donors'}</button>${x.broadcast_at ? '' : `<button class="btn gray sm" data-act="r-cancel" data-id="${x.id}" data-c="${esc(x.code)}">Cancel</button>`}`;
const reviewQueue = (list, total = list.length) => `<div class="card" style="margin-bottom:14px;${list.length ? 'border-color:#D6002A' : ''}"><div class="bar" style="margin:0 0 8px;justify-content:space-between"><b>Requests not yet sent to donors (${total})</b><a href="#/requests?status=review">Open list</a></div>
  ${list.length ? `<div class="tablewrap"><table><thead><tr><th>Request</th><th>Blood</th><th>Urgency</th><th>Patient</th><th></th></tr></thead><tbody>${list.slice(0, 6).map(x => `<tr><td class="nm" data-l="Request"><b>${esc(x.code)}</b><span class="muted small">${fmt(x.created_at)} • ${x.units} unit${x.units > 1 ? 's' : ''}</span></td><td data-l="Blood"><span class="bgtag">${x.blood_group}</span></td><td data-l="Urgency">${urg(x.urgency)}</td>
   <td data-l="Patient">${esc(x.requester)}<span class="muted small">${tel(x.requester_phone)}${x.ward ? ' • ' + esc(x.ward) : ''}</span></td><td class="act">${alertBtns(x)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nothing waiting. Use “New blood request” when a patient needs blood.</div>'}</div>`;
ACT['r-alert'] = async el => {
  const id = el.dataset.id, more = el.dataset.more === '1';
  let m; try { m = await api(`/requests/${id}/matches?scope=all`); } catch (e) { return toast(e.message, 'err'); }
  if (!m.total) return toast(more ? 'Every eligible donor was already alerted.' : 'No eligible donor found for this blood group right now.', 'err');
  const bg = el.dataset.bg, emergency = (m.urgency || el.dataset.urg) === 'Emergency', t = m.tiers || { all: m.total };
  /* narrowest first; an option is hidden when it reaches nobody new compared with a narrower one */
  const defs = [['exact_city', `Same blood group (${bg}) in ${m.city}`, []], ['exact', `Same blood group (${bg}), any city`, ['exact_city']],
    ['city', `All compatible groups in ${m.city}`, ['exact_city']], ['all', `All compatible donors (${m.compatibleGroups.join(', ')})`, ['exact_city', 'exact', 'city']]];
  const shown = [];
  for (const [k, label, narrower] of defs) { const n = t[k] || 0; if (n && !narrower.some(x => shown.some(sh => sh.k === x && sh.n === n))) shown.push({ k, label, n }); }
  const pick = emergency ? (shown.find(o => o.n === m.total) || shown[shown.length - 1]) : shown[0];
  const groups = Object.entries(m.byGroup).filter(([, n]) => n).map(([g, n]) => `${g}: ${n}`).join(' · ');
  const v = await dialog({
    title: `Alert donors for ${el.dataset.c}?`,
    text: `${el.dataset.u} unit(s) of ${bg} needed. Choose who gets the message now.`,
    html: `<div class="card" style="margin:0 0 12px;padding:10px 12px;background:#FFF7F8"><b>${m.total} eligible donor${m.total === 1 ? '' : 's'} available</b><div class="muted small">${esc(groups)}</div></div>
      ${shown.map(o => `<label class="small" style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><input type="radio" name="scope" value="${o.k}" ${o === pick ? 'checked' : ''}> ${esc(o.label)} <b>(${o.n})</b></label>`).join('')}
      <p class="muted small" style="margin:4px 0 12px">${emergency ? 'Emergency: everyone who can help is selected.' : 'Tip: start with the closest donors so rare groups like O− stay free for patients who really need them. Use “Alert more donors” later to widen.'}</p>
      <label class="field"><span>Extra message for donors (optional)</span><input name="message" maxlength="200" placeholder="e.g. Please come to the blood bank, ground floor"></label>`,
    confirm: 'Send alert' });
  if (!v) return;
  try { const r = await api(`/requests/${id}/broadcast`, { method: 'POST', body: { scope: v.scope, message: v.message } });
    toast(`Alert sent to ${r.alerted} donor${r.alerted === 1 ? '' : 's'}${r.emailed ? ` (${r.emailed} also by e-mail)` : ''}.`, 'ok'); render(); refreshCounts(); } catch (e) { toast(e.message, 'err'); }
};

/* ---------- the blood bank creates the request for a patient ---------- */
ACT['r-new'] = async el => {
  const pre = el && el.dataset && el.dataset.p ? Number(el.dataset.p) : 0;
  let pl; try { pl = (await api('/patients')).patients; } catch (e) { return toast(e.message, 'err'); }
  if (!pl.length) return toast('No patients have signed up yet.', 'err');
  const label = p => `${p.name} · ${p.blood_group}${p.ward ? ' · ' + p.ward : ''}${p.bht_no ? ' · ' + p.bht_no : ''} [#${p.id}]`;
  const v = await dialog({ title: 'New blood request', text: `For a patient of the hospital who needs blood. Next you choose which donors to alert.`,
    html: `<datalist id="pl">${pl.map(p => `<option value="${esc(label(p))}"></option>`).join('')}</datalist>
      <label class="field"><span>Patient (type a name, ward or BHT no.)</span><input name="patient" list="pl" required autocomplete="off" placeholder="Start typing…" value="${esc(pre && pl.find(p => p.id === pre) ? label(pl.find(p => p.id === pre)) : '')}"></label>
      <div class="two"><label class="field"><span>Blood group needed</span><select name="blood_group"><option value="">Same as patient</option>${BG.map(g => `<option>${g}</option>`).join('')}</select></label>
      <label class="field"><span>Units</span><select name="units">${[1, 2, 3, 4, 5, 6, 8, 10].map(n => `<option>${n}</option>`).join('')}</select></label></div>
      <div class="two"><label class="field"><span>Urgency</span><select name="urgency"><option>Normal</option><option>Urgent</option><option>Emergency</option></select></label>
      <label class="field"><span>Reason</span><select name="reason">${['Accident', 'Surgery', 'Cancer treatment', 'Thalassemia / Anaemia', 'Delivery / Pregnancy', 'Dengue / Fever', 'Other'].map(n => `<option>${n}</option>`).join('')}</select></label></div>
      <label class="field"><span>Ward / bed (optional)</span><input name="ward" maxlength="60" placeholder="Leave empty to use the patient’s ward"></label>
      <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" name="alert_now" value="1" style="width:auto"> Alert all matching donors immediately (Emergency requests are always alerted at once)</label>`,
    confirm: 'Create and choose donors' });
  if (!v) return;
  const m = /\[#(\d+)\]\s*$/.exec(v.patient || '');
  if (!m) return toast('Pick the patient from the list.', 'err');
  try {
    const r = await api('/requests', { method: 'POST', body: { patient_id: +m[1], blood_group: v.blood_group, units: +v.units, urgency: v.urgency, reason: v.reason, ward: v.ward, alert_now: v.alert_now === '1' } });
    toast(`Request ${r.code} created.`, 'ok'); refreshCounts();
    if (r.auto_alerted) { toast(`${r.auto_alerted} matching donor${r.auto_alerted > 1 ? 's' : ''} alerted automatically.`, 'ok'); return render(); }
    if (r.auto_alert_error) toast(r.auto_alert_error, 'err');
    const rows = (await api('/requests?q=' + encodeURIComponent(r.code))).requests, x = rows[0];
    if (x) ACT['r-alert']({ dataset: { id: x.id, c: x.code, bg: x.blood_group, u: x.units, urg: x.urgency, more: '0' } });
    render();
  } catch (e) { toast(e.message, 'err'); }
};
ACT['r-cancel'] = async el => {
  if (!await confirmBox(`Cancel ${el.dataset.c}?`, 'The patient and any donors who agreed are told.', 'Cancel request', true)) return;
  try { await api('/requests/' + el.dataset.id, { method: 'PATCH', body: { status: 'Cancelled' } }); toast('Request cancelled.', 'ok'); render(); refreshCounts(); } catch (e) { toast(e.message, 'err'); }
};
ACT['d-conf'] = async el => {
  if (!await confirmBox(`${el.dataset.n} has donated?`, 'This records the donation, starts their 90-day rest and tells the patient who donated.', 'Yes, donated')) return;
  try { const r = await api(`/requests/${el.dataset.id}/donors/${el.dataset.d}/confirm`, { method: 'POST' }); toast(r.completed ? 'Donation recorded. Request completed.' : `Donation recorded (${r.donated} of ${r.units}).`, 'ok'); render(); refreshCounts(); } catch (e) { toast(e.message, 'err'); }
};
ACT['d-no'] = async el => {
  if (!await confirmBox(`${el.dataset.n} did not come?`, 'Their place is freed so you can alert more donors.', 'Didn’t come', true)) return;
  try { await api(`/requests/${el.dataset.id}/donors/${el.dataset.d}/noshow`, { method: 'POST' }); toast('Place freed. You can alert more donors.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
};

PAGES['/'] = async () => {
  const [s, rv] = await Promise.all([api('/stats'), api('/requests?stage=review')]), r = s.requests;
  S.counts = { review: r.awaiting, reports: s.openReports };
  const kpi = (l, v, extra = '', cls = '') => `<div class="card kpi ${cls}"><small>${l}</small><b>${v}</b>${extra}</div>`;
  const statuses = ['Pending', 'Accepted', 'Completed', 'Declined', 'Cancelled', 'Expired'], smax = Math.max(1, ...statuses.map(x => r[x]));
  const gmax = Math.max(1, ...s.byBloodGroup.map(g => Math.max(g.donors, g.requests)));
  return { html: `<div class="bar" style="justify-content:space-between;margin:0"><h1 class="title" style="margin:0">Dashboard</h1><button class="btn" data-act="r-new">+ New blood request</button></div><p class="sub">Pick the patient who needs blood, alert the matching donors and record each donation.</p>
   ${s.lowStock && s.lowStock.length ? `<div class="card" style="margin-bottom:14px;border-color:#D6002A"><div class="bar" style="margin:0;justify-content:space-between"><b>Low blood stock: ${s.lowStock.map(x => `${esc(x.blood_group)} (${x.units}/${x.min_units})`).join(', ')}</b><a href="#/stock">Open stock</a></div></div>` : ''}
   ${reviewQueue(rv.requests, rv.total)}
   <div class="grid g4">${kpi('Registered donors', s.users.donors)}${kpi('Available to donate now', s.availableDonors)}${kpi('Patients / families', s.users.patients)}${kpi('Total requests', r.total)}
   ${kpi('Donors alerted (open)', r.alerted, r.alerted ? '<a href="#/requests?status=alerted">View</a>' : '')}${kpi('Active emergencies', r.emergency, '', r.emergency ? 'alert' : '')}
   ${kpi('Open reports', s.openReports, s.openReports ? '<a href="#/reports">Review now</a>' : '', s.openReports ? 'alert' : '')}</div>
   <div class="grid g2" style="margin-top:14px"><div class="card"><b>New sign-ups (last 7 days)</b>${bars(s.signups, 'count')}</div><div class="card"><b>Requests (last 7 days)</b>${bars(s.requestsPerDay, 'count')}</div></div>
   <div class="grid g2" style="margin-top:14px"><div class="card"><b>Requests by status</b><div style="margin-top:8px">${statuses.map(x => `<div class="hb"><span>${stLabel(x)}</span><div><i style="width:${r[x] / smax * 100}%"></i></div><b>${r[x]}</b></div>`).join('')}</div></div>
   <div class="card"><b>Donors vs requests by blood group</b><div class="legend" style="margin-top:6px"><span><i style="background:#D6002A"></i>Donors</span><span><i style="background:#F2A0B0"></i>Requests</span></div>
   <div class="chart">${s.byBloodGroup.map(g => `<div class="col"><div class="bgpair"><i style="height:${g.donors / gmax * 100}%;background:#D6002A;border-radius:5px 5px 0 0" title="${g.donors} donors"></i><i style="height:${g.requests / gmax * 100}%;background:#F2A0B0;border-radius:5px 5px 0 0" title="${g.requests} requests"></i></div><span>${g.group}</span></div>`).join('')}</div></div></div>
   <div class="card" style="margin-top:14px"><div class="bar" style="margin:0 0 8px;justify-content:space-between"><b>Latest requests</b><a href="#/requests">View all</a></div>
   ${s.recentRequests.length ? `<div class="tablewrap"><table><thead><tr><th>Code</th><th>Blood</th><th>Urgency</th><th>Patient</th><th>Status</th><th>When</th></tr></thead><tbody>${s.recentRequests.map(x => `<tr><td data-l="Code">${esc(x.code)}</td><td data-l="Blood"><span class="bgtag">${x.blood_group}</span></td><td data-l="Urgency">${urg(x.urgency)}</td><td data-l="Patient">${esc(x.requester)}</td><td data-l="Status">${badge(x.status)}</td><td data-l="When">${fmt(x.created_at)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No requests yet.</div>'}</div>`, mount: paintCounts };
};

/* ---------- users ---------- */
const pager = (r, base) => r.pages > 1 ? `<div class="pager"><span class="muted small">Page ${r.page} of ${r.pages} • ${r.total} total</span><a class="btn gray sm ${r.page <= 1 ? 'dis' : ''}" ${r.page <= 1 ? 'style="pointer-events:none;opacity:.5"' : ''} href="#${base}&page=${r.page - 1}">Previous</a><a class="btn gray sm" ${r.page >= r.pages ? 'style="pointer-events:none;opacity:.5"' : ''} href="#${base}&page=${r.page + 1}">Next</a></div>` : (r.total ? `<div class="pager"><span class="muted small">${r.total} total</span></div>` : '');
const qsOf = (q, keys) => keys.map(k => `${k}=${encodeURIComponent(q[k] || '')}`).join('&');
function wireFilters(base, keys) {
  const go = () => { const p = keys.map(k => { const el = $(`[name=f_${k}]`); return `${k}=${encodeURIComponent(el ? (el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value) : '')}`; }).join('&'); location.hash = `#${base}?${p}`; };
  $$('[name^=f_]').forEach(el => el.addEventListener(el.type === 'search' ? 'input' : 'change', el.type === 'search' ? debounce(go, 400) : go));
  const s = $('[name=f_q]'); if (s && s.value) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
}
PAGES['/users'] = async q => {
  const r = await api('/users?' + qsOf(q, ['q', 'role', 'status', 'page']));
  const opt = (v, cur, l) => `<option value="${v}" ${v === (cur || '') ? 'selected' : ''}>${l}</option>`;
  return { html: `<h1 class="title">Users</h1><p class="sub">Donors and the hospital’s patients. Suspend misuse and manage accounts.</p>
   <div class="bar"><input type="search" name="f_q" value="${esc(q.q || '')}" placeholder="Search name, email, phone, ward or BHT no." aria-label="Search users">
   <select name="f_role" aria-label="Role">${opt('', q.role, 'All roles')}${opt('donor', q.role, 'Donors')}${opt('patient', q.role, 'Patients')}</select>
   <select name="f_status" aria-label="Status">${opt('', q.status, 'Any status')}${opt('active', q.status, 'Active')}${opt('pending', q.status, 'Pending approval')}${opt('banned', q.status, 'Banned')}</select></div>
   <div class="card">${r.users.length ? `<div class="tablewrap"><table><thead><tr><th>User</th><th>Role</th><th>Blood</th><th>City</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody>
   ${r.users.map(u => `<tr><td class="nm" data-l="User"><b>${esc(u.name)}</b><span class="muted small">${esc(u.email)} • ${tel(u.phone)}${u.role === 'patient' && (u.ward || u.bht_no) ? ' • ' + esc([u.ward, u.bht_no].filter(Boolean).join(' / ')) : ''}</span></td><td data-l="Role">${esc(u.role)}</td><td data-l="Blood">${u.blood_group ? `<span class="bgtag">${u.blood_group}</span>` : '—'}</td><td data-l="City">${esc(u.city || '—')}</td><td data-l="Status">${badge(u.status)}</td><td data-l="Joined">${fmtD(u.created_at)}</td>
   <td class="act"><button class="btn gray sm" data-act="u-view" data-id="${u.id}">View</button>${u.status === 'pending' ? `<button class="btn ok sm" data-act="u-set" data-id="${u.id}" data-s="active" data-n="${esc(u.name)}">Approve</button>` : ''}
   ${u.status === 'banned' ? `<button class="btn out sm" data-act="u-set" data-id="${u.id}" data-s="active" data-n="${esc(u.name)}">Unban</button>` : `<button class="btn danger sm" data-act="u-set" data-id="${u.id}" data-s="banned" data-n="${esc(u.name)}">${u.status === 'pending' ? 'Reject' : 'Ban'}</button>`}
   <button class="btn danger sm" data-act="u-del" data-id="${u.id}" data-n="${esc(u.name)}">Delete</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No users match these filters.</div>'}${pager(r, '/users?' + qsOf(q, ['q', 'role', 'status']))}</div>`,
    mount: () => wireFilters('/users', ['q', 'role', 'status']) };
};
ACT['u-view'] = async el => {
  try {
    const { user: u } = await api('/users/' + el.dataset.id);
    const rows = [['Name', u.name], ['Email', u.email], ['Phone', u.phone], ['Role', u.role], ['Status', u.status], ['Blood group', u.blood_group || '—'], ['Gender', u.gender || '—'], ['Date of birth', u.dob || '—'], ['Location', [u.city, u.state].filter(Boolean).join(', ') || '—'], ['Registration no.', u.license_no || '—'], ['Joined', fmt(u.created_at)]];
    if (u.donor) rows.push(['Available', u.donor.is_available ? 'Yes' : 'No'], ['Last donation', u.donor.last_donation_date || '—'], ['Donations', u.donations]);
    rows.push(['Requests made', u.requestsMade], ['Reports against', u.reportsAgainst]);
    if (u.about) rows.push(['About', u.about]);
    await dialog({ title: u.name, html: `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`, cancel: 'Close', hideConfirm: true });
  } catch (e) { toast(e.message, 'err'); }
};
ACT['u-set'] = async el => {
  const s = el.dataset.s, n = el.dataset.n, pend = el.textContent.trim() === 'Approve';
  const label = pend ? 'Approve' : s === 'banned' ? (el.textContent.trim() === 'Reject' ? 'Reject' : 'Ban') : 'Unban';
  if (!await confirmBox(`${label} ${n}?`, s === 'banned' ? 'They will be signed out and their open requests will be cancelled.' : 'They will be able to use their account.', label, s === 'banned')) return;
  try { await api('/users/' + el.dataset.id, { method: 'PATCH', body: { status: s } }); toast(label + ' done.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
};
ACT['u-del'] = async el => {
  if (!await confirmBox('Delete ' + el.dataset.n + '?', 'This permanently deletes the account, its requests and notifications. This cannot be undone.', 'Delete', true)) return;
  try { await api('/users/' + el.dataset.id, { method: 'DELETE' }); toast('User deleted.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
};

/* ---------- requests ---------- */
const needRows = list => list.length ? list.map(x => x.stage === 'none'
  ? `<div class="need"><span class="bgtag">${esc(x.patient_bg || '—')}</span><div class="grow"><b>${esc(x.name)}</b><span class="muted small">${x.ward ? esc(x.ward) + ' • ' : ''}${x.bht_no ? esc(x.bht_no) + ' • ' : ''}${tel(x.phone)}</span></div><span class="muted small">No open request</span>
     <div class="nb"><button class="btn sm" data-act="r-new" data-p="${x.patient_id}">Request blood</button></div></div>`
  : `<div class="need"><span class="bgtag">${esc(x.blood_group)}</span><div class="grow"><b>${esc(x.name)}</b> ${urg(x.urgency)}<span class="muted small">${x.units} unit${x.units > 1 ? 's' : ''} needed${x.ward ? ' • ' + esc(x.ward) : ''}${x.bht_no ? ' • ' + esc(x.bht_no) : ''} • ${esc(x.phone || '')}</span></div>
  ${x.stage === 'review' ? badge('review', 'Not sent yet') : x.stage === 'alerted' ? badge('alerted', Number(x.secured) ? `${x.secured}/${x.units} agreed` : 'Donors alerted') : badge('Accepted')}
  <div class="nb">${x.status === 'Pending' ? alertBtns(x) : ''}<button class="btn gray sm" data-act="need-pick" data-c="${esc(x.code)}">Show</button></div></div>`).join('')
  : '<div class="empty">No patient has signed up yet.</div>';
ACT['need-pick'] = el => { location.hash = '#/requests?q=' + encodeURIComponent(el.dataset.c); };
function wireNeed() {
  const i = $('#need-q'); if (!i) return;
  let seq = 0;
  i.addEventListener('input', debounce(async () => {
    const id = ++seq;
    try { const { patients } = await api('/patients/search?q=' + encodeURIComponent(i.value.trim())); if (id !== seq) return;
      $('#need-list').innerHTML = i.value.trim() && !patients.length ? '<div class="empty">No patient matches this search.</div>' : needRows(patients);
      $('#need-n').textContent = patients.length + ' shown'; } catch (e) { toast(e.message, 'err'); }
  }, 300));
}
PAGES['/requests'] = async q => {
  const stageQ = ['review', 'alerted'].includes(q.status);
  const need = (await api('/patients/search')).patients;
  const r = await api('/requests?' + (stageQ ? `stage=${q.status}&` : '') + qsOf(stageQ ? { ...q, status: '' } : q, ['q', 'status', 'urgency', 'bg', 'flagged', 'page']));
  const o = (v, cur, l) => `<option value="${v}" ${v === (cur || '') ? 'selected' : ''}>${l}</option>`;
  return { html: `<div class="bar" style="justify-content:space-between;margin:0"><h1 class="title" style="margin:0">Blood Requests</h1><button class="btn" data-act="r-new">+ New blood request</button></div><p class="sub">Create a request for a patient, alert the matching donors, then confirm each donation when the donor has given blood.</p>
   <div class="card" style="margin-bottom:14px"><div class="bar" style="margin:0 0 8px;justify-content:space-between"><b>Find a patient who needs blood</b><span class="muted small" id="need-n">${need.length} shown</span></div>
   <input type="search" id="need-q" placeholder="Type patient name, phone, ward, BHT no. or blood group" aria-label="Search patients" style="width:100%"><div class="needlist" id="need-list">${needRows(need)}</div></div>
   <div class="bar"><input type="search" name="f_q" value="${esc(q.q || '')}" placeholder="Search code, ward, patient" aria-label="Search requests">
   <select name="f_status" aria-label="Status">${o('', q.status, 'Any status')}${o('review', q.status, 'Not yet sent to donors')}${o('alerted', q.status, 'Donors alerted')}${['Pending', 'Accepted', 'Completed', 'Declined', 'Cancelled', 'Expired'].map(s => o(s, q.status, stLabel(s))).join('')}</select>
   <select name="f_urgency" aria-label="Urgency">${o('', q.urgency, 'Any urgency')}${['Normal', 'Urgent', 'Emergency'].map(s => o(s, q.urgency, s)).join('')}</select>
   <select name="f_bg" aria-label="Blood group">${o('', q.bg, 'Any group')}${BG.map(g => o(g, q.bg, g)).join('')}</select>
   <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="f_flagged" ${q.flagged === '1' ? 'checked' : ''}> Flagged only</label></div>
   <div class="bar"><button class="btn danger sm" data-act="clean" data-m="expired">Delete expired / cancelled / declined</button><button class="btn danger sm" data-act="clean" data-m="flagged">Delete flagged (spam)</button></div>
   <div class="card">${r.requests.length ? `<div class="tablewrap"><table><thead><tr><th>Request</th><th>Blood</th><th>Urgency</th><th>Patient</th><th>Donors</th><th>Status</th><th></th></tr></thead><tbody>
   ${r.requests.map(x => `<tr><td class="nm" data-l="Request"><b>${esc(x.code)}</b>${x.flagged ? ' <span class="flag">⚑ flagged</span>' : ''}<span class="muted small">${fmt(x.created_at)} • ${x.units} unit${x.units > 1 ? 's' : ''}</span></td><td data-l="Blood"><span class="bgtag">${x.blood_group}</span></td><td data-l="Urgency">${urg(x.urgency)}</td>
   <td data-l="Patient">${esc(x.requester)}<span class="muted small">${esc(x.requester_phone || '')}${x.ward ? ' • ' + esc(x.ward) : ''}</span></td>
   <td data-l="Donors">${x.broadcast_at ? `<b>${x.donated}</b> donated · <b>${x.secured}</b> of ${x.units} agreed<span class="muted small">${x.broadcast_count} alerted</span>
     ${x.donors.map(d => d.state === 'donated' ? `<div class="small">✓ ${esc(d.name)} <span class="muted">${tel(d.phone)}</span></div>` : `<div class="small" style="margin-top:4px">${esc(d.name)} <span class="muted">${tel(d.phone)}</span>${etaTag(d.eta)} <button class="btn ok sm" data-act="d-conf" data-id="${x.id}" data-d="${d.id}" data-n="${esc(d.name)}">Donated</button> <button class="btn gray sm" data-act="d-no" data-id="${x.id}" data-d="${d.id}" data-n="${esc(d.name)}">Didn’t come</button></div>`).join('')}` : '<span class="muted">Not sent yet</span>'}</td>
   <td data-l="Status">${x.stage === 'review' ? badge('review', 'Not sent yet') : x.stage === 'alerted' ? badge('alerted', x.secured ? `${x.secured}/${x.units} agreed` : 'Donors alerted') : badge(x.status)}</td>
   <td class="act">${x.status === 'Pending' ? alertBtns(x) : ''}${['Pending', 'Accepted'].includes(x.status) && x.broadcast_at ? `<button class="btn gray sm" data-act="r-wa" data-id="${x.id}">WhatsApp</button>` : ''}${['Pending', 'Accepted'].includes(x.status) && x.secured ? `<button class="btn ok sm" data-act="r-ful" data-id="${x.id}" data-c="${esc(x.code)}">Mark fulfilled</button>` : ''}
   
<button class="btn gray sm" data-act="r-flag" data-id="${x.id}" data-f="${x.flagged ? 0 : 1}">${x.flagged ? 'Unflag' : 'Flag'}</button><button class="btn danger sm" data-act="r-del" data-id="${x.id}" data-c="${esc(x.code)}">Delete</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No requests match these filters.</div>'}${pager(r, '/requests?' + qsOf(q, ['q', 'status', 'urgency', 'bg', 'flagged']))}</div>`,
    mount: () => { wireFilters('/requests', ['q', 'status', 'urgency', 'bg', 'flagged']); wireNeed(); } };
};
ACT['r-wa'] = async el => {
  let d; try { d = await api(`/requests/${el.dataset.id}/wa-donors`); } catch (e) { return toast(e.message, 'err'); }
  const q = d.request, text = `Blood Donor Finder: ${q.urgency === 'Emergency' ? 'URGENT. ' : ''}${q.units} unit${q.units > 1 ? 's' : ''} of ${q.blood_group} blood needed at ${q.hospital}${q.ward ? ' (' + q.ward + ')' : ''}. Please open ${location.origin} and accept or decline. Thank you.`;
  const wa = p => { let n = String(p || '').replace(/\D/g, ''); if (/^0\d{9}$/.test(n)) n = '94' + n.slice(1); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : ''; };
  const rows = d.donors.map(x => `<div class="small" style="display:flex;justify-content:space-between;gap:8px;margin:6px 0"><span>${esc(x.name)} <span class="muted">${tel(x.phone)} · ${x.state === 'accepted' ? 'agreed' : 'not replied'}</span>${etaTag(x.eta)}</span><a class="btn ok sm" target="_blank" rel="noopener" href="${wa(x.phone)}" onclick="this.textContent='Opened ✓'">WhatsApp</a></div>`).join('');
  await dialog({ title: `WhatsApp: ${q.code}`, text: 'Tap WhatsApp next to a donor. WhatsApp opens with the message ready; just press Send.', html: `<div style="max-height:50vh;overflow:auto">${rows || '<p class="muted">No donors to message yet.</p>'}</div>`, cancel: 'Close', hideConfirm: true });
};
ACT['r-ful'] = async el => { if (!await confirmBox(`Mark ${el.dataset.c} as fulfilled?`, 'The patient and the confirmed donors are notified, and the donors’ donation date is recorded.', 'Mark fulfilled')) return; try { await api('/requests/' + el.dataset.id, { method: 'PATCH', body: { status: 'Completed' } }); toast('Marked as fulfilled.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); } };
ACT['r-flag'] = async el => { try { await api('/requests/' + el.dataset.id, { method: 'PATCH', body: { flagged: el.dataset.f === '1' } }); render(); } catch (e) { toast(e.message, 'err'); } };
ACT['r-del'] = async el => { if (!await confirmBox(`Delete ${el.dataset.c}?`, 'This removes the request permanently.', 'Delete', true)) return; try { await api('/requests/' + el.dataset.id, { method: 'DELETE' }); toast('Request deleted.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); } };
ACT.clean = async el => {
  const m = el.dataset.m;
  if (!await confirmBox(m === 'expired' ? 'Delete all expired, cancelled and declined requests?' : 'Delete all flagged requests?', 'This cannot be undone.', 'Delete', true)) return;
  try { const r = await api('/requests/cleanup', { method: 'POST', body: { mode: m } }); toast(`${r.removed} request${r.removed === 1 ? '' : 's'} deleted.`, 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
};

/* ---------- reports ---------- */
PAGES['/reports'] = async q => {
  const st = q.status === 'resolved' ? 'resolved' : 'open', { reports } = await api('/reports?status=' + st);
  return { html: `<h1 class="title">Reports</h1><p class="sub">Complaints from users about profiles and requests.</p>
   <div class="tabs"><a class="${st === 'open' ? 'on' : ''}" href="#/reports">Open</a><a class="${st === 'resolved' ? 'on' : ''}" href="#/reports?status=resolved">Resolved</a></div>
   <div class="card">${reports.length ? reports.map(p => `<div class="rep"><div><b>${p.request_code ? 'Request ' + esc(p.request_code) : 'Profile'}</b> reported by <b>${esc(p.reporter || 'a deleted user')}</b> <span class="muted small">• ${fmt(p.created_at)}</span></div>
    <div>Against: <b>${esc(p.target || 'deleted user')}</b> ${p.target_email ? `<span class="muted small">(${esc(p.target_email)})</span>` : ''} ${p.target_status ? badge(p.target_status) : ''}</div><div style="background:#FAF5F6;border-radius:10px;padding:10px 12px">${esc(p.reason)}</div>
    ${st === 'open' ? `<div class="bar" style="margin:0"><button class="btn gray sm" data-act="rp" data-id="${p.id}" data-a="dismiss">Dismiss</button>${p.target_user_id ? `<button class="btn danger sm" data-act="rp" data-id="${p.id}" data-a="ban">Ban user</button>` : ''}${p.request_id ? `<button class="btn danger sm" data-act="rp" data-id="${p.id}" data-a="delete_request">Delete request</button>` : ''}</div>` : `<div class="muted small">Resolved ${fmt(p.resolved_at)}</div>`}</div>`).join('') : `<div class="empty">No ${st} reports. 🎉</div>`}</div>` };
};
ACT.rp = async el => {
  const a = el.dataset.a, msg = { dismiss: 'Dismiss this report?', ban: 'Ban the reported user and resolve this report?', delete_request: 'Delete the reported request and resolve this report?' }[a];
  if (!await confirmBox(msg, '', 'Yes, continue', a !== 'dismiss')) return;
  try { await api('/reports/' + el.dataset.id, { method: 'PATCH', body: { action: a } }); toast('Report resolved.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
};

/* ---------- announcements ---------- */
PAGES['/announcements'] = async () => {
  const { campaigns } = await api('/campaigns');
  return { html: `<h1 class="title">Announcements</h1><p class="sub">Send campaigns (for example World Blood Donor Day) to users as in-app notifications.</p>
   <div class="grid g2"><form class="card" id="cf"><b>New announcement</b><div class="formerr" style="margin-top:8px"></div>
    <label class="field" style="margin-top:10px"><span>Title</span><input name="title" maxlength="100" required placeholder="Campaign: World Blood Donor Day"></label>
    <label class="field"><span>Message</span><textarea name="body" maxlength="400" required placeholder="Join us and make a difference in someone's life."></textarea></label>
    <label class="field"><span>Send to</span><select name="audience"><option value="donors">All donors</option><option value="patients">Patients / families</option><option value="all">Everyone</option></select></label>
    <button class="btn">Send announcement</button></form>
   <div class="card"><b>Sent announcements</b>${campaigns.length ? campaigns.map(c => `<div class="rep"><div><b>${esc(c.title)}</b> <span class="badge b-grey">${esc(c.audience)}</span></div><div class="muted">${esc(c.body)}</div><div class="bar" style="margin:0;justify-content:space-between"><span class="muted small">${fmt(c.created_at)} • delivered to ${c.sent_to}</span><button class="btn danger sm" data-act="c-del" data-id="${c.id}">Remove from history</button></div></div>`).join('') : '<div class="empty">Nothing sent yet.</div>'}</div></div>` };
};
document.addEventListener('submit', async e => {
  if (e.target.id !== 'cf') return; e.preventDefault(); const f = e.target, b = $('button', f); b.disabled = true;
  try { const r = await api('/campaigns', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); toast(`Sent to ${r.sent} users.`, 'ok'); render(); }
  catch (ex) { $('.formerr', f).innerHTML = `<div class="e">${esc(ex.message)}</div>`; b.disabled = false; }
});
ACT['c-del'] = async el => { try { await api('/campaigns/' + el.dataset.id, { method: 'DELETE' }); render(); } catch (e) { toast(e.message, 'err'); } };

/* ---------- tools ---------- */
PAGES['/tools'] = async () => ({ html: `<h1 class="title">Tools &amp; Export</h1><p class="sub">Maintenance jobs and data downloads.</p>
  <div class="grid g2"><div class="card"><b>Availability reminders</b><p class="muted" style="margin:6px 0 12px">Reminds donors to update their availability. Runs automatically every month; use this to send now. Also sends WhatsApp messages when Twilio is configured.</p><button class="btn" data-act="t-rem">Send reminders now</button></div>
  <div class="card"><b>Expire stale requests</b><p class="muted" style="margin:6px 0 12px">Pending requests with no response become Expired (Emergency 2 days, Urgent 4 days, Normal 7 days). Runs automatically every hour.</p><button class="btn" data-act="t-exp">Run now</button></div>
  <div class="card"><b>Export users</b><p class="muted" style="margin:6px 0 12px">Download all non-admin users as a CSV file.</p><button class="btn out" data-act="export" data-k="users">Download users.csv</button></div>
  <div class="card"><b>Export requests</b><p class="muted" style="margin:6px 0 12px">Download all blood requests as a CSV file.</p><button class="btn out" data-act="export" data-k="requests">Download requests.csv</button></div>
  <div class="card"><b>Backup of all data</b><p class="muted" style="margin:6px 0 12px">Downloads everything (users, requests, donations, stock, logs) as one file. Keep it somewhere safe: it contains personal data and password hashes. A backup is also saved automatically every day in the <code>data/backups</code> folder when the site runs on your own computer/server. To restore: stop the server, then run <code>npm run restore -- path/to/file.json</code>.</p><button class="btn out" data-act="backup">Download backup now</button></div></div>` });
ACT['t-rem'] = async el => { el.disabled = true; try { const r = await api('/tools/reminders', { method: 'POST' }); toast(`Reminders sent to ${r.sent} donors.`, 'ok'); } catch (e) { toast(e.message, 'err'); } el.disabled = false; };
ACT['t-exp'] = async el => { el.disabled = true; try { const r = await api('/tools/expire', { method: 'POST' }); toast(`${r.expired} request(s) expired.`, 'ok'); } catch (e) { toast(e.message, 'err'); } el.disabled = false; };
ACT.backup = async el => {
  el.disabled = true;
  try { const r = await api('/backup', { raw: true }); const url = URL.createObjectURL(await r.blob()); const a = document.createElement('a'); a.href = url; a.download = 'blood-donor-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); toast('Backup downloaded. Keep it safe.', 'ok'); }
  catch (e) { toast(e.message, 'err'); }
  el.disabled = false;
};
ACT.export = async el => {
  try { const r = await api('/export/' + el.dataset.k + (el.dataset.q ? '?' + el.dataset.q : ''), { raw: true }); const url = URL.createObjectURL(await r.blob()); const a = document.createElement('a'); a.href = url; a.download = (el.dataset.name || el.dataset.k) + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  catch (e) { toast(e.message, 'err'); }
};

/* ---------- blood stock ---------- */
PAGES['/stock'] = async () => {
  const { stock } = await api('/stock');
  const low = stock.filter(x => x.units < x.min_units).length;
  return { html: `<h1 class="title">Blood Stock</h1><p class="sub">Units of blood available in the blood bank. Update it after each collection or issue; you get a warning when a group falls below its minimum.</p>
   ${low ? `<div class="alert err" style="margin-bottom:12px">${low} blood group${low > 1 ? 's are' : ' is'} below the minimum. Alert donors for those groups.</div>` : ''}
   <div class="card"><div class="tablewrap"><table><thead><tr><th>Blood group</th><th>Units</th><th>Minimum</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>${stock.map(x => `<tr><td data-l="Group"><b>${esc(x.blood_group)}</b></td><td data-l="Units"><b>${x.units}</b></td><td data-l="Minimum">${x.min_units}</td><td data-l="Status">${x.units < x.min_units ? '<span class="badge b-red">Low</span>' : x.units === x.min_units ? '<span class="badge b-amber">At minimum</span>' : '<span class="badge b-green">OK</span>'}</td><td data-l="Updated">${fmt(x.updated_at)}</td>
     <td class="act"><button class="btn gray sm" data-act="st-d" data-g="${esc(x.blood_group)}" data-v="-1">−1</button> <button class="btn ok sm" data-act="st-d" data-g="${esc(x.blood_group)}" data-v="1">+1</button> <button class="btn out sm" data-act="st-e" data-g="${esc(x.blood_group)}" data-u="${x.units}" data-m="${x.min_units}">Edit</button></td></tr>`).join('')}</tbody></table></div></div>` };
};
ACT['st-d'] = async el => { try { await api('/stock', { method: 'PUT', body: { blood_group: el.dataset.g, delta: +el.dataset.v } }); render(); } catch (e) { toast(e.message, 'err'); } };
ACT['st-e'] = async el => {
  const v = await dialog({ title: `Stock: ${el.dataset.g}`, confirm: 'Save', html: `<div class="two"><label class="field"><span>Units in stock</span><input name="units" type="number" min="0" max="9999" value="${esc(el.dataset.u)}" required></label><label class="field"><span>Warn below</span><input name="min_units" type="number" min="0" max="9999" value="${esc(el.dataset.m)}" required></label></div>` });
  if (!v) return;
  try { await api('/stock', { method: 'PUT', body: { blood_group: el.dataset.g, units: v.units, min_units: v.min_units } }); toast('Stock saved.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
};

/* ---------- monthly report (print as PDF or download for Excel) ---------- */
PAGES['/summary'] = async q => {
  const r = await api('/report' + (q.month ? '?month=' + encodeURIComponent(q.month) : ''));
  const label = new Date(r.month + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const kpi = (l, v) => `<div class="card kpi"><small>${l}</small><b>${v}</b></div>`;
  const list = rows => rows.length ? rows.map(x => `<div class="small" style="display:flex;justify-content:space-between;padding:3px 0"><span>${esc(x.k)}</span><b>${x.c}</b></div>`).join('') : '<span class="muted small">No data</span>';
  return {
    html: `<div class="bar noprint" style="justify-content:space-between;margin:0"><h1 class="title" style="margin:0">Monthly Report</h1><div class="bar" style="margin:0"><input type="month" id="rmonth" value="${esc(r.month)}" max="${new Date().toISOString().slice(0, 7)}" style="width:auto"><button class="btn out" data-act="export" data-k="report" data-q="month=${esc(r.month)}" data-name="report-${esc(r.month)}">Download for Excel</button><button class="btn" data-act="print">Print / Save as PDF</button></div></div>
    <p class="sub">${esc(label)} · Batticaloa Hospital Blood Bank</p>
    <div class="grid g4">${kpi('Blood requests', r.requests)}${kpi('Units requested', r.units_requested)}${kpi('Donations recorded', r.donations)}${kpi('New donors', r.new_donors)}</div>
    <div class="card" style="margin-top:14px"><b>By blood group</b><div class="tablewrap"><table><thead><tr><th>Blood group</th><th>Requests</th><th>Units requested</th><th>Donations</th></tr></thead><tbody>${r.by_blood_group.map(x => `<tr><td><b>${esc(x.blood_group)}</b></td><td>${x.requests}</td><td>${x.units_requested}</td><td>${x.donations}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="grid g2" style="margin-top:14px"><div class="card"><b>Requests by status</b><div style="margin-top:6px">${list(r.by_status)}</div></div><div class="card"><b>Requests by urgency</b><div style="margin-top:6px">${list(r.by_urgency)}</div></div></div>
    <div class="card" style="margin-top:14px"><b>Top donors this month</b><div style="margin-top:6px">${r.top_donors.length ? r.top_donors.map(x => `<div class="small" style="display:flex;justify-content:space-between;padding:3px 0"><span>${esc(x.name)} <span class="muted">${esc(x.blood_group || '')}</span></span><b>${x.c}</b></div>`).join('') : '<span class="muted small">No donations recorded this month.</span>'}</div></div>`,
    mount: () => { const m = $('#rmonth'); if (m) m.onchange = () => { if (m.value) location.hash = '#/summary?month=' + m.value; }; }
  };
};
ACT.print = () => window.print();

/* ---------- logs & settings ---------- */
PAGES['/logs'] = async () => {
  const { logs } = await api('/logs');
  return {
    html: `<h1 class="title">Activity Log</h1><p class="sub">What the blood bank team and the system did (latest ${logs.length}).</p>
    <div class="card"><div class="bar" style="margin:0 0 10px"><input id="logq" type="search" placeholder="Search admin, action or details…" style="max-width:360px"></div>${logs.length ? `<div class="tablewrap"><table id="logt"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead><tbody>${logs.map(l => `<tr><td data-l="When">${fmt(l.created_at)}</td><td data-l="Admin">${esc(l.admin_name)}</td><td data-l="Action"><b>${esc(l.action)}</b></td><td data-l="Details">${esc(l.detail || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty"><b>No activity yet</b></div>'}</div>`,
    mount: () => { const q = $('#logq'); if (q) q.oninput = () => { const t = q.value.toLowerCase(); $$('#logt tbody tr').forEach(tr => { tr.style.display = tr.textContent.toLowerCase().includes(t) ? '' : 'none'; }); }; }
  };
};
PAGES['/settings'] = async () => ({ html: `<h1 class="title">Settings</h1><p class="sub">Your admin account and team.</p>
  <div class="grid g2"><form class="card" id="pf"><b>Change password</b><div class="formerr" style="margin-top:8px"></div>
   <label class="field" style="margin-top:10px"><span>Current password</span><input type="password" name="current" required autocomplete="current-password"></label>
   <label class="field"><span>New password</span><input type="password" name="password" required autocomplete="new-password"><small class="muted">At least 8 characters with a letter and a number.</small></label><button class="btn">Update password</button></form>
  <form class="card" id="af"><b>Add another administrator</b><div class="formerr" style="margin-top:8px"></div>
   <label class="field" style="margin-top:10px"><span>Name</span><input name="name" required></label><label class="field"><span>Email</span><input type="email" name="email" required></label>
   <label class="field"><span>Phone</span><input name="phone" required></label><label class="field"><span>Password</span><input type="password" name="password" required autocomplete="new-password"></label><button class="btn">Create admin</button></form></div>` });
document.addEventListener('submit', async e => {
  const id = e.target.id; if (id !== 'pf' && id !== 'af') return; e.preventDefault();
  const f = e.target, b = $('button', f); b.disabled = true; $('.formerr', f).innerHTML = '';
  try { await api(id === 'pf' ? '/password' : '/admins', { method: id === 'pf' ? 'PUT' : 'POST', body: Object.fromEntries(new FormData(f)) }); toast(id === 'pf' ? 'Password updated.' : 'Administrator added.', 'ok'); f.reset(); }
  catch (ex) { $('.formerr', f).innerHTML = `<div class="e">${esc(ex.message)}</div>`; }
  b.disabled = false;
});

render();
