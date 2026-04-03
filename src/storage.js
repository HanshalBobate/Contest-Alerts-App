const KEYS = {
  USER: 'clist_user',
  KEY: 'clist_key',
  NTFY: 'ntfy_topic',
  ALERTS: 'alert_history',
  KEEP_ALIVE: 'keep_alive'
};

export const Storage = {
  getCredentials: () => ({
    user: localStorage.getItem(KEYS.USER) || '',
    key: localStorage.getItem(KEYS.KEY) || '',
    ntfy: localStorage.getItem(KEYS.NTFY) || ''
  }),

  saveCredentials: (user, key, ntfy) => {
    localStorage.setItem(KEYS.USER, user);
    localStorage.setItem(KEYS.KEY, key);
    localStorage.setItem(KEYS.NTFY, ntfy);
  },

  getKeepAlive: () => localStorage.getItem(KEYS.KEEP_ALIVE) === 'true',
  setKeepAlive: (val) => localStorage.setItem(KEYS.KEEP_ALIVE, val),

  isNotified: (contestId, threshold) => {
    const history = JSON.parse(localStorage.getItem(KEYS.ALERTS) || '{}');
    return history[contestId]?.includes(threshold);
  },

  markNotified: (contestId, threshold) => {
    const history = JSON.parse(localStorage.getItem(KEYS.ALERTS) || '{}');
    if (!history[contestId]) history[contestId] = [];
    if (!history[contestId].includes(threshold)) {
      history[contestId].push(threshold);
    }
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(history));
  },

  clearOldHistory: () => {
    // Basic cleanup - in a real app, clear based on date
    localStorage.removeItem(KEYS.ALERTS);
  }
};
