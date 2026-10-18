# 🧭 GeoTrack — Cartographer's Field Console
## High-Precision GPS Telemetry & Live Location Tracking System
### Mumbai University | B.E. Computer Science & Engineering (Data Science) | Semester 3
**Subject:** Wireless & Mobile Communication (WMC) — Mini-Project

[![React 19](https://img.shields.io/badge/React-19.2.8-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=flat&logo=vite)](https://vite.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900.svg?style=flat&logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Tagline:** *“Every Move, Precisely Placed.”*

---

## 📌 1. Project Overview & WMC Relevance

**GeoTrack** is a high-precision, responsive geospatial web application designed as an end-to-end telemetry system for the **Wireless Mobile Communication (WMC)** academic syllabus.

Rather than treating location as an abstract software coordinate, **GeoTrack** directly addresses the electromagnetic, physical, and statistical challenges of wireless position determination across heterogeneous radio networks:

- **GNSS Satellite Downlink (Space Segment):** Multi-constellation tracking (GPS L1: $1575.42\text{ MHz}$, L5: $1176.45\text{ MHz}$, NavIC) using Direct Sequence Spread Spectrum (DSSS) and pseudo-random noise (PRN) codes.
- **Assisted GPS (A-GPS):** Leverages cellular network signaling (OMA SUPL / 3GPP LTE) to download satellite Ephemeris and Doppler data via cellular IP, slashing Time-To-First-Fix (TTFF) from 45 seconds to $< 2$ seconds.
- **Terrestrial Cellular Fallback:** Models cell tower positioning methods: Cell of Origin (COO), Timing Advance (TA), and Observed Time Difference of Arrival (OTDOA).
- **Wi-Fi Positioning (WPS):** Analyzes IEEE 802.11 ($2.4\text{ GHz} / 5\text{ GHz}$) Received Signal Strength Indication (RSSI) using the Log-Distance Path Loss model.
- **Signal Quality & Geometry (HDOP):** Classifies incoming fixes into Grades A through D according to the Horizontal Dilution of Precision error covariance matrix.
- **1D Discrete-Time Kalman Filter:** Suppresses Gaussian multipath jitter, clock drift, and stationary noise in real time.
- **Kinematic Outlier Rejection Gate:** Discards non-line-of-sight (NLOS) multipath reflection "teleportation" jumps ($v > 45\text{ m/s}$).
- **Geodesic Kinematics (Haversine Formula):** Computes exact great-circle displacements on the WGS-84 ellipsoid alongside real-time forward compass azimuth bearings.

---

## 🎨 2. Visual Identity: Cartographer's Field Console

GeoTrack is designed with a distinctive **Cartographer's Field Console** visual style:

- **Warm Mineral Ivory (`#F3F0E7`):** Non-glare base cartographic parchment background.
- **Deep Forest Ink (`#172A27`):** Instrument navigation rail and high-contrast telemetry panels.
- **Signal Vermilion (`#EC5B3B`):** Active recording indicators, route trail polyline, and mission alerts.
- **Electric Chartreuse (`#D8F36A`):** Live GNSS fix beacon, status pills, and positive states.
- **Secondary Muted Stone (`#A5AAA0`):** Reticles, crosshairs, and coordinate grid ticks.
- **Typography:** Space Grotesk (interface headings) and IBM Plex Mono (telemetry readouts, DMS coordinates, and speed values).

---

## 🚀 3. Quick Start (Run Locally)

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm** ([Download Node.js](https://nodejs.org/))

### Installation & Execution
```powershell
# 1. Clone your repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

Open your browser at:
```
http://localhost:5173/
```

To verify the production build:
```powershell
npm run build
```

---

## 🧪 4. How to Demonstrate the Application

### A. Classroom Demonstration Mode (No GPS Signal Needed)
*Ideal for indoor classrooms or lecture halls where satellite signals are weak:*
1. Open GeoTrack and view the **Field Console Telemetry** panel on the right.
2. In the dashed **Classroom Demo Mode** box, click **`Run Demo Route`**.
3. Watch the live reticle marker advance along the **Mumbai Marine Drive Coastal Transect** (Nariman Point to Girgaon Chowpatty).
4. Observe live telemetry updates:
   - Coordinates in both Decimal Degrees (DD) and Degrees Minutes Seconds (DMS).
   - Instantaneous speed calculation (km/h) and compass heading bearing.
   - Accumulated geodesic distance via Haversine equation.
   - Dynamic polyline trail and live Kalman filtering stats.
5. Click **`Pause Demo`**, **`Resume Demo`**, or switch speed multipliers (`1x`, `2x`, `4x`).
6. Click **`Save Session`** to store the route into your archives.

### B. Live Real GPS Tracking
*Ideal for outdoors or mobile testing:*
1. Click **`START LIVE GPS`**.
2. When the browser prompts **"Allow GeoTrack to access your location?"**, click **Allow**.
3. The system initiates `watchPosition()` with `enableHighAccuracy: true`, activating the device's satellite LNA antenna.
4. As you move, coordinates are filtered for multipath jumps, smoothed via the Kalman Filter, and mapped in real time.
5. Click **`STOP TRACKING`** when finished.

### C. Route Archives & GeoJSON Export
1. Click the **`ROUTES`** icon on the left navigation rail.
2. Inspect past sessions, durations, point counts, and total distance.
3. Click **`Export GeoJSON`** to download standard geospatial data compatible with QGIS, ArcGIS, or Google Earth.

---

## 🌐 5. Deployment Guide (Deploy in 2 Minutes)

> [!IMPORTANT]
> **Mobile Browser Geolocation Security Notice:**  
> Modern smartphone browsers (Chrome, Safari, Edge) **strictly require HTTPS** to allow access to device GPS hardware. Deploying to Vercel, Render, or GitHub Pages provides a free, verified SSL/HTTPS certificate automatically!

---

### Option A: Deploy on Vercel (Recommended — Easiest & Fastest)

Vercel is optimal for Vite + React applications and takes under 60 seconds:

1. Push your project code to a **GitHub repository**:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit of GeoTrack"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
3. Click **"Add New Project"** and select your `GeoTrack` repository from the list.
4. Vercel automatically detects Vite:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **"Deploy"**.
6. Within 30 seconds, your application will be live at:
   ```
   https://your-project-name.vercel.app
   ```
7. Open that link on your smartphone, grant location permissions, and test real satellite tracking!

*(Note: The included `vercel.json` ensures all single-page application routes resolve cleanly).*

---

### Option B: Deploy on Render

1. Push your code to GitHub.
2. Go to [render.com](https://render.com/) and sign in.
3. Click **"New +"** in the top dashboard and choose **"Static Site"**.
4. Connect your GitHub repository.
5. Configure the build settings:
   - **Name:** `geotrack`
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
6. Click **"Create Static Site"**.
7. Render will build and deploy your app with free HTTPS at:
   ```
   https://geotrack.onrender.com
   ```

---

### Option C: Deploy on GitHub Pages

This repository already includes an automated GitHub Actions deployment workflow at `.github/workflows/deploy.yml` and relative base assets (`base: './'`).

1. Push your repository to GitHub.
2. Open your repository on **GitHub.com**.
3. Go to **Settings** $\to$ **Pages** (in the left sidebar).
4. Under **"Build and deployment"** $\to$ **Source**, select **`GitHub Actions`**.
5. Go to the **Actions** tab in your repository: the workflow will trigger automatically on your `main` branch push.
6. Once completed, your app will be live at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

---

## 📱 6. Mobile Testing via Local Network (Without Deploying)

To test on your smartphone connected to the same Wi-Fi network:

1. Run Vite with the `--host` flag:
   ```powershell
   npm run dev -- --host
   ```
2. Vite will output a Network URL:
   ```text
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.5:5173/
   ```
3. *Alternative with HTTPS Tunnel (for mobile GPS permission):*
   ```powershell
   npx localtunnel --port 5173
   # or
   npx ngrok http 5173
   ```
   Open the generated HTTPS URL on your phone's browser.

---

## 🏗️ 7. Project Architecture

```text
WMC_miniproject/
├── index.html                  # HTML entry point with cartographic typography
├── package.json                # Dependencies: react, leaflet, react-leaflet, lucide-react
├── vite.config.ts              # Vite bundler config with relative base path ('./')
├── vercel.json                 # Vercel SPA routing rules
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── public/
│   └── favicon.svg             # Custom Cartographer reticle beacon favicon
└── src/
    ├── main.tsx                # React root mount
    ├── App.tsx                 # Core shell, view orchestration & modals
    ├── index.css               # Token imports
    ├── styles/
    │   ├── tokens.css          # Cartographic color palette & typography tokens
    │   ├── global.css          # Base resets, badges & beacon animations
    │   └── components.css      # Field console layout & responsive rules
    ├── types/
    │   └── tracking.ts         # LocationPoint, TrackingSession, GpsSignalQuality
    ├── utils/
    │   ├── geoDistance.ts      # Haversine formula, KalmanFilter1D, Jump filter, HDOP
    │   ├── formatters.ts       # Coordinate DMS/DD, speed, accuracy formatting
    │   └── sampleRoute.ts      # Predefined Marine Drive demonstration transect
    ├── services/
    │   ├── firebase.ts         # Optional Firebase Auth/Firestore with fallback
    │   └── trackingRepository.ts# LocalStorage persistence & Cloud sync
    ├── hooks/
    │   ├── useGeolocation.ts   # watchPosition API wrapper with 5-stage filter
    │   └── useTrackingSession.ts# Combined Real/Demo tracking state machine
    ├── components/
    │   ├── NavigationRail.tsx  # Vertical icon bar with custom wordmark
    │   ├── AppHeader.tsx       # Editorial header & session tag
    │   ├── LiveMap.tsx         # OpenStreetMap canvas with pulsing reticle marker
    │   ├── TelemetryPanel.tsx  # 2x2 instrument matrix, coordinates, HDOP & controls
    │   ├── RouteTimeline.tsx   # Bottom movement timeline strip
    │   ├── StatusAlertBanner.tsx# Simulated data / Local mode banners
    │   ├── AuthModal.tsx       # Field agent login modal
    │   └── SessionDetailModal.tsx# Route inspection & GeoJSON download
    └── pages/
        ├── LiveTrackingPage.tsx# Main live tracking view
        ├── RouteHistoryPage.tsx# Saved session archives
        ├── DataSettingsPage.tsx# Cloud synchronization & .env guide
        └── ProjectOverviewPage.tsx# Academic WMC technical report
```

---

## 📊 8. Mathematical Foundations Reference

### A. Geodesic Distance (Haversine Formula)
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right) \quad (R = 6,371,000\text{ m})$$

### B. Discrete-Time Kalman Filter Update Cycle
$$\text{Project State:} \quad x_{k|k-1} = x_{k-1|k-1}$$
$$\text{Project Covariance:} \quad P_{k|k-1} = P_{k-1|k-1} + Q$$
$$\text{Kalman Gain:} \quad K_k = \frac{P_{k|k-1}}{P_{k|k-1} + R}$$
$$\text{Update State:} \quad x_{k|k} = x_{k|k-1} + K_k \cdot (z_k - x_{k|k-1})$$
$$\text{Update Covariance:} \quad P_{k|k} = (1 - K_k) \cdot P_{k|k-1}$$

*(Where $R$ is scaled dynamically by the sensor's reported horizontal accuracy: $R = (\sigma_{\text{accuracy}} / 111320)^2$)*.

---

## 👥 9. Authors & Academic Credits

- **Student:** Shivam Singh & Team
- **Degree:** Bachelor of Engineering (B.E.) in Computer Science & Engineering (Data Science)
- **Institution:** University of Mumbai (MU) — Semester 3
- **Course:** Wireless Mobile Communication (WMC) Mini-Project
- **Academic Report:** Full theoretical documentation available in [GeoTrack_Project_Report.md](GeoTrack_Project_Report.md).

---

## 📄 10. License
This project is open-source under the [MIT License](LICENSE).
