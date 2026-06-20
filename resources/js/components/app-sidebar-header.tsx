import { HeaderNotifications } from '@/components/header-notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useLocalization } from '@/lib/localization';
import {
    type BreadcrumbItem as BreadcrumbItemType,
    type SharedData,
} from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import AppearanceToggleDropdown from './appearance-dropdown';
import LanguageDropdown from './language-dropdown';
import { Button } from './ui/button';

export function AppSidebarHeader({
    breadcrumbs,
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    void breadcrumbs;
    const { auth } = usePage<SharedData>().props;
    const { isRtl, t } = useLocalization();

    return (
        <header className="dark:bg-brand-bg-dark mx-auto flex h-16 w-full items-center justify-between gap-2 rounded-2xl border border-white bg-white px-4 shadow-sm shadow-neutral-950/[0.03] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:border-neutral-800">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
            </div>
            <div className="ml-2 flex shrink-0 items-center gap-2">
                <AppearanceToggleDropdown />
                <LanguageDropdown />
                {auth.is_super_admin ? (
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full border border-neutral-200/70 bg-neutral-100 transition-all duration-300 hover:bg-neutral-200/70 dark:border-neutral-700/90 dark:bg-neutral-950"
                    >
                        <Link href="/admin/activity-logs">
                            <ClipboardList className="h-5 w-5" />
                            <span className="sr-only">
                                {t('navigation.activityLogs', 'Activity Logs')}
                            </span>
                        </Link>
                    </Button>
                ) : null}
                <HeaderNotifications />
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
                        align="end"
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
