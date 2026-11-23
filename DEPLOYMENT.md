# 🚀 CodeAI - Deployment & App Distribution Guide

This guide explains how to run, install, and share **CodeAI** as a real-world application so anyone can use it across phones, laptops, and the internet.

---

## 📱 1. Install as Mobile & Desktop App (PWA)
CodeAI is configured as a **Progressive Web App (PWA)** with offline caching, high-resolution app icons, and native install capability.

### On Android (Chrome / Brave / Edge):
1. Open the website URL in Chrome.
2. Tap the **"Install App"** button inside CodeAI (or tap the 3 dots `⋮` at the top right).
3. Select **"Install App"** or **"Add to Home Screen"**.
4. The CodeAI app icon will be added to your phone's home screen with full-screen experience.

### On iPhone / iPad (Safari):
1. Open the website URL in Safari.
2. Tap the **Share button (⎋)** at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner.

### On Windows / Mac / Linux (Chrome / Edge):
1. Open the website in Chrome or Edge.
2. Click the **"Install App"** button in the sidebar OR click the **install icon (⊕)** on the right side of the browser address bar.
3. CodeAI will install as a standalone desktop app window with its own taskbar/dock icon!

---

## 📶 2. Share with Anyone on Your Local Wi-Fi / Hotspot
Anyone connected to the same Wi-Fi or mobile hotspot can access your live server immediately:

1. Start the server:
   ```bash
   npm run start
   ```
2. Your local network URL:
   ```
   http://10.12.140.124:5000
   ```
3. Open this link from any smartphone, tablet, or laptop on the same network!

---

## 🌐 3. Instant Free Public Link (Share Across the Internet)
Want to share your app with a friend, interviewer, or recruiter anywhere in the world right now?

Run this single command from your project root:
```bash
npm run share
```
This will generate a live public URL (e.g. `https://xxxx.loca.lt`). Anyone on the internet can open it on their phone or computer!

---

## ☁️ 4. Free 24/7 Permanent Cloud Deployment (Render.com)

To make CodeAI available online 24/7 with a permanent URL (e.g. `https://codeai-platform.onrender.com`):

### Steps:
1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Production full-stack build with PWA"
   git push origin main
   ```

2. Go to **[Render.com](https://render.com)** (Free Tier):
   - Click **"New +"** -> **"Web Service"**.
   - Connect your GitHub repository.
   - Configure the service:
     - **Runtime:** `Node`
     - **Build Command:** `npm run build`
     - **Start Command:** `npm run start`
   - Add Environment Variable:
     - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*

3. Click **"Deploy Web Service"**.
   - Within 2-3 minutes, Render will provide a free global HTTPS link (`https://your-app.onrender.com`).
   - Anyone in the world can open that link, sign up, and install the app!
