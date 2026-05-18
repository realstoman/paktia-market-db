import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Client } from '@/types';
import { formatNumber } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';

const formatOptionalDate = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const buildColumns = (
    t: (key: string, fallback?: string) => string,
    onView: (client: Client) => void,
): ColumnDef<Client>[] => [
    {
        accessorKey: 'name',
        header: t('clients.table.name', 'Name'),
        cell: ({ row }) => row.original.name || '-',
    },
    {
        accessorKey: 'email',
        header: t('clients.table.email', 'Email'),
        cell: ({ row }) => row.original.email || '-',
    },
    {
        accessorKey: 'phone',
        header: t('clients.table.phone', 'Phone'),
        cell: ({ row }) => row.original.phone || '-',
    },
    {
        accessorKey: 'provider',
        header: t('clients.table.provider', 'Provider'),
        cell: ({ row }) => {
            const provider = row.original.provider || 'unknown';

            return (
                <Badge variant="outline" className="capitalize">
                    {provider.replace(/_/g, ' ')}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'orders_count',
        header: t('clients.table.totalOrders', 'Orders'),
        cell: ({ row }) => formatNumber(row.original.orders_count ?? 0),
    },
    {
        accessorKey: 'website_orders_count',
        header: t('clients.table.websiteOrders', 'Website'),
        cell: ({ row }) => formatNumber(row.original.website_orders_count ?? 0),
    },
    {
        accessorKey: 'mobile_orders_count',
        header: t('clients.table.mobileOrders', 'Mobile'),
        cell: ({ row }) => formatNumber(row.original.mobile_orders_count ?? 0),
    },
    {
        accessorKey: 'last_order_at',
        header: t('clients.table.lastOrder', 'Last Order'),
        cell: ({ row }) => formatOptionalDate(row.original.last_order_at),
    },
    {
        accessorKey: 'is_active',
        header: t('clients.table.status', 'Status'),
        cell: ({ row }) =>
            row.original.is_active === false ? (
                <Badge variant="destructive">
                    {t('clients.status.inactive', 'Inactive')}
                </Badge>
            ) : (
                <Badge variant="secondary">
                    {t('clients.status.active', 'Active')}
                </Badge>
            ),
    },
    {
        id: 'actions',
        header: t('clients.table.actions', 'Actions'),
        cell: ({ row }) => (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onView(row.original)}
                className="gap-2"
            >
                <Eye className="h-4 w-4" />
                {t('clients.actions.view', 'View')}
            </Button>
        ),
    },
];
