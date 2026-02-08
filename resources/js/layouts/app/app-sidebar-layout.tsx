import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent className="mx-auto my-2 flex w-full max-w-[78rem] flex-col overflow-x-hidden overflow-y-auto rounded">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="mt-2 flex min-h-0 flex-1 flex-col">
                    {children}
                </div>
                <footer className="mt-4 flex items-center justify-between rounded-lg border border-sidebar-border/50 bg-white px-6 py-3 text-xs text-muted-foreground md:px-4 dark:bg-brand-bg-dark">
                    <span>© 2026 Baba Restaurant. All rights reserved.</span>
                    <a
                        href="https://stoman.me"
                        className="font-medium text-foreground hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Stoman
                    </a>
                </footer>
            </AppContent>
        </AppShell>
    );
}
