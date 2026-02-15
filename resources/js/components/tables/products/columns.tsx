import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Product, ProductCategory } from '@/types';
import { formatPrice } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban, Image as ImageIcon } from 'lucide-react';
import { CellAction } from './cell-action';

const getInitials = (value?: string) => {
    if (!value) return 'PR';
    return value
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
};

export const buildColumns = (
    categories: ProductCategory[],
): ColumnDef<Product>[] => [
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
        header: 'Product',
        cell: ({ row }) => {
            const product = row.original;
            const imageUrl = product.images?.[0]?.url;

            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        {imageUrl ? (
                            <AvatarImage src={imageUrl} alt={product.name} />
                        ) : null}
                        <AvatarFallback>
                            {getInitials(product.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {product.category?.name ?? 'Uncategorized'}
                        </span>
                    </div>
                </div>
            );
        },
    },
    {
        id: 'category.name',
        accessorFn: (row) => row.category?.name ?? 'Uncategorized',
        header: 'Category',
    },
    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
            <Badge variant="secondary" className="capitalize">
                {row.getValue('type')}
            </Badge>
        ),
    },
    {
        accessorKey: 'base_price',
        header: 'Base Price',
        cell: ({ row }) => formatPrice(row.getValue('base_price')),
    },
    {
        id: 'sizes',
        header: 'Sizes',
        cell: ({ row }) => {
            const sizeCount = row.original.sizes?.length ?? 0;
            return (
                <span className="text-sm text-muted-foreground">
                    {sizeCount} size{sizeCount === 1 ? '' : 's'}
                </span>
            );
        },
    },
    {
        id: 'images',
        header: 'Images',
        cell: ({ row }) => {
            const count = row.original.images?.length ?? 0;
            return (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    {count}
                </div>
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
            <CellAction data={row.original} categories={categories} />
        ),
    },
];
