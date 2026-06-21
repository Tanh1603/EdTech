import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is stale after 5 minutes
      gcTime: 1000 * 60 * 30,    // Keep garbage collection cache for 30 minutes
      refetchOnWindowFocus: false, // Avoid refetching when window gains focus
      retry: (failureCount, error: Error) => {
        const err = error as { status?: number };
        // Do not auto-retry for auth errors or resource not found
        if (err.status === 401 || err.status === 403 || err.status === 404) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
