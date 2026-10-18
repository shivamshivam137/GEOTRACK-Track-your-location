import { useState, useEffect } from 'react';
import { NavigationRail, type NavView } from './components/NavigationRail';
import { AppHeader } from './components/AppHeader';
import { RouteTimeline } from './components/RouteTimeline';
import { StatusAlertBanner } from './components/StatusAlertBanner';
import { AuthModal } from './components/AuthModal';
import { SessionDetailModal } from './components/SessionDetailModal';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { RouteHistoryPage } from './pages/RouteHistoryPage';
import { DataSettingsPage } from './pages/DataSettingsPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { useTrackingSession } from './hooks/useTrackingSession';
import { subscribeToAuthChanges, logOutUser } from './services/firebase';
import type { UserProfile, TrackingSession, LocationPoint } from './types/tracking';

export function App() {
  const [currentView, setCurrentView] = useState<NavView>('live');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [inspectedSession, setInspectedSession] = useState<TrackingSession | null>(null);
  const [selectedSessionPoints, setSelectedSessionPoints] = useState<LocationPoint[] | null>(null);

  // Subscribe to Firebase auth state if available
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Main Tracking Session Orchestrator
  const {
    telemetry,
    activePoints,
    isDemoMode,
    sessionId,
    syncStatus,
    startRealTracking,
    stopRealTracking,
    startDemoMode,
    pauseDemoMode,
    resumeDemoMode,
    resetDemoMode,
    saveCurrentSession,
    demoSpeedMultiplier,
    setDemoSpeedMultiplier
  } = useTrackingSession({ currentUser });

  const handleSaveSessionPrompt = async () => {
    if (activePoints.length === 0) {
      alert('No location points recorded yet to save.');
      return;
    }

    const defaultTitle = isDemoMode
      ? `Simulated Marine Drive Transect (${activePoints.length} pts)`
      : `Field GPS Session #${sessionId.slice(-4)}`;

    const title = window.prompt('Enter title for this recorded session:', defaultTitle);
    if (title) {
      const saved = await saveCurrentSession(title);
      if (saved) {
        alert(`Session "${saved.title}" saved successfully to archives.`);
      }
    }
  };

  const handleInspectSessionOnMap = (session: TrackingSession) => {
    setSelectedSessionPoints(session.points);
    setCurrentView('live');
  };

  return (
    <div className="app-shell cartographic-bg">
      {/* 1. Narrow Vertical Navigation Rail */}
      <NavigationRail
        currentView={currentView}
        onSelectView={view => {
          setCurrentView(view);
        }}
        status={telemetry.status}
        isSimulated={isDemoMode}
      />

      {/* 2. Main Workstation Area */}
      <div className="app-main">
        {/* Editorial Top Header */}
        <AppHeader
          sessionId={sessionId}
          status={telemetry.status}
          isSimulated={isDemoMode}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={async () => {
            await logOutUser();
            setCurrentUser(null);
          }}
        />

        {/* System Notice Alert (Simulated Data or Local Mode) */}
        <StatusAlertBanner
          isSimulated={isDemoMode}
          onNavigateCloud={() => setCurrentView('cloud')}
        />

        {/* View Switcher */}
        {currentView === 'live' && (
          <LiveTrackingPage
            telemetry={telemetry}
            activePoints={activePoints}
            isDemoMode={isDemoMode}
            selectedSessionPoints={selectedSessionPoints}
            onClearSelectedSession={() => setSelectedSessionPoints(null)}
            onStartRealTracking={startRealTracking}
            onStopRealTracking={stopRealTracking}
            onStartDemoMode={startDemoMode}
            onPauseDemoMode={pauseDemoMode}
            onResumeDemoMode={resumeDemoMode}
            onResetDemoMode={resetDemoMode}
            onSaveSession={handleSaveSessionPrompt}
            demoSpeedMultiplier={demoSpeedMultiplier}
            onSetDemoSpeedMultiplier={setDemoSpeedMultiplier}
          />
        )}

        {currentView === 'history' && (
          <RouteHistoryPage
            onInspectSessionOnMap={handleInspectSessionOnMap}
            onOpenSessionDetails={session => setInspectedSession(session)}
          />
        )}

        {currentView === 'cloud' && (
          <DataSettingsPage
            currentUser={currentUser}
            syncStatus={syncStatus}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={async () => {
              await logOutUser();
              setCurrentUser(null);
            }}
          />
        )}

        {currentView === 'overview' && <ProjectOverviewPage />}

        {/* 3. Bottom Movement Timeline / Trip-History Strip */}
        <RouteTimeline
          points={selectedSessionPoints || activePoints}
          totalDistanceMeters={telemetry.totalDistanceMeters}
          currentSpeedKmH={telemetry.currentSpeedKmH}
        />
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticated={user => setCurrentUser(user)}
      />

      <SessionDetailModal
        session={inspectedSession}
        onClose={() => setInspectedSession(null)}
        onInspectOnMap={handleInspectSessionOnMap}
        onDeleteSession={() => {
          setInspectedSession(null);
        }}
      />
    </div>
  );
}

export default App;
