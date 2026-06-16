import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuthorization } from '@/lib/permissions';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

export function NavMain({
    items = [],
    trailingItems,
}: {
    items: NavItem[];
    trailingItems?: ReactNode;
}) {
    const page = usePage();
    const { can, canAny } = useAuthorization();

    const filteredItems = items.filter((item) => {
        if (item.canAny?.length) {
            return canAny(item.canAny);
        }

        return can(item.can);
    });

    return (
        <SidebarGroup className="px-3 pt-5 pb-3">
            <SidebarMenu className="gap-2">
                {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(
                                resolveUrl(item.href),
                            )}
                            className="h-11 rounded-xl px-3 text-neutral-500 hover:bg-blue-50 hover:text-[#1858f2] data-[active=true]:bg-[#eef2ff] data-[active=true]:font-semibold data-[active=true]:text-[#1858f2] dark:text-neutral-400 dark:hover:bg-blue-500/10 dark:data-[active=true]:bg-blue-500/10 dark:data-[active=true]:text-blue-300"
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href}>
                                {item.icon && <item.icon className="size-5" />}
                                <span className="text-sm">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                {trailingItems}
            </SidebarMenu>
        </SidebarGroup>
    );
}
