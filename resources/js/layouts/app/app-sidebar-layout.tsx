import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarFooter } from '@/components/app-sidebar-footer';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { PageLoadingSkeleton } from '@/components/shared/page-loading-skeleton';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { type PropsWithChildren, useEffect, useRef, useState } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
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

        const removeStart = router.on('start', () => {
            clearNavigationState();
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
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent className="m-2 flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-xl">
                <div className="px-3 pt-2 md:px-4">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                </div>
                <div className="relative mt-3 flex min-h-0 flex-1 flex-col px-3 pb-3 md:px-4">
                    {children}
                    {isNavigating ? (
                        <div className="absolute inset-0 z-20 bg-background/75 backdrop-blur-[1px]">
                            <PageLoadingSkeleton />
                        </div>
                    ) : null}
                </div>
                <div className="px-3 pb-3 md:px-4">
                    <AppSidebarFooter />
                </div>
            </AppContent>
        </AppShell>
    );
}
