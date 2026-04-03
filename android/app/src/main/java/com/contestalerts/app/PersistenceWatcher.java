package com.contestalerts.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class PersistenceWatcher extends BroadcastReceiver {
    private static final String TAG = "PersistenceWatcher";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Watchdog heartbeat triggered...");

        // Check if the app is alive or if the service should be restarted
        // Starting the activity is the most reliable way to restore the full monitoring environment
        Intent i = new Intent(context, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        i.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        
        try {
            // We only want to start the activity if it's not already in foreground
            // But for Capacitor, we often just "ping" it.
            context.startActivity(i);
            Log.d(TAG, "Activity pinged via Watchdog");
        } catch (Exception e) {
            Log.e(TAG, "Failed to restore activity: " + e.getMessage());
        }

        // Schedule next check
        scheduleNext(context);
    }

    public static void scheduleNext(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, PersistenceWatcher.class);
        intent.setAction("com.contestalerts.app.ALARM_PING");
        
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 777, intent, flags);
        
        // Schedule for 15 minutes from now (Android system minimum for repeating/frequent alarms)
        long triggerTime = System.currentTimeMillis() + (15 * 60 * 1000); 

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
        }
    }
}
