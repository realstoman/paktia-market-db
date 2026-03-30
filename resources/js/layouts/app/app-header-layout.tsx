import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { PageLoadingSkeleton } from '@/components/shared/page-loading-skeleton';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', () => setIsNavigating(true));
        const removeFinish = router.on('finish', () => setIsNavigating(false));
        const removeError = router.on('error', () => setIsNavigating(false));
        const removeInvalid = router.on('invalid', () => setIsNavigating(false));

        return () => {
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
