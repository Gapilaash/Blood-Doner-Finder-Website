// Express app shared by the local server (server/index.js) and the Vercel function (api/index.js)
const path = require('path');
if (!process.env.VERCEL) require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const api = require('./api');
const admin = require('./admin');

async function ensureAdmin() {
  if (await db.one("SELECT 1 x FROM users WHERE role='admin'")) return;
  if (process.env.VERCEL && !process.env.ADMIN_PASSWORD) throw new Error('Set the ADMIN_PASSWORD environment variable on Vercel before the first request (it must not be the default).');
  if (!process.env.ADMIN_PASSWORD) console.warn('WARNING: using the default admin password Admin@123 - change it under Settings, or set ADMIN_PASSWORD.');
  const email = (process.env.ADMIN_EMAIL || 'admin@blooddonor.com').toLowerCase();
  await db.run("INSERT INTO users(name,email,phone,password_hash,role,status) VALUES('Administrator',?,?,?, 'admin','active') ON CONFLICT DO NOTHING",
    email, process.env.ADMIN_PHONE || '+94700000000', bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10));
  console.log('Admin account created:', email);
}
let booting;
const boot = () => booting || (booting = (async () => { await db.init(); await ensureAdmin(); })().catch(e => { booting = null; throw e; }));

// tiny in-memory rate limiter (per server instance)
function limiter(windowMs, max, message) {
  let hits = new Map(), start = Date.now();
  return (req, res, next) => {
    if (Date.now() - start > windowMs) { hits = new Map(); start = Date.now(); }
    const n = (hits.get(req.ip) || 0) + 1; hits.set(req.ip, n);
    if (n > max) return res.status(429).json({ error: message || 'Too many requests. Please slow down.' });
    next();
  };
}

const app = express();
app.set('trust proxy', 1);
const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors((req, cb) => cb(null, {
  origin: (origin, done) => {
    if (!origin) return done(null, true);
    try { return done(null, extra.includes(origin) || new URL(origin).hostname === req.hostname); } catch { return done(null, false); }
  }
})));
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin' }); next(); });
app.use(express.json({ limit: '50kb' }));

// runtime config for both websites (same-origin API by default)
app.get('/config.js', (req, res) => res.type('js').set('Cache-Control', 'no-store')
  .send('window.APP_CONFIG=' + JSON.stringify({ API: process.env.API_PUBLIC_URL || '/api', GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '' }) + ';'));

app.use('/api', async (req, res, next) => { try { await boot(); next(); } catch (e) { next(e); } });
app.use('/api', limiter(60000, 300));
app.use('/api/auth/login', limiter(15 * 60000, 20, 'Too many login attempts. Try again later.'));
app.use('/api/admin/login', limiter(15 * 60000, 20, 'Too many login attempts. Try again later.'));
app.use('/api/auth/register', limiter(60 * 60000, 20, 'Too many sign-ups from this network. Try again later.'));
app.use('/api/auth/forgot', limiter(15 * 60000, 10));
app.use('/api/auth/reset', limiter(15 * 60000, 10));
app.use('/api/donors', limiter(60000, 60, 'Too many searches. Please wait a moment.'));
app.use('/api/admin', admin);
app.use('/api', api);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

if (!process.env.VERCEL) app.use(express.static(path.join(__dirname, '..', 'public'))); // on Vercel the platform serves /public

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
  if (err.code === '23505') return res.status(409).json({ error: 'That value is already in use.' });
  console.error(err); res.status(500).json({ error: 'Something went wrong on the server.' });
});
module.exports = app;
module.exports.boot = boot;
