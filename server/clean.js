// Remove sample / test data from the database.
//   npm run clean-demo   -> removes only the old demo accounts (@demo.com) and their requests
//   npm run clean-all    -> removes ALL donors, patients, requests, notifications, reports, announcements and logs
//                           (admin accounts are kept)
// With the embedded local database, stop the server first (one process at a time).
// With Neon / Supabase, make sure DATABASE_URL is set (in .env or in your terminal) before running.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('./db');
const U = require('./util');

(async () => {
  await db.init();
  if (process.argv.includes('--all')) {
    await db.tx(async t => {
      for (const sql of [
        'DELETE FROM reports', 'DELETE FROM request_responses', 'DELETE FROM requests', 'DELETE FROM notifications',
        'DELETE FROM campaigns', 'DELETE FROM admin_logs', 'DELETE FROM donors', "DELETE FROM users WHERE role<>'admin'"
      ]) await t.run(sql);
    });
    console.log('All donors, patients, requests, notifications, reports, announcements and logs were removed. Admin accounts were kept.');
  } else {
    const rows = await db.q("SELECT id,email FROM users WHERE role<>'admin' AND lower(email) LIKE '%@demo.com'");
    for (const r of rows) await U.deleteUser(r.id);
    console.log(`Removed ${rows.length} demo account(s) (@demo.com) and their requests.`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
