# --- Quality Settings ---
$iconSource = "resources/icon.png"
$splashSource = "resources/splash.png"
$resRoot = "android/app/src/main/res"

# --- Icon Update (Targeting Max Quality) ---
if (Test-Path $iconSource) {
    Write-Host "Updating icons from $iconSource..." -ForegroundColor Cyan

    # Web/PWA
    Copy-Item $iconSource "public/pwa-512x512.png" -Force
    Copy-Item $iconSource "public/pwa-192x192.png" -Force

    # 1. Update LEGACY icons (for older phones or if backup)
    $legacyBuckets = @("mipmap-xxxhdpi", "mipmap-xxhdpi", "mipmap-xhdpi", "mipmap-hdpi", "mipmap-mdpi")
    foreach ($bucket in $legacyBuckets) {
        $path = Join-Path $resRoot $bucket
        if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force }
        Copy-Item $iconSource (Join-Path $path "ic_launcher.png") -Force
        Copy-Item $iconSource (Join-Path $path "ic_launcher_round.png") -Force
        Copy-Item $iconSource (Join-Path $path "ic_launcher_foreground.png") -Force
    }

    # 2. Update ADAPTIVE icons (for Android 8.0+)
    # This is CRITICAL. Without these XMLs, modern phones will fallback to low-res or use a default mask.
    $anyDpiPath = Join-Path $resRoot "mipmap-anydpi-v26"
    if (-not (Test-Path $anyDpiPath)) { New-Item -ItemType Directory -Path $anyDpiPath -Force }

    $adaptiveXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"@
    Set-Content -Path (Join-Path $anyDpiPath "ic_launcher.xml") -Value $adaptiveXml -Force
    Set-Content -Path (Join-Path $anyDpiPath "ic_launcher_round.xml") -Value $adaptiveXml -Force

    # Clean up any PNGs that might have been accidentally copied to anydpi-v26 (which ignores them for XMLs)
    Remove-Item (Join-Path $anyDpiPath "ic_launcher*.png") -ErrorAction SilentlyContinue

    Write-Host "✅ Adaptive Icons (XML) and High-res mipmaps updated." -ForegroundColor Green
}

# --- Splash Update (Targeting Max Quality) ---
if (Test-Path $splashSource) {
    Write-Host "Updating splash screens from $splashSource..." -ForegroundColor Cyan

    # 1. Update the Splash XML (Ensuring it uses the logo correctly)
    # We use gravity center to keep the high-res source sharp instead of stretching it.
    $xmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item><color android:color="#0f172a"/></item>
    <item>
        <bitmap 
            android:gravity="center" 
            android:src="@drawable/splash_logo"
            android:mipMap="true" />
    </item>
</layer-list>
"@
    Set-Content -Path (Join-Path $resRoot "drawable/splash.xml") -Value $xmlContent -Force

    # 2. Place high-res logo into ALL buckets to ensure resolution matches screen density
    $splashBuckets = @("drawable-xxxhdpi", "drawable-xxhdpi", "drawable-xhdpi", "drawable-hdpi", "drawable-mdpi")
    foreach ($bucket in $splashBuckets) {
        $path = Join-Path $resRoot $bucket
        if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force }
        Copy-Item $splashSource (Join-Path $path "splash_logo.png") -Force
    }

    # 3. Clean up the base drawable folder (prevents "blurry" fallback)
    Remove-Item (Join-Path $resRoot "drawable/splash_logo.png") -ErrorAction SilentlyContinue

    Write-Host "✅ High-res Splash logos updated across all density buckets." -ForegroundColor Green
}

Write-Host "🚀 QUALITY ASSET SYNC COMPLETE!" -ForegroundColor Magenta
Write-Host "⚠️ IMPORTANT: Please run 'npm run build; npx cap sync android' next." -ForegroundColor Yellow
