import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Cuisine,
    Kitchen,
    Product,
    ProductCategory,
    ProductSize,
    ProductType,
} from '@/types';
import { formatAfn } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban, Image as ImageIcon } from 'lucide-react';
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
    if (!value) return 'PR';
    return value
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
};

export const buildColumns = (
    categories: ProductCategory[],
    cuisines: Cuisine[],
    types: ProductType[],
    kitchens: Kitchen[],
    sizes: ProductSize[],
    t: (key: string, fallback?: string) => string,
    canDelete: boolean,
): ColumnDef<Product>[] => {
    const categoryById = new Map(
        categories.map((category) => [category.id, category]),
    );

    return [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label={t('products.columns.selectAll', 'Select all')}
                />
            ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('products.columns.selectRow', 'Select row')}
            />
        ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: t('products.columns.product', 'Product'),
            cell: ({ row }) => {
                const product = row.original;
                const imageUrl = resolveImageUrl(
                    product.images?.[0]?.path,
                    product.images?.[0]?.url,
                );
                // const resolvedCategory =
                //     product.category?.name ||
                //     (product.product_category_id
                //         ? categoryById.get(product.product_category_id)?.name
                //         : null) ||
                //     'Uncategorized';

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            {imageUrl !== '' ? (
                                <AvatarImage
                                    src={imageUrl}
                                    alt={product.name}
                                />
                            ) : null}
                            <AvatarFallback>
                                {getInitials(product.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                {product.name}
                            </span>
                            {product.pashto_name ? (
                                <span className="text-xs text-muted-foreground">
                                    {t('products.columns.psPrefix', 'PS:')}{' '}
                                    {product.pashto_name}
                                </span>
                            ) : null}
                            {product.dari_name ? (
                                <span className="text-xs text-muted-foreground">
                                    {t('products.columns.faPrefix', 'FA:')}{' '}
                                    {product.dari_name}
                                </span>
                            ) : null}
                            {/* <span className="text-xs text-muted-foreground">
                            {resolvedCategory}
                        </span> */}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'category.name',
            accessorFn: (row) => {
                const byRelation = row.category?.name;
                const byId = row.product_category_id
                    ? categoryById.get(row.product_category_id)?.name
                    : null;
                return (
                    byRelation ||
                    byId ||
                    t('products.columns.uncategorized', 'Uncategorized')
                );
            },
            header: t('products.columns.category', 'Category'),
        },
        {
            id: 'kitchen.name',
            accessorFn: (row) =>
                row.kitchen?.name ??
                t('products.columns.unassigned', 'Unassigned'),
            header: t('products.columns.kitchen', 'Kitchen'),
        },
        {
            accessorKey: 'type',
            header: t('products.columns.type', 'Type'),
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize">
                    {row.getValue('type')}
                </Badge>
            ),
        },
        {
            accessorKey: 'base_price',
            header: t('products.columns.basePrice', 'Base Price'),
            cell: ({ row }) => formatAfn(row.getValue('base_price')),
        },
        {
            id: 'sizes',
            header: t('products.columns.sizes', 'Sizes'),
            cell: ({ row }) => {
                const sizeCount = row.original.sizes?.length ?? 0;
                return (
                    <span className="text-sm text-muted-foreground">
                        {sizeCount}{' '}
                        {t('products.columns.sizes', 'Sizes')}
                    </span>
                );
            },
        },
        {
            id: 'images',
            header: t('products.columns.images', 'Images'),
            cell: ({ row }) => {
                const count = row.original.images?.length ?? 0;
                return (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                            {count}
                        </div>
                        <ImageViewerDialog
                            images={row.original.images ?? []}
                            triggerLabel={t(
                                'products.columns.imageView',
                                'View',
                            )}
                        />
                    </div>
                );
            },
        },
        {
            accessorKey: 'is_active',
            header: t('products.columns.status', 'Status'),
            cell: ({ row }) => {
                const active = row.getValue('is_active');
                return active ? (
                    <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                        <BadgeCheck className="h-4 w-4 text-green-600" />
                        {t('products.filters.active', 'Active')}
                    </Badge>
                ) : (
                    <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                        <Ban className="h-4 w-4 text-red-600" />
                        {t('products.filters.inactive', 'Inactive')}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: t('products.columns.actions', 'Actions'),
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    categories={categories}
                    cuisines={cuisines}
                    types={types}
                    kitchens={kitchens}
                    sizes={sizes}
                    canDelete={canDelete}
                />
            ),
        },
    ];
};
