import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
import { Bell, ChevronsUpDown } from 'lucide-react';
import AppearanceToggleDropdown from './appearance-dropdown';
import LanguageDropdown from './language-dropdown';
import { Button } from './ui/button';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <header className="mx-auto flex h-16 w-full items-center justify-between gap-2 rounded-lg border border-neutral-100/90 bg-white px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 dark:border-neutral-800/90 dark:bg-brand-bg-dark">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-3">
                <AppearanceToggleDropdown />
                <LanguageDropdown />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-9 w-9 rounded-full border border-neutral-200/70 bg-neutral-100 transition-all duration-300 hover:bg-neutral-200/70 dark:border-neutral-700/90 dark:bg-neutral-950"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="sr-only">Notifications</span>
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="space-y-3 px-2 py-2 text-sm">
                            <div className="rounded-md border p-2">
                                <p className="font-medium">
                                    New order received
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Order #4823 was placed 2 minutes ago.
                                </p>
                            </div>
                            <div className="rounded-md border p-2">
                                <p className="font-medium">Inventory low</p>
                                <p className="text-xs text-muted-foreground">
                                    Tomatoes stock is below threshold.
                                </p>
                            </div>
                            <div className="rounded-md border p-2">
                                <p className="font-medium">
                                    User access updated
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Jane Doe was assigned a new role.
                                </p>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 gap-2 px-2">
                            <UserInfo user={auth.user} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-64 rounded-lg"
                        align="end"
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
