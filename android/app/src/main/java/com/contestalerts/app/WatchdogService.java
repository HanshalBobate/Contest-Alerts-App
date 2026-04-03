package com.contestalerts.app;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

public class WatchdogService extends Service {
    private static final String TAG = "WatchdogService";
    private PowerManager.WakeLock wakeLock;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ContestAlerts::WatchdogLock");
        wakeLock.acquire();
        Log.d(TAG, "WatchdogService started with WakeLock.");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.w(TAG, "TASK_REMOVED (Swiped). Initiating absolute recovery...");
        
        // Use AlarmManager for a system-level heartbeat pulse
        PersistenceWatcher.scheduleNext(this);
        
        // Force-restore the activity which re-arms the Foreground Monitor
        Intent i = new Intent(this, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        i.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        try {
            startActivity(i);
        } catch (Exception e) {
            Log.e(TAG, "Recovery startup failed: " + e.getMessage());
        }
        
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }
}
