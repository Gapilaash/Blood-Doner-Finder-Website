# Blood Donor Finder (Vercel-ready)

One repository, one deployment, **two websites + API**:

| Part | URL | Folder |
|---|---|---|
| Public website (donors and patients of the hospital) | `/` | `public/` |
| **Separate Admin website / dashboard** | `/admin/` | `public/admin/` |
| REST API (serverless function) | `/api/...` | `api/index.js` + `server/` |
| Database | PostgreSQL | `server/db.js` (schema created automatically) |

## 1. Run locally
```
npm install
npm start
```
Open http://localhost:3000 and http://localhost:3000/admin/ . With no `DATABASE_URL`, an embedded PostgreSQL (PGlite) stores data in `./data` - nothing to install.

**Admin:** `admin@blooddonor.com` / `Admin@123` (created automatically; change it under Settings).
**Remove old sample/test data** (stop the server first): `npm run clean-demo` removes the old demo accounts (`@demo.com`); `npm run clean-all` removes every donor, patient, request, notification and log but keeps the admin. With Neon/Supabase set `DATABASE_URL` first. Locally you can also just delete the `data` folder.
`npm test` runs 117 API checks (add `TEST_DATABASE_URL=postgres://...` to test a real PostgreSQL).

## 2. Deploy: GitHub + Vercel
1. **Create a free PostgreSQL database** - Neon (neon.tech) or Supabase, or Vercel Dashboard > Storage > Neon. Copy the connection string (`postgres://...`). Prefer the *pooled* connection string.
2. **Push to GitHub**
   ```
   git init
   git add .
   git commit -m "Blood Donor Finder"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. **Vercel**: Add New > Project > import the repo. Leave Framework = *Other*, no build command, root directory = repo root.
4. Before deploying, add **Environment Variables** (Settings > Environment Variables):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your PostgreSQL connection string |
   | `JWT_SECRET` | any long random text (required) |
   | `CRON_SECRET` | any long random text (required for the daily job) |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your first admin login (set a strong password!) |
   | `DEV_RESET_CODE_IN_RESPONSE` | `false` |

   If you used Vercel's Neon integration, `DATABASE_URL`/`POSTGRES_URL` is added for you.
5. Deploy. Tables and the admin account are created automatically on the first request. Visit `https://<your-project>.vercel.app` and `https://<your-project>.vercel.app/admin/`.

Daily cron (`vercel.json`) expires old requests and sends monthly availability reminders. Vercel Hobby allows once-a-day cron jobs.

## How it works (one hospital: Batticaloa Hospital)
**Who uses it:** the hospital's **patients** (they sign up and watch their own dashboard), **donors**, and the **admin** (the blood bank team, separate dashboard at `/admin/`).

1. **Patients do not request blood.** They sign up (with ward / bed and BHT number, so the blood bank can find them) and their dashboard shows their blood status and **who donated for them**.
2. **The admin decides.** The blood bank team knows which patient needs blood. In the admin dashboard they click **+ New blood request**, pick the patient, blood group (default: the patient's), units, urgency and reason.
3. **Alert donors.** Straight after creating the request the admin sees a preview ("6 donors will be messaged: A+ 3, O- 1 ...") and sends the alert to every *compatible*, active, available and rested donor (A+ patient: A+, A-, O+, O-). Choose all compatible donors or only donors in Batticaloa, add an optional note. **Alert more donors** later reaches new donors only - nobody is messaged twice.
4. **Donors respond.** They see only the requests the blood bank sent them, accept or decline, then come to the hospital. A request for 3 units stays open until 3 donors accept.
5. **The admin confirms the donation.** When a donor has given blood, the admin clicks **Donated** next to the donor (or **Didn't come**, which frees the place so more donors can be alerted). That records the donation date (90-day rest), thanks the donor, and adds the donor to the patient's dashboard. When all units are donated the request is Completed.

Phone numbers are visible to the admin only. Patients see donors' names and blood groups; donors see the patient's name and ward.

**Messages:** every alert is an in-app notification (bell icon). With Twilio keys (`TWILIO_*`) the same alert is also sent on WhatsApp (up to 200 per alert). Plain SMS is not built in; adding it means one function in `server/util.js` (`sendBulk`).

Settings (environment variables): `HOSPITAL_NAME` (default *Batticaloa Hospital*), `HOSPITAL_CITY` (default *Batticaloa*), `HOSPITAL_PHONE` (optional, shown to donors).

## Features
**Donor** - register (18-65), login by email/phone, availability + last donation date, 90-day rest rule, requests the blood bank sends, accept / decline / withdraw, donation history.
**Patient** - sign up with ward and BHT number, dashboard with open blood needs and the list of donors who donated for them, request history.
**Admin website** - create a request for a patient, preview and alert compatible donors, confirm each donation or mark a no-show, dashboard charts, users (search by name, phone, ward, BHT number; ban/unban, delete), requests (cancel, mark fulfilled, flag, delete, bulk cleanup), reports, announcements, reminder/expiry tools, activity log, CSV export.
**Security** - bcrypt, JWT, login lockout, rate limits (per serverless instance), phone numbers hidden from donors and patients, admins cannot log in on the public site.

## Notes
- **Forgot password** has no email server: with `DEV_RESET_CODE_IN_RESPONSE=true` the code is shown on screen (demo). In production set it `false` and connect an email/SMS service, or users cannot reset passwords.
- **Google sign-in** (existing accounts only, needs `GOOGLE_CLIENT_ID`) and **WhatsApp reminders** (needs Twilio keys) are optional and untested here because they need your own accounts.
- Want the admin site on its own domain? Create a second Vercel project from the same repo with the same env vars and just use its `/admin/` URL, or point a domain such as `admin.example.com` to it with a redirect to `/admin/`.

## Look & content (Sri Lanka)
Layout follows the structure of blooddonation.lk: contact strip, header (Home, Find Donor, About Us, Can You Donate, Login / Register Now), hero with Sinhala tagline, FIND DONOR form (blood type, city, province), About Us with key features, "Give Blood Directly To Us" banner and footer. Donors and hospitals pick one of Sri Lanka's 9 provinces, and search can filter by province.
- Font: Newsreader (Google Fonts) everywhere. Hero photo: `public/img/hero.jpg`.
- Colors are CSS variables at the top of `public/css/style.css` (`--red`, `--red-d`, `--pink` ...) - change them to restyle everything.
- Contact email shown in header/footer: `SITE.email` at the top of `public/js/core.js`.

## Behaviour notes
- Phone numbers are stored in one format (`0771234567`, `94771234567` and `+94771234567` are the same number).
- Banning or deleting a donor frees the place they had accepted and tells the patient.
- Only the blood bank records donations (donors and patients cannot confirm), so a patient cannot lock a donor out by clicking early.
- Requests nobody answered expire (Emergency 2 days, Urgent 4, Normal 7, counted from the moment donors were alerted).
- On Vercel, `ADMIN_PASSWORD` is required (the app refuses to create the admin with the default password).
- Existing databases upgrade automatically (new columns; old single-donor requests are converted).

## Donor alerts

When the blood bank presses **Alert donors**, it chooses who gets the message:

| Option | Who |
| --- | --- |
| Same blood group in the hospital's city | closest exact matches (default for Normal / Urgent) |
| Same blood group, any city | exact matches everywhere |
| All compatible groups in the city | e.g. O- / O+ donors for an A+ patient, city only |
| All compatible donors | everyone who can help (default for Emergency) |

Rare groups such as O- stay free for patients who really need them. Use **Alert more donors** later to widen the search; donors already contacted are never messaged twice.

Every alert is shown in the donor's app. Two optional extra channels:

* **E-mail (free)** - easiest is Gmail: turn on 2-Step Verification on a Google account, create an *App password*, then set `GMAIL_USER` and `GMAIL_APP_PASSWORD` (and `APP_URL`). Gmail allows roughly 500 e-mails a day on a normal account. Alternative: Brevo (`BREVO_API_KEY`, `MAIL_FROM_EMAIL`), 300 a day free. Run `npm install` once (adds `nodemailer`).
* **WhatsApp (paid)** - set the `TWILIO_*` values. Twilio's trial only reaches numbers you have verified.

## New in this version
* **Auto alert** - Emergency requests alert every matching donor as soon as the blood bank creates them (`AUTO_ALERT` in `.env`: `emergency` default, `all`, or `off`). In the "New blood request" box you can also tick "Alert all matching donors immediately".
* **Repeat reminders** - donors who were alerted but have not answered are reminded again (in-app + e-mail): Emergency every 5 min, Urgent every 10 min, Normal every 15 min, up to `REMINDER_MAX` (default 10). Needs the server to keep running (`npm start`); on Vercel's free plan the cron job only runs once a day.
* **Donor arrival time** - when a donor accepts, they say when they can come (now / within 2 hours / later today / tomorrow). The blood bank sees it next to the donor.
* **Thank-you + next date** - when the blood bank records a donation, the donor gets a notification and an e-mail with the date they can donate again, then a reminder when that day arrives.
* **Blood stock** - admin page "Blood Stock": units per blood group, a minimum level, and a warning on the dashboard when a group is low.
* **Monthly report** - admin page "Monthly Report": requests, units, donations, new donors, top donors. Buttons: "Download for Excel" (CSV) and "Print / Save as PDF".
* **Donor badges and certificate** - donors earn badges (1, 3, 5, 10, 25 donations) and can open a printable certificate for each donation (History page).
* **Languages** - English / தமிழ் / සිංහල switch (bottom-left of the donor website). Screen texts are translated; messages written by the server (notifications, error messages) stay in English. Translations live in `public/js/i18n.js`; please have a native speaker review them.
* **Call links** - phone numbers in the admin website are `tel:` links (tap to call).
* **Backup** - Tools page "Download backup now", plus an automatic daily file in `data/backups` (kept `BACKUP_KEEP` days). Restore (stop the server first): `npm run restore -- data/backups/backup-YYYY-MM-DD.json`. On Vercel/Neon, also use your database provider's own backups.
* **WhatsApp (free)** - on Blood Requests, the "WhatsApp" button lists the alerted donors with a link that opens WhatsApp with the message ready.
