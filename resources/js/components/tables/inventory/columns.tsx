import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Property,
    Currency,
    Employee,
    InventoryCategory,
    InventoryItem,
    InventoryType,
    Unit,
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
    properties: Property[],
    vendors: Vendor[],
    currencies: Currency[],
    units: Unit[],
    categories: InventoryCategory[],
    inventoryTypes: InventoryType[],
    employees: Employee[],
    t: (key: string, fallback?: string) => string,
): ColumnDef<InventoryItem>[] => {
    const propertyById = new Map(properties.map((property) => [property.id, property]));
    const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));

    return [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label={t('inventory.columns.selectAll', 'Select all')}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label={t('inventory.columns.selectRow', 'Select row')}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: t('inventory.columns.item', 'Item'),
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
                            <AvatarFallback>
                                {getInitials(item.name)}
                            </AvatarFallback>
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
            id: 'property.name',
            accessorFn: (row) =>
                row.property?.name ||
                (row.property_id ? propertyById.get(row.property_id)?.name : null) ||
                t('inventory.columns.unknown', 'Unknown'),
            header: t('inventory.columns.property', 'Property'),
        },
        {
            id: 'vendor.name',
            accessorFn: (row) =>
                row.vendor?.name ||
                (row.vendor_id ? vendorById.get(row.vendor_id)?.name : null) ||
                '-',
            header: t('inventory.columns.vendor', 'Vendor'),
        },
        {
            accessorKey: 'quantity',
            header: t('inventory.columns.stock', 'Stock'),
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <span className="text-sm text-muted-foreground">
                        {Number(item.quantity)}{' '}
                        {item.unit ?? t('inventory.common.unit', 'unit')}
                    </span>
                );
            },
        },
        {
            accessorKey: 'unit_price',
            header: t('inventory.columns.singlePrice', 'Single Price'),
            cell: ({ row }) =>
                `${row.original.currency_symbol ?? ''}${formatNumber(
                    row.original.unit_price ?? 0,
                )}`,
        },
        {
            id: 'total_price',
            header: t('inventory.columns.totalPrice', 'Total Price'),
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
            accessorKey: 'is_usable',
            header: t('inventory.columns.usable', 'Usable'),
            cell: ({ row }) =>
                row.original.is_usable ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {t('inventory.common.usable', 'Usable')}
                    </Badge>
                ) : (
                    <Badge className="bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                        {t('inventory.common.notUsable', 'Not Usable')}
                    </Badge>
                ),
        },
        {
            id: 'assigned_to',
            header: t('inventory.columns.assignedTo', 'Assigned To'),
            cell: ({ row }) => {
                const activeAssignments = row.original.active_assignments ?? [];

                if (!activeAssignments.length) {
                    return (
                        <span className="text-xs text-muted-foreground">
                            {t('inventory.assignments.available', 'Available')}
                        </span>
                    );
                }

                return (
                    <div className="space-y-1">
                        {activeAssignments.slice(0, 2).map((assignment) => {
                            const employee =
                                assignment.employee ??
                                employees.find(
                                    (item) => item.id === assignment.employee_id,
                                );
                            const employeeName = employee
                                ? `${employee.first_name} ${employee.last_name}`.trim()
                                : t(
                                      'inventory.assignments.employeeNumber',
                                      'Employee #:id',
                                  ).replace(
                                      ':id',
                                      String(assignment.employee_id),
                                  );

                            return (
                                <Badge
                                    key={assignment.id}
                                    variant="outline"
                                    className="block w-fit bg-amber-50 text-amber-800"
                                >
                                    {employeeName}
                                </Badge>
                            );
                        })}
                    </div>
                );
            },
        },
        {
            id: 'images',
            header: t('inventory.columns.images', 'Images'),
            cell: ({ row }) => (
                <ImageViewerDialog images={row.original.images ?? []} />
            ),
        },
        {
            id: 'receipt',
            header: t('inventory.columns.receipt', 'Receipt/Bill'),
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
                        {t('inventory.common.view', 'View')}
                    </a>
                );
            },
        },
        {
            id: 'actions',
            header: t('inventory.columns.actions', 'Actions'),
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    properties={properties}
                    vendors={vendors}
                    currencies={currencies}
                    units={units}
                    categories={categories}
                    inventoryTypes={inventoryTypes}
                    employees={employees}
                />
            ),
        },
    ];
};
