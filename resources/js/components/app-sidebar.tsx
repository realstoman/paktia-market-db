import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
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
    Building2,
    ChefHat,
    CookingPot,
    Globe,
    LayoutGrid,
    Shield,
    Smartphone,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Orders',
        href: '/orders',
        icon: ChefHat,
        can: 'user.view',
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
        icon: Shield,
        can: 'role.view',
    },
    {
        title: 'Branches',
        href: '/branches',
        icon: Building2,
        can: 'branch.view',
    },
    {
        title: 'Kitchens',
        href: '/kitchens',
        icon: CookingPot,
        can: 'kitchen.view',
    },
    {
        title: 'Countries',
        href: '/countries',
        icon: Globe,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Mobile App',
        href: 'https://github.com/realstoman',
        icon: Smartphone,
    },
    {
        title: 'Website',
        href: 'https://github.com/realstoman',
        icon: Globe,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="floating" className="my-2">
            <SidebarHeader className="rounded-t-sm bg-white dark:bg-brand-bg-dark">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-white dark:bg-brand-bg-dark">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="bg-white dark:bg-brand-bg-dark">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
