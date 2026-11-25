# 📱 CodeAI Mobile App (React Native & Expo)

Cross-platform native mobile app for **CodeAI - AI-Powered Coding Interview Platform**, built with **React Native** and **Expo SDK 58**.

---

## 🚀 How to Run on Your Phone in 30 Seconds

### Step 1: Install Expo Go App on Your Phone
* **Android:** Install [Expo Go on Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
* **iPhone:** Install [Expo Go on Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Start the Metro Bundler
In the terminal, run:
```bash
cd mobile
npx expo start
```

### Step 3: Scan the QR Code
* **Android:** Open the **Expo Go** app and tap **"Scan QR code"**, then scan the QR code displayed in your terminal.
* **iPhone:** Open your standard **Camera** app, point at the terminal QR code, and tap the notification banner to open in Expo Go.

---

## 📦 How to Build Standalone Android APK (.apk file)

To generate an installable `.apk` file that can be distributed directly to friends or testers without Expo Go:

### Option A: 1-Command Cloud Build (EAS Build - Recommended)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in or create a free Expo account:
   ```bash
   eas login
   ```
3. Run preview build (generates a direct `.apk`):
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
4. EAS builds the `.apk` on the cloud and gives you a direct download link and QR code!

### Option B: Local Android Build (Requires Android Studio)
```bash
cd mobile
npx expo prebuild
npx expo run:android
```

---

## 🌟 App Features & Screens

1. **Next-Gen FAANG Authentication:**
   * Sign In / Sign Up with sleek FAANG dark theme styling.
   * 1-Tap Demo Access as `Shobhit11`.
2. **Dashboard:**
   * Platform Rating (1200), Points (100), Problems Solved (24), Accuracy (100%).
   * Quick action cards for Voice Interview, Code Editor, and System Design.
3. **Question Bank:**
   * Search by tag or title.
   * Filter tabs (All, Easy, Medium, Hard).
   * Solved status tracking.
4. **Code Workspace & Test Execution:**
   * Multi-language support (Python, JavaScript, C++, Java).
   * Monospace Code editor.
   * Run Code with instant test case feedback (Runtime, Memory, Expected vs Actual).
5. **AI Voice Interviewer:**
   * Live audio pulse wave animation.
   * Push-to-talk microphone interaction.
   * Real-time technical interview dialogue with AI interviewer.
