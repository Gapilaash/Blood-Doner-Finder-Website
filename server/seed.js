// Demo data:  npm run seed      (works on the local embedded DB or on DATABASE_URL)
const app = require('./app');
const bcrypt = require('bcryptjs');
const db = require('./db');
(async () => {
  await app.boot();
  const pw = bcrypt.hashSync('Demo@1234', 10);
  const add = async (name, email, phone, role, bg, gender, dob, city, state, x = {}) => {
    if (await db.one('SELECT 1 x FROM users WHERE email=?', email)) return;
    const r = await db.one('INSERT INTO users(name,email,phone,password_hash,role,blood_group,gender,dob,city,state,about,license_no,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id',
      name, email, phone, pw, role, bg, gender, dob, city, state, x.about || null, x.license || null, x.status || 'active');
    if (role === 'donor') await db.run('INSERT INTO donors(user_id,is_available,last_donation_date) VALUES(?,?,?)', r.id, x.avail ?? 1, x.last || null);
  };
  const E = 'Eastern Province';
  await add('Nimal Perera', 'nimal@demo.com', '+94770000001', 'donor', 'A+', 'Male', '1995-06-21', 'Batticaloa', E, { about: 'Regular donor, happy to help in emergencies.', last: '2026-08-01' });
  await add('Kavindi Silva', 'kavindi@demo.com', '+94770000002', 'donor', 'O+', 'Female', '1998-02-20', 'Batticaloa', E, { about: 'Happy to help anyone in need.' });
  await add('Suresh Kumar', 'suresh@demo.com', '+94770000003', 'donor', 'B+', 'Male', '1992-11-03', 'Batticaloa', E);
  await add('Thanuja Rajan', 'thanuja@demo.com', '+94770000004', 'donor', 'A+', 'Female', '1996-07-09', 'Kalmunai', E, { last: '2026-01-10' });
  await add('Arun Selvam', 'arun@demo.com', '+94770000005', 'donor', 'A+', 'Male', '1994-03-30', 'Eravur', E);
  await add('Chamara Fernando', 'chamara@demo.com', '+94770000006', 'donor', 'A-', 'Male', '1990-09-12', 'Ampara', E);
  await add('Dilini Jayasinghe', 'dilini@demo.com', '+94770000007', 'donor', 'O-', 'Female', '1997-12-01', 'Batticaloa', E);
  await add('Ruwan Perera', 'ruwan@demo.com', '+94770000008', 'donor', 'AB+', 'Male', '1991-06-21', 'Colombo', 'Western Province', { avail: 0 });
  await add('Asha Devi', 'asha@demo.com', '+94770000010', 'patient', 'A+', 'Female', null, 'Batticaloa', E);
  await add('Ravi Kumar', 'ravi@demo.com', '+94770000011', 'patient', 'B+', 'Male', null, 'Batticaloa', E);
  await add('Mala Perera', 'mala@demo.com', '+94770000012', 'patient', 'O+', 'Female', null, 'Kaluwanchikudy', E);
  await db.run("UPDATE users SET ward='Ward 7, Bed 12', bht_no='BHT-2026-0418' WHERE email='asha@demo.com'");
  await db.run("UPDATE users SET ward='Ward 3, Bed 4', bht_no='BHT-2026-0421' WHERE email='ravi@demo.com'");
  await db.run("UPDATE users SET ward='Maternity, Bed 9', bht_no='BHT-2026-0430' WHERE email='mala@demo.com'");
  // one request waiting for the admin, so the review queue is not empty on first login
  const asha = await db.one("SELECT id FROM users WHERE email='asha@demo.com'");
  if (asha && !(await db.one('SELECT 1 x FROM requests WHERE requester_id=?', asha.id))) {
    const r = await db.one("INSERT INTO requests(requester_id,blood_group,units,reason,hospital,city,ward,urgency) VALUES(?,?,?,?,?,?,?,?) RETURNING id", asha.id, 'A+', 2, 'Surgery', 'Batticaloa Hospital', 'Batticaloa', 'Ward 7, Bed 12', 'Urgent');
    await db.run('UPDATE requests SET code=? WHERE id=?', '#BR' + String(r.id).padStart(6, '0'), r.id);
  }
  console.log('Demo users added (password for all: Demo@1234)');
  console.log('  donor    nimal@demo.com\n  patients asha@demo.com, ravi@demo.com, mala@demo.com (Asha already has a blood request that is not yet sent to donors)\n  admin    /admin  (see ADMIN_EMAIL / ADMIN_PASSWORD)');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
