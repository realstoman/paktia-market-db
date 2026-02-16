import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Kitchen, Product } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

export const buildColumns = (
    kitchenTypes: { label: string; value: string }[],
    products: Product[],
): ColumnDef<Kitchen>[] => [
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
        header: 'ID',
    },
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => row.getValue('type') || '—',
    },
    {
        id: 'products',
        header: 'Products',
        accessorFn: (row) =>
            (row.products ?? [])
                .map((product) => product.name)
                .join(', '),
        cell: ({ row }) => {
            const kitchenProducts = row.original.products ?? [];
            if (kitchenProducts.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        No products
                    </span>
                );
            }

            return (
                <span className="text-xs text-muted-foreground">
                    {kitchenProducts.length} product
                    {kitchenProducts.length > 1 ? 's' : ''}
                </span>
            );
        },
    },

    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
            const active = row.getValue('is_active');
            return active ? (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    Active
                </Badge>
            ) : (
                <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                    <Ban className="h-4 w-4 text-red-600" />
                    Inactive
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
            <CellAction
                data={row.original}
                kitchenTypes={kitchenTypes}
                products={products}
            />
        ),
    },
];
