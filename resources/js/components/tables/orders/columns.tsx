import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Order } from '@/types';
import { formatPrice } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Clock, Ban } from 'lucide-react';

const statusStyles: Record<string, { label: string; icon: JSX.Element }> = {
    pending: {
        label: 'Pending',
        icon: <Clock className="h-4 w-4 text-amber-600" />,
    },
    completed: {
        label: 'Completed',
        icon: <BadgeCheck className="h-4 w-4 text-green-600" />,
    },
    cancelled: {
        label: 'Cancelled',
        icon: <Ban className="h-4 w-4 text-red-600" />,
    },
};

export const buildColumns = (): ColumnDef<Order>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: 'Order ID',
    },
    {
        id: 'branch.name',
        accessorFn: (row) => row.branch?.name ?? 'Unknown',
        header: 'Branch',
    },
    {
        accessorKey: 'items_count',
        header: 'Items',
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.getValue('items_count') ?? 0}
            </span>
        ),
    },
    {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => formatPrice(row.getValue('total_amount')),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const statusValue = row.getValue('status') as string | undefined;
            const status =
                (statusValue && statusStyles[statusValue]) ||
                statusStyles.pending;

            return (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    {status.icon}
                    {status.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return date.toLocaleDateString();
        },
    },
];
