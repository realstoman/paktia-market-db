import { QueryClient } from '@tanstack/react-query';

/**
 * Single QueryClient shared across Inertia navigations. Mounting a fresh
 * client on every page would defeat caching and dedupe.
 *
 * Defaults are tuned for an authenticated admin app (data is fairly
 * volatile, but not real-time):
 * - 30s staleness window so quick navigations don't refetch.
 * - 5m garbage collection so cached data survives a tab switch.
 * - retry once for transient network failures, no retry for mutations.
 * - refetchOnWindowFocus disabled to avoid surprising the user with
 *   spinners when they return to the tab.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
