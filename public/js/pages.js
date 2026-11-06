/* Blood Donor Finder – pages */
const PHOTO_NURSE = `<figure class="side-photo nurse"><img src="/img/nurse.jpg" alt="Friendly nurse in blue scrubs" loading="lazy" width="468" height="703"><figcaption><b>Give Blood. Save Lives.</b><small>Trained staff look after every donor.</small></figcaption></figure>`;
const PHOTO_LAB = `<figure class="side-photo lab"><img src="/img/lab.jpg" alt="Lab professional holding a blood sample tube" loading="lazy" width="799" height="640"><figcaption><b>Every sample matters</b><small>Matching the right blood group saves time.</small></figcaption></figure>`;
const isDonor = () => state.user && state.user.role === 'donor';

/* ================= landing ================= */
let flowUid = 0;
const flowSvg = (dark = false) => {
  const id = 'vessel' + (++flowUid), d = 'M-20 40 C130 4 240 76 390 40 S640 4 790 40 S1040 76 1220 40';
  const cells = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const r = i % 2 ? 5 : 6.5;
    return `<g><ellipse rx="${r + 1.5}" ry="${r}" class="cell"/><ellipse rx="${r * .42}" ry="${r * .34}" class="cell-in"/><animateMotion dur="10s" begin="-${(i * 1.25).toFixed(2)}s" repeatCount="indefinite" rotate="auto"><mpath href="#${id}"/></animateMotion></g>`; }).join('');
  return `<div class="flow ${dark ? 'on-dark' : ''}" aria-hidden="true"><svg class="flow-svg" viewBox="0 0 1200 80" preserveAspectRatio="xMidYMid slice"><path id="${id}" d="${d}" class="v-wall"/><path d="${d}" class="v-lumen"/><path d="${d}" class="v-flow"/><g class="cells">${cells}</g></svg></div>`;
};
function revealOnScroll() {
  const els = $$('.reveal'), counters = $$('[data-count]');
  const run = el => { el.classList.add('in'); $$('[data-count]', el).forEach(count); };
  const count = el => { const n = Number(el.dataset.count); if (!n || matchMedia('(prefers-reduced-motion: reduce)').matches) return; const t0 = performance.now(), dur = 1100;
    const tick = t => { const k = Math.min(1, (t - t0) / dur), v = Math.round(n * (1 - Math.pow(1 - k, 3))); el.textContent = v.toLocaleString(); if (k < 1) requestAnimationFrame(tick); }; el.textContent = '0'; requestAnimationFrame(tick); };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .15 });
  els.forEach(el => io.observe(el));
}

const FEATURES = [['Patient dashboard', 'Patients of the hospital see their blood status and who donated blood for them.'], ['Blood bank decides', 'The blood bank team knows who needs blood and sends the requests, not the patients.'], ['Alerts to matching donors', 'Every compatible, available donor gets a message at once.'], ['Donor registration', 'Register once so the hospital can reach you when your blood group is needed.']];
const TRUST = [[I.shield, 'Eligible donors', 'Ages 18–65 with a 90-day rest rule'], [I.badgeok, 'Confirmed by the hospital', 'The blood bank records every donation'], [I.lock, 'Your privacy', 'Phone numbers stay with the blood bank'], [I.bell, 'Instant alerts', 'All matching donors are messaged at once']];
const STEPS = [[I.user, 'Blood bank finds the need', 'The blood bank team sees which patient needs blood.'], [I.bell, 'Matching donors alerted', 'Every compatible donor gets a message and can accept.'], [I.heart, 'Donate and thank', 'Donors come to the hospital. The patient sees who donated.']];
const AUDIENCE = [[I.heart, 'Blood donors', 'Register once and get a message whenever the hospital needs your blood group.', 'Become a donor', '#/register/donor'], [I.people, 'Hospital patients', 'Sign up to follow your blood status and see the donors who helped you.', 'Patient sign up', '#/register/patient'], [I.building, 'Hospital blood bank', 'Choose the patient, alert every matching donor and record each donation.', 'Admin sign in', '/admin/']];
const faqs = () => [['Who can donate blood?', `Healthy adults aged 18–65 who weigh at least 50 kg and have waited ${state.meta.eligibilityDays || 90} days since their last donation. Use the “Can You Donate” checklist for a quick guide.`], ['How does a blood request work?', `The blood bank team at ${hospName()} knows which patients need blood. They send a request to every matching donor. You accept in the app and come to the hospital.`], ['I am a patient. Do I request blood here?', 'No. The blood bank team arranges everything for you. Your dashboard shows your blood status and the names of the donors who donated for you.'], ['Is my phone number public?', 'No. Phone numbers are visible only to the blood bank team.'], ['Does it cost anything?', 'No. Blood Donor Finder is free for donors and patients.']];
route('/', async ctx => {
  let st = null; try { st = await api('/public-stats'); } catch { }
  ctx.shell.pad = 'full'; const u = state.user;
  const kpi = (ic, n, t, d) => `<div class="kpi reveal group" style="--d:${d}s"><span class="ic-box lg transition duration-300 group-hover:scale-110 group-hover:-rotate-6">${ic}</span><div><b data-count="${Number(n)}">${Number(n).toLocaleString()}</b><small>${t}</small></div></div>`;
  ctx.mount = revealOnScroll;
  const stats = st ? `<section class="sect"><div class="sect-in"><div class="kpis">${kpi(I.people, st.donors, 'Registered donors', 0)}${kpi(I.badgeok, st.fulfilled, 'Requests fulfilled', .1)}${kpi(I.pin, st.cities, 'Cities covered', .2)}</div></div></section>` : '';
  return `<section class="hero2"><div class="hero2-in"><div class="hero2-copy">
      <p class="eyebrow2">${esc(hospName())} · Blood bank</p>
      <h1>Give blood at <em>${esc(hospName())}</em></h1>
      <p class="lead">The blood bank team knows which patients need blood and messages every matching donor. Patients follow their status and see who donated for them.</p>
      <div class="cta-row">${u ? '<a class="btn lg" href="#/home">Go to my dashboard</a>' : `<a class="btn lg" href="#/register/donor">${I.heart}Become a donor</a><a class="btn lg out" href="#/register/patient">${I.user}Patient sign up</a>`}</div>
      <ul class="hero-points"><li>${I.badgeok}Free for everyone</li><li>${I.badgeok}Donations confirmed by the hospital</li><li>${I.badgeok}Alerts to every matching donor</li></ul></div>
    <div class="hero2-photo" role="img" aria-label="A donor squeezing a stress ball while giving blood"><div class="df-card" aria-hidden="true">${dropFall()}<div><b>Every drop counts</b><small>One donation can help save up to 3 lives</small></div></div></div></div></section>
  <ul class="trust">${TRUST.map(([ic, t, d], i) => `<li class="reveal group" style="--d:${i * .08}s"><span class="ic transition duration-300 group-hover:-translate-y-1 group-hover:bg-brand group-hover:text-white">${ic}</span><div><b>${t}</b><small>${d}</small></div></li>`).join('')}</ul>
  ${flowSvg()}
  ${stats}
  <section class="promo"><div class="promo-in reveal"><div class="promo-frame"><video src="/video/blood-donor-day.mp4" poster="/video/poster.jpg" autoplay muted loop playsinline controls preload="metadata" aria-label="Donate blood, save lives"></video></div>
    <div class="promo-copy"><p class="eyebrow2">World Blood Donor Day</p><h2>Donate blood. Save lives.</h2><p>One bag of blood can help up to three people. Register as a donor and be the reason someone gets a second chance.</p><a class="btn" href="#/role">${I.drop}Become a donor</a></div></div></section>
  <section class="sect alt"><div class="sect-in"><div class="sect-head reveal"><h2>How it works</h2><p>From the hospital ward to a donation in three simple steps.</p></div>
    <ol class="steps3">${STEPS.map(([ic, t, d], i) => `<li class="step reveal group" style="--d:${i * .12}s"><span class="step-ic transition duration-300 group-hover:scale-110 group-hover:-rotate-6">${ic}<span class="num">${i + 1}</span></span><b>${t}</b><small>${d}</small></li>`).join('')}</ol></div></section>
  <section class="sect"><div class="sect-in"><div class="sect-head reveal"><h2>Built for everyone involved</h2><p>Whether you give blood, are a patient or run the blood bank, there is a place for you here.</p></div>
    <div class="aud">${AUDIENCE.map(([ic, t, d, cta, href], i) => `<article class="aud-card reveal group" style="--d:${i * .1}s"><span class="ic-box lg transition duration-300 group-hover:scale-110 group-hover:-rotate-6">${ic}</span><h3>${t}</h3><p>${d}</p><a class="aud-link" href="${href}">${cta}<span class="transition-transform duration-300 group-hover:translate-x-1">${I.arrow}</span></a></article>`).join('')}</div></div></section>
  <section class="sect alt"><div class="sect-in faq-wrap"><div class="sect-head left reveal"><h2>Common questions</h2><p>Quick answers before you register.</p><a class="btn out" href="#/can-donate" style="margin-top:18px">Check if you can donate</a></div>
    <div class="faq">${faqs().map(([q, a], i) => `<details class="faq-i group reveal" style="--d:${i * .06}s"><summary><span>${q}</span><span class="chev transition-transform duration-300 group-open:rotate-180">${I.chev}</span></summary><p>${a}</p></details>`).join('')}</div></div></section>
  <section class="band cta-band">${flowSvg(true)}<div class="wrap center reveal"><h2 class="h2">Every donation can save up to three lives</h2><p class="cta-sub">Donors are always welcome. Register once and get notified when your blood group is needed.</p>
    <a class="btn light lg" href="${u ? '#/availability' : '#/role'}">${u && isDonor() ? 'Update my availability' : 'Become a donor'}</a></div></section>`;
});

route('/about', async ctx => {
  ctx.title = 'About us';
  return `<div class="narrow" style="max-width:780px"><p class="kicker">About Us</p><h1 class="h2">Blood Donor Finder · ${esc(hospName())}</h1><img class="about-photo" src="/img/lab.jpg" alt="Lab professional holding a blood sample tube" loading="lazy" width="799" height="640">
  <p>Blood is needed every day for accidents, surgeries, cancer treatment, childbirth and long-term illnesses such as thalassaemia. Finding a matching donor quickly is hard when contacts are scattered across phones and social media.</p>
  <p style="margin-top:12px">Blood Donor Finder connects the patients of ${esc(hospName())} with voluntary donors. The blood bank team sees which patient needs blood and messages every compatible donor. Patients see who donated for them.</p>
  <h3 class="h3">Key Features</h3><ul class="feat">${FEATURES.map(([t, d]) => `<li><b>${t}:</b> ${d}</li>`).join('')}</ul>
  <h3 class="h3">Your privacy matters</h3><p>Phone numbers are visible only to the blood bank team. Patients see the names of the donors who helped them, and donors see only what they need to come to the hospital.</p>
  <h3 class="h3">Important</h3><p class="muted">This website helps the hospital reach donors quickly; blood is collected at the hospital blood bank. In an emergency also call the blood bank directly.</p>
  <div class="row wrap" style="margin-top:22px;gap:12px"><a class="btn" href="#/register/donor">Register as a donor</a><a class="btn out" href="#/register/patient">Patient sign up</a></div></div>`;
});

route('/can-donate', async ctx => {
  ctx.title = 'Can you donate?';
  const q = ['I am between 18 and 65 years old', 'I weigh at least 50 kg', 'I feel healthy today (no fever, cough, cold or infection)', `It has been at least ${state.meta.eligibilityDays} days since my last blood donation`, 'I have not had a tattoo, piercing or surgery in the last 6 months', 'I am not pregnant or breastfeeding', 'I am not taking antibiotics or other medication that a doctor said prevents donation'];
  return `<div class="narrow" style="max-width:780px"><p class="kicker">Can You Donate</p><h1 class="h2">Check if you can donate blood</h1><img class="about-photo nurse" src="/img/nurse.jpg" alt="Friendly nurse ready to help you donate" loading="lazy" width="468" height="703">
  <p class="muted">Tick every statement that is true for you today. This is a quick guide only - the blood bank's medical staff make the final decision.</p>
  <form class="card neon stack" data-form="eligibility" style="margin-top:16px">${q.map((t, i) => `<label class="check"><input type="checkbox" name="q${i}"> ${esc(t)}</label>`).join('')}
  <button class="btn" type="submit">Check</button><div id="eres" role="status"></div></form>
  <h3 class="h3">Good to know</h3><ul class="feat"><li>Donating takes about 10 minutes; the whole visit around an hour.</li><li>Drink plenty of water and eat a normal meal before you donate.</li><li>Rest and avoid heavy exercise for the rest of the day.</li><li>One donation can help up to three people.</li></ul>
  <div class="row wrap" style="margin-top:18px;gap:12px"><a class="btn" href="#/role">Register as a donor</a></div></div>`;
});
FORMS.eligibility = (f, d) => {
  const n = Object.keys(d).length, ok = n === 7;
  $('#eres').innerHTML = ok ? '<div class="alert ok">You look eligible to donate. Register as a donor so people can reach you.</div>' : `<div class="alert warn">You ticked ${n} of 7. Please wait or speak to a blood bank doctor before donating.</div>`;
};


/* ---------- dashboard building blocks ---------- */
const heartArt = `<svg class="dash-art" viewBox="0 0 260 120" aria-hidden="true">
  <defs><linearGradient id="hDrop" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#F2495A"/><stop offset="1" stop-color="#A50A17"/></linearGradient></defs>
  <path class="ecg" pathLength="100" d="M6 64h86l12-22 16 46 14-34 8 10h112" fill="none" stroke="#E8606B" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="art-drop"><circle class="art-halo" cx="130" cy="62" r="46" fill="#fff" fill-opacity=".75"/>  <path d="M130 22S103 54 103 72a27 27 0 0054 0c0-18-27-50-27-50z" fill="url(#hDrop)"/>
  <path d="M117 70c1-10 6-19 13-27" stroke="#fff" stroke-opacity=".5" stroke-width="4.5" stroke-linecap="round" fill="none"/></g></svg>`;
const squiggle = `<svg class="squig" viewBox="0 0 150 10" aria-hidden="true"><path d="M2 7C30 1 70 1 148 6" fill="none" stroke="#C4121D" stroke-width="2.4" stroke-linecap="round"/></svg>`;
/* waving mascot: boy image for Male users, girl image for Female users (only the hand moves) */
const MASCOT = { male: { k: 'boy', alt: 'Waving boy' }, female: { k: 'girl', alt: 'Waving girl' } };
const mascot = u => {
  const m = MASCOT[String(u.gender || '').toLowerCase()];
  if (!m) return '';
  return `<div class="wave-mascot ${m.k}" role="img" aria-label="${m.alt}"><img class="wm-base" src="/img/${m.k}-base.webp" alt="" width="400" height="400" decoding="async"><img class="wm-hand" src="/img/${m.k}-hand.webp" alt="" decoding="async"></div>`;
};
const dashHead = (u, sub, actions) => `<div class="dash-head"><div class="dash-hi${mascot(u) ? ' has-mascot' : ''}">${mascot(u)}<div class="dash-hi-t"><h1>Hello, ${esc(u.name.split(' ')[0])}</h1><p>${sub}</p></div></div><div class="dash-actions">${actions}</div></div>`;
const statx = (kind, ic, label, n, href = '#/requests') => `<a class="statx ${kind}" href="${href}"><div class="sv"><small>${label}</small><b>${n}</b></div></a>`;
const panelx = (title, ic, right, body, cls = '') => `<section class="panelx ${cls}"><header class="panelx-h"><h2>${title}</h2>${right ? `<span class="ph-r">${right}</span>` : ''}</header><div class="panelx-b">${body}</div></section>`;
const viewAll = `<a href="#/requests">View all</a>`;

/* ================= auth ================= */
route('/login', async ctx => {
  ctx.title = 'Log in'; ctx.shell.pad = 'dark'; ctx.mount = () => initGoogle(ctx.q.next);
  return `<div class="auth-split">${PHOTO_NURSE}<div class="authwrap auth-center"><form class="card neon round" data-form="login" data-next="${esc(ctx.q.next || '')}"><div class="formerr"></div>
      <div class="lock-badge" aria-hidden="true">${I.lock}</div>
      <h1 class="neon-title">Welcome</h1><p class="neon-sub">Login to continue your journey</p>
      <label class="field"><span>Email or phone number</span><input name="identifier" placeholder="Email or phone number" autocomplete="username" required></label>
      ${pwField()}
      <div class="auth-row"><a href="#/forgot">Forgot password?</a></div>
      <button class="btn" type="submit">Login</button>
      <p class="auth-switch">Don't have an account? <a class="switch-circle" href="#/role" aria-label="Create an account" title="Create an account">+</a></p></form>
    <div class="auth-alt"><div class="or">or</div><div id="gslot">${googleBtn()}</div><a class="auth-back" href="#/">← Back to home</a></div>
    <div class="dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div></div>`;
}, { guest: true });
const googleBtn = () => `<button type="button" class="gbtn" data-act="google">${googleSvg}Continue with Google</button>`;
ACT.google = () => toast('Google sign-in is not set up yet. Add GOOGLE_CLIENT_ID in the .env file (see README).', 'err');
function initGoogle(next) {
  if (!CFG.GOOGLE_CLIENT_ID) return;
  const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
  s.onload = () => {
    const slot = $('#gslot'); if (!slot || !window.google) return;
    google.accounts.id.initialize({ client_id: CFG.GOOGLE_CLIENT_ID, callback: async r => {
      try { const d = await api('/auth/google', { method: 'POST', body: { credential: r.credential } }); setSession(d.token, d.user); go(next || '/home'); toast('Welcome back, ' + d.user.name.split(' ')[0] + '!', 'ok'); }
      catch (e) { toast(e.message, 'err'); }
    } });
    slot.innerHTML = ''; google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', width: Math.min(360, slot.clientWidth || 360), text: 'continue_with' });
  };
  document.head.appendChild(s);
}
FORMS.login = async (f, d) => {
  const r = await api('/auth/login', { method: 'POST', body: d });
  setSession(r.token, r.user); toast('Welcome back, ' + r.user.name.split(' ')[0] + '!', 'ok');
  go(f.dataset.next || '/home');
};

let forgotStep = 1, forgotId = '';
route('/forgot', async ctx => {
  ctx.title = 'Reset password'; ctx.shell.pad = 'dark'; forgotStep = 1;
  return `<div class="authwrap">${pageHead('Reset password')}${forgotForm()}</div>`;
}, { guest: true });
function forgotForm(code = '') {
  return forgotStep === 1
    ? `<form class="card neon stack" data-form="forgot1"><div class="formerr"></div><p class="serif muted small">Enter your email or phone. We will generate a 6-digit code valid for 15 minutes.</p>
       <label class="field"><span>Email or phone number</span><input name="identifier" required autocomplete="username"></label><button class="btn" type="submit">Send reset code</button></form>`
    : `<form class="card neon stack" data-form="forgot2"><div class="formerr"></div>${code ? `<div class="alert info">Demo mode: your code is <b>${esc(code)}</b></div>` : '<p class="serif muted small">Enter the 6-digit code that was sent to you.</p>'}
       <label class="field"><span>6-digit code</span><input name="code" inputmode="numeric" maxlength="6" pattern="\\d{6}" required autocomplete="one-time-code"></label>
       ${pwField('password', 'New password', 'At least 8 characters, letters and numbers', 'new-password')}<button class="btn" type="submit">Change password</button></form>`;
}
FORMS.forgot1 = async (f, d) => { forgotId = d.identifier; const r = await api('/auth/forgot', { method: 'POST', body: d }); forgotStep = 2; f.outerHTML = forgotForm(r.devCode); };
FORMS.forgot2 = async (f, d) => { await api('/auth/reset', { method: 'POST', body: { ...d, identifier: forgotId } }); toast('Password changed. Please log in.', 'ok'); go('/login'); };

let pickedRole = 'donor';
route('/role', async ctx => {
  ctx.title = 'Create account'; ctx.shell.pad = 'dark'; if (!ctx.q.keep) pickedRole = 'donor';
  const roles = [['donor', 'Blood Donor', 'Save lives, be a hero', I.heart], ['patient', 'Patient / Family', 'Follow your blood status', I.user]];
  return `<div class="auth-split">${PHOTO_NURSE}<div class="authwrap">${pageHead('Create Your Account')}<p class="serif muted small" style="margin:-8px 0 14px;text-align:center">Choose your role to get started</p>
   <div class="stack" role="radiogroup" aria-label="Account type">${roles.map(([k, t, s, ic]) => `<button class="rolecard group ${k === pickedRole ? 'on' : ''}" role="radio" aria-checked="${k === pickedRole}" data-act="role" data-r="${k}"><span class="ri">${ic}</span><span><b>${t}</b><br><small class="muted">${s}</small></span></button>`).join('')}</div>
   <div class="form-actions"><button class="btn" data-act="next-role">Next</button></div><p class="center small muted" style="margin-top:12px">Already registered? <a href="#/login" style="font-weight:600">Log in</a></p></div></div>`;
}, { guest: true });
ACT.role = el => { pickedRole = el.dataset.r; $$('.rolecard').forEach(c => { const on = c === el; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); }); };
ACT['next-role'] = () => go('/register/' + pickedRole);

route('/register/:role', async ctx => {
  const role = ctx.params.role; if (!['donor', 'patient'].includes(role)) return go('/role');
  ctx.title = 'Register'; ctx.shell.pad = 'dark';
  const y = new Date().getFullYear(), td = new Date().toISOString().slice(0, 10);
  const title = { donor: 'Donor Registration', patient: 'Patient Registration', hospital: 'Hospital Registration' }[role];
  const hosp = role === 'hospital';
  return `<div class="authwrap">${pageHead(title)}${cityList()}
  <form class="card neon" data-form="register" data-role="${role}"><div class="formerr"></div>
   <label class="field"><span>${hosp ? 'Hospital name' : 'Full name'}</span><input name="name" placeholder="${hosp ? 'Hospital name' : 'Enter your name'}" required minlength="2" autocomplete="name"></label>
   <label class="field"><span>Email</span><input name="email" type="email" placeholder="Enter your email" required autocomplete="email"></label>
   <label class="field"><span>Phone number</span><input name="phone" type="tel" placeholder="e.g. +94 77 123 4567" required autocomplete="tel"><div class="hint">Never shown publicly. Only the blood bank team can see it.</div></label>
   ${hosp ? '<label class="field"><span>Hospital registration number</span><input name="license_no" placeholder="Used by admins to verify your hospital" required></label>' : `
   <label class="field"><span>Blood group</span><select name="blood_group" required>${bgOptions('')}</select></label>`}
   ${role === 'donor' ? `<div class="two"><label class="field"><span>Gender</span><select name="gender" required><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
   <label class="field"><span>Date of birth</span><input name="dob" type="date" required min="${y - 65}-01-01" max="${y - 18}-${td.slice(5)}"><div class="hint">Donors must be 18 to 65.</div></label></div>` : ''}
   ${role === 'patient' ? `<label class="field"><span>Gender (optional)</span><select name="gender"><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select></label>` : ''}
   ${role === 'patient' ? `<div class="two"><label class="field"><span>Ward / bed (optional)</span><input name="ward" maxlength="60" placeholder="e.g. Ward 7, Bed 12"></label><label class="field"><span>Hospital reg. no. / BHT (optional)</span><input name="bht_no" maxlength="40" placeholder="Helps the blood bank find you"></label></div>` : ''}
   <div class="two"><label class="field"><span>City</span><input name="city" list="cities" placeholder="e.g. Colombo" required autocomplete="off"></label>
   <label class="field"><span>Province</span><select name="state" required>${provinceOptions('')}</select></label></div>
   ${pwField('password', 'Password', 'At least 8 characters, letters and numbers', 'new-password')}
   ${hosp ? '<div class="alert warn" style="margin-top:14px">Hospital accounts are verified by an administrator before they can submit requests.</div>' : ''}
   <div class="form-actions"><button class="btn" type="submit">Save &amp; Continue</button></div></form></div>`;
}, { guest: true });
FORMS.register = async (f, d) => {
  const r = await api('/auth/register', { method: 'POST', body: { ...d, role: f.dataset.role } });
  setSession(r.token, r.user); toast('Account created. Welcome!', 'ok'); go('/home');
};

/* ================= home ================= */
route('/home', async ctx => {
  ctx.shell.pad = 'wide';
  ctx.title = 'Home'; await refreshUser(); const u = state.user;
  return u.role === 'donor' ? donorHome(u) : seekerHome(u);
}, { auth: true });

async function donorHome(u) {
  const [st, rq] = await Promise.all([api('/donor/stats'), api('/requests?status=Pending')]);
  const d = u.donor, recent = rq.requests.slice(0, 4);
  const status = d.eligible ? (d.is_available ? ['The hospital can alert you', 'b-green', 'Available'] : ['You will not be alerted', 'b-grey', 'Unavailable']) : [`Resting until ${fmtDate(d.next_eligible_date)}`, 'b-amber', 'Resting'];
  const items = recent.map(r => `<div class="card req"><div class="req-row group" data-go="/request/${r.id}">${bdrop(r.blood_group)}<div class="grow"><div class="req-top"><b>${esc(r.hospital)}, ${esc(r.city)}</b><a class="btn sm" href="#/request/${r.id}">Respond</a></div><div class="meta"><span class="mi">${I.user}${r.units} unit${r.units > 1 ? 's' : ''}</span>${r.urgency !== 'Normal' ? `<span class="chip ${r.urgency === 'Emergency' ? 'c-red' : 'c-amber'}"><i></i>${esc(r.urgency)}</span>` : ''}<span class="mi">${I.clock}${ago(r.created_at)}</span></div></div></div></div>`).join('');
  const tile = (h, ic, t) => `<a class="tile group" href="${h}"><span class="ic-box">${ic}</span>${t}</a>`;
  return `${dashHead(u, 'Thank you for being a donor. Your donation saves lives.', `<a class="btn out" href="#/availability">${I.cal}Update availability</a><a class="btn" href="#/requests?tab=Accepted">${I.check}My accepted requests</a>`)}
   <div class="statsx">${statx('red', I.bell, 'Incoming requests', st.incoming)}${statx('blue', I.check, 'Accepted', st.accepted, '#/requests?tab=Accepted')}${statx('green', I.heart, 'Donations', st.donations, '#/history')}</div>
   <div class="desk-2"><div>${panelx('Recent requests', I.hist, viewAll, recent.length ? `<div class="list">${items}</div>` : '<div class="empty"><b>No requests need you right now</b>The hospital will message you when your blood group is needed.</div>', 'bare')}</div>
   <div class="stack">${panelx('Your status', I.shield, '', `<div class="row" style="align-items:flex-start"><div class="grow"><b>${status[0]}</b><div class="small muted" style="margin-top:2px">${d.last_donation_date ? 'Last donation: ' + fmtDate(d.last_donation_date) : 'No donation recorded yet'}</div></div>${badge(status[2], status[1])}</div>`)}</div></div>`;
}
async function seekerHome(u) {
  const [rq, dn] = await Promise.all([api('/requests'), api('/patient/donations')]);
  const open = rq.requests.filter(r => ['Pending', 'Accepted'].includes(r.status));
  const need = open[0], hp = state.meta.hospital && state.meta.hospital.phone;
  const done = rq.requests.filter(r => r.status === 'Completed').length;
  const donors = dn.donations.length ? `<div class="list">${dn.donations.map(d => `<div class="item">${avatar(d.name, 44)}<div class="grow"><div class="t">${esc(d.name)}</div><div class="small muted">Blood group ${esc(d.blood_group)} • ${fmtDate(d.donated_at)} • ${esc(d.code)}</div></div>${badge('Completed', 'b-green')}</div>`).join('')}</div>`
    : '<div class="empty"><b>No donations yet</b>When a donor gives blood for you, their name appears here.</div>';
  const needCard = need ? `<div class="qcard"><div class="qc-top"><span class="bgflat">${esc(need.blood_group)}</span><div><b>${need.units} unit${need.units > 1 ? 's' : ''} of ${esc(need.blood_group)}</b><small>${esc(need.stage)}${need.ward ? ' • ' + esc(need.ward) : ''}</small></div></div>
      ${need.broadcast_at ? `<div class="small" style="margin:6px 0 10px">${need.donated} donated · ${need.secured} of ${need.units} donors agreed</div>` : '<div class="small muted" style="margin:6px 0 10px">The blood bank is arranging donors for you.</div>'}
      <a class="btn out wide" href="#/request/${need.id}">View details</a></div>`
    : `<div class="small muted">No blood is being arranged for you right now. If you need blood, please tell the blood bank team${hp ? ' (' + esc(hp) + ')' : ''}.</div>`;
  return `${dashHead(u, `The blood bank at ${esc(hospName())} finds donors for you. See who donated below.`, `<a class="btn out" href="#/requests">${I.hist}My requests</a>`)}
   <div class="statsx">${statx('red', I.heart, 'Donors who helped you', dn.total)}${statx('blue', I.drop, 'Open needs', open.length, '#/requests?tab=Pending')}${statx('green', I.check, 'Completed', done, '#/requests?tab=Completed')}</div>
   <div class="desk-2"><div>${panelx('Donors who donated for you', I.heart, '', donors, 'bare')}</div>
   <div class="stack">${panelx('Your current blood need', I.drop, '', needCard, 'bare')}
   ${panelx('How it works', I.msg, '', '<ol class="small" style="margin:0;padding-left:18px;line-height:1.7"><li>The blood bank knows what blood you need.</li><li>They alert every matching donor.</li><li>Donors come to the hospital and donate.</li><li>Their names appear here.</li></ol>')}</div></div>`;
}

/* ================= requests ================= */
// readable status for the patient / admin side
const stageBadge = r => badge(r.stage, { review: 'b-amber', alerted: 'b-amber', filling: 'b-green', confirmed: 'b-green', rejected: 'b-red' }[r.stage_key]);
const reqCard = r => {
  const donorView = isDonor();
  const who = donorView ? `${r.blood_group} needed at ${r.hospital}` : `${r.units} unit${r.units > 1 ? 's' : ''} of ${r.blood_group}`;
  const st = r.my_state;
  const chip = r.urgency === 'Emergency' ? '<span class="chip c-red"><i></i>Emergency</span>' : r.urgency === 'Urgent' ? '<span class="chip c-amber"><i></i>Urgent</span>' : '';
  const prog = !donorView && ['Pending', 'Accepted'].includes(r.status) && r.broadcast_at ? `<span class="mi">${I.people}${r.donated} donated · ${r.secured} of ${r.units} confirmed</span>` : '';
  return `<div class="card req"><div class="req-row group" data-go="/request/${r.id}"><span class="bgflat">${esc(r.blood_group)}</span><div class="grow"><div class="req-top"><b>${esc(who)}</b>${donorView ? badge(st) : stageBadge(r)}</div>
   <div class="meta"><span class="mi">${I.user}${r.units} unit${r.units > 1 ? 's' : ''}</span>${chip}${prog}<span class="mi">${I.pin}${esc(r.hospital)}${r.ward ? ', ' + esc(r.ward) : ''}</span></div><div class="req-foot"><span class="mi">${I.cal}${fmtDate(r.created_at)}</span><span>&middot;</span><span>${esc(r.code)}</span></div></div></div></div>`;
};
route('/requests', async ctx => {
  ctx.title = 'Requests'; ctx.shell.pad = 'wide'; const tab = ctx.q.tab || 'All'; const tabs = ['All', 'Pending', 'Accepted', 'Completed'];
  const r = await api('/requests?status=' + tab);
  return `<div>${pageHead(isDonor() ? 'Blood Requests' : 'My Blood Requests', false, isDonor() ? 'Requests the blood bank sent you because your blood group can help.' : 'The blood bank arranges blood for you. Follow the progress here.')}
   <div class="pills" role="tablist">${tabs.map(t => `<button class="pill ${t === tab ? 'on' : ''}" role="tab" aria-selected="${t === tab}" data-go="/requests?tab=${t}">${t}</button>`).join('')}</div>
   ${r.requests.length ? `<div class="list cols cols3" style="margin-top:8px">${r.requests.map(reqCard).join('')}</div>`
    : `<div class="empty"><b>${tab === 'All' ? 'No requests yet' : 'No ' + tab.toLowerCase() + ' requests'}</b>${isDonor() ? 'When the blood bank needs your blood group you will get a message and the request will appear here.' : 'If you need blood, the blood bank team creates the request for you.'}</div>`}</div>`;
}, { auth: true });

route('/request/:id', async ctx => {
  const { request: r } = await api('/requests/' + ctx.params.id); ctx.title = r.code; const u = state.user;
  const mine = u.id === r.requester_id, st = r.my_state;
  const header = `<div class="infocard" style="margin-bottom:6px">${bdrop(r.blood_group)}<div class="grow"><b style="color:var(--red)">${esc(r.urgency)} Request</b><div class="small muted">${esc(r.code)} • ${ago(r.created_at)}</div></div>${mine ? stageBadge(r) : badge(st)}</div>`;
  const kv = (k, v) => `<div><small>${k}</small><b>${v}</b></div>`;
  const common = `${kv('Hospital', esc(r.hospital) + ', ' + esc(r.city))}${r.ward ? kv('Ward / bed', esc(r.ward)) : ''}${kv('Blood group / units', esc(r.blood_group) + ' • ' + r.units + ' unit' + (r.units > 1 ? 's' : ''))}${kv('Reason', esc(r.reason || '—'))}${r.note ? kv('Note', esc(r.note)) : ''}`;
  const hp = state.meta.hospital && state.meta.hospital.phone;
  let body, actions = '';
  if (!mine) { // donor view
    body = `<h2 class="sec">Patient Information</h2><div class="row">${avatar(r.requester_name, 48)}<div><b>${esc(r.requester_name)}</b><div class="small muted">${[r.requester_gender, r.requester_age ? r.requester_age + ' years' : ''].filter(Boolean).join(' • ') || 'Patient'}</div></div></div>
      <div class="kv" style="margin-top:18px">${common}</div>`;
    if (st === 'Pending') actions = `<div class="alert info">The blood bank sent you this request because your blood group can help. If you accept, please come to ${esc(r.hospital)}.</div><button class="btn" data-act="accept" data-id="${r.id}">Accept Request</button><button class="btn out" data-act="decline" data-id="${r.id}">Decline Request</button>`;
    else if (st === 'Accepted') actions = `<div class="alert ok">Thank you for accepting. Please come to the blood bank at ${esc(r.hospital)}${hp ? ' (call ' + esc(hp) + ' first)' : ''}. The blood bank team records your donation once you have donated.</div><button class="btn out" data-act="decline" data-id="${r.id}">I can no longer donate</button>`;
    else if (st === 'Filled') actions = '<div class="alert info">Enough donors have already confirmed for this request. Thank you for being ready to help!</div>';
    else if (st === 'Completed') actions = '<div class="alert ok">Your donation was recorded. Thank you for saving a life!</div>';
    else if (st === 'Declined') actions = '<div class="alert info">You declined this request.</div>';
  } else { // patient view (read-only: the blood bank arranges everything)
    const msg = { review: 'The blood bank team is arranging donors for you. You do not need to do anything.',
      alerted: `The blood bank alerted ${r.broadcast_count} matching donor${r.broadcast_count === 1 ? '' : 's'} for you. You will see here who agrees to donate.`,
      filling: `${r.secured} of ${r.units} donor${r.units > 1 ? 's have' : ' has'} agreed to donate. The blood bank is still asking more donors.`,
      confirmed: 'All donors have agreed. They will come to the blood bank to donate.' }[r.stage_key];
    const dl = (r.donors || []).map(d => `<div class="row" style="justify-content:space-between;align-items:center;margin-top:10px"><div class="row" style="gap:10px">${avatar(d.name, 36)}<div><b>${esc(d.name)}</b><div class="small muted">Blood group ${esc(d.blood_group)}</div></div></div>${d.state === 'donated' ? badge('Completed', 'b-green') : badge('Accepted')}</div>`).join('');
    body = `<div class="kv" style="margin-top:16px">${common}</div>
      ${msg ? `<div class="alert ${r.secured ? 'ok' : 'info'}" style="margin-top:16px">${msg}</div>` : ''}
      ${dl ? `<h2 class="sec" style="margin-top:18px">Donors for you</h2>${dl}` : ''}
      ${r.status === 'Completed' ? '<div class="alert ok" style="margin-top:16px">All the blood you needed has been donated.</div>' : ''}
      ${r.status === 'Cancelled' ? '<div class="alert warn" style="margin-top:16px">The blood bank closed this request. Please ask the blood bank team if you still need blood.</div>' : ''}
      ${r.status === 'Expired' ? '<div class="alert warn" style="margin-top:16px">No donor responded in time. Please tell the blood bank team if you still need blood.</div>' : ''}`;
  }
  return `<div class="narrow">${pageHead('Request Details')}${header}<div class="card">${body}</div>
   <div class="stack actions-sticky">${actions}${u.role === 'donor' ? `<button class="btn gray sm" style="width:100%" data-act="report-req" data-id="${r.id}">Report this request</button>` : ''}</div></div>`;
}, { auth: true });


/* ---------- donor badges and certificate ---------- */
const BADGES = [[1, 'First Drop', '🩸'], [3, 'Life Saver', '❤️'], [5, 'Hero', '🦸'], [10, 'Champion', '🏆'], [25, 'Legend', '👑']];
const badgesHtml = n => {
  const next = BADGES.find(b => n < b[0]);
  return `<h2 class="sec">Your badges</h2><div class="badges">${BADGES.map(([k, name, em]) => `<div class="bdg ${n >= k ? 'on' : ''}" title="${k} donation${k > 1 ? 's' : ''}"><span>${em}</span><b>${name}</b><small>${k} donation${k > 1 ? 's' : ''}</small></div>`).join('')}</div>
   <p class="small muted" style="margin:8px 0 14px">${next ? `${next[0] - n} more donation${next[0] - n > 1 ? 's' : ''} to earn “${next[1]}”.` : 'You earned every badge. Thank you, Legend!'}</p>`;
};
ACT.cert = el => {
  const h = (window.__hist || [])[+el.dataset.i]; if (!h) return;
  const no = window.__hist.length - (+el.dataset.i), d = fmtDate(h.completed_at), name = state.user && state.user.name || 'Donor';
  const w = window.open('', '_blank'); if (!w) return toast('Allow pop-ups to open the certificate.', 'err');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Blood Donation Certificate</title><style>
    @page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Georgia,'Times New Roman',serif;background:#f3f3f3;color:#222}
    .bar{text-align:center;padding:12px;font-family:Arial,sans-serif}.bar button{padding:10px 18px;font-size:15px;background:#B50E18;color:#fff;border:0;border-radius:8px;cursor:pointer}
    .page{width:297mm;height:210mm;margin:0 auto 20px;background:#fff;padding:14mm}.frame{height:100%;border:3px solid #B50E18;padding:8mm;text-align:center;display:flex;flex-direction:column;justify-content:center;outline:1px solid #B50E18;outline-offset:-10px}
    h1{margin:0;color:#B50E18;font-size:40px;letter-spacing:2px}.sub{margin:6px 0 22px;font-size:17px;color:#555}.name{font-size:42px;margin:6px 0;border-bottom:1px solid #bbb;display:inline-block;padding:0 30px 4px}
    p{font-size:19px;line-height:1.6;margin:10px 60px}.drop{font-size:44px}.foot{margin-top:26px;display:flex;justify-content:space-around;font-size:15px;color:#444}
    @media print{body{background:#fff}.bar{display:none}.page{margin:0}}</style></head><body>
    <div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div>
    <div class="page"><div class="frame"><div class="drop">🩸</div><h1>CERTIFICATE OF APPRECIATION</h1><div class="sub">${esc(hospName())} Blood Bank</div>
    <div>This certificate is proudly presented to</div><div><span class="name">${esc(name)}</span></div>
    <p>for the voluntary donation of <b>${h.units > 1 ? esc(String(h.units)) + ' units' : '1 unit'}</b> of <b>${esc(h.blood_group)}</b> blood on <b>${esc(d)}</b>.<br>This is donation number <b>${no}</b>. Your generosity gives someone a second chance at life.</p>
    <div class="foot"><div>Blood Bank, ${esc(h.hospital || hospName())}<br>${esc(h.city || '')}</div><div>Request ${esc(h.code || '')}</div></div></div></div></body></html>`);
  w.document.close();
};
const post = (p) => api(p, { method: 'POST' });
ACT.accept = async el => {
  const eta = await modal({ title: 'When can you come?', text: 'Tell the blood bank when you expect to reach the hospital.', confirm: 'Accept request', input: { label: 'I can come', type: 'select', options: [['now', 'Right now'], ['2h', 'Within 2 hours'], ['today', 'Later today'], ['tomorrow', 'Tomorrow']] } });
  if (!eta) return;
  el.disabled = true;
  try { await api(`/requests/${el.dataset.id}/accept`, { method: 'POST', body: { eta } }); go('/done/accepted/' + el.dataset.id); } catch (e) { toast(e.message, 'err'); el.disabled = false; }
};
ACT.decline = async el => {
  if (!await modal({ title: 'Decline this request?', text: 'The hospital will look for another donor.', confirm: 'Decline', danger: true })) return;
  try { await post(`/requests/${el.dataset.id}/decline`); go('/done/declined/' + el.dataset.id); } catch (e) { toast(e.message, 'err'); }
};
ACT['report-req'] = async el => {
  const reason = await modal({ title: 'Report this request', text: 'Use this for spam, fake or abusive requests. Admins will review it.', confirm: 'Send report', input: { label: 'Reason', placeholder: 'Describe the problem', maxlength: 300 } });
  if (!reason) return; try { await api('/report', { method: 'POST', body: { request_id: el.dataset.id, reason } }); toast('Report sent. Thank you.', 'ok'); } catch (e) { toast(e.message, 'err'); }
};

/* result screens */
const doneView = ({ ok = true, title, text, btn, href, extra = '' }) => `<div class="narrow done"><div class="big" style="background:${ok ? 'var(--green)' : 'var(--red)'}">${ok ? I.check : I.x}</div>
  <h1 style="color:${ok ? 'var(--green)' : 'var(--red)'}">${title}</h1><p>${text}</p>${extra}<div style="margin-top:46px"><a class="btn" href="${href}">${btn}</a></div></div>`;
route('/done/:kind/:id', async ctx => {
  const k = ctx.params.kind; ctx.title = 'Done';
  if (k === 'availability') return doneView({ title: 'Availability Updated!', text: 'Your availability has been successfully updated.', btn: 'Go to Dashboard', href: '#/home' });
  if (k === 'declined') return doneView({ ok: false, title: 'Request Declined!', text: 'You have declined the donation request.<br>Thank you for your support.', btn: 'Back to Dashboard', href: '#/home' });
  if (k === 'accepted') return doneView({ title: 'Request Accepted!', text: 'Thank you!<br>Please come to the hospital blood bank. The blood bank team will record your donation.', btn: 'Go to Dashboard', href: '#/home' });
  const { request: r } = await api('/requests/' + ctx.params.id);
  const box = rows => `<div class="card" style="text-align:left;margin-top:22px"><div class="kv">${rows.map(([a, b]) => `<div class="row" style="justify-content:space-between"><small style="margin:0">${a}</small><b>${b}</b></div>`).join('')}</div></div>`;
  if (k === 'submitted') return doneView({ title: 'Request Sent!', text: `Your request was sent to ${esc(r.hospital)}.<br>The blood bank team will check it and alert matching donors. You will be notified.`,
    btn: 'View My Requests', href: '#/requests', extra: `<div class="card" style="margin-top:22px;background:var(--pink)"><small class="muted">Request ID</small><div><b>${esc(r.code)}</b></div></div>` });
  if (k === 'donation') return doneView({ title: 'Donation Completed!', text: 'Your donation has been successfully recorded. Thank you for saving a life!', btn: 'Back to Home', href: '#/home',
    extra: `<div class="card" style="text-align:left;margin-top:22px"><b>Request Details</b><div class="row" style="margin-top:10px">${bdrop(r.blood_group)}<div><b>${esc(r.blood_group)} ${r.units} Unit${r.units > 1 ? 's' : ''}</b><div class="small muted">${esc(r.hospital)}, ${esc(r.city)}</div><div class="small muted">Date: ${fmtDate(r.completed_at)}</div></div></div></div>` });
  return doneView({ title: 'Request Completed!', text: 'Thank you for your support.<br>The donation has been successfully completed and confirmed.', btn: 'Back to Home', href: '#/home',
    extra: box([['Donors', String(r.secured)], ['Blood Group', esc(r.blood_group)], ['Date', fmtDate(r.completed_at)]]) });
}, { auth: true });

/* ================= donor-only pages ================= */
route('/availability', async ctx => {
  ctx.title = 'Availability'; const u = await refreshUser(), d = u.donor;
  return `<div class="narrow">${pageHead('Update Availability', true, 'Control whether the hospital can alert you.')}<form class="stack" data-form="avail"><div class="formerr"></div>
   <div class="card neon"><label class="row" style="justify-content:space-between;cursor:pointer"><b>Available to Donate</b><span class="switch"><input type="checkbox" name="is_available" ${d.is_available ? 'checked' : ''}><i></i></span></label></div>
   <div class="card neon"><label class="field"><span>Last Donation Date</span><input type="date" name="last_donation_date" value="${esc(d.last_donation_date || '')}" max="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)}"><div class="hint">You can donate again ${state.meta.eligibilityDays} days after your last donation.</div></label></div>
   ${d.eligible ? '' : `<div class="alert warn">You are resting until ${fmtDate(d.next_eligible_date)}. The hospital will not alert you until then.</div>`}
   <button class="btn" type="submit">Save Changes</button></form></div>`;
}, { auth: ['donor'] });
FORMS.avail = async (f, d) => { await api('/donor/availability', { method: 'PUT', body: { is_available: !!d.is_available, last_donation_date: d.last_donation_date || null } }); go('/done/availability/0'); };

route('/history', async ctx => {
  ctx.title = 'Donation history'; const u = await refreshUser(); const { history } = await api('/donor/history'); window.__hist = history;
  return `<div class="narrow">${pageHead('Donation History', true, 'Every donation you have completed through the platform.')}<div class="stats"><div class="stat"><span class="ic-box lg">${I.heart}</span><div><b>${history.length}</b><small>Total donations</small></div></div><div class="stat"><span class="ic-box lg">${I.cal}</span><div><b class="sm">${u.donor.next_eligible_date ? fmtDate(u.donor.next_eligible_date) : 'Now'}</b><small>Next eligible</small></div></div></div>
   ${badgesHtml(history.length)}
   <h2 class="sec">Completed donations</h2>${history.length ? `<div class="list">${history.map((r, i) => `<div class="item">${bdrop(r.blood_group)}<div class="grow"><div class="t">${esc(r.blood_group)} • ${r.units} unit${r.units > 1 ? 's' : ''}</div><div class="s">${esc(r.hospital)}, ${esc(r.city)}</div><div class="s">${fmtDate(r.completed_at)}</div></div>${badge('Completed')}<button class="btn out sm" data-act="cert" data-i="${i}">Certificate</button></div>`).join('')}</div>`
    : '<div class="empty"><b>No donations yet</b>Your confirmed donations will be listed here.</div>'}</div>`;
}, { auth: ['donor'] });

/* ================= notifications ================= */
const NICON = { campaign: I.mega, reminder: I.cal, system: I.heart };
route('/notifications', async ctx => {
  ctx.title = 'Notifications'; const tab = ctx.q.tab || 'all';
  const { notifications: list } = await api('/notifications?type=' + tab);
  const tabs = [['all', 'All'], ['requests', 'Requests'], ['system', 'System']];
  return `<div class="narrow">${pageHead('Notifications', false, 'Alerts about requests and announcements.')}
   <div class="row" style="justify-content:space-between"><div class="pills">${tabs.map(([k, t]) => `<button class="pill ${k === tab ? 'on' : ''}" data-go="/notifications?tab=${k}">${t}</button>`).join('')}</div>
   ${list.some(n => !n.is_read) ? '<button class="btn out sm" data-act="readall" style="flex:none">Mark all read</button>' : ''}</div>
   ${list.length ? `<div class="list" style="margin-top:6px">${list.map(n => `<button class="nitem group ${n.is_read ? '' : 'new'}" data-act="notif" data-id="${n.id}" data-req="${n.request_id || ''}"><span class="ic">${n.type === 'request' ? `<span style="width:16px;display:block">${dropSvg()}</span>` : NICON[n.type] || I.heart}</span>
     <span class="grow"><span class="row" style="justify-content:space-between;gap:6px"><span class="t">${esc(n.title)}</span>${n.is_read ? '' : badge('New')}</span><p>${esc(n.body || '')}</p><time>${ago(n.created_at)}</time></span></button>`).join('')}</div>`
    : '<div class="empty"><b>You are all caught up</b>New alerts about requests and campaigns show up here.</div>'}</div>`;
}, { auth: true });
ACT.notif = async el => {
  try { await post(`/notifications/${el.dataset.id}/read`); if (state.user.unread > 0 && el.classList.contains('new')) { state.user.unread--; paintUnread(); } } catch { }
  if (el.dataset.req) go('/request/' + el.dataset.req); else { el.classList.remove('new'); const b = $('.badge', el); b && b.remove(); }
};
ACT.readall = async () => { await post('/notifications/read-all'); state.user.unread = 0; paintUnread(); render(); };

/* ================= profile ================= */
route('/profile', async ctx => {
  ctx.title = 'Profile'; const u = await refreshUser(); const hosp = u.role === 'hospital', donor = u.role === 'donor';
  const y = new Date().getFullYear(), td = new Date().toISOString().slice(0, 10);
  return `<div class="narrow">${pageHead('My Profile', false, 'Keep your details up to date.')}<div class="profile-head">${avatar(u.name, 64)}<div><h2>${esc(u.name)}</h2><div class="muted small">${esc(u.email)} • ${esc({ donor: 'Blood donor', patient: 'Patient / family', hospital: 'Hospital' }[u.role])}</div>${hosp ? `<div style="margin-top:4px">${u.status === 'active' ? badge('Verified', 'b-green') : badge('Awaiting verification', 'b-amber')}</div>` : ''}</div></div>
   <form class="card neon" data-form="profile">${cityList()}<div class="formerr"></div>
    <label class="field"><span>${hosp ? 'Hospital name' : 'Full name'}</span><input name="name" value="${esc(u.name)}" required minlength="2"></label>
    ${hosp ? '' : `<label class="field"><span>Blood group</span><select name="blood_group">${bgOptions(u.blood_group)}</select></label>
    <label class="field"><span>Gender</span><select name="gender">${['', 'Male', 'Female', 'Other'].map(g => `<option ${g === (u.gender || '') ? 'selected' : ''} value="${g}">${g || 'Prefer not to say'}</option>`).join('')}</select></label>`}
    ${donor ? `<label class="field"><span>Date of birth</span><input type="date" name="dob" value="${esc(u.dob || '')}" min="${y - 65}-01-01" max="${y - 18}-${td.slice(5)}"></label>` : ''}
    <label class="field"><span>Phone</span><input name="phone" type="tel" value="${esc(u.phone)}" required></label>
     ${u.role === 'patient' ? `<div class="two"><label class="field"><span>Ward / bed</span><input name="ward" maxlength="60" value="${esc(u.ward || '')}"></label><label class="field"><span>Hospital reg. no. / BHT</span><input name="bht_no" maxlength="40" value="${esc(u.bht_no || '')}"></label></div>` : ''}
    <div class="two"><label class="field"><span>City</span><input name="city" list="cities" value="${esc(u.city || '')}" required></label><label class="field"><span>Province</span><select name="state">${provinceOptions(u.state || '')}</select></label></div>
    ${donor ? `<label class="field"><span>About you</span><textarea name="about" maxlength="300" placeholder="A short note patients will see">${esc(u.about || '')}</textarea></label>` : ''}
    <div class="form-actions"><button class="btn" type="submit">Save Changes</button></div></form>
   <h2 class="sec">Change password</h2>
   <form class="card neon" data-form="pwchange"><div class="formerr"></div>${pwField('current', 'Current password', 'Current password')}${pwField('password', 'New password', 'At least 8 characters, letters and numbers', 'new-password')}<div style="margin-top:16px"><button class="btn out" type="submit">Update password</button></div></form>
   <div class="stack" style="margin-top:22px"><button class="btn gray" style="width:100%" data-act="logout">Log out</button><button class="btn gray" style="width:100%;color:#9B1C1C" data-act="del-acc">Delete my account</button></div></div>`;
}, { auth: true });
FORMS.profile = async (f, d) => { const r = await api('/me', { method: 'PUT', body: d }); state.user = r.user; toast('Profile saved.', 'ok'); render(); };
FORMS.pwchange = async (f, d) => { await api('/me/password', { method: 'PUT', body: d }); f.reset(); toast('Password updated.', 'ok'); };
ACT['del-acc'] = async () => {
  const pw = await modal({ title: 'Delete your account?', text: 'This permanently removes your profile and requests. Enter your password to confirm.', confirm: 'Delete account', danger: true, input: { type: 'password', label: 'Password', placeholder: 'Your password' } });
  if (!pw) return; try { await api('/me', { method: 'DELETE', body: { password: pw } }); logout(false); toast('Your account was deleted.'); } catch (e) { toast(e.message, 'err'); }
};

/* ================= boot ================= */
(async function boot() {
  try { const m = await api('/meta'); state.meta = { ...state.meta, ...m }; } catch { }
  if (state.token) { try { await refreshUser(); } catch { state.token = null; localStorage.removeItem('bdf_token'); } }
  if (state.user && state.user.role === 'admin') { state.token = null; state.user = null; localStorage.removeItem('bdf_token'); }
  render();
})();
