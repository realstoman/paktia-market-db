import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BranchTable, Order } from '@/types';
import { formatAfn } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban, Clock3, CookingPot } from 'lucide-react';
import { OrderRowActions } from './row-actions';

const statusStyles: Record<string, { label: string; icon: JSX.Element }> = {
    pending: {
        label: 'Pending',
        icon: <Clock3 className="h-4 w-4 text-amber-600" />,
    },
    in_progress: {
        label: 'In Progress',
        icon: <CookingPot className="h-4 w-4 text-blue-600" />,
    },
    ready: {
        label: 'Ready',
        icon: <BadgeCheck className="h-4 w-4 text-emerald-600" />,
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

interface BuildOrderColumnsOptions {
    onEdit: (order: Order) => void;
    onView: (order: Order) => void;
    onAddItems: (order: Order) => void;
    onAssignTable: (order: Order, branchTableId: number) => void;
    onUpdateStatus: (
        order: Order,
        status: string,
        paymentMethod?: string,
    ) => void;
    onPrint: (order: Order) => void;
    branchTables: BranchTable[];
}

export const buildColumns = ({
    onEdit,
    onView,
    onAddItems,
    onAssignTable,
    onUpdateStatus,
    onPrint,
    branchTables,
}: BuildOrderColumnsOptions): ColumnDef<Order>[] => [
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
        id: 'branch_table.table_number',
        accessorFn: (row) => row.branch_table?.table_number ?? '-',
        header: 'Table Number',
    },
    {
        id: 'user.name',
        accessorFn: (row) => row.user?.name ?? 'System',
        header: 'Created By',
    },
    {
        id: 'source',
        accessorFn: (row) => row.source ?? 'pos',
        header: 'Source',
        cell: ({ row }) => {
            const source = row.original.source ?? 'pos';
            const isMobile = source === 'mobile_app';

            return (
                <Badge
                    className={
                        isMobile
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                    }
                >
                    {isMobile ? 'Mobile' : 'POS'}
                </Badge>
            );
        },
    },
    {
        id: 'customer',
        accessorFn: (row) =>
            row.client?.name ?? row.customer_name ?? row.customer_phone ?? '-',
        header: 'Customer',
        cell: ({ row }) => {
            const order = row.original;
            const name = order.client?.name ?? order.customer_name ?? '-';
            const phone = order.client?.phone ?? order.customer_phone ?? null;

            return (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                        {phone ?? 'No phone'}
                    </p>
                </div>
            );
        },
    },
    {
        id: 'kitchens',
        header: 'Kitchens',
        cell: ({ row }) => {
            const names = Array.from(
                new Set(
                    (row.original.items ?? [])
                        .map(
                            (item) =>
                                item.kitchen?.name ??
                                item.product?.kitchen?.name ??
                                'Unassigned',
                        )
                        .filter(Boolean),
                ),
            );

            return (
                <span className="text-sm text-muted-foreground">
                    {names.length > 0 ? names.join(', ') : 'Unassigned'}
                </span>
            );
        },
    },
    {
        accessorKey: 'items_count',
        header: 'Items',
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.getValue('items_count') ?? row.original.items?.length ?? 0}
            </span>
        ),
    },
    {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => formatAfn(row.getValue('total_amount')),
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
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <OrderRowActions
                order={row.original}
                branchTables={branchTables}
                onEdit={onEdit}
                onView={onView}
                onAddItems={onAddItems}
                onAssignTable={onAssignTable}
                onUpdateStatus={onUpdateStatus}
                onPrint={onPrint}
            />
        ),
    },
];
