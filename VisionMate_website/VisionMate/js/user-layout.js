// ============================================================
//  VisionMate – User Portal Layout & Auth
//  user-layout.js  |  RBAC-aware nav + wording fix (v3)
//  NOTE: The word "Caretaker" must never appear anywhere in the
//        User Portal UI — the role is always shown as "User".
// ============================================================

const UserLayout = {
  baseNavItems: [
    { path: 'dashboard.html',    icon: 'bi-house-fill',     label: 'Dashboard'     },
    { path: 'assigned.html',     icon: 'bi-people-fill',    label: 'Patients'      },
    { path: 'monitoring.html',   icon: 'bi-activity',       label: 'Monitoring',  hwOnly: true },
    { path: 'notifications.html',icon: 'bi-bell-fill',      label: 'Notifications' },
    { path: 'profile.html',      icon: 'bi-person-circle',  label: 'Profile'       }
  ],

  // RBAC: Monitoring (Hardware Live Data) only shows for the
  // dedicated hardware-monitoring account (user.hwLinked === true).
  getNavItems(user) {
    const hwLinked = !!(user && user.hwLinked);
    return this.baseNavItems.filter(item => !item.hwOnly || hwLinked);
  },

  getSidebarHTML(activeLabel, user) {
    const name = (user && user.name) ? user.name : 'User';
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const hwLinked = !!(user && user.hwLinked);

    const navHtml = this.getNavItems(user).map(item => {
      const active = activeLabel === item.label ? 'active' : '';
      const badge  = (item.label === 'Monitoring' && hwLinked) ? '<span class="badge bg-danger ms-auto" style="font-size:0.6rem">LIVE</span>' : '';
      return `<a href="${item.path}" class="nav-link ${active}">
        <i class="bi ${item.icon}"></i>
        <span>${item.label}</span>
        ${badge}
      </a>`;
    }).join('');

    return `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <img src="../logo.png" alt="VisionMate Logo" />
        <div class="sidebar-logo-text">
          <h1>VisionMate</h1>
          <p>User Portal</p>
        </div>
      </div>
      <nav>${navHtml}</nav>
      <div class="sidebar-footer">
        <div class="d-flex align-items-center gap-2 px-2 mb-3" style="background:rgba(255,255,255,0.06);border-radius:0.5rem;padding:0.6rem 0.75rem !important;">
          <div class="user-pill-avatar" style="width:32px;height:32px;font-size:0.75rem;flex-shrink:0">${initials}</div>
          <div style="min-width:0">
            <div style="font-size:0.78rem;color:#fff;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
            <div style="font-size:0.68rem;color:rgba(255,255,255,0.5)">${hwLinked ? '⬤ HW Connected' : 'User'}</div>
          </div>
        </div>
        <button class="logout-btn" onclick="userLogout()">
          <i class="bi bi-box-arrow-left"></i><span>Logout</span>
        </button>
      </div>
    </div>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;
  },

  getTopbarHTML(pageTitle, pageSubtitle, user, notifCount = 0) {
    const name = (user && user.name) ? user.name : 'User';
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const badge = notifCount > 0 ? `<span class="notif-badge" id="topbarNotifBadge">${notifCount}</span>` : `<span class="notif-badge" id="topbarNotifBadge" style="display:none">0</span>`;
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
        <a href="notifications.html" class="notif-btn text-decoration-none">
          <i class="bi bi-bell-fill"></i>${badge}
        </a>
        <div class="user-pill">
          <div class="user-pill-text text-end">
            <p>${name}</p>
            <small>User</small>
          </div>
          <div class="user-pill-avatar">${initials}</div>
        </div>
      </div>
    </div>`;
  }
};

// ── Auth helpers ──────────────────────────────────────────────
function vmRequireUser() {
  try {
    const s = localStorage.getItem('vm_user_session');
    if (!s) { window.location.href = 'login.html'; return null; }
    return JSON.parse(s);
  } catch(e) { window.location.href = 'login.html'; return null; }
}

// RBAC guard: call at the top of monitoring.html so that only the
// dedicated hardware-monitoring account can view Hardware Live Data.
// Any other caretaker/user is redirected away immediately.
function vmRequireHardwareAccess(session) {
  if (!session || !session.hwLinked) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

async function userLogout() {
  if (window.VmAuth && window.VmAuth.signOut) {
    await window.VmAuth.signOut();
  } else {
    localStorage.removeItem('vm_user_session');
    localStorage.removeItem('vm_auth_uid');
    window.location.href = 'login.html';
  }
}

// ── Notification sound (VmSound) ──────────────────────────────
// Plays a notification tone when a NEW notification arrives (called from
// VmAuth.startUnreadBadge in firebase-auth.js). Emergency / hardware
// notifications play a louder, repeating siren so the caretaker notices.
// Browsers block audio until the user has interacted with the page, so
// if sound is still locked a small "enable sound" button is shown; any
// click / tap / key press on the page unlocks it automatically.
const VmSound = (() => {
  let ctx = null;
  let pendingKind = null;
  let btn = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    return ctx;
  }

  function tone(c, freq, start, dur, vol, type) {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(start); osc.stop(start + dur + 0.05);
  }

  function schedule(c, kind) {
    const t0 = c.currentTime + 0.05;
    if (kind === 'urgent') {
      // 4 rounds of a two-tone siren (~4.5 s)
      for (let i = 0; i < 4; i++) {
        const t = t0 + i * 1.1;
        tone(c, 880, t,        0.25, 0.5, 'square');
        tone(c, 660, t + 0.28, 0.25, 0.5, 'square');
        tone(c, 880, t + 0.56, 0.25, 0.5, 'square');
      }
      try { if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) {}
    } else {
      // gentle two-note "ding"
      tone(c, 660, t0,        0.18, 0.25, 'sine');
      tone(c, 880, t0 + 0.16, 0.30, 0.25, 'sine');
    }
  }

  function hideBtn() { if (btn) { btn.remove(); btn = null; } }

  function showBtn() {
    if (btn || !document.body) return;
    btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '🔔 Tap to enable alert sound';
    btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;border:none;' +
      'border-radius:999px;padding:.7rem 1.1rem;font-weight:600;color:#fff;cursor:pointer;' +
      'background:#DC2626;box-shadow:0 6px 20px rgba(0,0,0,.3)';
    btn.addEventListener('click', () => unlock(true));
    document.body.appendChild(btn);
  }

  // Try to start audio. Called on any user gesture and from the button.
  function unlock(playTest) {
    const c = getCtx();
    if (!c) return;
    const done = () => {
      if (c.state !== 'running') return;
      hideBtn();
      if (pendingKind) { const k = pendingKind; pendingKind = null; schedule(c, k); }
      else if (playTest === true) schedule(c, 'normal');
    };
    if (c.state === 'running') { done(); return; }
    c.resume().then(done).catch(() => {});
  }

  function play(kind) {
    const c = getCtx();
    if (!c) return;
    if (c.state === 'running') { schedule(c, kind); return; }
    // Audio still locked — remember the sound, ask for one tap.
    // (An urgent sound is never downgraded by a later normal one.)
    if (pendingKind !== 'urgent') pendingKind = kind;
    c.resume().catch(() => {});
    setTimeout(() => {
      if (c.state === 'running') { const k = pendingKind; pendingKind = null; if (k) schedule(c, k); }
      else showBtn();
    }, 250);
  }

  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    document.addEventListener(ev, () => unlock(false), { passive: true }));

  // On pages where audio is not yet unlocked, make sure the user is
  // prompted early (so the first real emergency can already ring).
  document.addEventListener('vm:auth-ready', () => {
    const c = getCtx();
    if (c && c.state !== 'running') setTimeout(() => { if (c.state !== 'running') showBtn(); }, 1200);
  });

  return { play, unlock };
})();
window.VmSound = VmSound;

// ── Auto-start the unread notification badge updater ──────────
// Fires after firebase-auth.js loads and dispatches vm:auth-ready.
// Works on every page that includes user-layout.js.
document.addEventListener('vm:auth-ready', () => {
  try {
    const s = JSON.parse(localStorage.getItem('vm_user_session') || '{}');
    if (s.id && window.VmAuth && VmAuth.startUnreadBadge) {
      VmAuth.startUnreadBadge(s.id);
    }
  } catch(e) { /* ignore */ }
});

// ── Sidebar mobile toggle ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hbBtn   = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (hbBtn && sidebar) {
    hbBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay && overlay.classList.toggle('show');
    });
    overlay && overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay && overlay.classList.remove('show');
    });
  }
});

// ── Shared helpers ─────────────────────────────────────────────
function getInitialU(name) {
  return (name || '?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
}
function monBadgeU(status) {
  const map = {
    'Active':    'bg-success',
    'Monitoring':'bg-info',
    'Stable':    'bg-primary',
    'Critical':  'bg-danger',
    'Inactive':  'bg-secondary'
  };
  return `<span class="badge ${map[status]||'bg-secondary'}">${status}</span>`;
}

window.UserLayout    = UserLayout;
window.vmRequireUser = vmRequireUser;
window.vmRequireHardwareAccess = vmRequireHardwareAccess;
window.userLogout    = userLogout;
window.getInitialU   = getInitialU;
window.monBadgeU     = monBadgeU;
