import { Storage } from './storage';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

export const Alerts = {
  startHighAlert: (title, body) => {
    // 1. Browser Notification (Foreground)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        tag: 'contest-alert',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200, 100, 500]
      });
    }

    // 2. Local Native Notification (Background Ready)
    LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id: Math.floor(Math.random() * 1000000),
        schedule: { at: new Date(Date.now() + 1000) },
        sound: 'alarm.wav', // Custom sound if provided later
        actionTypeId: 'OPEN_APP',
        extra: { type: 'high_alert' }
      }]
    });

    // 3. Vibration (Native)
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 1000]);
    }

    // 4. Remote Push via NTFY.SH (Optional Backup)
    const { ntfy } = Storage.getCredentials();
    if (ntfy) {
      fetch(`https://ntfy.sh/${ntfy}`, {
        method: 'POST',
        body,
        headers: {
          'Title': title,
          'Priority': 'urgent',
          'Tags': 'warning,alarm'
        }
      }).catch(e => console.error('Ntfy push fail:', e));
    }
  },

  stopHighAlert: () => {
    if ('vibrate' in navigator) navigator.vibrate(0);
  },

  requestPermissions: async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
    await LocalNotifications.requestPermissions();
    await ForegroundService.requestPermissions();

    // Create high-priority channel for Android
    await LocalNotifications.createChannel({
      id: 'contest_alerts',
      name: 'Contest Alerts',
      description: 'Urgent contest start reminders',
      importance: 5,
      visibility: 1,
      vibration: true
    });
  },

  showSummary: async (title, body, ongoing = false, id = 999999) => {
    await LocalNotifications.schedule({
      notifications: [{
        title,
        body, 
        id: id,
        schedule: { at: new Date(Date.now() + 100) },
        channelId: 'contest_alerts',
        ongoing: ongoing, 
        autoCancel: false,
        smallIcon: 'ic_launcher',
        largeIcon: 'ic_launcher',
        android: {
          ongoing: ongoing,
          autoCancel: false,
          importance: 5,
          visibility: 1,
          priority: 2,
          smallIcon: 'ic_launcher',
          style: 'bigtext',
          bigText: body
        }
      }]
    });
  }
};
