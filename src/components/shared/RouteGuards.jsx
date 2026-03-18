import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { ErrorFallback } from './ErrorFallback';
import { LoadingScreen } from './LoadingScreen';
import { useAuth } from '@/hooks/useAuth';

function AuthRetryState({ title, error, refetch }) {
  return (
    <ErrorFallback
      title={title}
      description={error?.message || 'We could not verify your session. Tap to retry.'}
      primaryLabel="Tap to retry"
      onPrimaryAction={() => refetch()}
      showHomeLink={false}
    />
  );
}

export function PublicOnlyRoute() {
  const { sessionLoading, user } = useAuth();

  if (sessionLoading || !user) return <Outlet />;

  return <Navigate to="/app/today" replace />;
}

export function AuthenticatedRoute() {
  const { sessionLoading, user, isError, error, refetch } = useAuth();
  const location = useLocation();

  if (sessionLoading) return <LoadingScreen title="Checking session" />;
  if (isError) return <AuthRetryState title="Unable to check your session" error={error} refetch={refetch} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

export function OnboardingRoute() {
  const { profile, sessionLoading, user, isError, error, refetch } = useAuth();

  if (sessionLoading) return <LoadingScreen title="Loading onboarding" />;
  if (isError) return <AuthRetryState title="Unable to load onboarding" error={error} refetch={refetch} />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.onboarding_complete) return <Navigate to="/app/today" replace />;

  return <Outlet />;
}

export function AppRoute() {
  const { profile, sessionLoading, user, isError, error, refetch } = useAuth();

  if (sessionLoading) return <LoadingScreen title="Loading your protocol" />;
  if (isError) return <AuthRetryState title="Unable to load your dashboard" error={error} refetch={refetch} />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding/0" replace />;

  return <Outlet />;
}

