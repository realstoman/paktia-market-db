import { AppNotification } from '@/types';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

export interface NotificationsResponse {
    data: AppNotification[];
    meta: {
        unread: number;
        total: number;
    };
}

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'list'] as const;

const NOTIFICATIONS_INDEX_URL = '/api/notifications';
const NOTIFICATIONS_READ_ALL_URL = '/api/notifications/read-all';

function getCsrfToken(): string {
    const meta = document.querySelector(
        'meta[name="csrf-token"]',
    ) as HTMLMetaElement | null;
    return meta?.content ?? '';
}

async function fetchNotifications(): Promise<NotificationsResponse> {
    const response = await fetch(NOTIFICATIONS_INDEX_URL, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to load notifications (${response.status})`);
    }

    return (await response.json()) as NotificationsResponse;
}

async function postRead(url: string): Promise<void> {
    const response = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to update notification (${response.status})`);
    }
}

/**
 * Fetches the notifications bell payload through TanStack Query so the
 * cache survives Inertia navigations and the dropdown can opt into a
 * gentle background refetch (e.g. polling) without a custom timer.
 */
export function useNotifications(options?: {
    refetchIntervalMs?: number | false;
    enabled?: boolean;
}) {
    return useQuery<NotificationsResponse>({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: fetchNotifications,
        staleTime: 15_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchInterval: options?.refetchIntervalMs ?? false,
        enabled: options?.enabled ?? true,
    });
}

/**
 * Marks a single notification as read on the server, then invalidates the
 * cached list so the bell updates without a manual refetch.
 */
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            postRead(`/api/notifications/${encodeURIComponent(id)}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: NOTIFICATIONS_QUERY_KEY,
            });
        },
    });
}

/**
 * Marks every currently-visible notification as read.
 */
export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => postRead(NOTIFICATIONS_READ_ALL_URL),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: NOTIFICATIONS_QUERY_KEY,
            });
        },
    });
}
