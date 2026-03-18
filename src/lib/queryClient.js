import { QueryClient } from '@tanstack/react-query';

const QUERY_RETRY_COUNT = 2;

function getRetryDelay(attemptIndex) {
  return Math.min(400 * (2 ** attemptIndex), 2400);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      // Initial request + 2 retries = 3 total attempts.
      retry: QUERY_RETRY_COUNT,
      retryDelay: getRetryDelay,
    },
    mutations: {
      retry: 1,
    },
  },
});
