import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { PageLoadingSkeleton } from '@/components/shared/page-loading-skeleton';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const [isNavigating, setIsNavigating] = useState(false);
    const navigationTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const clearNavigationState = () => {
            if (navigationTimeoutRef.current !== null) {
                window.clearTimeout(navigationTimeoutRef.current);
                navigationTimeoutRef.current = null;
            }

            setIsNavigating(false);
        };

        const removeStart = router.on('start', (event) => {
            clearNavigationState();

            if (
                event.detail.visit.async ||
                event.detail.visit.showProgress === false
            ) {
                return;
            }

            navigationTimeoutRef.current = window.setTimeout(() => {
                setIsNavigating(true);
            }, 180);
        });
        const removeFinish = router.on('finish', clearNavigationState);
        const removeError = router.on('error', clearNavigationState);
        const removeInvalid = router.on('invalid', clearNavigationState);

        return () => {
            clearNavigationState();
            removeStart();
            removeFinish();
            removeError();
            removeInvalid();
        };
    }, []);

    return (
        <AppShell>
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent className="relative">
                {children}
                {isNavigating ? (
                    <div className="absolute inset-0 z-20 bg-background/75 backdrop-blur-[1px]">
                        <PageLoadingSkeleton />
                    </div>
                ) : null}
            </AppContent>
        </AppShell>
    );
}
