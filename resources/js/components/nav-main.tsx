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
        <SidebarGroup className="px-2 pt-3 pb-2">
            <SidebarMenu>
                {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(
                                resolveUrl(item.href),
                            )}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href}>
                                {item.icon && <item.icon />}
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
