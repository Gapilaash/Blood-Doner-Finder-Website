/* Blood Donor Finder – core (helpers, API, router, layout) */
const CFG = window.APP_CONFIG || { API: '/api' };
const state = { user: null, token: localStorage.getItem('bdf_token'), meta: { bloodGroups: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], cities: [], reasons: [] } };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- icons ---------- */
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  cal: svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>'),
  bell: svg('<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  eye: svg('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'),
  check: svg('<path d="M4 12l5 5L20 6"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  heart: svg('<path d="M20.8 5.6a5.5 5.5 0 00-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 22l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
  phone: svg('<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>'),
  list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  mega: svg('<path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M15 9a4 4 0 010 6"/>'),
  msg: svg('<path d="M21 12a8 8 0 01-11.7 7L3 21l2-5.5A8 8 0 1121 12z"/>'),
  building: svg('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 8v6M9 11h6"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L16 9.5"/>'),
  bolt: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  drop: svg('<path d="M12 2.5S5 10.5 5 15a7 7 0 0014 0c0-4.5-7-12.5-7-12.5z"/>'),
  people: svg('<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M15.5 14.4c3.3-.5 6 1.4 6 4.6"/>'),
  chev: svg('<path d="M6 9l6 6 6-6"/>'),
  award: svg('<circle cx="12" cy="9" r="6"/><path d="M8.6 14.2L7 22l5-3 5 3-1.6-7.8"/>'),
  badgeok: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.7 2.7L16 9.5"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  hist: svg('<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>')
};
I.clock = svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
I.up = svg('<path d="M7 17L17 7M8 7h9v9"/>');

/* professional two-tone icons (used inside tiles) */
const GRAD = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
I.searchPro = `<svg class="pro-ic" viewBox="0 0 36 36" aria-hidden="true">${GRAD('gSearch', '#F2495A', '#A30B16')}
  <circle cx="15" cy="15" r="10" fill="#FFE3E6" stroke="url(#gSearch)" stroke-width="3.2"/>
  <path d="M15 8.6s-4.2 4.9-4.2 7.6a4.2 4.2 0 008.4 0c0-2.7-4.2-7.6-4.2-7.6z" fill="url(#gSearch)"/>
  <path d="M12.9 16.6a2.3 2.3 0 001.3 2" stroke="#fff" stroke-opacity=".7" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  <path d="M22.6 22.6L31 31" stroke="url(#gSearch)" stroke-width="4.4" stroke-linecap="round"/></svg>`;
const DROP = 'M20 3.2c-.5 0-.9.2-1.2.6C14.6 9 6.5 18.4 6.5 29a13.5 13.5 0 0027 0C33.5 18.4 25.4 9 21.2 3.8c-.3-.4-.7-.6-1.2-.6z';
// Animated blood drop: forms, falls, lands and sends out ripples (pure CSS, see .dropfall in style.css)
const hospName = () => (state.meta && state.meta.hospital && state.meta.hospital.name) || 'Batticaloa Hospital';
const dropFall = () => '<span class="dropfall" aria-hidden="true"><i class="df-drop"></i><i class="df-ring"></i><i class="df-ring r2"></i></span>';
const dropSvg = (c = '#C8102E') => `<svg viewBox="0 0 40 52" aria-hidden="true"><path d="${DROP}" fill="${c}"/><path d="M12.6 30.5a7.6 7.6 0 004.6 7" stroke="#fff" stroke-opacity=".5" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`;
const LG_DEFS = `<defs><linearGradient id="lgR" x1="8" y1="2" x2="32" y2="48" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#EF3B48"/><stop offset=".55" stop-color="#C8101E"/><stop offset="1" stop-color="#8E0812"/></linearGradient></defs>`;
const logoSvg = (c = '#B50E18', plus = '#fff') => {
  const brand = c === '#B50E18';
  return `<svg class="logo-mark" viewBox="0 0 40 52" aria-hidden="true">${brand ? LG_DEFS : ''}<path d="${DROP}" fill="${brand ? 'url(#lgR)' : c}"/>${brand ? '<path d="M12.2 26.5c.9-4.4 3.6-8.2 6.4-11.6" stroke="#fff" stroke-opacity=".38" stroke-width="2.4" fill="none" stroke-linecap="round"/>' : ''}<rect x="17.6" y="23" width="4.8" height="15" rx="1.6" fill="${plus}"/><rect x="12.5" y="28.1" width="15" height="4.8" rx="1.6" fill="${plus}"/></svg>`;
};
const pulseSvg = `<svg viewBox="0 0 40 52" aria-hidden="true"><path d="${DROP}" fill="#fff"/><path d="M10.5 31.5h5.2l2.4-5.4 3.7 10.2 2.7-4.8h5" stroke="#C8101E" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const bdrop = bg => { const g = esc(bg || ''), fs = g.length > 2 ? 15 : 19;
  return `<span class="bgtile transition duration-300 group-hover:scale-110" role="img" aria-label="Blood group ${g}"><svg viewBox="0 0 56 66" aria-hidden="true">${GRAD('gDrop', '#F04A5A', '#A50A17')}
  <path d="M28 3C28 3 7 26 7 42a21 21 0 0042 0C49 26 28 3 28 3z" fill="url(#gDrop)"/>
  <path d="M15.5 38c1.2-6 5-11.5 9-16.2" stroke="#fff" stroke-opacity=".45" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <text x="28" y="${g.length > 2 ? 49 : 50}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" letter-spacing="-.5">${g}</text></svg></span>`; };
const heroSvg = `<svg viewBox="0 0 320 340" role="img" aria-label="Blood drop held by caring hands">
<path d="M10 200h60l14-40 20 70 18-50 12 20h176" fill="none" stroke="#FFB3C4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M160 20C160 20 82 110 82 174a78 78 0 00156 0C238 110 160 20 160 20z" fill="#E1002D"/>
<path d="M162 40c-6 10-70 90-70 134a70 70 0 0035 60" fill="none" stroke="#FF6B87" stroke-width="10" stroke-linecap="round" opacity=".55"/>
<path d="M196 150a28 28 0 0112 38" stroke="#fff" stroke-opacity=".55" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M30 270c30-40 70-48 110-30l20 8 20-8c40-18 80-10 110 30-20 40-70 60-130 60S50 310 30 270z" fill="#FFD2B8"/>
<path d="M30 270c30-40 70-48 110-30l20 8" fill="none" stroke="#F4B391" stroke-width="3"/>
<path d="M58 118c-10-14-30-6-26 12 3 12 26 26 26 26s23-14 26-26c4-18-16-26-26-12z" fill="#FF4D6D"/>
<path d="M270 98c-8-11-23-5-20 9 2 9 20 20 20 20s18-11 20-20c3-14-12-20-20-9z" fill="#FF4D6D"/></svg>`;
const googleSvg = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;

/* ---------- helpers ---------- */
const utc = s => new Date(String(s).replace(' ', 'T') + 'Z');
const ago = s => {
  if (!s) return ''; const sec = Math.max(0, (Date.now() - utc(s)) / 1000);
  if (sec < 60) return 'Just now'; if (sec < 3600) return Math.floor(sec / 60) + ' min ago';
  if (sec < 86400) return Math.floor(sec / 3600) + ' hrs ago'; if (sec < 86400 * 30) return Math.floor(sec / 86400) + ' days ago';
  return utc(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDate = s => { if (!s) return '—'; const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : utc(s); return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtDateTime = s => utc(s).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const since = s => {
  if (!s) return 'Never donated'; const d = Math.floor((Date.now() - new Date(s + 'T00:00:00')) / 864e5);
  if (d <= 0) return 'Today'; if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
  if (d < 365) { const m = Math.floor(d / 30); return m + (m === 1 ? ' month ago' : ' months ago'); }
  const y = Math.floor(d / 365); return y + (y === 1 ? ' year ago' : ' years ago');
};
const COLORS = ['#475569', '#0F766E', '#1D4ED8', '#6D28D9', '#B45309', '#BE123C', '#0E7490', '#4D7C0F'];
const avatar = (name, size = 44) => {
  let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const ini = String(name).trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${size * .38}px;background:${COLORS[h % COLORS.length]}">${esc(ini)}</span>`;
};
const BADGE = { Pending: 'b-amber', Accepted: 'b-green', Completed: 'b-grey', Declined: 'b-red', Filled: 'b-grey', Cancelled: 'b-grey', Expired: 'b-grey', Available: 'b-green', Unavailable: 'b-grey', New: 'b-green' };
const BICON = { Pending: 'clock', Accepted: 'check', Completed: 'check', Declined: 'x', Cancelled: 'x' };
const badge = (t, cls) => `<span class="badge ${cls || BADGE[t] || 'b-grey'}">${BICON[t] ? I[BICON[t]] : ''}${esc(t)}</span>`;
const loc = u => [u.city, u.state].filter(Boolean).join(', ');
const cityList = () => `<datalist id="cities">${state.meta.cities.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
const bgOptions = (sel, ph = 'Select blood group') => `<option value="">${ph}</option>` + state.meta.bloodGroups.map(g => `<option ${g === sel ? 'selected' : ''}>${g}</option>`).join('');
const SITE = { email: 'contact@blooddonor.lk' }; // edit contact details shown in the header/footer
const provinceOptions = (sel, ph = 'Select province') => {
  const list = state.meta.provinces || []; const extra = sel && !list.includes(sel) ? [sel] : [];
  return `<option value="">${ph}</option>` + [...list, ...extra].map(p => `<option ${p === sel ? 'selected' : ''}>${esc(p)}</option>`).join('');
};
const loading = () => `<div aria-label="Loading" role="status"><div class="animate-pulse space-y-5">
  <div class="h-8 w-56 rounded-lg bg-slate-200"></div><div class="h-4 w-80 max-w-full rounded bg-slate-200"></div>
  <div class="grid grid-cols-3 gap-4 pt-2"><div class="h-24 rounded-xl bg-slate-200"></div><div class="h-24 rounded-xl bg-slate-200"></div><div class="h-24 rounded-xl bg-slate-200"></div></div>
  <div class="h-28 rounded-xl bg-slate-200"></div><div class="h-28 rounded-xl bg-slate-200"></div></div></div>`;

function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; t.setAttribute('role', 'status');
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3800);
}
function modal({ title, text = '', confirm = 'Confirm', cancel = 'Cancel', danger = false, input = null, icon = '' }) {
  return new Promise(resolve => {
    const root = $('#modal-root');
    root.innerHTML = `<div class="overlay" role="dialog" aria-modal="true" aria-label="${esc(title)}"><form class="modal neon" style="text-align:${icon ? 'center' : 'left'}">
      ${icon ? `<div style="width:44px;margin:0 auto 10px">${icon}</div>` : ''}<h3>${esc(title)}</h3><p>${esc(text)}</p>
      ${input && input.type === 'select' ? `<label class="field"><span>${esc(input.label || '')}</span><select name="v">${input.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label><div style="height:14px"></div>` : input ? `<label class="field"><span>${esc(input.label || '')}</span><input name="v" type="${input.type || 'text'}" placeholder="${esc(input.placeholder || '')}" ${input.required === false ? '' : 'required'} ${input.maxlength ? 'maxlength=' + input.maxlength : ''} autocomplete="off"></label><div style="height:14px"></div>` : ''}
      <div class="stack"><button class="btn" type="submit" ${danger ? 'style="background:#9B1C1C;border-color:#9B1C1C"' : ''}>${esc(confirm)}</button><button class="btn out" type="button" data-x>${esc(cancel)}</button></div></form></div>`;
    const done = v => { root.innerHTML = ''; document.removeEventListener('keydown', esc_); resolve(v); };
    const esc_ = e => { if (e.key === 'Escape') done(false); };
    document.addEventListener('keydown', esc_);
    $('form', root).onsubmit = e => { e.preventDefault(); done(input ? e.target.v.value : true); };
    $('[data-x]', root).onclick = () => done(false);
    $('.overlay', root).onclick = e => { if (e.target.classList.contains('overlay')) done(false); };
    const f = $('input', root) || $('button', root); f && f.focus();
  });
}

/* ---------- API ---------- */
async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = 'Bearer ' + state.token;
  let r;
  try { r = await fetch(CFG.API + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('Cannot reach the server. Check your connection and try again.'); }
  let j = {}; try { j = await r.json(); } catch { }
  if (r.status === 401 && state.token) { logout(true); throw new Error(j.error || 'Please log in again.'); }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Something went wrong.'), { status: r.status });
  return j;
}
function setSession(token, user) { state.token = token; state.user = user; localStorage.setItem('bdf_token', token); }
function logout(expired) {
  state.token = null; state.user = null; localStorage.removeItem('bdf_token');
  if (expired) toast('Session expired. Please log in again.', 'err');
  location.hash = '#/login';
}
async function refreshUser() { const r = await api('/me'); state.user = r.user; return r.user; }

/* ---------- router ---------- */
const ROUTES = [];
const route = (pattern, fn, opt = {}) => ROUTES.push({ re: new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$'), keys: (pattern.match(/:\w+/g) || []).map(k => k.slice(1)), fn, opt });
const go = p => { location.hash = '#' + p; };
let renderId = 0;
async function render() {
  const id = ++renderId;
  const raw = location.hash.slice(1) || '/', [path, qs] = raw.split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  let match = null, params = {};
  for (const r of ROUTES) { const m = path.match(r.re); if (m) { match = r; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1])); break; } }
  if (!match) return go('/');
  const u = state.user, o = match.opt;
  if (o.auth && !u) return go('/login?next=' + encodeURIComponent(raw));
  if (o.guest && u) return go('/home');
  if (Array.isArray(o.auth) && !o.auth.includes(u.role)) return go('/home');
  const ctx = { params, q, path, mount: null, shell: {} };
  $('#app').innerHTML = layout(loading(), ctx);
  let html;
  try { html = await match.fn(ctx); } catch (e) { html = `<div class="empty"><b>Something went wrong</b>${esc(e.message)}<div style="margin-top:14px"><a class="btn out sm" href="#/">Back to home</a></div></div>`; }
  if (id !== renderId) return;
  $('#app').innerHTML = layout(html, ctx);
  window.scrollTo(0, 0);
  ctx.mount && ctx.mount();
  document.title = (ctx.title ? ctx.title + ' – ' : '') + 'Blood Donor Finder';
}
function navFor(role) {
  if (role === 'donor') return [['/home', 'Home'], ['/requests', 'Requests'], ['/availability', 'Availability'], ['/history', 'History']];
  return [['/home', 'Home'], ['/requests', 'My Requests']];
}
function unreadDot() { const n = state.user ? state.user.unread : 0; return `<span class="dot" data-unread ${n ? '' : 'hidden'}>${n > 99 ? '99+' : n}</span>`; }
function layout(inner, ctx) {
  const u = state.user, p = ctx.path;
  const on = h => (h === '/' ? p === '/' : (p === h || p.startsWith(h + '/'))) ? 'on' : '';
  const guestNav = [['/', 'Home'], ['/can-donate', 'Can You Donate'], ['/about', 'About Us']];
  const nav = u ? navFor(u.role) : guestNav;
  const right = u
    ? `<a class="iconbtn" href="#/notifications" aria-label="Notifications">${I.bell}${unreadDot()}</a><details class="usermenu desk-only"><summary aria-label="Account menu">${avatar(u.name, 38)}<span class="um-chev">${I.chev}</span></summary><div class="um-pop" role="menu"><div class="um-who"><b>${esc(u.name)}</b><small>${esc(u.role[0].toUpperCase() + u.role.slice(1))}</small></div><a href="#/profile" role="menuitem">${I.user}My profile</a><a href="#/notifications" role="menuitem">${I.bell}Notifications</a><button type="button" data-act="logout" role="menuitem">${I.x}Log out</button></div></details>`
    : `<a class="btn out sm rect desk-only" href="#/role">Register</a><a class="btn sm rect" href="#/login">${I.user}Sign In</a>`;
  const tabs = u ? `<nav class="tabbar" aria-label="Main">
    <a href="#/home" class="${on('/home')}">${I.home}Home</a><a href="#/requests" class="${on('/requests') || on('/request')}">${I.cal}Requests</a>
    <a href="#/notifications" class="${on('/notifications')}">${I.bell}Notifications${unreadDot()}</a><a href="#/profile" class="${on('/profile')}">${I.user}Profile</a></nav>` : '';
  const full = (ctx.shell.pad || '').includes('full');
  return `<header class="topbar"><div class="topbar-in"><a class="logo" href="#/">${logoSvg()}<span class="logo-t"><b><i>Blood</i> Donor Finder</b><small>Give Blood. Save Lives.</small></span></a><span class="topbar-sep" aria-hidden="true"></span>
    <nav class="nav ${u ? '' : 'guest'}" aria-label="Sections">${nav.map(([h, t]) => `<a class="${on(h)}" href="#${h}">${t}</a>`).join('')}</nav>
    <div class="top-actions">${right}</div></div></header><main class="page ${ctx.shell.pad || ''}" id="main">${inner}</main>
  <footer class="footer ${full ? '' : 'mt'}"><div class="footer-in"><div><a class="logo" href="#/" style="color:#fff">${logoSvg('#fff', '#8F0A12')}<span class="logo-t"><b>Blood Donor Finder</b><small>Give Blood. Save Lives.</small></span></a>
    <p>Connecting blood donors with people in need across Sri Lanka. Every donation can save up to three lives.</p><b>24 &times; 7 &bull; 365 days</b></div>
    <div><h4>Other Links</h4><a href="#/">Home</a><a href="#/about">About Us</a><a href="#/can-donate">Can You Donate</a>${u ? '<a href="#/home">My Dashboard</a>' : '<a href="#/login">Login</a><a href="#/role">Register</a>'}</div>
    <div><h4>Contact Us</h4><span>Sri Lanka</span><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></div></div>
    <div class="footer-copy">&copy; ${new Date().getFullYear()} All rights reserved by Blood Donor Finder</div></footer>${tabs}`;
}
const pageHead = (title, back = true, sub = '') => `<div class="phead">${back ? `<button class="back" data-act="back" aria-label="Go back">${I.back}</button>` : ''}<div class="phead-t"><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div></div>`;

/* ---------- delegated events ---------- */
const ACT = {}, FORMS = {};
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a, e); return; }
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f || !FORMS[f.dataset.form]) return;
  e.preventDefault();
  const btn = $('button[type=submit]', f), err = $('.formerr', f), label = btn && btn.textContent;
  if (err) err.innerHTML = '';
  if (btn) { btn.disabled = true; btn.classList.add('loading'); btn.textContent = 'Please wait…'; }
  try { await FORMS[f.dataset.form](f, Object.fromEntries(new FormData(f))); }
  catch (ex) { if (err) { err.innerHTML = `<div class="alert err" role="alert">${esc(ex.message)}</div>`; err.scrollIntoView({ block: 'nearest' }); } else toast(ex.message, 'err'); }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.classList.remove('loading'); btn.textContent = label; } }
});
ACT.back = () => history.length > 1 ? history.back() : go('/home');
ACT.pw = el => { const i = el.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; };
ACT.logout = async () => { if (await modal({ title: 'Log out?', text: 'You will need to sign in again to use your account.', confirm: 'Log out' })) { logout(false); toast('You are logged out.'); } };
ACT.bgchip = el => {
  const box = el.closest('.chips'), hid = box.parentElement.querySelector('input[name=bg]');
  const same = el.classList.contains('on'); $$('.bgchip', box).forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
  if (!same) { el.classList.add('on'); el.setAttribute('aria-pressed', 'true'); hid.value = el.dataset.bg; } else hid.value = '';
};
ACT.seg = el => { const box = el.closest('.seg'); $$('button', box).forEach(b => b.classList.remove('on')); el.classList.add('on'); box.nextElementSibling.value = el.dataset.v; };
const chipsHtml = sel => `<div class="chips" role="group" aria-label="Blood group">${state.meta.bloodGroups.map(g => `<button type="button" class="bgchip ${g === sel ? 'on' : ''}" aria-pressed="${g === sel}" data-act="bgchip" data-bg="${g}">${g}</button>`).join('')}</div><input type="hidden" name="bg" value="${esc(sel || '')}">`;
const pwField = (name = 'password', label = 'Password', ph = 'Enter your password', auto = 'current-password') =>
  `<label class="field"><span>${label}</span><div class="pw"><input name="${name}" type="password" placeholder="${ph}" autocomplete="${auto}" required><button type="button" data-act="pw" aria-label="Show or hide password">${I.eye}</button></div></label>`;

window.addEventListener('hashchange', render);

/* unread badge polling */
function paintUnread() { $$('[data-unread]').forEach(d => { const n = state.user ? state.user.unread : 0; d.hidden = !n; d.textContent = n > 99 ? '99+' : n; }); }
setInterval(async () => { if (!state.token || document.hidden) return; try { const r = await api('/unread'); if (state.user && r.unread !== state.user.unread) { state.user.unread = r.unread; paintUnread(); } } catch { } }, 30000);

/* close the account menu on outside click / Esc / navigation */
document.addEventListener('click', e => { $$('.usermenu[open]').forEach(d => { if (!d.contains(e.target) || e.target.closest('.um-pop a,.um-pop button')) d.open = false; }); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.usermenu[open]').forEach(d => d.open = false); });


/* ================= motion ================= */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* count-up for dashboard / stat numbers */
function animateNumbers(root = document) {
  if (REDUCED) return;
  $$('.statx b, .stat b:not(.sm)', root).forEach(el => {
    const t = el.textContent.trim(); if (!/^\d+$/.test(t)) return;
    const n = +t; if (!n) return; const t0 = performance.now(), dur = 900;
    const tick = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); else el.textContent = n; };
    el.textContent = '0'; requestAnimationFrame(tick);
  });
}
new MutationObserver(() => { const a = document.getElementById('app'); if (a && !a.dataset.counted && a.querySelector('.statx b, .stat b')) { a.dataset.counted = '1'; animateNumbers(a); } else if (a && !a.querySelector('.statx b, .stat b')) delete a.dataset.counted; })
  .observe(document.getElementById('app'), { childList: true });

/* blood-drop ripple on every button press */
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn, .pill, .bgchip'); if (!b || REDUCED || b.disabled) return;
  const r = b.getBoundingClientRect(), s = document.createElement('span'), size = Math.max(r.width, r.height) * 1.6;
  s.className = 'ripple'; s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 650);
});
