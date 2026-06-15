import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { HeaderNotifications } from '@/components/header-notifications';
import LanguageDropdown from '@/components/language-dropdown';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
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
    ClipboardList,
    LayoutGrid,
    Menu,
    Search,
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
}

const navConfig: HeaderNavConfig[] = [
    { titleKey: 'navigation.dashboard', fallbackTitle: 'Dashboard', href: dashboard(), icon: LayoutGrid, can: 'dashboard.view' },
    { titleKey: 'navigation.branches', fallbackTitle: 'Properties', href: '/branches', icon: Building2, can: 'branch.view' },
    { titleKey: 'navigation.inventory', fallbackTitle: 'Inventory', href: '/inventory', icon: Boxes, can: 'inventory.view' },
    { titleKey: 'navigation.employees', fallbackTitle: 'Employees', href: '/employees', icon: BriefcaseBusiness, can: 'employees.view' },
    { titleKey: 'navigation.finance', fallbackTitle: 'Finance', href: '/finance', icon: Banknote, canAny: ['finance.view', 'payroll.view'] },
    { titleKey: 'navigation.users', fallbackTitle: 'Users', href: '/users', icon: Users, can: 'user.view' },
    { titleKey: 'navigation.roles', fallbackTitle: 'Roles', href: '/roles', icon: ShieldCheck, can: 'role.view' },
    { titleKey: 'navigation.reports', fallbackTitle: 'Reports', href: '/reports', icon: ChartLine, can: 'reports.view' },
];

export function AppHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { can, canAny, isSuperAdmin } = useAuthorization();
    const { isRtl, t } = useLocalization();
    const navigation = [
        ...navConfig.filter((item) =>
            item.canAny?.length ? canAny(item.canAny) : can(item.can),
        ),
        ...(isSuperAdmin
            ? [{ titleKey: 'navigation.runtimeHealth', fallbackTitle: 'Runtime Health', href: '/operations/runtime-health', icon: Activity }]
            : []),
    ];

    const navLinks = (mobile = false) =>
        navigation.map((item) => {
            const href = resolveUrl(item.href);
            const active = page.url.startsWith(href);
            const Icon = item.icon;

            return (
                <Link
                    key={href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        active
                            ? 'bg-[#e8f1f2] text-[#123f4a]'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-[#123f4a]'
                    } ${mobile ? 'w-full justify-start' : 'whitespace-nowrap'}`}
                >
                    <Icon className="size-4" />
                    <span>{t(item.titleKey, item.fallbackTitle)}</span>
                </Link>
            );
        });

    return (
        <header className="sticky top-0 z-30 border-b border-[#dfe7e9] bg-[#f8fbfb]/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="mx-auto flex h-20 w-full items-center gap-4 px-4 lg:px-7">
                <Link href={dashboard()} className="flex w-32 shrink-0 items-center justify-center">
                    <img src="/brand/logo.png" alt="Paktiawal Group logo" className="h-16 w-auto object-contain" />
                </Link>

                <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">
                    {navLinks()}
                </nav>

                <div className="hidden min-w-48 max-w-xs flex-1 items-center gap-2 rounded-2xl border border-[#dfe7e9] bg-white px-4 xl:flex dark:border-neutral-800 dark:bg-neutral-900">
                    <Search className="size-4 text-slate-400" />
                    <input
                        aria-label={t('dashboardPage.search', 'Search')}
                        placeholder={t('dashboardPage.searchPlaceholder', 'Search...')}
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                </div>

                <div className="ms-auto flex shrink-0 items-center gap-2">
                    <AppearanceToggleDropdown />
                    <LanguageDropdown className="hidden sm:block" />
                    {auth.is_super_admin ? (
                        <Button asChild variant="ghost" size="icon" className="size-10 rounded-full border border-[#dfe7e9] bg-white dark:border-neutral-800 dark:bg-neutral-900">
                            <Link href="/admin/activity-logs" aria-label={t('navigation.activityLogs', 'Activity Logs')}>
                                <ClipboardList className="size-4" />
                            </Link>
                        </Button>
                    ) : null}
                    <HeaderNotifications />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-11 rounded-full border border-[#dfe7e9] bg-white px-2 dark:border-neutral-800 dark:bg-neutral-900">
                                <UserInfo user={auth.user} showName={false} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className={`w-56 ${isRtl ? 'text-right' : ''}`} align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-10 rounded-full border border-[#dfe7e9] bg-white lg:hidden dark:border-neutral-800 dark:bg-neutral-900">
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side={isRtl ? 'right' : 'left'} className="w-72 bg-[#f8fbfb] p-5 dark:bg-neutral-950">
                            <SheetHeader>
                                <SheetTitle className="sr-only">Navigation</SheetTitle>
                            </SheetHeader>
                            <img src="/brand/logo.png" alt="Paktiawal Group logo" className="mx-auto h-20 w-auto" />
                            <div className="mt-6 space-y-2">{navLinks(true)}</div>
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
