import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarFooter } from '@/components/app-sidebar-footer';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { PageLoadingSkeleton } from '@/components/shared/page-loading-skeleton';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { type PropsWithChildren, useEffect, useState } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
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
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent className="m-2 flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-xl">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="relative mt-3 flex min-h-0 flex-1 flex-col px-3 pb-3 md:px-4">
                    {children}
                    {isNavigating ? (
                        <div className="absolute inset-0 z-20 bg-background/75 backdrop-blur-[1px]">
                            <PageLoadingSkeleton />
                        </div>
                    ) : null}
                </div>
                <AppSidebarFooter />
            </AppContent>
        </AppShell>
    );
}
