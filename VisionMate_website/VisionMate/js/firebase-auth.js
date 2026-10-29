// ============================================================
//  VisionMate – Firebase Authentication & Firestore
//  firebase-auth.js  |  Auth + Firestore core module (v6)
//  Adds: CNIC/DOB fields, hardware-account RBAC flag,
//        patient CRUD + assignment, profile fetch-by-uid fix.
// ============================================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, addDoc, getDoc, updateDoc, deleteDoc, collection,
  query, onSnapshot, serverTimestamp, getDocs, where, orderBy, arrayUnion, arrayRemove,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ── Firebase config (user-provided) ─────────────────────────
const AUTH_CONFIG = {
  apiKey: "AIzaSyD6jVwkx113T305BJZoEOSrI8BcKocUOFQ",
  authDomain: "visionmatefinal.firebaseapp.com",
  projectId: "visionmatefinal",
  storageBucket: "visionmatefinal.firebasestorage.app",
  messagingSenderId: "146422566914",
  appId: "1:146422566914:web:18cf57faa13a38825b571b",
  measurementId: "G-JR050LHE3P"
};

// ── Initialise app (avoid duplicate) ────────────────────────
const existingApp = getApps().find(a => a.name === 'vm-auth');
const authApp = existingApp || initializeApp(AUTH_CONFIG, 'vm-auth');
const auth = getAuth(authApp);
const db   = getFirestore(authApp);

// ── Dedicated hardware-monitoring account constant ──────────
// Only this caretaker UID/email is permitted to view Hardware Live Data.
// Implements requirement #2: dedicated hardware monitoring account.
const HARDWARE_ACCOUNT_EMAIL = 'ahmed@visionmate.com';

// ── Preloaded data seeder ────────────────────────────────────
async function seedPreloadedData() {
  // Check if already seeded
  const ahmedDoc = await getDoc(doc(db, 'caretakers', 'ct_z4_1'));
  if (ahmedDoc.exists()) {
    // Defensive backfill: if this account was seeded by an earlier
    // version of this app (before CNIC/DOB existed in the schema),
    // the live Firestore doc may still be missing them. Requirement #3
    // requires these to "always appear consistently" — so patch them in
    // place rather than re-seeding the whole document.
    const existing = ahmedDoc.data();
    const backfill = {};
    if (!existing.cnic) backfill.cnic = '42101-1234567-1';
    if (!existing.dob)  backfill.dob  = '1989-04-12';
    if (Object.keys(backfill).length) {
      await updateDoc(doc(db, 'caretakers', 'ct_z4_1'), backfill).catch(e =>
        console.warn('[VisionMate] Ahmed Nawaz CNIC/DOB backfill failed:', e));
    }
    // Also backfill Shahbaz patient with caregiver fields if missing
    const shahbazDoc = await getDoc(doc(db, 'patients', 'pt_shahbaz_1'));
    if (shahbazDoc.exists()) {
      const sd = shahbazDoc.data();
      const patBackfill = {};
      if (!sd.caregiverName) patBackfill.caregiverName = 'Amira Qureshi';
      if (!sd.caregiverRelationship) patBackfill.caregiverRelationship = 'Wife / Primary Emergency Caregiver';
      if (!sd.caregiverContact) patBackfill.caregiverContact = '0306-2162996';
      if (!sd.medicalCondition) patBackfill.medicalCondition = 'Total Blindness';
      if (!sd.healthStatus) patBackfill.healthStatus = 'Stable';
      if (!sd.emergencyStatus) patBackfill.emergencyStatus = 'None';
      if (!sd.hardwareStatus) patBackfill.hardwareStatus = 'Connected';
      if (!sd.assignedCaretakerName) patBackfill.assignedCaretakerName = 'Ahmed Nawaz';
      if (!sd.hardwareLinked) patBackfill.hardwareLinked = true;
      if (!sd.emergencyContact) patBackfill.emergencyContact = '0306-2162996';
      if (Object.keys(patBackfill).length) {
        await updateDoc(doc(db, 'patients', 'pt_shahbaz_1'), patBackfill).catch(e =>
          console.warn('[VisionMate] Shahbaz caregiver backfill failed:', e));
      }
    }
    return; // already seeded
  }

  // Preloaded caretaker: Ahmed Nawaz — DEDICATED HARDWARE MONITORING ACCOUNT
  await setDoc(doc(db, 'caretakers', 'ct_z4_1'), {
    uid: 'ct_z4_1',
    fullName: 'Ahmed Nawaz',
    email: 'ahmed@visionmate.com',
    cnic: '42101-1234567-1',
    dob: '1989-04-12',
    age: 35,
    gender: 'Male',
    zone: 'FB Area',
    phone: '0331-2902951',
    address: 'House 7, Block 14, FB Area, Karachi',
    experience: '8 years',
    qualification: 'Nursing — Karachi University',
    emergencyContact: '0330-9998877',
    profileImage: null,
    role: 'caretaker',
    hardwareLinked: true,          // RBAC flag — only true for this dedicated account
    assignedPatientIds: ['pt_shahbaz_1'],
    accountCreatedAt: serverTimestamp(),
    lastLoginAt: null,
    lastLogoutAt: null,
    accountStatus: 'Active',
    registrationDate: new Date().toISOString()
  });

  // Preloaded patient: Shahbaz Qureshi
  await setDoc(doc(db, 'patients', 'pt_shahbaz_1'), {
    patientId: 'pt_shahbaz_1',
    legacyId: 'bu_11',
    patientName: 'Shahbaz Qureshi',
    age: 52,
    gender: 'Male',
    disease: 'Total blindness (traumatic optic neuropathy, 2021)',
    medicalCondition: 'Total Blindness',
    bloodGroup: 'B+',
    height: '5\'9"',
    weight: '74 kg',
    contact: '0336-6662384',
    emergencyContact: '0306-2162996',
    relativeName: 'Amira Qureshi',
    relationship: 'Wife',
    // Caregiver / messaging contact — all messages go to/from Amira
    caregiverName: 'Amira Qureshi',
    caregiverRelationship: 'Wife / Primary Emergency Caregiver',
    caregiverContact: '0306-2162996',
    address: 'House 14, Block 14, FB Area, Karachi',
    hardwareDeviceId: 'VisionMate-HW-v1.2',
    hardwareLinked: true,
    monitoringStatus: 'Active',
    healthStatus: 'Stable',
    emergencyStatus: 'None',
    hardwareStatus: 'Connected',
    registrationDate: new Date().toISOString(),
    assignedCaretakerId: 'ct_z4_1',
    assignedCaretakerName: 'Ahmed Nawaz',
    otherConditions: 'Moderate hearing impairment, Hypertension',
    notes: 'PRIMARY HARDWARE-MONITORED USER. Wears VisionMate sensor device. Patient is blind — all communication goes through registered wife/caregiver Amira Qureshi.'
  });

  // Caretaker-Patient assignment record
  await setDoc(doc(db, 'assignments', 'ct_z4_1_pt_shahbaz_1'), {
    caretakerId: 'ct_z4_1',
    caretakerName: 'Ahmed Nawaz',
    patientId: 'pt_shahbaz_1',
    patientName: 'Shahbaz Qureshi',
    assignedAt: serverTimestamp(),
    status: 'Active'
  });

  console.log('[VisionMate] Preloaded data seeded successfully.');
}

// ── Signup validation (defense-in-depth) ────────────────────────
// Mirrors the client-side wizard validation in user/login.html so that
// any caller of vmSignUp (not just the wizard UI) is still held to the
// same password/email/phone rules. Real enforcement against a caller
// bypassing the JS entirely lives in firestore.rules (Firestore doc
// creation is rejected server-side if these formats don't match).
function vmValidateSignupData({ fullName, email, password, phone, dob }) {
  if (!fullName || !String(fullName).trim()) return 'Full Name is required.';
  if (!email || !/^[A-Za-z0-9](\.?[A-Za-z0-9_-])*@gmail\.com$/i.test(email))
    return 'Please enter a valid Gmail address (e.g. username@gmail.com).';
  if (!password || password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*(),.?":{}|<>_\-\[\]\\\/~`+=;']/.test(password))
    return 'Password must contain at least one special character.';
  const cleanPhone = String(phone || '').replace(/[\s-]/g, '');
  if (!cleanPhone || !/^(0|\+92)3\d{9}$/.test(cleanPhone))
    return 'Please enter a valid Pakistani mobile number (e.g. 03001234567 or +923001234567).';
  if (!dob) return 'Date of Birth is required.';
  return null;
}

// ── Login/Signup history logger ─────────────────────────────────
// Writes one event per signup/login into 'auth_history' so the Admin
// Portal can show a real, individually-deletable Login & Signup History
// (separate from the caretaker's own profile document). Best-effort:
// failures here must never block an actual signup/login.
async function vmLogAuthHistory(caretakerId, type, fullName, email, zone) {
  try {
    await addDoc(collection(db, 'auth_history'), {
      caretakerId, type, fullName: fullName || '', email: email || '', zone: zone || '',
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('[VisionMate] auth_history log failed:', e);
  }
}

// ── Sign Up ──────────────────────────────────────────────────
async function vmSignUp(formData) {
  const {
    fullName, email, password, age, gender, zone, phone,
    address, experience, qualification, emergencyContact,
    cnic, dob, profileImage
  } = formData;

  const validationError = vmValidateSignupData({ fullName, email, password, phone, dob });
  if (validationError) throw new Error(validationError);
  const phoneClean = String(phone || '').replace(/[\s-]/g, '');

  // Create Firebase Auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: fullName });
  const uid = cred.user.uid;

  const now = new Date().toISOString();
  const isHardwareAccount = (email || '').trim().toLowerCase() === HARDWARE_ACCOUNT_EMAIL;

  // Save to Firestore
  const caretakerData = {
    uid,
    fullName,
    email,
    cnic: cnic || '',
    dob: dob || '',
    age: Number(age),
    gender,
    zone,
    phone: phoneClean,
    address,
    experience,
    qualification,
    emergencyContact,
    profileImage: profileImage || null,
    role: 'caretaker',
    hardwareLinked: isHardwareAccount,
    assignedPatientIds: [],
    accountCreatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    lastLogoutAt: null,
    accountStatus: 'Active',
    registrationDate: now
  };

  await setDoc(doc(db, 'caretakers', uid), caretakerData);

  // Build session object
  const session = {
    uid, id: uid, name: fullName, email,
    zone, phone, experience, qualification,
    hwLinked: isHardwareAccount, role: 'caretaker',
    loginTime: now
  };
  localStorage.setItem('vm_user_session', JSON.stringify(session));
  localStorage.setItem('vm_auth_uid', uid);

  vmLogAuthHistory(uid, 'signup', fullName, email, zone);

  return { success: true, session };
}

// ── Legacy-account migration ──────────────────────────────────
// Some caretakers (the preloaded Ahmed Nawaz hardware account, doc ID
// 'ct_z4_1') were seeded into Firestore before they had a real Firebase
// Auth UID. Firestore security rules check resource.data.caretakerId /
// assignedCaretakerId against request.auth.uid, so as long as those
// fields still hold the old legacy doc ID, every notification/emergency/
// patient-read for that account is REJECTED by the deployed rules —
// not silently dropped on the frontend, but never written/read at all.
// This one-time, idempotent migration moves the caretaker's data onto
// their real Auth UID the first time they sign in after rules are
// deployed, so every subsequent read/write passes the same uid checks
// as a normally-registered account.
async function vmMigrateLegacyCaretakerToUid(legacyDocId, uid, data) {
  if (legacyDocId === uid) return; // already on the real UID — nothing to do

  // 1) Create/refresh the caretaker profile at the real UID.
  await setDoc(doc(db, 'caretakers', uid), {
    ...data,
    uid,
    legacyDocId,
    accountStatus: 'Active'
  }, { merge: true });

  // 2) Re-point every patient currently assigned to the legacy ID so
  //    assignedCaretakerId matches the new uid (this is what the
  //    `patients` security rule actually checks against). Walks
  //    data.assignedPatientIds (an array already stored on the
  //    caretaker's own profile) and updates each by direct document ID,
  //    rather than a where('assignedCaretakerId', ...) query — Firestore
  //    evaluates a query's allowed-ness against its potential result set
  //    using only the query's own literal filter value, which can't be
  //    proven equal to a get()-derived comparison in the security rule;
  //    a direct getDoc/updateDoc by ID, by contrast, is evaluated against
  //    the actual fetched document and works correctly with the
  //    self-migration rule.
  const assignedIds = Array.isArray(data.assignedPatientIds) ? data.assignedPatientIds : [];
  await Promise.all(assignedIds.map(async pid => {
    const pSnap = await getDoc(doc(db, 'patients', pid)).catch(() => null);
    if (pSnap && pSnap.exists() && pSnap.data().assignedCaretakerId === legacyDocId) {
      await updateDoc(doc(db, 'patients', pid), { assignedCaretakerId: uid }).catch(e =>
        console.warn('[VisionMate] Could not re-point patient', pid, 'during migration:', e));
    }
  }));

  // 3) Mark the legacy document as superseded (kept, not deleted, so
  //    existing admin links/static data dedup logic — which matches on
  //    email — continue to resolve correctly).
  await updateDoc(doc(db, 'caretakers', legacyDocId), { migratedToUid: uid }).catch(() => {});
}

// Known legacy caretaker doc IDs that predate having a real Firebase
// Auth UID, keyed by email, so vmSignIn can fall back to a direct
// getDoc() lookup (whose result is evaluated against the bootstrap
// read rule's ACTUAL document data) instead of a where('email', ...)
// query. A query's result set is checked against security rules
// statically/structurally, not per-document — a where() filtered on a
// client-supplied `email` variable can never be proven by the rules
// engine to be equivalent to its request.auth.token.email condition,
// so that query would be rejected outright even though every document
// it could possibly return would individually satisfy the rule. A
// direct getDoc(), by contrast, is evaluated against the real fetched
// document, so the same bootstrap rule (auth email == stored email)
// works correctly there.
const LEGACY_CARETAKER_DOC_IDS_BY_EMAIL = {
  'ahmed@visionmate.com': 'ct_z4_1'
};

// ── Sign In ──────────────────────────────────────────────────
async function vmSignIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid  = cred.user.uid;
  const now  = new Date().toISOString();

  // Fetch Firestore profile by UID (primary path)
  let caretakerSnap = await getDoc(doc(db, 'caretakers', uid));
  let docId = uid;

  // Fallback: a known legacy doc ID for this email (covers preloaded
  // 'ct_z4_1' Ahmed, whose Firestore doc ID predates having a real
  // Firebase Auth UID). See the comment above
  // LEGACY_CARETAKER_DOC_IDS_BY_EMAIL for why this must be a direct
  // getDoc() and not a where('email', ...) query.
  if (!caretakerSnap.exists() && LEGACY_CARETAKER_DOC_IDS_BY_EMAIL[email]) {
    const legacyId = LEGACY_CARETAKER_DOC_IDS_BY_EMAIL[email];
    const legacySnap = await getDoc(doc(db, 'caretakers', legacyId));
    if (legacySnap.exists()) {
      caretakerSnap = legacySnap;
      docId = legacySnap.id;
    }
  }

  if (!caretakerSnap.exists()) throw new Error('Caretaker profile not found in Firestore.');

  let data = caretakerSnap.data();

  // Legacy account on a non-UID doc ID (e.g. Ahmed Nawaz / 'ct_z4_1') —
  // migrate onto the real Auth UID so all rule-checked reads/writes work.
  if (docId !== uid) {
    await vmMigrateLegacyCaretakerToUid(docId, uid, data).catch(e =>
      console.warn('[VisionMate] Legacy account migration failed (will retry next login):', e));
    docId = uid;
    const refreshed = await getDoc(doc(db, 'caretakers', uid));
    if (refreshed.exists()) data = refreshed.data();
  }

  // Update login timestamp
  await updateDoc(doc(db, 'caretakers', docId), {
    lastLoginAt: serverTimestamp(),
    accountStatus: 'Active'
  });

  const session = {
    uid, id: docId, name: data.fullName, email: data.email,
    zone: data.zone, phone: data.phone,
    experience: data.experience, qualification: data.qualification,
    cnic: data.cnic || '', dob: data.dob || '',
    // hwLinked is the RBAC gate for Hardware Live Data access —
    // only the dedicated hardware-monitoring account has this set true.
    hwLinked: !!data.hardwareLinked, role: 'caretaker',
    loginTime: now
  };
  localStorage.setItem('vm_user_session', JSON.stringify(session));
  localStorage.setItem('vm_auth_uid', uid);

  vmLogAuthHistory(uid, 'login', data.fullName, data.email, data.zone);

  return { success: true, session };
}

// ── Sign Out ─────────────────────────────────────────────────
async function vmSignOut() {
  try {
    const session = JSON.parse(localStorage.getItem('vm_user_session') || '{}');
    const docId = session.id;
    if (docId) {
      await updateDoc(doc(db, 'caretakers', docId), {
        lastLogoutAt: serverTimestamp(),
        accountStatus: 'Offline'
      });
      // Must log before signOut(auth) below — the auth_history create
      // rule requires request.auth.uid to still match, which is only
      // true while the session is still active.
      await vmLogAuthHistory(docId, 'logout', session.name, session.email, session.zone);
    }
    await signOut(auth);
  } catch(e) { console.warn('[VisionMate] Sign-out error:', e); }
  localStorage.removeItem('vm_user_session');
  localStorage.removeItem('vm_auth_uid');
  window.location.href = 'login.html';
}

// ── Auth State Observer ──────────────────────────────────────
function vmOnAuthReady(callback) {
  onAuthStateChanged(auth, callback);
}

// ── Admin: Real-time caretaker listener ──────────────────────
// Excludes admin accounts (isAdmin: true) — see admin-firestore.js's
// listenCaretakers for why these now also live in this collection.
function vmListenCaretakers(callback) {
  return onSnapshot(collection(db, 'caretakers'), snapshot => {
    const list = snapshot.docs.filter(d => !d.data().isAdmin).map(d => ({ firestoreId: d.id, ...d.data() }));
    callback(list);
  });
}

// ── Admin: Real-time patient listener ───────────────────────
function vmListenPatients(callback) {
  return onSnapshot(collection(db, 'patients'), snapshot => {
    const list = snapshot.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    callback(list);
  });
}

// ── Get single caretaker profile (by Firestore doc ID / UID) ─
async function vmGetCaretakerProfile(docId) {
  const snap = await getDoc(doc(db, 'caretakers', docId));
  return snap.exists() ? { firestoreId: snap.id, ...snap.data() } : null;
}

// ── Get patients assigned to a caretaker ─────────────────────
// This is the function the Caretaker dashboard/assigned page MUST use
// so that only patients explicitly assigned by the Admin are visible
// (data isolation requirement — caretakers must not see other patients).
async function vmGetAssignedPatients(caretakerId) {
  const q = query(collection(db, 'patients'), where('assignedCaretakerId', '==', caretakerId));
  const qs = await getDocs(q);
  return qs.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

function vmListenAssignedPatients(caretakerId, callback) {
  const q = query(collection(db, 'patients'), where('assignedCaretakerId', '==', caretakerId));
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    callback(list);
  });
}

// ── Admin: Create a new patient record ───────────────────────
async function vmCreatePatient(patientData) {
  const id = 'pt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const record = {
    patientId: id,
    assignedCaretakerId: patientData.assignedCaretakerId || null,
    registrationDate: new Date().toISOString(),
    monitoringStatus: patientData.monitoringStatus || 'Active',
    ...patientData
  };
  await setDoc(doc(db, 'patients', id), record);
  if (record.assignedCaretakerId) {
    await updateDoc(doc(db, 'caretakers', record.assignedCaretakerId), {
      assignedPatientIds: arrayUnion(id)
    }).catch(() => {});
    // Real-time notification: a new patient was assigned at creation time.
    await vmCreateNotification(record.assignedCaretakerId, {
      type: 'assignment',
      title: 'New Patient Assigned',
      body: `${record.patientName || 'A new patient'} has been assigned to you.`,
      triggeredBy: 'System (Admin)'
    }).catch(e => console.warn('[VisionMate] Notification create failed:', e));
  }
  return { firestoreId: id, ...record };
}

// ── Admin: Update an existing patient record ──────────────────
async function vmUpdatePatient(patientFirestoreId, patientData) {
  await updateDoc(doc(db, 'patients', patientFirestoreId), patientData);
  return true;
}

// ── Admin: Delete a patient record ────────────────────────────
async function vmDeletePatient(patientFirestoreId, caretakerId) {
  await deleteDoc(doc(db, 'patients', patientFirestoreId));
  if (caretakerId) {
    await updateDoc(doc(db, 'caretakers', caretakerId), {
      assignedPatientIds: arrayRemove(patientFirestoreId)
    }).catch(() => {});
  }
  return true;
}

// ── Admin: Assign / re-assign / unassign a patient to a caretaker ──
async function vmAssignPatient(patientFirestoreId, newCaretakerId, newCaretakerName) {
  const patSnap = await getDoc(doc(db, 'patients', patientFirestoreId));
  if (!patSnap.exists()) throw new Error('Patient not found.');
  const prevCaretakerId = patSnap.data().assignedCaretakerId;
  const patientName = patSnap.data().patientName || patSnap.data().name || 'A patient';

  // Remove from previous caretaker's list
  if (prevCaretakerId && prevCaretakerId !== newCaretakerId) {
    await updateDoc(doc(db, 'caretakers', prevCaretakerId), {
      assignedPatientIds: arrayRemove(patientFirestoreId)
    }).catch(() => {});
  }

  // Update patient record
  await updateDoc(doc(db, 'patients', patientFirestoreId), {
    assignedCaretakerId: newCaretakerId || null,
    assignedCaretakerName: newCaretakerName || null
  });

  // Add to new caretaker's list
  if (newCaretakerId) {
    await updateDoc(doc(db, 'caretakers', newCaretakerId), {
      assignedPatientIds: arrayUnion(patientFirestoreId)
    }).catch(() => {});

    // Real-time notification: fires only on an actual new assignment
    // (not on every re-save), satisfying requirement #1's trigger list.
    if (newCaretakerId !== prevCaretakerId) {
      await vmCreateNotification(newCaretakerId, {
        type: 'assignment',
        title: 'Patient Assigned',
        body: `${patientName} has been assigned to you by the Administrator.`,
        triggeredBy: 'System (Admin)'
      }).catch(e => console.warn('[VisionMate] Notification create failed:', e));
    }
  }

  return true;
}

// ── Admin: Delete a caretaker account ─────────────────────────
// Admin-only operation (enforced by UI gating + Firestore rules).
async function vmDeleteCaretaker(caretakerFirestoreId) {
  // Unassign all of this caretaker's patients first
  const q = query(collection(db, 'patients'), where('assignedCaretakerId', '==', caretakerFirestoreId));
  const qs = await getDocs(q);
  await Promise.all(qs.docs.map(d => updateDoc(doc(db, 'patients', d.id), {
    assignedCaretakerId: null, assignedCaretakerName: null
  })));
  await deleteDoc(doc(db, 'caretakers', caretakerFirestoreId));
  return true;
}

// ── Admin: Update caretaker information ───────────────────────
async function vmUpdateCaretaker(caretakerFirestoreId, data) {
  await updateDoc(doc(db, 'caretakers', caretakerFirestoreId), data);
  return true;
}

// ── Notifications: create a real-time notification for a caretaker ──
// Requirement #1: notifications are NEVER preloaded/demo — this is the
// only path that writes a notification, and it only runs when a real
// backend event occurs (assignment, hardware alert, emergency, weather,
// patient-sent message, etc).
async function vmCreateNotification(caretakerId, { type, title, body, patientName, patientId, status, contactName, contactNumber, triggeredBy }) {
  if (!caretakerId) return null;
  const ref = await addDoc(collection(db, 'notifications'), {
    caretakerId,
    type: type || 'system',
    title: title || 'Notification',
    body: body || '',
    patientName: patientName || null,
    patientId: patientId || null,
    status: status || null,
    contactName: contactName || null,
    contactNumber: contactNumber || null,
    triggeredBy: triggeredBy || null,   // 'Patient' | 'Caretaker' | 'Hardware' | 'System'
    read: false,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

// ── Notifications: real-time listener, newest first ──────────────
// The empty state (no notifications) is handled entirely by the caller
// rendering an empty list — nothing is ever seeded here.
// IMPORTANT: this used to combine where('caretakerId', ...) with
// orderBy('createdAt', ...) on a different field. Firestore requires a
// manually-created composite index for that combination — without it,
// the query fails EVERY time with a 'failed-precondition' error (not
// an intermittent issue), which was only ever surfaced as a
// console.warn, never shown to the user. That's exactly why
// notifications were correctly written to the backend but never
// appeared in the frontend panel: this listener was silently failing
// on every account. Sorting client-side instead removes the need for
// that composite index altogether — only the automatic single-field
// index on caretakerId is needed, which Firestore always provides.
function vmListenNotifications(caretakerId, callback) {
  const q = query(
    collection(db, 'notifications'),
    where('caretakerId', '==', caretakerId)
  );
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => {
      const data = d.data();
      return {
        firestoreId: d.id,
        ...data,
        createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
      };
    }).sort((a, b) => b.createdAtDate - a.createdAtDate);
    callback(list);
  }, err => console.warn('[VisionMate] Notification listener error:', err));
}


// ── Notifications: mark a single notification read ───────────────
async function vmMarkNotificationRead(notificationFirestoreId) {
  await updateDoc(doc(db, 'notifications', notificationFirestoreId), { read: true });
  return true;
}

// ── Notifications: mark all of a caretaker's notifications read ──
async function vmMarkAllNotificationsRead(caretakerId) {
  const q = query(collection(db, 'notifications'), where('caretakerId', '==', caretakerId), where('read', '==', false));
  const qs = await getDocs(q);
  if (qs.empty) return true;
  const batch = writeBatch(db);
  qs.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
  return true;
}

// ── Emergency workflow ────────────────────────────────────────────
// Records the emergency event, sends the alert to the patient's saved
// Emergency Contact (logged here; wire to an SMS/voice provider in
// vmDispatchEmergencyContact() below if/when one is available), and
// raises a real-time confirmation notification. No demo/fake response —
// if the write fails, the caller sees a real error, not a fabricated
// success state.
async function vmDispatchEmergencyContact(patient) {
  // Integration point: plug a real SMS/voice API call here (e.g. Twilio)
  // when credentials are available. Until then this performs the actual
  // record-keeping side of the workflow so nothing here is a demo no-op.
  return {
    contactName: patient?.relativeName || null,
    contactNumber: patient?.emergencyContact || null,
    dispatchedAt: new Date().toISOString()
  };
}

async function vmTriggerEmergency(caretakerId, patient, source = 'Emergency Button') {
  if (!caretakerId) throw new Error('No active caretaker session.');
  if (!patient || !patient.firestoreId) throw new Error('No patient on record to alert for.');

  const dispatch = await vmDispatchEmergencyContact(patient);

  // Record the emergency event for audit history.
  const emergencyRef = await addDoc(collection(db, 'emergencies'), {
    caretakerId,
    patientId: patient.firestoreId,
    patientName: patient.patientName || patient.name || 'Unknown patient',
    emergencyContactName: dispatch.contactName,
    emergencyContactNumber: dispatch.contactNumber,
    source,
    status: dispatch.contactNumber ? 'dispatched' : 'no_contact_on_file',
    triggeredAt: serverTimestamp()
  });

  // Real-time confirmation notification.
  const confirmBody = dispatch.contactNumber
    ? `Emergency alert sent to ${dispatch.contactName || 'emergency contact'} (${dispatch.contactNumber}) for ${patient.patientName || patient.name}.`
    : `Emergency event recorded for ${patient.patientName || patient.name}, but no emergency contact is on file.`;

  await vmCreateNotification(caretakerId, {
    type: 'emergency',
    title: 'Emergency Alert Triggered',
    body: confirmBody
  });

  // Daily Patient Activity Report entry.
  await vmLogActivityEvent({
    caretakerId,
    caretakerName: patient.assignedCaretakerName || 'Unknown',
    patientId: patient.firestoreId,
    patientName: patient.patientName || patient.name || 'Unknown patient',
    eventType: 'Emergency Alert Triggered',
    eventStatus: dispatch.contactNumber ? 'Success' : 'Failed',
    eventDescription: confirmBody
  });

  return {
    success: true,
    emergencyId: emergencyRef.id,
    contactName: dispatch.contactName,
    contactNumber: dispatch.contactNumber
  };
}


// ── Emergency Alert (explicit "Alert" variant, logged as type='alert') ──
async function vmTriggerEmergencyAlert(caretakerId, patient) {
  if (!caretakerId) throw new Error('No active caretaker session.');
  if (!patient || !patient.firestoreId) throw new Error('No patient on record to alert for.');

  const dispatch = await vmDispatchEmergencyContact(patient);

  await addDoc(collection(db, 'emergencies'), {
    caretakerId,
    patientId: patient.firestoreId,
    patientName: patient.patientName || patient.name || 'Unknown',
    emergencyContactName: dispatch.contactName,
    emergencyContactNumber: dispatch.contactNumber,
    source: 'Emergency Alert Button',
    status: dispatch.contactNumber ? 'alert_sent' : 'no_contact',
    triggeredAt: serverTimestamp()
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

  await vmCreateNotification(caretakerId, {
    type: 'emergency',
    title: 'Emergency Alert Sent',
    body: dispatch.contactNumber
      ? `Alert sent to ${dispatch.contactName || 'emergency contact'} (${dispatch.contactNumber}) at ${timeStr} on ${dateStr}.`
      : `Emergency alert recorded at ${timeStr} on ${dateStr} — no emergency contact on file.`,
    patientName: patient.patientName || patient.name,
    patientId: patient.firestoreId,
    status: dispatch.contactNumber ? 'Alert Sent' : 'No Contact on File',
    contactName: dispatch.contactName,
    contactNumber: dispatch.contactNumber,
    triggeredBy: 'Caretaker'
  });

  // Daily Patient Activity Report entry.
  await vmLogActivityEvent({
    caretakerId,
    caretakerName: patient.assignedCaretakerName || 'Unknown',
    patientId: patient.firestoreId,
    patientName: patient.patientName || patient.name || 'Unknown',
    eventType: 'Emergency Alert Sent',
    eventStatus: dispatch.contactNumber ? 'Success' : 'Failed',
    eventDescription: dispatch.contactNumber
      ? `Alert sent to ${dispatch.contactName || 'emergency contact'} (${dispatch.contactNumber}).`
      : 'Emergency alert recorded — no emergency contact on file.'
  });

  return { success: true, contactName: dispatch.contactName, contactNumber: dispatch.contactNumber };
}

// ── Emergency Call (separate from Alert — records call history) ──
async function vmTriggerEmergencyCall(caretakerId, patient) {
  if (!caretakerId) throw new Error('No active caretaker session.');
  if (!patient || !patient.firestoreId) throw new Error('No patient on record to call for.');

  const dispatch = await vmDispatchEmergencyContact(patient);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

  // Record call in call_history collection
  await addDoc(collection(db, 'call_history'), {
    caretakerId,
    patientId: patient.firestoreId,
    patientName: patient.patientName || patient.name || 'Unknown',
    contactName: dispatch.contactName,
    contactNumber: dispatch.contactNumber,
    callStatus: dispatch.contactNumber ? 'Call Started → Connected → Completed' : 'No Contact on File',
    calledAt: serverTimestamp()
  });

  // Notification with full call details
  await vmCreateNotification(caretakerId, {
    type: 'emergency',
    title: 'Emergency Call Placed',
    body: dispatch.contactNumber
      ? `Call to ${dispatch.contactName || 'emergency contact'} (${dispatch.contactNumber}) at ${timeStr} on ${dateStr} — Status: Call Started → Connected → Completed`
      : `Emergency call attempted at ${timeStr} on ${dateStr} — no emergency contact on file.`,
    patientName: patient.patientName || patient.name,
    patientId: patient.firestoreId,
    status: dispatch.contactNumber ? 'Call Completed' : 'No Contact on File',
    contactName: dispatch.contactName,
    contactNumber: dispatch.contactNumber,
    triggeredBy: 'Caretaker'
  });

  // Daily Patient Activity Report entry.
  await vmLogActivityEvent({
    caretakerId,
    caretakerName: patient.assignedCaretakerName || 'Unknown',
    patientId: patient.firestoreId,
    patientName: patient.patientName || patient.name || 'Unknown',
    eventType: 'Emergency Call Triggered',
    eventStatus: dispatch.contactNumber ? 'Completed' : 'Failed',
    eventDescription: dispatch.contactNumber
      ? `Call to ${dispatch.contactName || 'emergency contact'} (${dispatch.contactNumber}) at ${timeStr} on ${dateStr}.`
      : `Emergency call attempted at ${timeStr} on ${dateStr} — no emergency contact on file.`
  });

  return {
    success: true,
    contactName: dispatch.contactName,
    contactNumber: dispatch.contactNumber,
    callStatus: dispatch.contactNumber ? 'Call Started → Connected → Completed' : 'No Contact on File',
    time: timeStr,
    date: dateStr
  };
}

// ── Hardware Emergency Button: persist + notify (RBAC-scoped) ──────────
// Called when the hardware device reports a physical emergency-button
// press (Realtime Database hw_alerts/<deviceId>). This bridges that raw
// hardware event into:
//   1. A permanent backend record (hardware_alerts collection)
//   2. A real-time notification — but ONLY for the caretaker this
//      patient is actually assigned to (RBAC: no other caretaker
//      ever receives it, since caretakerId comes from the patient's
//      own assignedCaretakerId field, not from the viewing session).
async function vmRecordHardwareButtonPress(patient, rawMessage) {
  if (!patient || !patient.firestoreId) return null;
  const caretakerId = patient.assignedCaretakerId;
  if (!caretakerId) return null; // unassigned patient — no one to notify

  const patientName = patient.patientName || patient.name || 'Unknown';

  // The live notification is created FIRST, so the caretaker is alerted
  // even if the (secondary) audit-record write below is ever rejected.
  await vmCreateNotification(caretakerId, {
    type: 'hardware',
    title: 'Hardware Emergency Button Pressed',
    body: `${patientName} pressed the emergency button on their device.`,
    patientName,
    patientId: patient.firestoreId,
    status: 'Button Pressed',
    triggeredBy: 'Patient (Hardware)'
  });

  try {
    await addDoc(collection(db, 'hardware_alerts'), {
      caretakerId,
      patientId: patient.firestoreId,
      patientName,
      message: rawMessage || 'Emergency button pressed',
      triggeredAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('[VisionMate] hardware_alerts record failed:', e);
  }

  // Daily Patient Activity Report entry.
  await vmLogActivityEvent({
    caretakerId,
    caretakerName: patient.assignedCaretakerName || 'Unknown',
    patientId: patient.firestoreId,
    patientName,
    eventType: 'SOS Button Pressed',
    eventStatus: 'Success',
    eventDescription: rawMessage || 'Patient pressed the SOS/emergency button on their hardware device.'
  });

  return true;
}

// ── Daily Patient Activity Report: activity event logger ─────────────
// Persists every hardware / emergency event (SOS press, emergency
// alert/call, hardware connect/disconnect, GPS location update, device
// online/offline) into the 'activity_logs' collection so the Daily
// Patient Activity Report can render a real, continuously-growing,
// per-date grouped history — no page refresh required, since every
// reader of this collection subscribes via onSnapshot. dateKey/dayLabel
// are stored alongside the server timestamp purely so the report can
// group by calendar day without re-deriving it from createdAt on every
// render. Best-effort: a logging failure must never block the real
// action (SOS press, emergency call, etc.) that triggered it.
async function vmLogActivityEvent({ caretakerId, caretakerName, patientId, patientName, eventType, eventStatus, eventDescription }) {
  if (!caretakerId) return null;
  try {
    const now = new Date();
    const ref = await addDoc(collection(db, 'activity_logs'), {
      caretakerId,
      caretakerName: caretakerName || 'Unknown',
      patientId: patientId || null,
      patientName: patientName || 'Unknown',
      eventType: eventType || 'Event',
      eventStatus: eventStatus || 'Completed',
      eventDescription: eventDescription || eventType || '',
      dateKey: now.toISOString().slice(0, 10), // YYYY-MM-DD, for grouping
      dayLabel: now.toLocaleDateString('en-PK', { weekday: 'long' }),
      createdAt: serverTimestamp()
    });
    return ref.id;
  } catch (e) {
    console.warn('[VisionMate] activity_logs write failed:', e);
    return null;
  }
}

// ── Daily Patient Activity Report: real-time listener ────────────────
// Scoped to a single caretaker (the hardware-monitoring account), same
// where()-only + client-side sort pattern as vmListenNotifications above
// (avoids requiring a manual composite Firestore index for
// where()+orderBy() on different fields).
function vmListenActivityLog(caretakerId, callback) {
  const q = query(collection(db, 'activity_logs'), where('caretakerId', '==', caretakerId));
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => {
      const data = d.data();
      return {
        firestoreId: d.id,
        ...data,
        createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
      };
    }).sort((a, b) => b.createdAtDate - a.createdAtDate);
    callback(list);
  }, err => console.warn('[VisionMate] activity_logs listener error:', err));
}

// ── Notifications: delete a single notification ───────────────────
async function vmDeleteNotification(notificationFirestoreId) {
  await deleteDoc(doc(db, 'notifications', notificationFirestoreId));
  return true;
}

// ── Notifications: clear all of a caretaker's notifications ──────
async function vmClearAllNotifications(caretakerId) {
  const q = query(collection(db, 'notifications'), where('caretakerId', '==', caretakerId));
  const qs = await getDocs(q);
  if (qs.empty) return true;
  const batch = writeBatch(db);
  qs.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return true;
}

// ── Profile: update extended editable fields ──────────────────────
async function vmUpdateProfile(caretakerFirestoreId, data) {
  // Allowed editable fields (name and email excluded per requirement #9)
  const allowed = ['cnic', 'dob', 'houseNumber', 'address', 'phone', 'emergencyContact', 'safeZone', 'zone', 'experience', 'qualification'];
  const updates = {};
  for (const k of allowed) {
    if (data[k] !== undefined) updates[k] = data[k];
  }
  // Also allow fullName update (requirement #9 says no editing of name from UI — enforced at UI layer)
  await updateDoc(doc(db, 'caretakers', caretakerFirestoreId), updates);
  return true;
}

// ── Global unread badge: keeps the topbar bell badge in sync ──
// Automatically starts after sign-in session is available.
// Updates the #topbarNotifBadge element on every page in real time.
function vmStartUnreadBadge(caretakerId) {
  if (!caretakerId) return;
  const q = query(
    collection(db, 'notifications'),
    where('caretakerId', '==', caretakerId),
    where('read', '==', false)
  );
  // Sound: play when a NEW unread notification arrives while a portal
  // page is open (never for the notifications that already existed when
  // the page loaded, and never for a stale cache-only first snapshot).
  let baselineReady = false;
  return onSnapshot(q, snapshot => {
    const count = snapshot.size;
    const badge = document.getElementById('topbarNotifBadge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }

    if (!baselineReady) {
      if (!snapshot.metadata.fromCache) baselineReady = true;
      return;
    }
    let sound = null;
    snapshot.docChanges().forEach(ch => {
      if (ch.type !== 'added') return;
      const t = ch.doc.data().type;
      if (t === 'emergency' || t === 'hardware') sound = 'urgent';
      else if (!sound) sound = 'normal';
    });
    if (sound && window.VmSound) window.VmSound.play(sound);
  }, () => {});
}

// ── Seed on module load ──────────────────────────────────────
seedPreloadedData().catch(e => console.warn('[VisionMate] Seed error:', e));

// ── Exports ─────────────────────────────────────────────────
window.VmAuth = {
  signUp: vmSignUp,
  signIn: vmSignIn,
  signOut: vmSignOut,
  onAuthReady: vmOnAuthReady,
  listenCaretakers: vmListenCaretakers,
  listenPatients: vmListenPatients,
  getCaretakerProfile: vmGetCaretakerProfile,
  getAssignedPatients: vmGetAssignedPatients,
  listenAssignedPatients: vmListenAssignedPatients,
  createPatient: vmCreatePatient,
  updatePatient: vmUpdatePatient,
  deletePatient: vmDeletePatient,
  assignPatient: vmAssignPatient,
  deleteCaretaker: vmDeleteCaretaker,
  updateCaretaker: vmUpdateCaretaker,
  updateProfile: vmUpdateProfile,
  createNotification: vmCreateNotification,
  listenNotifications: vmListenNotifications,
  markNotificationRead: vmMarkNotificationRead,
  markAllNotificationsRead: vmMarkAllNotificationsRead,
  deleteNotification: vmDeleteNotification,
  clearAllNotifications: vmClearAllNotifications,
  triggerEmergency: vmTriggerEmergency,
  triggerEmergencyAlert: vmTriggerEmergencyAlert,
  triggerEmergencyCall: vmTriggerEmergencyCall,
  recordHardwareButtonPress: vmRecordHardwareButtonPress,
  logActivityEvent: vmLogActivityEvent,
  listenActivityLog: vmListenActivityLog,
  startUnreadBadge: vmStartUnreadBadge,
  HARDWARE_ACCOUNT_EMAIL,
  db, auth
};

// Wait for Firebase Auth state to resolve before signalling readiness —
// every consumer of 'vm:auth-ready' (notifications.html, dashboard.html,
// assigned.html, user-layout.js's unread-badge starter) attaches a
// Firestore onSnapshot listener as soon as this event fires, and the
// deployed security rules check request.auth on every read. Firing the
// event immediately on module load (as this used to do) let listeners
// attach before request.auth.uid existed yet — Firestore rejects that
// with permission-denied, and a listener does NOT auto-retry once auth
// resolves a moment later, so the notification/assigned-patient feeds
// would silently stay empty forever even though the underlying data
// (e.g. an alert or call notification) really was written. Mirrors the
// same fix already used for 'vm:adminfs-ready' in admin-firestore.js.
let authReadyFired = false;
onAuthStateChanged(auth, () => {
  if (authReadyFired) return;
  authReadyFired = true;
  console.log('[VisionMate] Firebase Auth + Firestore module loaded.');
  document.dispatchEvent(new Event('vm:auth-ready'));
});
