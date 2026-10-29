// ============================================================
//  VisionMate – Admin Firestore Real-time Module
//  admin-firestore.js  |  Live listeners for Admin Portal (v2)
// ============================================================

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore, collection, onSnapshot, doc, getDoc, updateDoc, deleteDoc,
  setDoc, addDoc, query, where, getDocs, arrayUnion, arrayRemove, serverTimestamp, orderBy
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const AUTH_CONFIG = {
  apiKey: "AIzaSyD6jVwkx113T305BJZoEOSrI8BcKocUOFQ",
  authDomain: "visionmatefinal.firebaseapp.com",
  projectId: "visionmatefinal",
  storageBucket: "visionmatefinal.firebasestorage.app",
  messagingSenderId: "146422566914",
  appId: "1:146422566914:web:18cf57faa13a38825b571b"
};

const existingApp = getApps().find(a => a.name === 'vm-auth');
const adminApp = existingApp || initializeApp(AUTH_CONFIG, 'vm-auth');
const db = getFirestore(adminApp);

// ── Real-time caretaker listener ─────────────────────────────
// Excludes admin accounts: vmEnsureAdminFirebaseAuth (js/layout.js) now
// stores the signed-in admin's own profile in this same `caretakers`
// collection (tagged isAdmin: true) so Firestore rules can recognize
// them. Every consumer of this listener (caretaker tables, zone charts,
// stat counts) expects real caretaker records only, so the filter lives
// here once rather than being repeated in every admin page.
function listenCaretakers(callback) {
  return onSnapshot(collection(db, 'caretakers'), snapshot => {
    const list = snapshot.docs
      .filter(d => !d.data().isAdmin)
      .map(d => ({
        firestoreId: d.id,
        ...d.data(),
        // Normalise timestamp fields to string
        lastLoginAt: d.data().lastLoginAt?.toDate?.()?.toLocaleString('en-PK') || '—',
        lastLogoutAt: d.data().lastLogoutAt?.toDate?.()?.toLocaleString('en-PK') || '—',
        accountCreatedAt: d.data().accountCreatedAt?.toDate?.()?.toLocaleString('en-PK') || d.data().registrationDate || '—'
      }));
    callback(list);
  });
}

// ── Real-time patient listener ───────────────────────────────
function listenPatients(callback) {
  return onSnapshot(collection(db, 'patients'), snapshot => {
    const list = snapshot.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    callback(list);
  });
}

// ── Get patients by caretaker ────────────────────────────────
async function getPatientsForCaretaker(caretakerId) {
  const q = query(collection(db, 'patients'), where('assignedCaretakerId', '==', caretakerId));
  const qs = await getDocs(q);
  return qs.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
}

// ── Real-time notification helper (mirrors firebase-auth.js) ───
// Kept here too since admin/patients.html writes assignments through
// this module directly, not through js/firebase-auth.js.
async function notifyCaretaker(caretakerId, { type, title, body, patientName, patientId, status, contactName, contactNumber, triggeredBy }) {
  if (!caretakerId) return;
  await addDoc(collection(db, 'notifications'), {
    caretakerId,
    type: type || 'system',
    title: title || 'Notification',
    body: body || '',
    patientName: patientName || null,
    patientId: patientId || null,
    status: status || null,
    contactName: contactName || null,
    contactNumber: contactNumber || null,
    triggeredBy: triggeredBy || null,
    read: false,
    createdAt: serverTimestamp()
  }).catch(e => console.warn('[VisionMate] Notification create failed:', e));
}

// ── Admin: Assign / reassign / unassign a patient ─────────────
async function assignPatient(patientFirestoreId, newCaretakerId, newCaretakerName) {
  const patSnap = await getDoc(doc(db, 'patients', patientFirestoreId));
  if (!patSnap.exists()) throw new Error('Patient not found.');
  const prevCaretakerId = patSnap.data().assignedCaretakerId;
  const patientName = patSnap.data().patientName || patSnap.data().name || 'A patient';

  if (prevCaretakerId && prevCaretakerId !== newCaretakerId) {
    await updateDoc(doc(db, 'caretakers', prevCaretakerId), {
      assignedPatientIds: arrayRemove(patientFirestoreId)
    }).catch(() => {});
  }

  await updateDoc(doc(db, 'patients', patientFirestoreId), {
    assignedCaretakerId: newCaretakerId || null,
    assignedCaretakerName: newCaretakerName || null
  });

  if (newCaretakerId) {
    await updateDoc(doc(db, 'caretakers', newCaretakerId), {
      assignedPatientIds: arrayUnion(patientFirestoreId)
    }).catch(() => {});

    // Real-time notification — only on an actual new assignment.
    if (newCaretakerId !== prevCaretakerId) {
      await notifyCaretaker(newCaretakerId, {
        type: 'assignment',
        title: 'Patient Assigned',
        body: `${patientName} has been assigned to you by the Administrator.`
      });
    }
  }
  return true;
}

// ── Admin: Create a new patient ───────────────────────────────
async function createPatient(patientData) {
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
    await notifyCaretaker(record.assignedCaretakerId, {
      type: 'assignment',
      title: 'New Patient Assigned',
      body: `${record.patientName || 'A new patient'} has been assigned to you.`,
      triggeredBy: 'System (Admin)'
    });
  }
  return { firestoreId: id, ...record };
}

// ── Admin: Update a patient record ────────────────────────────
async function updatePatient(patientFirestoreId, data) {
  await updateDoc(doc(db, 'patients', patientFirestoreId), data);
  return true;
}

// ── Admin: Delete a patient record ────────────────────────────
async function deletePatient(patientFirestoreId, caretakerId) {
  await deleteDoc(doc(db, 'patients', patientFirestoreId));
  if (caretakerId) {
    await updateDoc(doc(db, 'caretakers', caretakerId), {
      assignedPatientIds: arrayRemove(patientFirestoreId)
    }).catch(() => {});
  }
  return true;
}

// ── Admin: Delete a caretaker account (admin-only) ─────────────
async function deleteCaretaker(caretakerFirestoreId) {
  const q = query(collection(db, 'patients'), where('assignedCaretakerId', '==', caretakerFirestoreId));
  const qs = await getDocs(q);
  await Promise.all(qs.docs.map(d => updateDoc(doc(db, 'patients', d.id), {
    assignedCaretakerId: null, assignedCaretakerName: null
  })));
  await deleteDoc(doc(db, 'caretakers', caretakerFirestoreId));
  return true;
}

// ── Admin: Update caretaker info ────────────────────────────────
async function updateCaretaker(caretakerFirestoreId, data) {
  await updateDoc(doc(db, 'caretakers', caretakerFirestoreId), data);
  return true;
}

// ── Admin: Listen to ALL notifications across all caretakers ──
function listenAllNotifications(callback, maxResults = 100) {
  // Import orderBy + limit dynamically to avoid breaking existing imports
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const list = snap.docs.slice(0, maxResults).map(d => {
      const data = d.data();
      return { firestoreId: d.id, ...data,
        createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() };
    });
    callback(list);
  }, err => console.warn('[AdminFS] All-notifications listener error:', err));
}

// ── Admin: Update a patient record (including caregiver info) ──
async function updatePatientFull(patientFirestoreId, data) {
  await updateDoc(doc(db, 'patients', patientFirestoreId), data);
  return true;
}

// ── Admin: Permanently delete a notification / activity item ──
async function deleteNotification(notificationFirestoreId) {
  await deleteDoc(doc(db, 'notifications', notificationFirestoreId));
  return true;
}

// ── Admin: Login & Signup History (auth_history collection) ────
// One event per signup/login (written by js/firebase-auth.js), kept
// separate from the caretaker's own profile document so deleting a
// history record never touches the actual caretaker account. Newest
// entries first via orderBy('createdAt','desc').
function listenAuthHistory(callback, maxResults = 200) {
  const q = query(collection(db, 'auth_history'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const list = snap.docs.slice(0, maxResults).map(d => {
      const data = d.data();
      return {
        firestoreId: d.id, ...data,
        createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
      };
    });
    callback(list);
  }, err => console.warn('[AdminFS] auth_history listener error:', err));
}

// ── Admin: Permanently delete a login/signup history record ────
async function deleteAuthHistoryRecord(recordFirestoreId) {
  await deleteDoc(doc(db, 'auth_history', recordFirestoreId));
  return true;
}

// ── Admin: Daily Patient Activity Report — all events, all caretakers ──
// Real-time, newest-first (client-side sort, same reasoning as
// listenAllNotifications: avoids a manual composite index). Powers the
// Admin Portal's read-only view of the hardware-account's auto-generated
// daily activity report; entries are written by js/firebase-auth.js
// (vmLogActivityEvent) and are never deleted, so full history is always
// available here.
function listenActivityLog(callback, maxResults = 500) {
  const q = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => {
    const list = snap.docs.slice(0, maxResults).map(d => {
      const data = d.data();
      return { firestoreId: d.id, ...data,
        createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() };
    });
    callback(list);
  }, err => console.warn('[AdminFS] activity_logs listener error:', err));
}

window.AdminFS = {
  listenCaretakers, listenPatients, getPatientsForCaretaker,
  listenAllNotifications, deleteNotification,
  listenAuthHistory, deleteAuthHistoryRecord,
  listenActivityLog,
  assignPatient, createPatient, updatePatient, updatePatientFull, deletePatient,
  deleteCaretaker, updateCaretaker
};

// Wait for Firebase Auth state to resolve before signalling readiness —
// the Admin Portal now signs into Firebase Auth on login (see
// js/layout.js → vmEnsureAdminFirebaseAuth), and Firestore security
// rules check request.auth on every read/write. Firing 'vm:adminfs-ready'
// before that auth state is known would let listeners attach with no
// auth token yet, which the deployed rules would reject.
const adminAuth = getAuth(adminApp);
let adminFsReadyFired = false;
onAuthStateChanged(adminAuth, () => {
  if (adminFsReadyFired) return;
  adminFsReadyFired = true;
  document.dispatchEvent(new Event('vm:adminfs-ready'));
  console.log('[VisionMate] Admin Firestore module loaded.');
});
