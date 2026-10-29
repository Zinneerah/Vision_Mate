# VisionMate — Production-Ready Release

## What Changed in This Update

### Emergency Alert / Emergency Call — relocated and extended
- **Removed** from the User Dashboard.
- **Moved to the Monitoring page** (visible only to the dedicated hardware-monitoring account), replacing the "Monitored Patient" detail card that lived there. Same button styling, size, and backend workflow as before — just relocated.
- **Removed** the broken duplicate Emergency Alert / Emergency Call buttons that sat in the Monitoring page's "Live Alerts & Notifications" header — those had no working click handler in the previous build.
- **Added** for normal (non-hardware) caretakers on the **Assigned Patients** page — per-patient Emergency Alert / Emergency Call buttons (the Monitoring page is hardware-account-only, so normal caretakers need a different entry point, scoped to the specific patient rather than a single "active patient" guess).

### Root-cause fix: notifications/emergencies not appearing on the frontend
The actual cause was **not** a frontend rendering bug — it was that Firestore security rules require `caretakerId` / `assignedCaretakerId` fields to equal the signed-in user's real Firebase Auth UID, but:
- The legacy hardware account (Ahmed Nawaz) was seeded with Firestore document ID `ct_z4_1`, and that legacy ID — not his real Auth UID — was being used as `caretakerId` everywhere. Every write/read for that account was silently rejected by the rules.
- The Admin Portal never signed into Firebase Auth at all (`localStorage`-only session), so every Firestore call it made had `request.auth == null` and was rejected outright.

**Fixes:**
- `js/firebase-auth.js` now migrates a legacy account onto its real Auth UID the first time it signs in (`vmMigrateLegacyCaretakerToUid`) — idempotent, one-time, and self-contained (no admin privileges required; see `firestore.rules` for the narrowly-scoped self-migration exceptions this relies on).
- `js/layout.js` now establishes a real Firebase Auth session for the Admin Portal on login (`vmEnsureAdminFirebaseAuth`), tagging the admin's own `caretakers/{uid}` document with `isAdmin: true`. `firestore.rules` recognizes this via an `isAdmin()` helper, granting the Admin Portal real, rule-checked read/write access instead of relying on an unauthenticated bypass.
- `js/admin-firestore.js`'s caretaker listener now filters out `isAdmin: true` documents, so the admin's own Firebase-Auth-backed profile never shows up in caretaker tables, zone charts, or stat counts.
- Removed a dead notification-rendering block in `admin/dashboard.html` that referenced a panel element (`#adminNotifPanel`) which didn't exist anywhere in that page's markup — it was a silent no-op. The live, working admin-wide notification feed lives on `admin/activity.html`.

### Previously in v7

#### Removed
- **Messaging system** fully removed from frontend, backend, database rules, and navigation.
- **Monitored Patient Details card** removed from the Monitoring page (see above — replaced with Emergency Alert/Call).

#### Notifications (Real-Time, Everywhere)
- Every notification carries a `triggeredBy` field: `'Patient (Hardware)'`, `'Caretaker'`, or `'System (Admin)'`.
- Notifications read from the same `notifications` Firestore collection across Dashboard, Notifications page, and Admin Portal.

#### Shahbaz's Wife (Emergency Caregiver) — Editable
- The hardware account's Profile page shows an editable "Emergency Caregiver" section, synced live to the patient's Firestore record.

#### Hardware Notifications
- Hardware emergency button events carry `triggeredBy: 'Patient (Hardware)'` and persist to the `hardware_alerts` collection.

## Firebase Collections Used
- `caretakers` — caretaker profiles (now also holds admin profiles, tagged `isAdmin: true`)
- `patients` — patient records
- `assignments` — caretaker-patient assignments
- `admin_accounts` — admin login credentials (see the caveat in `firestore.rules` about this collection's client-side readability)
- `notifications` — real-time notifications (all portal sections read from this)
- `emergencies` — emergency event audit log
- `call_history` — emergency call records
- `hardware_alerts` — hardware button press records

## Firestore Rules
See the comments at the top of `firestore.rules` for the full access model. In short: every caretaker (including admins) signs into Firebase Auth, and rules check `request.auth.uid` against the relevant `caretakerId`/`assignedCaretakerId` field on every collection — no collection is left readable/writable by an unauthenticated client except `admin_accounts` (read-only, for the admin login form itself; see the caveat comment there).

Deploy with:
```
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

## Weather
- Open-Meteo API (free, no API key) for live weather + 5-day forecast.
- Default location: FB Area, Karachi — editable in `js/weather.js` `WEATHER_CONFIG`.

## Hardware-Linked Account
- Email: ahmed@visionmate.com
- Firebase Realtime DB: `hw_live/bu_11` (GPS + device), `hw_alerts/bu_11` (SOS)
- Firestore caretaker document: created at `ct_z4_1` originally; migrates to the account's real Firebase Auth UID on first sign-in after these rules are deployed (the old `ct_z4_1` document is kept, tagged `migratedToUid`, so existing admin links and dedup logic keep working).

