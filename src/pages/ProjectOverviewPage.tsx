import React from 'react';
import {
  Radio,
  Satellite,
  Server,
  Compass
} from 'lucide-react';

export const ProjectOverviewPage: React.FC = () => {
  return (
    <div className="history-page-container">
      <div className="history-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span className="instrument-badge" style={{ background: 'var(--color-chartreuse)', color: 'var(--color-forest)' }}>
            MUMBAI UNIVERSITY • BE SEMESTER 5
          </span>
          <span className="instrument-badge" style={{ background: 'var(--bg-stone-subtle)', color: 'var(--color-forest)' }}>
            CSE • WMC MINI-PROJECT
          </span>
        </div>
        <h2 style={{ fontSize: '22px', color: 'var(--color-forest)' }}>
          GeoTrack: GPS-Based Live Location Tracking System
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Theoretical Foundations, Wireless Architecture, and Implementation Analysis for Wireless Mobile Communication.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Module 1: GNSS Satellite Trilateration */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px', boxShadow: 'var(--shadow-instrument)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Satellite size={22} color="var(--color-vermilion)" />
            <h3 style={{ fontSize: '15px', color: 'var(--color-forest)' }}>
              1. Space Segment & Trilateration
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The Global Positioning System operates via a constellation of 24+ MEO (Medium Earth Orbit) satellites broadcasting radio signals at <strong>L1 (1575.42 MHz)</strong> and <strong>L5 (1176.45 MHz)</strong>.
          </p>
          <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-stone-subtle)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <strong>Mathematical Principle:</strong><br />
            To compute a 3D position fix (Latitude, Longitude, Altitude) and receiver clock offset (Δt), the receiver solves 4 simultaneous non-linear pseudorange equations:
            <br />
            <code>ρ_i = c · (t_r - t_s_i) = √[(x_i - x)^2 + (y_i - y)^2 + (z_i - z)^2] + c·Δt</code>
          </div>
        </div>

        {/* Module 2: A-GPS & Cellular Integration */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px', boxShadow: 'var(--shadow-instrument)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Radio size={22} color="var(--color-forest)" />
            <h3 style={{ fontSize: '15px', color: 'var(--color-forest)' }}>
              2. Assisted GPS (A-GPS) & Cell-ID
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Standalone GPS requires downloading ephemeris data directly from satellites at a slow 50 bps, leading to high Time-To-First-Fix (TTFF) of 30–60 seconds.
          </p>
          <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-stone-subtle)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <strong>Wireless Solution (A-GPS):</strong><br />
            Mobile networks (4G LTE / 5G NR) provide ephemeris and reference clock data over high-speed cellular data (RRC layer), reducing TTFF to under 2 seconds and enabling positioning in urban canyons (e.g. Mumbai high-rises).
          </div>
        </div>

        {/* Module 3: Geodesic Calculations & Haversine Formula */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px', boxShadow: 'var(--shadow-instrument)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Compass size={22} color="var(--color-chartreuse)" style={{ background: 'var(--color-forest)', borderRadius: '4px', padding: '2px' }} />
            <h3 style={{ fontSize: '15px', color: 'var(--color-forest)' }}>
              3. WGS-84 Geodesy & Haversine Formula
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Earth is an oblate spheroid modelled by the <strong>WGS-84</strong> geodetic datum. Great-circle distance between consecutive coordinate pairs is determined via the Haversine formula:
          </p>
          <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-stone-subtle)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <code>a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)</code><br />
            <code>c = 2 · atan2(√a, √(1−a))</code><br />
            <code>d = R · c (where R = 6,371,000 meters)</code>
          </div>
        </div>

        {/* Module 4: Cloud Transmission & Web Telemetry */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hairline)', borderRadius: '6px', padding: '20px', boxShadow: 'var(--shadow-instrument)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Server size={22} color="#2B7A27" />
            <h3 style={{ fontSize: '15px', color: 'var(--color-forest)' }}>
              4. Cloud Telemetry Transmission
            </h3>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            In GeoTrack, the tracking device packages WGS-84 fixes with timestamp, speed, and HDOP accuracy. These records are transmitted via mobile data / Wi-Fi over encrypted TLS to Cloud Firestore.
          </p>
          <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-stone-subtle)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <strong>Write Optimization:</strong><br />
            To conserve cellular battery and avoid network congestion, telemetry updates are throttled with distance-delta thresholds (discarding redundant stationary points).
          </div>
        </div>
      </div>

      {/* Presentation Summary Card */}
      <div style={{ marginTop: '24px', background: 'var(--color-forest)', color: 'var(--color-ivory)', borderRadius: '6px', padding: '24px' }}>
        <h3 style={{ color: 'var(--color-chartreuse)', fontSize: '16px', marginBottom: '8px' }}>
          Classroom Demonstration Walkthrough (Viva / Evaluation Guide)
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-on-dark-secondary)', lineHeight: 1.6 }}>
          1. <strong>Explain Positioning:</strong> Discuss how your device accesses location (browser Geolocation API querying hardware GNSS + Wi-Fi BSSID triangulation).<br />
          2. <strong>Demonstrate Live GPS:</strong> Click &quot;START LIVE GPS&quot; outdoors or near a window to acquire a live satellite fix.<br />
          3. <strong>Demonstrate Simulation:</strong> If indoors in a lecture hall without satellite signal, click &quot;Run Demo Route&quot; to show the simulated Marine Drive transect with realistic bearing, velocity, and distance increments.<br />
          4. <strong>Demonstrate Multi-Device Sync:</strong> Sign into the same agent account on mobile and presentation laptop to showcase real-time telemetry streaming over the air!
        </p>
      </div>
    </div>
  );
};
