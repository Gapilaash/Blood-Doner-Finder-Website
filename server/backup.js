// Database backup / restore (works with the embedded database and with PostgreSQL).
//   node server/backup.js backup            -> writes data/backups/backup-YYYY-MM-DD.json
//   node server/backup.js restore <file>    -> REPLACES all data with the file (stop the server first)
// The server also writes one backup a day by itself (when it runs on your own computer/server).
const fs = require('fs');
const path = require('path');
const db = require('./db');

const TABLES = ['users', 'donors', 'requests', 'request_responses', 'notifications', 'reports', 'campaigns', 'admin_logs', 'blood_stock'];
const SERIAL = { users: 'id', donors: 'donor_id', requests: 'id', notifications: 'id', reports: 'id', campaigns: 'id', admin_logs: 'id' };
const DIR = path.join(__dirname, '..', 'data', 'backups');
const KEEP = Number(process.env.BACKUP_KEEP || 14);

async function dump() {
  await db.init();
  const tables = {};
  for (const t of TABLES) tables[t] = await db.q(`SELECT * FROM ${t}`);
  return { app: 'blood-donor-finder', version: 1, created_at: new Date().toISOString(), tables };
}

async function restore(data) {
  if (!data || data.app !== 'blood-donor-finder' || !data.tables) throw new Error('This is not a Blood Donor Finder backup file.');
  await db.init();
  await db.tx(async t => {
    for (const name of [...TABLES].reverse()) await t.run(`DELETE FROM ${name}`);
    for (const name of TABLES) {
      for (const row of data.tables[name] || []) {
        const cols = Object.keys(row);
        if (!cols.length) continue;
        await t.run(`INSERT INTO ${name}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`, ...cols.map(c => row[c]));
      }
    }
    for (const [name, col] of Object.entries(SERIAL))
      await t.run(`SELECT setval(pg_get_serial_sequence('${name}','${col}'), COALESCE((SELECT MAX(${col}) FROM ${name}),1), (SELECT MAX(${col}) FROM ${name}) IS NOT NULL)`);
  });
  return Object.fromEntries(TABLES.map(n => [n, (data.tables[n] || []).length]));
}

// One file per day, newest BACKUP_KEEP files are kept. Skipped on Vercel (read-only disk): use your database provider's backups there.
async function dailyBackup() {
  if (process.env.VERCEL) return null;
  const file = path.join(DIR, `backup-${new Date().toISOString().slice(0, 10)}.json`);
  if (fs.existsSync(file)) return null;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(await dump()), { mode: 0o600 });
  const old = fs.readdirSync(DIR).filter(f => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(0, -KEEP);
  old.forEach(f => fs.unlinkSync(path.join(DIR, f)));
  return file;
}

module.exports = { dump, restore, dailyBackup };

if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  (async () => {
    const [cmd, file] = process.argv.slice(2);
    if (cmd === 'backup') { const f = (await dailyBackup()) || 'already done today (data/backups)'; console.log('Backup:', f); }
    else if (cmd === 'restore' && file) { console.log('Restored rows:', await restore(JSON.parse(fs.readFileSync(file, 'utf8')))); }
    else console.log('Usage: node server/backup.js backup | restore <file>');
    process.exit(0);
  })().catch(e => { console.error('Failed:', e.message); process.exit(1); });
}
