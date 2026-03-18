import { Suspense, lazy, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import AuthPage from '@/pages/auth/AuthPage';
import { DashboardErrorBoundary } from '@/components/shared/DashboardErrorBoundary';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import { AppRoute, AuthenticatedRoute, OnboardingRoute, PublicOnlyRoute } from '@/components/shared/RouteGuards';
import { ToastStack } from '@/components/ui/ToastStack';
import { queryClient } from '@/lib/queryClient';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useUiStore } from '@/stores/uiStore';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const OnboardingIntro = lazy(() => import('@/pages/onboarding/OnboardingIntro'));
const OnboardingStepPage = lazy(() => import('@/pages/onboarding/OnboardingStepPage'));
const AnalyzingPage = lazy(() => import('@/pages/onboarding/AnalyzingPage'));
const OnboardingWelcome = lazy(() => import('@/pages/onboarding/WelcomePage'));
const AppLayout = lazy(() => import('@/pages/app/AppLayout'));
const TodayPage = lazy(() => import('@/pages/app/Today'));
const ProgressPage = lazy(() => import('@/pages/app/Progress'));
const MindPage = lazy(() => import('@/pages/app/Mind'));
const IdentityPage = lazy(() => import('@/pages/app/Identity'));
const ReviewPage = lazy(() => import('@/pages/app/Review'));
const FinancePage = lazy(() => import('@/pages/app/Finance'));
const VisionPage = lazy(() => import('@/pages/app/Vision'));
const ProfilePage = lazy(() => import('@/pages/app/Profile'));
const SocialPage = lazy(() => import('@/pages/app/Social'));
const CLIENT_CACHE_RESET_KEY = 'forge-client-cache-reset-v6';

function AppRoutes() {
  const location = useLocation();
  const setInstallPromptEvent = useUiStore((state) => state.setInstallPromptEvent);

  useEffect(() => {
    let didReloadForSwUpdate = false;
    const hadServiceWorkerController = Boolean(navigator.serviceWorker?.controller);
    const onControllerChange = () => {
      if (didReloadForSwUpdate || !hadServiceWorkerController) return;
      didReloadForSwUpdate = true;
      window.location.reload();
    };

    const setupServiceWorker = async () => {
      if (!('serviceWorker' in navigator)) return;

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      if (import.meta.env.PROD) {
        const shouldResetClient = window.localStorage.getItem(CLIENT_CACHE_RESET_KEY) !== 'done';

        if (shouldResetClient) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const cacheKeys = 'caches' in window ? await caches.keys() : [];
          const forgeCaches = cacheKeys.filter((key) => key.startsWith('forge-'));

          if (registrations.length || forgeCaches.length) {
            await Promise.all(registrations.map((registration) => registration.unregister()));
            await Promise.all(forgeCaches.map((key) => caches.delete(key)));
            window.localStorage.setItem(CLIENT_CACHE_RESET_KEY, 'done');
            window.location.reload();
            return;
          }

          window.localStorage.setItem(CLIENT_CACHE_RESET_KEY, 'done');
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
        return;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    };

    setupServiceWorker().catch(() => null);

    const handler = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
    };
  }, [setInstallPromptEvent]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <OfflineBanner />
      <InstallPrompt />
      <Routes location={location} key={location.pathname}>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<AuthPage mode="login" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/welcome" element={<LandingPage />} />
        </Route>

        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding/0" element={<OnboardingIntro />} />
          <Route path="/onboarding/:step" element={<OnboardingStepPage />} />
          <Route path="/onboarding/analyzing" element={<AnalyzingPage />} />
          <Route path="/onboarding/welcome" element={<OnboardingWelcome />} />
        </Route>

        <Route element={<AuthenticatedRoute />}>
          <Route element={<AppRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="today" replace />} />
              <Route path="today" element={<DashboardErrorBoundary><TodayPage /></DashboardErrorBoundary>} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="mind" element={<MindPage />} />
              <Route path="identity" element={<IdentityPage />} />
              <Route path="review" element={<ReviewPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="vision" element={<VisionPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="social" element={<SocialPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  useOnlineStatus();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <ToastStack />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
