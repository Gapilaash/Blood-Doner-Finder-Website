// Local / traditional server:  npm start   ->  http://localhost:3000  (site)  and  /admin  (admin website)
const app = require('./app');
const U = require('./util');
const PORT = +process.env.PORT || 3000;
app.boot().then(() => {
  app.listen(PORT, () => {
    console.log(`Website         http://localhost:${PORT}`);
    console.log(`Admin website   http://localhost:${PORT}/admin/`);
    console.log(`API             http://localhost:${PORT}/api`);
  });
  const jobs = async () => { try { await U.expireRequests(); await U.sendReminders(false); await U.notifyEligibleAgain(); await require('./backup').dailyBackup(); } catch (e) { console.error('job error', e.message); } };
  setTimeout(jobs, 5000).unref(); setInterval(jobs, 60 * 60 * 1000).unref();
  let busy = false;
  const fast = async () => { if (busy) return; busy = true; try { await U.resendAlerts(); } catch (e) { console.error('reminder error', e.message); } busy = false; };
  setInterval(fast, 60 * 1000).unref();
}).catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
