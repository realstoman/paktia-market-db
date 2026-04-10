import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { setFormattingLocale } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
    defaultSidebarOpen?: boolean;
}

export function AppShell({
    children,
    variant = 'header',
    defaultSidebarOpen,
}: AppShellProps) {
    const { sidebarOpen: isOpen, localization } = usePage<SharedData>().props;

    setFormattingLocale(localization.locale);

    useEffect(() => {
        document.documentElement.lang = localization.locale;
        document.documentElement.dir = localization.direction;
        document.body.dir = localization.direction;
        document.documentElement.classList.toggle('rtl', localization.isRtl);
        document.body.classList.toggle('rtl', localization.isRtl);
    }, [localization.direction, localization.isRtl, localization.locale]);

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider defaultOpen={defaultSidebarOpen ?? isOpen}>
            {children}
        </SidebarProvider>
    );
}
