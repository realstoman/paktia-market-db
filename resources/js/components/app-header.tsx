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
    Boxes,
    BriefcaseBusiness,
    Building2,
    ChartLine,
    ChevronDown,
    CircleDollarSign,
    ClipboardList,
    Globe2,
    LayoutGrid,
    MapPinned,
    Menu,
    Settings2,
    ShieldCheck,
    Users,
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
        href: '/branches',
        icon: Building2,
        can: 'branch.view',
    },
    {
        titleKey: 'navigation.finance',
        fallbackTitle: 'Finance',
        href: '/finance',
        icon: Banknote,
        canAny: ['finance.view', 'payroll.view'],
    },
    {
        titleKey: 'navigation.inventory',
        fallbackTitle: 'Inventory',
        href: '/inventory',
        icon: Boxes,
        can: 'inventory.view',
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
        titleKey: 'navigation.employees',
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
        titleKey: 'navigation.reports',
        fallbackTitle: 'Reports',
        href: '/reports',
        icon: ChartLine,
        can: 'reports.view',
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
        titleKey: 'navigation.toolBranches',
        fallbackTitle: 'Branches',
        href: '/branches',
        icon: Building2,
        can: 'branch.view',
    },
    {
        titleKey: 'navigation.toolChartOfAccounts',
        fallbackTitle: 'Chart of Accounts',
        href: '/finance/chart-of-accounts',
        icon: Banknote,
        canAny: ['finance.view', 'finance.manage'],
    },
    {
        titleKey: 'navigation.toolExpenseCategories',
        fallbackTitle: 'Expense Categories',
        href: '/finance/expense-categories',
        icon: CircleDollarSign,
        canAny: ['finance.view', 'finance.manage', 'expenses.view'],
    },
    {
        titleKey: 'navigation.toolCashMovementTypes',
        fallbackTitle: 'Cash Movement Types',
        href: '/finance/cash-movement-types',
        icon: CircleDollarSign,
        canAny: ['finance.view', 'finance.manage'],
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
    const toolsNavigation = toolNavConfig.filter(canShowItem);
    const isActiveItem = (item: HeaderNavConfig) => {
        const href = resolveUrl(item.href);

        return page.url === href || page.url.startsWith(`${href}/`);
    };
    const isToolsActive = toolsNavigation.some(isActiveItem);

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
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
                    active
                        ? 'bg-[#e8f1f2] text-[#123f4a]'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-[#123f4a]'
                } ${mobile ? 'w-full justify-start' : 'whitespace-nowrap'}`}
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
                className={isRtl ? 'flex-row-reverse text-right' : ''}
            >
                <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="size-4" />
                    <span>{t(item.titleKey, item.fallbackTitle)}</span>
                </Link>
            </DropdownMenuItem>
        );
    });

    return (
        <header className="sticky top-0 z-30 border-b border-[#dfe7e9] bg-[#f8fbfb]/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="mx-auto flex h-20 w-full items-center gap-4 px-4 lg:px-7">
                <Link
                    href={dashboard()}
                    className="flex w-32 shrink-0 items-center justify-center"
                >
                    <img
                        src="/brand/logo.png"
                        alt="Paktiawal Group logo"
                        className="h-16 w-auto object-contain"
                    />
                </Link>

                <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
                    {navLinks()}
                    {toolsNavigation.length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors ${
                                        isToolsActive
                                            ? 'bg-[#e8f1f2] text-[#123f4a]'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-[#123f4a]'
                                    }`}
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
                                className={`w-72 ${isRtl ? 'text-right' : ''}`}
                            >
                                <DropdownMenuLabel>
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

                <div className="ms-auto flex shrink-0 items-center gap-2">
                    <AppearanceToggleDropdown />
                    <LanguageDropdown className="hidden sm:block" />
                    <HeaderNotifications />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-11 rounded-full border border-[#dfe7e9] bg-white px-2 dark:border-neutral-800 dark:bg-neutral-900"
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
                                src="/brand/logo.png"
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
