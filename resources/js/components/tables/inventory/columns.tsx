import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Branch,
    Currency,
    InventoryItem,
    Vendor,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { ImageViewerDialog } from './image-viewer-dialog';

const resolveImageUrl = (path?: string, url?: string) => {
    const candidate = url || path || '';
    if (!candidate) return '';
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        return candidate;
    }
    if (candidate.startsWith('/storage/')) {
        return candidate;
    }
    if (candidate.startsWith('storage/')) {
        return `/${candidate}`;
    }
    if (candidate.startsWith('public/')) {
        return `/storage/${candidate.replace(/^public\//, '')}`;
    }
    if (candidate.startsWith('/')) {
        return candidate;
    }
    return `/storage/${candidate}`;
};

const getInitials = (value?: string) => {
    if (!value) return 'IN';
    return value
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
};

export const buildColumns = (
    branches: Branch[],
    vendors: Vendor[],
    currencies: Currency[],
): ColumnDef<InventoryItem>[] => {
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));

    return [
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
            accessorKey: 'name',
            header: 'Item',
            cell: ({ row }) => {
                const item = row.original;
                const imageUrl = resolveImageUrl(
                    item.images?.[0]?.path,
                    item.images?.[0]?.url,
                );

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            {imageUrl ? (
                                <AvatarImage src={imageUrl} alt={item.name} />
                            ) : null}
                            <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                {item.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {item.type}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'branch.name',
            accessorFn: (row) =>
                row.branch?.name ||
                (row.branch_id ? branchById.get(row.branch_id)?.name : null) ||
                'Unknown',
            header: 'Branch',
        },
        {
            accessorKey: 'quantity',
            header: 'Stock',
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <span className="text-sm text-muted-foreground">
                        {Number(item.quantity)} {item.unit ?? 'unit'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'unit_price',
            header: 'Single Price',
            cell: ({ row }) =>
                `${row.original.currency_symbol ?? ''}${formatNumber(
                    row.original.unit_price ?? 0,
                )}`,
        },
        {
            id: 'total_price',
            header: 'Total Price',
            accessorFn: (row) =>
                Number(row.quantity || 0) * Number(row.unit_price || 0),
            cell: ({ row }) => {
                const total =
                    Number(row.original.quantity || 0) *
                    Number(row.original.unit_price || 0);
                return `${row.original.currency_symbol ?? ''}${formatNumber(total)}`;
            },
        },
        {
            accessorKey: 'paid_amount',
            header: 'Paid',
            cell: ({ row }) =>
                `${row.original.currency_symbol ?? ''}${formatNumber(
                    row.original.paid_amount ?? 0,
                )}`,
        },
        {
            id: 'outstanding_amount',
            header: 'Remaining',
            accessorFn: (row) =>
                Math.max(
                    0,
                    Number(row.quantity || 0) * Number(row.unit_price || 0) -
                        Number(row.paid_amount || 0),
                ),
            cell: ({ row }) =>
                `${row.original.currency_symbol ?? ''}${formatNumber(
                    Math.max(
                        0,
                        Number(row.original.quantity || 0) *
                            Number(row.original.unit_price || 0) -
                            Number(row.original.paid_amount || 0),
                    ),
                )}`,
        },
        {
            accessorKey: 'is_usable',
            header: 'Usable',
            cell: ({ row }) =>
                row.original.is_usable ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Usable
                    </Badge>
                ) : (
                    <Badge className="bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                        Not Usable
                    </Badge>
                ),
        },
        {
            id: 'images',
            header: 'Images',
            cell: ({ row }) => (
                <ImageViewerDialog images={row.original.images ?? []} />
            ),
        },
        {
            id: 'receipt',
            header: 'Receipt/Bill',
            cell: ({ row }) => {
                const item = row.original;
                const receiptUrl = resolveImageUrl(
                    item.receipt_path ?? undefined,
                    item.receipt_url ?? undefined,
                );

                if (!receiptUrl) {
                    return (
                        <span className="text-xs text-muted-foreground">-</span>
                    );
                }

                return (
                    <a
                        href={receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        View
                    </a>
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
                <CellAction
                    data={row.original}
                    branches={branches}
                    vendors={vendors}
                    currencies={currencies}
                />
            ),
        },
    ];
};
