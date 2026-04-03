# 🚨 Contest Alerts App

A premium, high-persistence mobile application for competitive programmers. Never miss a contest again with real-time monitoring and high-priority alarms.

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-Android-blue.svg)
![Framework](https://img.shields.io/badge/Framework-Capacitor-A8FF00.svg)

## ✨ Key Features

- **Always-On Monitoring**: Powered by a robust Foreground Service "Watchdog" mechanism to survive system kills and background restrictions.
- **Clist.by Integration**: Uses the CLIST API to track contests across Codeforces, LeetCode, AtCoder, CodeChef, and more.
- **High-Priority Alarms**: Distinct notification levels for contests starting in 24h, 6h, 1h, and immediately.
- **Premium UI/UX**: Dark mode by default with glassmorphism design and smooth micro-animations.
- **Interactive Notifications**: Quick actions to refresh, snooze, or view contest details directly from the notification tray.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS, JavaScript (Vite 6)
- **Native Bridge**: Capacitor 8.0
- **Plugins**: 
  - `@capawesome-team/capacitor-android-foreground-service`
  - `@capacitor/local-notifications`
  - Custom Battery Optimization helper

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS)
- [Android Studio](https://developer.android.com/studio) (for native builds)
- [Clist.by API Key](https://clist.by/api/v4/doc/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/HanshalBobate/Contest-Alerts-App.git
   cd Contest-Alerts-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update your high-res assets:
   - Place your `icon.png` and `splash.png` in the `resources/` folder.
   - Run the high-quality sync script:
     ```powershell
     powershell -ExecutionPolicy Bypass -File update_assets.ps1
     ```

4. Build and sync to Android:
   ```bash
   npm run build
   npx cap sync android
   ```

## ⚙️ Configuration

1. Launch the app on your phone.
2. Enter your **Clist Username** and **API Key**.
3. Enable **Foreground Monitoring** to ensure the app stays alive in the background.
4. (Optional) Enter an **ntfy.sh** topic for remote notification mirroring.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Developed with ❤️ by [Hanshal Bobate](https://github.com/HanshalBobate)
