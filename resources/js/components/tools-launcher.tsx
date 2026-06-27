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
import { useAuthorization } from '@/lib/permissions';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Banknote,
    Building2,
    CircleDollarSign,
    FileSignature,
    Gem,
    Globe2,
    Handshake,
    MapPinned,
    PackageSearch,
    Settings2,
    UserRoundCog,
    Users,
    UtensilsCrossed,
} from 'lucide-react';

interface ToolConfig {
    href: string;
    labelKey: string;
    fallbackLabel: string;
    icon: LucideIcon;
    can?: string;
    superAdminOnly?: boolean;
}

const tools: ToolConfig[] = [
    {
        href: '/contract-templates',
        labelKey: 'navigation.toolContracts',
        fallbackLabel: 'Contract Templates',
        icon: FileSignature,
        superAdminOnly: true,
    },
    {
        href: '/inventory',
        labelKey: 'navigation.toolInventory',
        fallbackLabel: 'Inventory',
        icon: PackageSearch,
        can: 'inventory.view',
    },
    {
        href: '/finance/dubai-restaurant',
        labelKey: 'navigation.toolDubaiRestaurant',
        fallbackLabel: 'Dubai Restaurant',
        icon: UtensilsCrossed,
        can: 'finance.view',
    },
    {
        href: '/finance/kabul-sarafi',
        labelKey: 'navigation.toolKabulSarafi',
        fallbackLabel: 'Kabul Gold & Sarafi',
        icon: Gem,
        can: 'finance.view',
    },
    {
        href: '/employees',
        labelKey: 'navigation.toolEmployees',
        fallbackLabel: 'Employees',
        icon: UserRoundCog,
        can: 'employees.view',
    },
    {
        href: '/shareholders',
        labelKey: 'navigation.toolShareholders',
        fallbackLabel: 'Shareholders',
        icon: Handshake,
        can: 'shareholders.view',
    },
    {
        href: '/countries',
        labelKey: 'navigation.toolCountries',
        fallbackLabel: 'Countries',
        icon: Globe2,
        superAdminOnly: true,
    },
    {
        href: '/provinces',
        labelKey: 'navigation.toolProvinces',
        fallbackLabel: 'Provinces',
        icon: MapPinned,
        superAdminOnly: true,
    },
    {
        href: '/properties',
        labelKey: 'navigation.toolProperties',
        fallbackLabel: 'Markets & Properties',
        icon: Building2,
        can: 'property.view',
    },
    {
        href: '/users',
        labelKey: 'navigation.toolUsers',
        fallbackLabel: 'Users',
        icon: Users,
        can: 'user.view',
    },
    {
        href: '/finance/chart-of-accounts',
        labelKey: 'navigation.toolChartOfAccounts',
        fallbackLabel: 'Chart of Accounts',
        icon: Banknote,
        superAdminOnly: true,
    },
    {
        href: '/finance/expense-categories',
        labelKey: 'navigation.toolExpenseCategories',
        fallbackLabel: 'Expense Categories',
        icon: CircleDollarSign,
        superAdminOnly: true,
    },
    {
        href: '/finance/cash-movement-types',
        labelKey: 'navigation.toolCashMovementTypes',
        fallbackLabel: 'Cash Movement Types',
        icon: CircleDollarSign,
        superAdminOnly: true,
    },
];

export function ToolsLauncher() {
    const { t } = useLocalization();
    const { can, isSuperAdmin } = useAuthorization();
    const visibleTools = tools.filter(
        (tool) =>
            (!tool.superAdminOnly || isSuperAdmin) &&
            (!tool.can || can(tool.can)),
    );

    if (visibleTools.length === 0) {
        return null;
    }

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
                    {visibleTools.map(
                        ({ href, labelKey, fallbackLabel, icon: Icon }) => (
                            <DropdownMenuItem key={href} asChild>
                                <Link
                                    href={href}
                                    className="flex items-center gap-2"
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{t(labelKey, fallbackLabel)}</span>
                                </Link>
                            </DropdownMenuItem>
                        ),
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    );
}
