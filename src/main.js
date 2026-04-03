import './style.css';
import { Storage } from './storage';
import { Api } from './api';
import { Alerts } from './alerts';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { registerPlugin } from '@capacitor/core';

// --- State ---
let monitoringInterval = null;
let lastPeriodicNotifyTime = 0;
let contests = [];
let appIsActive = true;

const BatteryOptimization = registerPlugin('BatteryOptimization');

const UI = {
  navBtns: document.querySelectorAll('.nav-btn'),
  views: document.querySelectorAll('.view'),
  statusBadge: document.getElementById('status-badge'),
  apiForm: document.getElementById('api-form'),
  clistUser: document.getElementById('clist-user'),
  clistKey: document.getElementById('clist-key'),
  ntfyTopic: document.getElementById('ntfy-topic'),
  contestsList: document.getElementById('contests-list'),
  btnTestAlert: document.getElementById('btn-test-alert'),
  toggleKeepAlive: document.getElementById('toggle-keep-alive'),
  webviewFrame: document.getElementById('clist-frame'),
  webviewFallback: document.getElementById('iframe-fallback'),
  alertOverlay: document.getElementById('alert-overlay'),
  btnStopAlert: document.getElementById('btn-stop-alert'),
  btnRequestPerms: document.getElementById('btn-request-perms')
};

// --- View Navigation ---
UI.navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.view;
    UI.navBtns.forEach(b => b.classList.toggle('active', b === btn));
    UI.views.forEach(v => v.classList.toggle('active', v.id === `view-${target}`));

    if (target === 'webview' && UI.webviewFrame.src === 'about:blank') {
      UI.webviewFrame.src = 'https://clist.by/';
    }
  });
});

// --- API & Monitoring ---
const updateStatus = (text, type = 'info') => {
  if (!UI.statusBadge) return;
  UI.statusBadge.innerText = text;
  UI.statusBadge.style.color = type === 'error' ? '#ef4444' : '#22c55e';
};

const renderContests = (contests) => {
  if (!UI.contestsList) return;
  if (!contests || contests.length === 0) {
    UI.contestsList.innerHTML = '<p class="empty-msg">No upcoming contests found.</p>';
    return;
  }

  UI.contestsList.innerHTML = contests.map((c, i) => {
    try {
      const startTime = new Date(c.start);
      const diff = startTime - new Date();
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const mins = Math.floor((diff / 1000 / 60) % 60);

      const rName = (c.resource && c.resource.name) ? c.resource.name : (c.resource || 'Unknown');

      let timeClass = '';
      if (hours < 1) timeClass = 'starting-now';
      else if (hours < 6) timeClass = 'starting-soon';

      return `
        <div class="contest-card">
          <div class="contest-info">
            <h3>${c.event || 'Untitled Contest'}</h3>
            <p>${rName} | ${startTime.toLocaleString()}</p>
          </div>
          <div class="contest-time ${timeClass}">
            ${hours}h ${mins}m
          </div>
        </div>
      `;
    } catch (err) {
      console.error(`Error rendering contest item ${i}:`, err);
      return '';
    }
  }).join('');
};

const monitorLoop = async () => {
  try {
    updateStatus('Monitoring...', 'success');
    contests = await Api.fetchContests();
    renderContests(contests);

    // 1. High Alerts check
    contests.forEach(contest => {
      const thresholds = Api.getThresholds(contest.start);
      thresholds.forEach(t => {
        if (!Storage.isNotified(contest.id, t)) {
          triggerHighAlert(contest.event, t);
          Storage.markNotified(contest.id, t);
        }
      });
    });

    // 2. Periodic Summary (Every loop to ensure persistence)
    sendPeriodicSummary(contests);
    lastPeriodicNotifyTime = Date.now();
  } catch (err) {
    updateStatus('API Error', 'error');
    console.error(err);
  }
};

const triggerHighAlert = (contestName, threshold) => {
  const title = `🚨 CONTEST ALERT [${threshold}]`;
  const body = `${contestName} starts soon! GET READY.`;

  UI.alertOverlay.classList.remove('hidden');
  document.getElementById('alert-title').innerText = title;
  document.getElementById('alert-body').innerText = body;

  Alerts.startHighAlert(title, body);
};

const initBackgroundService = async (summaryText = 'Monitoring active...') => {
  try {
    const { display } = await ForegroundService.checkPermissions();
    if (display !== 'granted') {
      await ForegroundService.requestPermissions();
    }

    await ForegroundService.startForegroundService({
      id: 123456,
      title: 'Contest Alerts (Boat Mode)',
      body: summaryText,
      smallIcon: 'ic_launcher',
      importance: 3 // Higher priority
    });
    console.log('Foreground Service started/updated');
    UI.btnRequestPerms?.classList.add('hidden');
  } catch (err) {
    console.error('Failed to start Foreground Service:', err);
  }
};

const sendPeriodicSummary = (contests) => {
  const upcoming = contests.filter(c => new Date(c.start) > new Date());
  if (upcoming.length === 0) {
    Alerts.showSummary("No Upcoming Contests", "Check back later!", true);
    initBackgroundService("No contests found.");
    return;
  }

  const page = upcoming.slice(0, 5).reverse(); // 💥 reverse kar diya

  page.forEach((c, i) => {
    const diff = new Date(c.start) - new Date();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const nid = 2000 + (i + 1);

    // 👇 numbering bhi reverse
    const displayIndex = page.length - i;

    const ntitle = `🚨  ${c.event} starts in ${timeStr}`;
    const nbody = `${c.resource.name || c.resource}`;

    Alerts.showSummary(ntitle, nbody, true, nid);
  });

  const mirrorText = page.map((c, i) => `[${i + 1}] ${c.event.slice(0, 10)}..`).join(' | ');
  initBackgroundService(mirrorText);
};

const checkPermissions = async () => {
  try {
    const { display } = await ForegroundService.checkPermissions();
    if (display === 'granted') {
      UI.btnRequestPerms?.classList.add('hidden');
    } else {
      UI.btnRequestPerms?.classList.remove('hidden');
    }

    // No battery optimization check needed here anymore
  } catch (e) {
    console.error('Permission check failed', e);
  }
};


// --- Event Listeners ---
UI.apiForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  // Auto-trim spaces to avoid 401 errors
  const user = UI.clistUser.value.trim();
  const key = UI.clistKey.value.trim();
  const ntfy = UI.ntfyTopic.value.trim();

  Storage.saveCredentials(user, key, ntfy);
  Alerts.requestPermissions();
  if (monitoringInterval) clearInterval(monitoringInterval);
  monitorLoop();
  monitoringInterval = setInterval(monitorLoop, 1000 * 60 * 5); // 5 mins
  updateStatus('Settings Saved', 'success');
});

UI.btnTestAlert?.addEventListener('click', async () => {
  await Alerts.requestPermissions();
  if (contests.length > 0) {
    sendPeriodicSummary(contests);
    lastPeriodicNotifyTime = Date.now();
  } else {
    await monitorLoop();
    sendPeriodicSummary(contests);
  }
});

UI.btnRequestPerms?.addEventListener('click', async () => {
  await Alerts.requestPermissions();
  await initBackgroundService();
  checkPermissions();
});

UI.btnStopAlert?.addEventListener('click', () => {
  Alerts.stopHighAlert();
  UI.alertOverlay.classList.add('hidden');
});

UI.toggleKeepAlive?.addEventListener('change', (e) => {
  const active = e.target.checked;
  Storage.setKeepAlive(active);
  if (active) initBackgroundService();
});

// --- Initial Load ---
const init = async () => {
  const { user, key, ntfy } = Storage.getCredentials();
  if (user && key) {
    UI.clistUser.value = user;
    UI.clistKey.value = key;
    UI.ntfyTopic.value = ntfy;

    // Load from cache first if available (immediate UI feedback)
    if (contests.length > 0) {
      sendPeriodicSummary(contests);
    }

    await monitorLoop();
    sendPeriodicSummary(contests); // Force update on first run

    monitoringInterval = setInterval(monitorLoop, 1000 * 60 * 5);

    // Auto-start active monitoring if it was previously enabled
    if (Storage.getKeepAlive()) {
      UI.toggleKeepAlive.checked = true;
      await initBackgroundService();

      // If we just loaded and were in background, minimize
      const { isActive } = await App.getState();
      if (!isActive) {
        setTimeout(() => App.minimizeApp(), 2000);
      }
    }
  } else {
    updateStatus('Waiting for API credentials', 'info');
  }
  checkPermissions();
};

init();

// App state management
App.addListener('appStateChange', ({ isActive }) => {
  appIsActive = isActive;
  console.log('App state changed. Active:', isActive);
});
