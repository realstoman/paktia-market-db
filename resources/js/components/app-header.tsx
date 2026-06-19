import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { HeaderNotifications } from '@/components/header-notifications';
import LanguageDropdown from '@/components/language-dropdown';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { resolveUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Banknote,
    BriefcaseBusiness,
    Building2,
    ChartLine,
    ChevronDown,
    ClipboardList,
    ContactRound,
    Globe2,
    Handshake,
    LayoutGrid,
    MapPinned,
    Menu,
    Settings2,
    ShieldCheck,
    Users,
    Warehouse,
} from 'lucide-react';

interface HeaderNavConfig {
    titleKey: string;
    fallbackTitle: string;
    href: NavItem['href'];
    icon: NonNullable<NavItem['icon']>;
    can?: string;
    canAny?: string[];
    superAdminOnly?: boolean;
}

const primaryNavConfig: HeaderNavConfig[] = [
    {
        titleKey: 'navigation.dashboard',
        fallbackTitle: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        can: 'dashboard.view',
    },
    {
        titleKey: 'navigation.marketsProperties',
        fallbackTitle: 'Markets & Properties',
        href: '/properties',
        icon: Building2,
        can: 'property.view',
    },
    {
        titleKey: 'navigation.tenants',
        fallbackTitle: 'Tenants & Businesses',
        href: '/tenants',
        icon: ContactRound,
        can: 'tenants.view',
    },
    {
        titleKey: 'navigation.shareholders',
        fallbackTitle: 'Shareholders',
        href: '/shareholders',
        icon: Handshake,
        can: 'shareholders.view',
    },
    {
        titleKey: 'navigation.finance',
        fallbackTitle: 'Finance',
        href: '/finance',
        icon: Banknote,
        canAny: ['finance.view', 'payroll.view'],
    },
    {
        titleKey: 'navigation.reports',
        fallbackTitle: 'Reports',
        href: '/reports',
        icon: ChartLine,
        can: 'reports.view',
    },
];

const toolNavConfig: HeaderNavConfig[] = [
    {
        titleKey: 'navigation.toolInventory',
        fallbackTitle: 'Inventory',
        href: '/inventory',
        icon: Warehouse,
        can: 'inventory.view',
    },
    {
        titleKey: 'navigation.toolEmployees',
        fallbackTitle: 'Employees',
        href: '/employees',
        icon: BriefcaseBusiness,
        can: 'employees.view',
    },
    {
        titleKey: 'navigation.users',
        fallbackTitle: 'Users',
        href: '/users',
        icon: Users,
        can: 'user.view',
    },
    {
        titleKey: 'navigation.roles',
        fallbackTitle: 'Roles',
        href: '/roles',
        icon: ShieldCheck,
        can: 'role.view',
    },
    {
        titleKey: 'navigation.toolCountries',
        fallbackTitle: 'Countries',
        href: '/countries',
        icon: Globe2,
        superAdminOnly: true,
    },
    {
        titleKey: 'navigation.toolProvinces',
        fallbackTitle: 'Provinces',
        href: '/provinces',
        icon: MapPinned,
        superAdminOnly: true,
    },
    {
        titleKey: 'navigation.runtimeHealth',
        fallbackTitle: 'System Health',
        href: '/operations/runtime-health',
        icon: Activity,
        superAdminOnly: true,
    },
    {
        titleKey: 'navigation.activityLogs',
        fallbackTitle: 'Activity Logs',
        href: '/admin/activity-logs',
        icon: ClipboardList,
        superAdminOnly: true,
    },
];

export function AppHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { can, canAny, isSuperAdmin } = useAuthorization();
    const { isRtl, t } = useLocalization();

    const canShowItem = (item: HeaderNavConfig) => {
        if (item.superAdminOnly && !isSuperAdmin) {
            return false;
        }

        if (item.canAny?.length) {
            return canAny(item.canAny);
        }

        if (item.can) {
            return can(item.can);
        }

        return true;
    };

    const primaryNavigation = primaryNavConfig.filter(canShowItem);
    const primaryRoutes = new Set(
        primaryNavigation.map((item) => resolveUrl(item.href)),
    );
    const toolsNavigation = toolNavConfig
        .filter(canShowItem)
        .filter((item) => !primaryRoutes.has(resolveUrl(item.href)));
    const isActiveItem = (item: HeaderNavConfig) => {
        const href = resolveUrl(item.href);

        return page.url === href || page.url.startsWith(`${href}/`);
    };
    const isToolsActive = toolsNavigation.some(isActiveItem);
    const navItemBaseClass =
        'flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 py-0 text-base font-medium transition-colors outline-none focus:outline-none focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0';
    const navItemStateClass = (active: boolean) =>
        active
            ? 'bg-brand-primary/8 text-brand-primary'
            : 'text-slate-500 hover:bg-brand-primary/5 hover:text-brand-primary';

    const navLink = (
        item: HeaderNavConfig,
        mobile = false,
        keyPrefix = 'primary',
    ) => {
        const href = resolveUrl(item.href);
        const active = isActiveItem(item);
        const Icon = item.icon;

        return (
            <Link
                key={`${keyPrefix}:${href}`}
                href={item.href}
                className={`${navItemBaseClass} ${navItemStateClass(active)} ${
                    mobile
                        ? 'w-full justify-start'
                        : 'justify-center whitespace-nowrap'
                }`}
            >
                <Icon className="size-4" />
                <span>{t(item.titleKey, item.fallbackTitle)}</span>
            </Link>
        );
    };

    const navLinks = (mobile = false) =>
        primaryNavigation.map((item) => navLink(item, mobile));

    const toolItems = toolsNavigation.map((item) => {
        const href = resolveUrl(item.href);
        const Icon = item.icon;

        return (
            <DropdownMenuItem
                key={href}
                asChild
                className={isRtl ? 'text-right' : ''}
            >
                <Link
                    href={item.href}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className={`flex w-full items-center gap-2 ${
                        isRtl ? 'justify-start text-right' : ''
                    }`}
                >
                    <Icon className="size-4" />
                    <span className="flex-1">
                        {t(item.titleKey, item.fallbackTitle)}
                    </span>
                </Link>
            </DropdownMenuItem>
        );
    });

    return (
        <header className="sticky top-0 z-30 border-b border-[#dfe7e9] bg-[#f8fbfb]/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="mx-auto flex h-20 w-full flex-nowrap items-center gap-2 px-4 lg:px-7">
                <Link
                    href={dashboard()}
                    className="flex h-full w-20 shrink-0 items-center justify-center self-center"
                >
                    <img
                        src="/brand/pg-logo-portrait.png"
                        alt="Paktiawal Group logo"
                        className="h-16 w-auto object-contain"
                    />
                </Link>

                <nav className="hidden h-full min-w-0 flex-1 flex-nowrap items-center justify-start gap-0.5 overflow-x-auto py-0 lg:flex">
                    {navLinks()}
                    {toolsNavigation.length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={`${navItemBaseClass} ${navItemStateClass(isToolsActive)} shadow-none`}
                                >
                                    <Settings2 className="size-4" />
                                    <span>
                                        {t('navigation.tools', 'Tools')}
                                    </span>
                                    <ChevronDown className="size-3.5 opacity-70" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align={isRtl ? 'start' : 'end'}
                                className={`w-60 ${isRtl ? 'text-right' : ''}`}
                            >
                                <DropdownMenuLabel
                                    className={isRtl ? 'text-right' : ''}
                                >
                                    {t(
                                        'navigation.managementTools',
                                        'Management tools',
                                    )}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {toolItems}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                </nav>

                <div className="ms-auto flex h-full shrink-0 flex-nowrap items-center gap-2 self-center">
                    <AppearanceToggleDropdown />
                    <LanguageDropdown className="hidden sm:block" />
                    {isSuperAdmin ? (
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-10 rounded-full border border-[#dfe7e9] bg-white text-slate-600 transition-colors hover:bg-brand-primary/5 hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            <Link
                                href="/admin/activity-logs"
                                aria-label={t(
                                    'navigation.activityLogs',
                                    'Activity Logs',
                                )}
                            >
                                <Activity className="size-4" />
                            </Link>
                        </Button>
                    ) : null}
                    <HeaderNotifications />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative size-10 rounded-full border border-[#dfe7e9] bg-white text-brand-primary shadow-sm shadow-slate-950/3 transition-all duration-300 hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                            >
                                <UserInfo user={auth.user} showName={false} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className={`w-56 ${isRtl ? 'text-right' : ''}`}
                            align="end"
                        >
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-full border border-[#dfe7e9] bg-white lg:hidden dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side={isRtl ? 'right' : 'left'}
                            className="w-72 bg-[#f8fbfb] p-5 dark:bg-neutral-950"
                        >
                            <SheetHeader>
                                <SheetTitle className="sr-only">
                                    Navigation
                                </SheetTitle>
                            </SheetHeader>
                            <img
                                src="/brand/pg-logo-portrait.png"
                                alt="Paktiawal Group logo"
                                className="mx-auto h-20 w-auto"
                            />
                            <div className="mt-6 space-y-2">
                                {navLinks(true)}
                                {toolsNavigation.length > 0 ? (
                                    <>
                                        <div className="px-2 pt-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                                            {t('navigation.tools', 'Tools')}
                                        </div>
                                        {toolsNavigation.map((item) =>
                                            navLink(item, true, 'tool'),
                                        )}
                                    </>
                                ) : null}
                            </div>
                            <LanguageDropdown className="mt-6 sm:hidden" />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {breadcrumbs.length > 1 ? (
                <div className="border-t border-[#e7edef] px-7 py-2 text-xs text-slate-500 dark:border-neutral-800">
                    {breadcrumbs.map((item) => item.title).join(' / ')}
                </div>
            ) : null}
        </header>
    );
}
