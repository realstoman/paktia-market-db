import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useLocalization } from '@/lib/localization';
import { Link } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    CircleDollarSign,
    Globe2,
    MapPinned,
    Settings2,
    Users,
} from 'lucide-react';

const tools = [
    { href: '/countries', label: 'Countries', icon: Globe2 },
    { href: '/provinces', label: 'Provinces', icon: MapPinned },
    { href: '/branches', label: 'Branches', icon: Building2 },
    { href: '/users', label: 'Users', icon: Users },
    {
        href: '/finance/chart-of-accounts',
        label: 'Chart of Accounts',
        icon: Banknote,
    },
    {
        href: '/finance/expense-categories',
        label: 'Expense Categories',
        icon: CircleDollarSign,
    },
    {
        href: '/finance/cash-movement-types',
        label: 'Cash Movement Types',
        icon: CircleDollarSign,
    },
];

export function ToolsLauncher() {
    const { t } = useLocalization();

    return (
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip={t('navigation.tools', 'Tools')}>
                        <Settings2 />
                        <span>{t('navigation.tools', 'Tools')}</span>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-64"
                >
                    <DropdownMenuLabel>
                        {t('navigation.managementTools', 'Management tools')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {tools.map(({ href, label, icon: Icon }) => (
                        <DropdownMenuItem key={href} asChild>
                            <Link
                                href={href}
                                className="flex items-center gap-2"
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    );
}
