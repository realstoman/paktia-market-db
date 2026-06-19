import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { PageLoadingSkeleton } from '@/components/shared/page-loading-skeleton';
import { useLocalization } from '@/lib/localization';
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
    const { isRtl, t } = useLocalization();
    const year = new Date().getFullYear();

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
            <AppContent className="relative flex min-h-[calc(100vh-5rem)] flex-col bg-[#eef3f4] p-3 sm:p-5 dark:bg-neutral-950">
                {children}
                <div className="-mx-3 mt-auto -mb-3 pt-8 sm:-mx-5 sm:-mb-5">
                    <footer
                        dir="ltr"
                        className="flex flex-col gap-3 bg-[#f8fbfb]/95 px-4 py-4 text-xs text-slate-500 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:bg-neutral-950/95 dark:text-neutral-400"
                    >
                        <div className="text-center text-sm sm:text-left">
                            <a
                                href="https://stoman.me"
                                target="_blank"
                                rel="noreferrer"
                                className="pr-1 font-semibold text-brand-primary transition-colors hover:text-brand-secondary hover:underline"
                            >
                                Stoman
                            </a>
                            <span>
                                {t('footer.developedBy', 'Developed by')}
                            </span>{' '}
                        </div>
                        <div
                            dir={isRtl ? 'rtl' : 'ltr'}
                            className="text-center text-sm sm:text-right"
                        >
                            © {year}{' '}
                            <a
                                href="https://paktiawalgroup.com"
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-brand-primary transition-colors hover:text-brand-secondary hover:underline dark:text-white"
                            >
                                {t('brand.marketName', 'Paktiawal Group')}
                            </a>
                            .{' '}
                            {t(
                                'footer.allRightsReserved',
                                'All rights reserved.',
                            )}
                        </div>
                    </footer>
                </div>
                {isNavigating ? (
                    <div className="absolute inset-0 z-20 bg-background/75 backdrop-blur-[1px]">
                        <PageLoadingSkeleton />
                    </div>
                ) : null}
            </AppContent>
        </AppShell>
    );
}
