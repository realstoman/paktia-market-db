import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarFooter } from '@/components/app-sidebar-footer';
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
            <AppContent className="m-2 flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-xl">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="mt-3 flex min-h-0 flex-1 flex-col px-3 pb-3 md:px-4">
                    {children}
                </div>
                <AppSidebarFooter />
            </AppContent>
        </AppShell>
    );
}
