import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { HeaderNotifications } from '@/components/header-notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import {
    type BreadcrumbItem as BreadcrumbItemType,
    type SharedData,
} from '@/types';
import { usePage } from '@inertiajs/react';
import { useLocalization } from '@/lib/localization';
import AppearanceToggleDropdown from './appearance-dropdown';
import LanguageDropdown from './language-dropdown';
import { Button } from './ui/button';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<SharedData>().props;
    const { isRtl } = useLocalization();

    return (
        <header className="mx-auto flex h-16 w-full items-center justify-between gap-2 rounded-lg border border-neutral-100/90 bg-white px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 dark:border-neutral-800/90 dark:bg-brand-bg-dark">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <div className="min-w-0 flex-1">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-2">
                <AppearanceToggleDropdown />
                <LanguageDropdown />
                <HeaderNotifications user={auth.user} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full border border-neutral-200/70 bg-neutral-100 transition-all duration-300 hover:bg-neutral-200/70 dark:border-neutral-700/90 dark:bg-neutral-950"
                        >
                            <UserInfo user={auth.user} showName={false} />
                            <span className="sr-only">User menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className={`w-52 rounded-lg ${isRtl ? 'text-right' : ''}`}
                        align={isRtl ? 'start' : 'end'}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
