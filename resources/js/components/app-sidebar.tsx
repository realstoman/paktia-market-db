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
    Globe,
    LayoutGrid,
    MapPin,
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
        title: 'Users',
        href: '/users',
        icon: Users,
        // can: 'VIEW-USER',
    },
    {
        title: 'Roles',
        href: '/roles',
        icon: Shield,
        // can: 'VIEW-ROLE',
    },
    {
        title: 'Countries',
        href: '/countries',
        icon: Globe,
    },
    {
        title: 'Provinces',
        href: '/provinces',
        icon: MapPin,
    },
    {
        title: 'Branches',
        href: '/branches',
        icon: Building2,
        // can: 'VIEW-BRANCH',
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
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
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

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
