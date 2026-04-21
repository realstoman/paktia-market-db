import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { BranchTable, Order } from '@/types';
import { formatAfn } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban, Clock3, CookingPot } from 'lucide-react';
import React from 'react';
import { OrderRowActions } from './row-actions';

const statusStyles: Record<string, { icon: React.JSX.Element }> = {
    pending: {
        icon: <Clock3 className="h-4 w-4 text-amber-600" />,
    },
    in_progress: {
        icon: <CookingPot className="h-4 w-4 text-blue-600" />,
    },
    ready: {
        icon: <BadgeCheck className="h-4 w-4 text-emerald-600" />,
    },
    completed: {
        icon: <BadgeCheck className="h-4 w-4 text-green-600" />,
    },
    cancelled: {
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
    t: (key: string, fallback?: string) => string;
    getStatusLabel: (status: string) => string;
    getSourceLabel: (source: string) => string;
    dateLocale: string;
}

export const buildColumns = ({
    onEdit,
    onView,
    onAddItems,
    onAssignTable,
    onUpdateStatus,
    onPrint,
    branchTables,
    t,
    getStatusLabel,
    getSourceLabel,
    dateLocale,
}: BuildOrderColumnsOptions): ColumnDef<Order>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                onClick={(event) => event.stopPropagation()}
                aria-label={t('orders.columns.selectAll', 'Select all')}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                onClick={(event) => event.stopPropagation()}
                aria-label={t('orders.columns.selectRow', 'Select row')}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: t('orders.columns.orderId', 'Order ID'),
    },
    {
        id: 'branch.name',
        accessorFn: (row) =>
            row.branch?.name ?? t('orders.columns.unknown', 'Unknown'),
        header: t('orders.columns.branch', 'Branch'),
    },
    {
        id: 'branch_table.table_number',
        accessorFn: (row) => row.branch_table?.table_number ?? '-',
        header: t('orders.columns.tableNumber', 'Table Number'),
    },
    {
        id: 'user.name',
        accessorFn: (row) =>
            row.user?.name ?? t('orders.columns.system', 'System'),
        header: t('orders.columns.createdBy', 'Created By'),
    },
    {
        id: 'source',
        accessorFn: (row) => row.source ?? 'pos',
        header: t('orders.columns.source', 'Source'),
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
                    {getSourceLabel(isMobile ? 'mobile_app' : 'pos')}
                </Badge>
            );
        },
    },
    {
        id: 'customer',
        accessorFn: (row) =>
            row.client?.name ?? row.customer_name ?? row.customer_phone ?? '-',
        header: t('orders.columns.customer', 'Customer'),
        cell: ({ row }) => {
            const order = row.original;
            const name = order.client?.name ?? order.customer_name ?? '-';
            const phone = order.client?.phone ?? order.customer_phone ?? null;

            return (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                        {phone ?? t('orders.columns.noPhone', 'No phone')}
                    </p>
                </div>
            );
        },
    },
    {
        id: 'kitchens',
        header: t('orders.columns.kitchens', 'Kitchens'),
        cell: ({ row }) => {
            const names = Array.from(
                new Set(
                    (row.original.items ?? [])
                        .map(
                            (item) =>
                                item.kitchen?.name ??
                                item.product?.kitchen?.name ??
                                t('orders.columns.unassigned', 'Unassigned'),
                        )
                        .filter(Boolean),
                ),
            );
            const visibleNames = names.slice(0, 2);
            const hiddenNames = names.slice(2);

            if (names.length === 0) {
                return (
                    <span className="text-sm text-muted-foreground">
                        {t('orders.columns.unassigned', 'Unassigned')}
                    </span>
                );
            }

            return (
                <div className="max-w-[170px] space-y-1">
                    {visibleNames.map((name) => (
                        <div
                            key={name}
                            className="truncate text-sm text-muted-foreground"
                            title={name}
                        >
                            {name}
                        </div>
                    ))}
                    {hiddenNames.length > 0 ? (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        +{hiddenNames.length} more
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <div className="space-y-1">
                                        {hiddenNames.map((name) => (
                                            <p key={name}>{name}</p>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : null}
                </div>
            );
        },
    },
    {
        accessorKey: 'items_count',
        header: t('orders.columns.items', 'Items'),
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {row.getValue('items_count') ?? row.original.items?.length ?? 0}
            </span>
        ),
    },
    {
        accessorKey: 'total_amount',
        header: t('orders.columns.total', 'Total'),
        cell: ({ row }) => formatAfn(row.getValue('total_amount')),
    },
    {
        accessorKey: 'status',
        header: t('orders.columns.status', 'Status'),
        cell: ({ row }) => {
            const statusValue = row.getValue('status') as string | undefined;
            const status =
                (statusValue && statusStyles[statusValue]) ||
                statusStyles.pending;

            return (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    {status.icon}
                    {getStatusLabel(statusValue ?? 'pending')}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: t('orders.columns.createdAt', 'Created At'),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return date.toLocaleDateString(dateLocale);
        },
    },
    {
        id: 'actions',
        header: t('orders.columns.actions', 'Actions'),
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
