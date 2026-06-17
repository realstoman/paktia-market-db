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
                <footer
                    dir="ltr"
                    className="mt-auto flex flex-col gap-3 border-t border-[#dfe7e9] pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:text-neutral-400"
                >
                    <div className="text-center sm:text-left">
                        <span>{t('footer.developedBy', 'Developed by')}</span>{' '}
                        <a
                            href="https://stoman.me"
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-brand-primary transition-colors hover:text-brand-secondary hover:underline"
                        >
                            Stoman
                        </a>
                    </div>
                    <div
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className="text-center sm:text-right"
                    >
                        © {year}{' '}
                        <a
                            href="https://paktiawalgroup.com"
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#123f4a] transition-colors hover:text-brand-primary hover:underline dark:text-white"
                        >
                            {t('brand.marketName', 'Paktiawal Group')}
                        </a>
                        . {t('footer.allRightsReserved', 'All rights reserved.')}
                    </div>
                </footer>
                {isNavigating ? (
                    <div className="absolute inset-0 z-20 bg-background/75 backdrop-blur-[1px]">
                        <PageLoadingSkeleton />
                    </div>
                ) : null}
            </AppContent>
        </AppShell>
    );
}
