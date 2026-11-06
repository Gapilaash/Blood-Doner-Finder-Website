// Put this file in the blood-donor-finder folder (next to package.json), then run:  node test-mail.js
// Optional: node test-mail.js someone@example.com   (send the test to another address)
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const user = process.env.GMAIL_USER;
const pass = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const to = process.argv[2] || user;

console.log('.env loaded     :', user ? 'YES' : 'NO (GMAIL_USER is empty - check the .env location/name)');
console.log('GMAIL_USER      :', user || '(empty)');
console.log('App password len:', pass.length, pass.length === 16 ? '(OK)' : '(should be 16 letters)');
if (!user || !pass) process.exit(1);

let nodemailer;
try { nodemailer = require('nodemailer'); }
catch { console.log('\nnodemailer is NOT installed -> run: npm install'); process.exit(1); }

const tx = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });

(async () => {
  try {
    await tx.verify();
    console.log('\nGmail login      : OK');
    const info = await tx.sendMail({
      from: `"Blood Donor Finder" <${user}>`,
      to,
      subject: 'Blood Donor Finder - test email',
      text: 'If you can read this, e-mail alerts work.'
    });
    console.log('Test mail sent to:', to, '| response:', info.response);
    console.log('Check the Inbox AND the Spam folder.');
  } catch (e) {
    console.log('\nFAILED:', e.code || '', e.responseCode || '', e.message);
    if (e.code === 'EAUTH') console.log('-> Wrong/expired app password, or 2-Step Verification is OFF. Create a NEW app password and paste it in .env.');
    if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ENOTFOUND'].includes(e.code)) console.log('-> Network/firewall/ISP is blocking Gmail SMTP (smtp.gmail.com, port 465/587). Try another network or the Brevo option.');
  }
})();
