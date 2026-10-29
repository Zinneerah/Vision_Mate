// ============================================================
//  VisionMate – Admin-Only Layout & Auth
//  layout.js
// ============================================================

const PortalLayout = {
  adminNavItems: [
    { path: 'dashboard.html',  icon: 'bi-speedometer2',           label: 'Dashboard'   },
    { path: 'zones.html',      icon: 'bi-map-fill',               label: 'Zones'       },
    { path: 'caretakers.html', icon: 'bi-shield-fill-check',      label: 'Caretakers'  },
    { path: 'patients.html',   icon: 'bi-person-fill',            label: 'Patients'    },
    { path: 'monitoring.html', icon: 'bi-activity',               label: 'Monitoring'  },
    { path: 'activity.html',   icon: 'bi-bell-fill',              label: 'Notifications & Activity' },
    { path: 'settings.html',   icon: 'bi-gear-fill',              label: 'Settings'    }
  ],

  getSidebarHTML(activeLabel) {
    const navHtml = this.adminNavItems.map(item => {
      const active = activeLabel === item.label ? 'active' : '';
      return `<a href="${item.path}" class="nav-link ${active}"><i class="bi ${item.icon}"></i><span>${item.label}</span></a>`;
    }).join('');

    return `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="../logo.png" alt="VisionMate Logo" />
        <div class="sidebar-logo-text">
          <h1>VisionMate</h1>
          <p>Admin Portal</p>
        </div>
      </div>
      <nav>${navHtml}</nav>
      <div class="sidebar-footer">
        <button class="logout-btn" onclick="vmLogout()">
          <i class="bi bi-box-arrow-left"></i><span>Logout</span>
        </button>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;
  },

  getTopbarHTML(pageTitle, pageSubtitle = '') {
    const user = JSON.parse(localStorage.getItem('vm_admin_session') || '{}');
    const name = user.name || 'Administrator';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    return `
    <div class="topbar">
      <div class="d-flex align-items-center gap-3">
        <button class="hamburger-btn" id="hamburgerBtn"><i class="bi bi-list"></i></button>
        <div>
          <h2 class="m-0">${pageTitle}</h2>
          ${pageSubtitle ? `<p class="m-0">${pageSubtitle}</p>` : ''}
        </div>
      </div>
      <div class="topbar-actions">
        <div class="user-pill">
          <div class="user-pill-text text-end">
            <p>${name}</p>
            <small>Administrator</small>
          </div>
          <div class="user-pill-avatar">${initials}</div>
        </div>
      </div>
    </div>`;
  }
};

// ── Auth helpers ────────────────────────────────────────────
function vmRequireAdmin() {
  const s = localStorage.getItem('vm_admin_session');
  if (!s) { window.location.href = 'login.html'; return null; }
  return JSON.parse(s);
}

function vmLogout() {
  localStorage.removeItem('vm_admin_session');
  // Best-effort sign-out of the Firebase Auth session established on
  // login (see vmEnsureAdminFirebaseAuth) — non-blocking, since the
  // portal-level session removal above is what actually gates access.
  import("https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js").then(authMod => {
    import("https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js").then(appMod => {
      const existing = appMod.getApps().find(a => a.name === 'vm-auth');
      if (existing) authMod.signOut(authMod.getAuth(existing)).catch(() => {});
    });
  }).catch(() => {});
  window.location.href = 'login.html';
}

// ── Admin credential verification ────────────────────────────
// Verifies against Firestore collection 'admin_accounts' so the
// admin account is a real, manageable record rather than a value
// hard-coded in login.html. A bootstrap default is seeded once if
// the collection is empty, so a fresh deployment always has one
// working admin login; change the password afterwards via Firestore
// or extend settings.html with an "Update Admin Password" form.
//
// In addition to the existing admin_accounts check (unchanged, still
// what gates access into the Admin Portal UI), this also establishes a
// real Firebase Auth session for the admin and tags their `caretakers`
// doc with isAdmin: true. Firestore security rules check
// request.auth != null for every read/write — the Admin Portal
// previously never signed in at all, so every notification/emergency/
// patient query it made was rejected by the deployed rules regardless
// of the admin_accounts check passing. This closes that gap without
// loosening any of the per-caretaker isolation rules: the admin's own
// Firebase Auth account is real and rule-checked just like any
// caretaker's, just with the added isAdmin flag the rules can key off.
const ADMIN_AUTH_CONFIG = {
  apiKey: "AIzaSyD6jVwkx113T305BJZoEOSrI8BcKocUOFQ",
  authDomain: "visionmatefinal.firebaseapp.com",
  projectId: "visionmatefinal",
  storageBucket: "visionmatefinal.firebasestorage.app",
  messagingSenderId: "146422566914",
  appId: "1:146422566914:web:18cf57faa13a38825b571b"
};

async function vmEnsureAdminFirebaseAuth(email, password, name) {
  const authMod = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js");
  const fsMod   = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js");
  const appMod  = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js");

  const existing = appMod.getApps().find(a => a.name === 'vm-auth');
  const app = existing || appMod.initializeApp(ADMIN_AUTH_CONFIG, 'vm-auth');
  const auth = authMod.getAuth(app);
  const db   = fsMod.getFirestore(app);

  let uid;
  try {
    const cred = await authMod.signInWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
  } catch (signInErr) {
    // First time this admin account signs in via Firebase Auth (it may
    // already exist as an admin_accounts Firestore record, but never as
    // a Firebase Auth user) — create the Auth account now, keyed to the
    // same email/password already verified against admin_accounts above.
    if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
      const cred = await authMod.createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
    } else {
      throw signInErr;
    }
  }

  // Tag (or create) the caretakers-collection doc for this uid with
  // isAdmin: true, merged so it never clobbers an existing record.
  await fsMod.setDoc(fsMod.doc(db, 'caretakers', uid), {
    uid, email, fullName: name || 'Administrator', role: 'admin', isAdmin: true
  }, { merge: true });

  return uid;
}

async function vmVerifyAdminCredentials(email, password) {
  try {
    const mod = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js");
    const fsMod = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js");
    const existing = mod.getApps().find(a => a.name === 'vm-auth');
    const app = existing || mod.initializeApp(ADMIN_AUTH_CONFIG, 'vm-auth');
    const db = fsMod.getFirestore(app);

    const snap = await fsMod.getDocs(fsMod.collection(db, 'admin_accounts'));
    let result;
    if (snap.empty) {
      // Bootstrap a default admin account on first run only.
      await fsMod.setDoc(fsMod.doc(db, 'admin_accounts', 'admin_default'), {
        email: 'admin@visionmate.com',
        password: 'admin123', // change this via Firestore console after first login
        name: 'System Administrator',
        createdAt: new Date().toISOString()
      });
      result = (email === 'admin@visionmate.com' && password === 'admin123')
        ? { ok: true, name: 'System Administrator' } : { ok: false };
    } else {
      const match = snap.docs.find(d => d.data().email === email && d.data().password === password);
      result = match ? { ok: true, name: match.data().name || 'Administrator' } : { ok: false };
    }

    if (result.ok) {
      // Establish the real Firebase Auth session behind the scenes —
      // the existing admin_accounts check above is still what gates the
      // login UI; this just makes request.auth non-null for every
      // subsequent Firestore call the Admin Portal makes.
      try {
        const uid = await vmEnsureAdminFirebaseAuth(email, password, result.name);
        result.uid = uid;
      } catch (authErr) {
        console.warn('[VisionMate] Admin Firebase Auth session could not be established:', authErr.message);
        // Don't block the admin out of the portal UI over this — but log
        // it clearly, since Firestore reads/writes will be rejected by
        // security rules without it.
      }
    }
    return result;
  } catch (e) {
    console.warn('[VisionMate] Admin verification fell back to local check:', e.message);
    // Network/Firestore unavailable — fail safe to no access rather than
    // silently granting access.
    return { ok: false, error: e.message };
  }
}
window.vmVerifyAdminCredentials = vmVerifyAdminCredentials;

// ── Sidebar mobile toggle ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hbBtn    = document.getElementById('hamburgerBtn');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  if (hbBtn && sidebar) {
    hbBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay && overlay.classList.toggle('show');
    });
    overlay && overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }
  // Update topbar date
  const dateEl = document.getElementById('topbarDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-PK', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
});

// ── Shared helpers ────────────────────────────────────────────
function getInitial(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
}
function statusBadge(status) {
  const cls = status === 'Active' ? 'bg-success' : 'bg-secondary';
  return `<span class="badge ${cls}">${status}</span>`;
}
function monBadge(status) {
  const cls = status === 'Active' ? 'bg-success' : 'bg-secondary';
  return `<span class="badge ${cls}">${status}</span>`;
}
function hwBadge() {
  return `<span class="badge ms-1" style="background:var(--warning);color:#000"><i class="bi bi-cpu-fill me-1"></i>HW</span>`;
}
