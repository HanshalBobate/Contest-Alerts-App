package com.contestalerts.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register the local persistence plugin
        try {
            registerPlugin(BatteryOptimizationPlugin.class);
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Plugin registration failed: " + e.getMessage());
        }
        
        // Safe arming of background persistence with a tiny delay
        new android.os.Handler().postDelayed(() -> {
            try {
                Intent watchdog = new Intent(this, WatchdogService.class);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    startService(watchdog);
                } else {
                    startService(watchdog);
                }
                android.util.Log.d("MainActivity", "WatchdogService started.");
            } catch (Exception e) {
                android.util.Log.w("MainActivity", "Watchdog startup deferred: " + e.getMessage());
            }
        }, 3000); // 3 sec delay
        
        // Schedule next heartbeat
        try {
            PersistenceWatcher.scheduleNext(this);
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to schedule Watchdog: " + e.getMessage());
        }
    }
}
