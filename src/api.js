import { Storage } from './storage';

const API_BASE = 'https://clist.by/api/v1/contest/';

export const Api = {
  fetchContests: async () => {
    const { user, key } = Storage.getCredentials();
    if (!user || !key) throw new Error('Missing CLIST credentials');

    const now = new File([new Date().toISOString()], 'now.txt').name; // Just for a clean ISO string
    const isoNow = new Date().toISOString().split('.')[0]; 
    
    // Using a proxy or direct fetch if allowed (clist usually allows JS if API key is provided)
    // Note: In a browser, CORS might be an issue. If so, a simple proxy would be needed.
    // However, clist API is intended for client-side integration in many cases.
    
    const url = `${API_BASE}?username=${user}&api_key=${key}&start__gt=${isoNow}&order_by=start&limit=20`;
    console.log('🚀 [CLIST API URL]', url);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const contests = data.objects || [];
      contests.forEach(c => {
        if (c.start && !c.start.includes('Z')) c.start = c.start.replace(' ', 'T') + 'Z';
        if (c.end && !c.end.includes('Z')) c.end = c.end.replace(' ', 'T') + 'Z';
      });
      console.log('📦 [API DATA RECEIVED]', contests.length, 'items');
      return contests;
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  },

  getThresholds: (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = start - now;
    const diffMins = Math.floor(diffMs / 1000 / 60);

    const thresholds = [];
    if (diffMins <= 0 && diffMins > -10) thresholds.push('IMMEDIATE');
    if (diffMins <= 60 && diffMins > 50) thresholds.push('1H');
    if (diffMins <= 360 && diffMins > 350) thresholds.push('6H');
    if (diffMins <= 1440 && diffMins > 1430) thresholds.push('24H');

    return thresholds;
  }
};
