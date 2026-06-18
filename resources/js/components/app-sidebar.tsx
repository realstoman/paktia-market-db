import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ToolsLauncher } from '@/components/tools-launcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { resolveUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Activity,
    Banknote,
    Boxes,
    BriefcaseBusiness,
    Building2,
    ChartLine,
    LayoutGrid,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

interface SidebarNavConfig {
    titleKey: string;
    fallbackTitle: string;
    href: NavItem['href'];
    icon: NonNullable<NavItem['icon']>;
    can?: string;
    canAny?: string[];
}

const mainNavItems: SidebarNavConfig[] = [
    {
        titleKey: 'navigation.dashboard',
        fallbackTitle: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        can: 'dashboard.view',
    },
    {
        titleKey: 'navigation.inventory',
        fallbackTitle: 'Inventory',
        href: '/inventory',
        icon: Boxes,
        can: 'inventory.view',
    },
    {
        titleKey: 'navigation.employees',
        fallbackTitle: 'Employees',
        href: '/employees',
        icon: BriefcaseBusiness,
        can: 'employees.view',
    },
    {
        titleKey: 'navigation.finance',
        fallbackTitle: 'Finance',
        href: '/finance',
        icon: Banknote,
        canAny: ['finance.view', 'payroll.view'],
    },
    {
        titleKey: 'navigation.properties',
        fallbackTitle: 'Markets & Properties',
        href: '/properties',
        icon: Building2,
        can: 'property.view',
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
];

export function AppSidebar() {
    const { hasRole, can, isSuperAdmin } = useAuthorization();
    const { isRtl, t } = useLocalization();
    const dashboardHref = resolveUrl(dashboard());
    const financeHome =
        !isSuperAdmin && hasRole('finance') && can('finance.view');
    const inventoryHome =
        !isSuperAdmin && hasRole('inventory') && can('inventory.view');
    const homeHref = financeHome
        ? '/finance'
        : inventoryHome
          ? '/inventory'
          : dashboard();
    const navigationItems: NavItem[] = [
        ...mainNavItems
            .filter((item) => {
                if (
                    resolveUrl(item.href) === dashboardHref &&
                    (financeHome || inventoryHome)
                ) {
                    return false;
                }

                return true;
            })
            .map((item) => ({
                title: t(item.titleKey, item.fallbackTitle),
                href: item.href,
                icon: item.icon,
                can: item.can,
                canAny: item.canAny,
            })),
        ...(isSuperAdmin
            ? [
                  {
                      title: t('navigation.runtimeHealth', 'Runtime Health'),
                      href: '/operations/runtime-health',
                      icon: Activity,
                  } satisfies NavItem,
              ]
            : []),
    ];
    return (
        <Sidebar
            collapsible="icon"
            variant="floating"
            side={isRtl ? 'right' : 'left'}
            className="[--sidebar-width:17rem]"
        >
            <SidebarHeader className="dark:bg-brand-bg-dark gap-0 rounded-t-lg bg-white p-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="h-20 justify-center rounded-none p-0 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0! hover:bg-transparent"
                            asChild
                        >
                            <Link href={homeHref} aria-label="Dashboard">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="dark:bg-brand-bg-dark bg-white">
                <NavMain
                    items={navigationItems}
                    trailingItems={isSuperAdmin ? <ToolsLauncher /> : null}
                />
            </SidebarContent>

            <SidebarFooter className="dark:bg-brand-bg-dark rounded-b-lg bg-white">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
