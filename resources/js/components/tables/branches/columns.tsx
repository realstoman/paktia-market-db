import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Branch, Country, Province } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

type TranslateFn = (key: string, fallback?: string) => string;

export const buildColumns = (
    countries: Country[],
    provinces: Province[],
    t: TranslateFn,
    locale: string,
): ColumnDef<Branch>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label={t('branches.table.selectAll', 'Select all')}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('branches.table.selectRow', 'Select row')}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: t('branches.table.id', 'ID'),
    },
    {
        accessorKey: 'name',
        header: t('branches.table.name', 'Name'),
    },
    {
        accessorKey: 'country',
        header: t('branches.table.country', 'Country'),
    },
    {
        accessorKey: 'province',
        header: t('branches.table.province', 'Province'),
    },
    {
        accessorKey: 'address',
        header: t('branches.table.address', 'Address'),
    },
    {
        accessorKey: 'is_active',
        header: t('branches.table.status', 'Status'),
        cell: ({ row }) => {
            const active = row.getValue('is_active');
            return active ? (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    {t('branches.statuses.active', 'Active')}
                </Badge>
            ) : (
                <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                    <Ban className="h-4 w-4 text-red-600" />
                    {t('branches.statuses.inactive', 'Inactive')}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: t('branches.table.createdAt', 'Created At'),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return new Intl.DateTimeFormat(
                locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US',
            ).format(date);
        },
    },
    {
        id: 'actions',
        header: t('branches.table.actions', 'Actions'),
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                countries={countries}
                provinces={provinces}
            />
        ),
    },
];
