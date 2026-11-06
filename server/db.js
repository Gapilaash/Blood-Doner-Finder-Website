// PostgreSQL access layer.
//  - DATABASE_URL (or POSTGRES_URL) set  -> real PostgreSQL (Neon, Supabase, Vercel Postgres ...)
//  - otherwise                          -> embedded PostgreSQL (PGlite) stored in ./data/pglite for easy local use
const path = require('path');
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
const NOW = "(now() at time zone 'utc')";
const toPg = sql => { let i = 0; return sql.replace(/\?/g, () => '$' + (++i)); };

let base; // { query(sql, params) -> {rows,rowCount}, exec(sql), transaction(fn(tx)) }
if (url) {
  const { Pool, types } = require('pg');
  types.setTypeParser(20, v => parseInt(v, 10));   // bigint -> number
  types.setTypeParser(1114, v => v);               // timestamp -> string
  types.setTypeParser(1082, v => v);               // date -> 'YYYY-MM-DD'
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({ connectionString: url.replace(/[?&]sslmode=[^&]*/g, ''), max: 5, idleTimeoutMillis: 10000, ssl: local ? false : { rejectUnauthorized: false } });
  const wrap = c => ({ query: async (s, p) => { const r = await c.query(toPg(s), p); return { rows: r.rows, rowCount: r.rowCount }; }, exec: s => c.query(s) });
  base = {
    ...wrap(pool),
    async transaction(fn) {
      const c = await pool.connect();
      try { await c.query('BEGIN'); const r = await fn(wrap(c)); await c.query('COMMIT'); return r; }
      catch (e) { try { await c.query('ROLLBACK'); } catch { } throw e; }
      finally { c.release(); }
    }
  };
} else {
  const { PGlite } = require('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR || path.join(__dirname, '..', 'data', 'pglite');
  require('fs').mkdirSync(path.dirname(dir), { recursive: true });
  const pg = new PGlite(dir, { parsers: { 20: v => parseInt(v, 10), 1114: v => v, 1082: v => v } });
  const wrap = c => ({ query: async (s, p) => { const r = await c.query(toPg(s), p); return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length }; }, exec: s => c.exec(s) });
  base = { ...wrap(pg), transaction: fn => pg.transaction(t => fn(wrap(t))) };
}

const mk = b => ({
  q: async (sql, ...p) => (await b.query(sql, p)).rows,
  one: async (sql, ...p) => (await b.query(sql, p)).rows[0],
  run: (sql, ...p) => b.query(sql, p),
  exec: s => b.exec(s)
});
const db = mk(base);
db.NOW = NOW;
db.isPostgres = !!url;
db.tx = fn => base.transaction(t => fn(mk(t)));

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN('donor','patient','hospital','admin')),
  blood_group TEXT, gender TEXT, dob DATE, city TEXT, state TEXT, about TEXT, license_no TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','pending','banned')),
  verified INTEGER NOT NULL DEFAULT 1,
  reset_hash TEXT, reset_expires BIGINT,
  failed_logins INTEGER NOT NULL DEFAULT 0, locked_until BIGINT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW}
);
CREATE TABLE IF NOT EXISTS donors(
  donor_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  is_available INTEGER NOT NULL DEFAULT 1,
  last_donation_date DATE
);
CREATE TABLE IF NOT EXISTS requests(
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  blood_group TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  reason TEXT, hospital TEXT NOT NULL, city TEXT NOT NULL, note TEXT,
  urgency TEXT NOT NULL DEFAULT 'Normal' CHECK(urgency IN('Normal','Urgent','Emergency')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN('Pending','Accepted','Completed','Declined','Cancelled','Expired')),
  flagged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW},
  accepted_at TIMESTAMP, completed_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS request_responses(
  request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW},
  PRIMARY KEY(request_id, donor_id)
);
CREATE TABLE IF NOT EXISTS notifications(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL, body TEXT, request_id INTEGER,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW}
);
CREATE TABLE IF NOT EXISTS reports(
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW}, resolved_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS campaigns(
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL, body TEXT NOT NULL, audience TEXT NOT NULL DEFAULT 'donors',
  sent_to INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW}
);
CREATE TABLE IF NOT EXISTS admin_logs(
  id SERIAL PRIMARY KEY,
  admin_id INTEGER, admin_name TEXT, action TEXT NOT NULL, detail TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT ${NOW}
);
-- indexes for fast emergency searches (blood_group + city)
CREATE INDEX IF NOT EXISTS idx_users_search ON users(role, status, blood_group, city);
CREATE INDEX IF NOT EXISTS idx_req_status ON requests(status, blood_group, city);
CREATE INDEX IF NOT EXISTS idx_req_requester ON requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_req_donor ON requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
-- single-hospital flow: requests wait for admin review, then admin alerts compatible donors
ALTER TABLE users ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bht_no TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS broadcast_at TIMESTAMP;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS broadcast_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE request_responses ADD COLUMN IF NOT EXISTS last_alert_at TIMESTAMP;
ALTER TABLE request_responses ADD COLUMN IF NOT EXISTS alert_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE request_responses ADD COLUMN IF NOT EXISTS eta TEXT;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS eligible_notified_for DATE;
UPDATE donors SET eligible_notified_for=last_donation_date WHERE eligible_notified_for IS NULL AND last_donation_date IS NOT NULL AND (current_date - last_donation_date) >= 90;
CREATE TABLE IF NOT EXISTS blood_stock(
  blood_group TEXT PRIMARY KEY, units INTEGER NOT NULL DEFAULT 0, min_units INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMP NOT NULL DEFAULT ${NOW}
);
INSERT INTO blood_stock(blood_group) VALUES('A+'),('A-'),('B+'),('B-'),('O+'),('O-'),('AB+'),('AB-') ON CONFLICT DO NOTHING;
-- request_responses.response: alerted | accepted | donated | declined  (a request can now have several donors)
INSERT INTO request_responses(request_id,donor_id,response)
  SELECT id, donor_id, CASE WHEN status='Completed' THEN 'donated' ELSE 'accepted' END FROM requests
  WHERE donor_id IS NOT NULL AND status IN('Accepted','Completed') ON CONFLICT DO NOTHING;
UPDATE requests SET broadcast_at=created_at WHERE broadcast_at IS NULL AND status IN('Accepted','Completed');
-- upgrades for databases created by an older version
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER NOT NULL DEFAULT 1;
UPDATE users SET verified=0 WHERE role='hospital' AND status='pending' AND verified=1;
-- store Sri Lankan numbers in one format (+94...) so 0771234567 and +94771234567 are the same person
UPDATE users u SET phone='+94'||substr(u.phone,2) WHERE u.phone ~ '^0[0-9]{9}$'
  AND NOT EXISTS (SELECT 1 FROM users x WHERE x.phone='+94'||substr(u.phone,2));
UPDATE users u SET phone='+'||u.phone WHERE u.phone ~ '^94[0-9]{9}$'
  AND NOT EXISTS (SELECT 1 FROM users x WHERE x.phone='+'||u.phone);
`;
let ready;
db.init = () => ready || (ready = db.tx(async t => { await t.run('SELECT pg_advisory_xact_lock(727001)'); await t.exec(SCHEMA); }).catch(e => { ready = null; throw e; }));
module.exports = db;
