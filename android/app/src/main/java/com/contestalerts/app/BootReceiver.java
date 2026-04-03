package com.contestalerts.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || 
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            Log.d("BootReceiver", "Boot completed, starting Contest Alerts...");

            // Start the main activity to trigger the JS logic and foreground service
            Intent i = new Intent(context, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            
            try {
                context.startActivity(i);
            } catch (Exception e) {
                Log.e("BootReceiver", "Failed to start activity: " + e.getMessage());
                // Fallback: Try starting the service directly if activity fails
                // But starting JS typically needs the WebView in the Activity
            }
        }
    }
}
