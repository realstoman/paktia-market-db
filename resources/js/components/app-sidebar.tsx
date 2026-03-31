import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ToolsLauncher } from '@/components/tools-launcher';
import { useAuthorization } from '@/lib/permissions';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Activity,
    Boxes,
    Building2,
    CookingPot,
    Globe,
    LayoutGrid,
    Package,
    ScrollText,
    ShieldCheck,
    Smartphone,
    UserRound,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        can: 'dashboard.view',
    },
    {
        title: 'Orders',
        href: '/orders',
        icon: CookingPot,
        can: 'orders.view',
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
        can: 'products.view',
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: Boxes,
        can: 'inventory.view',
    },
    {
        title: 'Employees',
        href: '/employees',
        icon: UserRound,
        can: 'employees.view',
    },
    {
        title: 'Finance',
        href: '/finance',
        icon: Wallet,
        canAny: ['finance.view', 'payroll.view'],
    },
    {
        title: 'Branches',
        href: '/branches',
        icon: Building2,
        can: 'branch.view',
    },
    {
        title: 'Users',
        href: '/users',
        icon: Users,
        can: 'user.view',
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: ShieldCheck,
        can: 'role.view',
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: ScrollText,
        can: 'reports.view',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Mobile App',
        href: 'https://play.google.com/store/apps/details?id=com.babataste',
        icon: Smartphone,
    },
    {
        title: 'Website',
        href: 'https://babataste.com',
        icon: Globe,
    },
];

export function AppSidebar() {
    const { isSuperAdmin } = useAuthorization();
    const navigationItems = isSuperAdmin
        ? [
              ...mainNavItems,
              {
                  title: 'Runtime Health',
                  href: '/operations/runtime-health',
                  icon: Activity,
              } satisfies NavItem,
          ]
        : mainNavItems;

    return (
        <Sidebar collapsible="icon" variant="floating">
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
