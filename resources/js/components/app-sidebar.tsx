import { NavFooter } from '@/components/nav-footer';
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
    Globe,
    LayoutGrid,
    Package,
    ReceiptText,
    ShieldCheck,
    Smartphone,
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
        titleKey: 'navigation.orders',
        fallbackTitle: 'Orders',
        href: '/orders',
        icon: ReceiptText,
        can: 'orders.view',
    },
    {
        titleKey: 'navigation.products',
        fallbackTitle: 'Products',
        href: '/products',
        icon: Package,
        can: 'products.view',
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
        titleKey: 'navigation.branches',
        fallbackTitle: 'Branches',
        href: '/branches',
        icon: Building2,
        can: 'branch.view',
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

const footerNavItems: Omit<SidebarNavConfig, 'can' | 'canAny'>[] = [
    {
        titleKey: 'navigation.mobileApp',
        fallbackTitle: 'Mobile App',
        href: 'https://play.google.com/store/apps/details?id=com.babataste',
        icon: Smartphone,
    },
    {
        titleKey: 'navigation.website',
        fallbackTitle: 'Website',
        href: 'https://babataste.com',
        icon: Globe,
    },
];

export function AppSidebar() {
    const { hasRole, isSuperAdmin } = useAuthorization();
    const { isRtl, t } = useLocalization();
    const navigationItems: NavItem[] = [
        ...mainNavItems
            .filter((item) => {
                if (item.href === '/orders' && hasRole('kitchen')) {
                    return false;
                }

                if (
                    item.href === dashboard() &&
                    hasRole('finance') &&
                    !isSuperAdmin
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
    const translatedFooterNavItems: NavItem[] = footerNavItems.map((item) => ({
        title: t(item.titleKey, item.fallbackTitle),
        href: item.href,
        icon: item.icon,
    }));

    return (
        <Sidebar
            collapsible="icon"
            variant="floating"
            side={isRtl ? 'right' : 'left'}
        >
            <SidebarHeader className="rounded-t-lg bg-white dark:bg-brand-bg-dark">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-white dark:bg-brand-bg-dark">
                <NavMain items={navigationItems} />
                {isSuperAdmin ? <ToolsLauncher /> : null}
            </SidebarContent>

            <SidebarFooter className="rounded-b-lg bg-white dark:bg-brand-bg-dark">
                <NavFooter
                    items={translatedFooterNavItems}
                    className="mt-auto"
                />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
