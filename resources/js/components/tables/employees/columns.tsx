import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatNumber } from '@/utils/format';
import {
    Property,
    Employee,
    EmployeePosition,
    EmploymentType,
    Shift,
} from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

type TranslateFn = (key: string, fallback?: string) => string;

const publicStorageUrl = (path?: string | null) => {
    if (!path) {
        return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('/storage/')) {
        return path;
    }

    return `/storage/${path.replace(/^\/+/, '')}`;
};

export const buildColumns = (
    properties: Property[],
    employmentTypes: EmploymentType[],
    employeePositions: EmployeePosition[],
    shifts: Shift[],
    canDelete: boolean,
    t: TranslateFn,
    locale: string,
): ColumnDef<Employee>[] => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label={t('employees.table.selectAll', 'Select all')}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('employees.table.selectRow', 'Select row')}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'photo',
        header: t('employees.table.photo', 'Photo'),
        cell: ({ row }) => {
            const photoUrl = publicStorageUrl(row.original.profile_picture);
            const initials =
                `${row.original.first_name?.charAt(0) ?? ''}${row.original.last_name?.charAt(0) ?? ''}`.toUpperCase();

            return (
                <div className="flex items-center">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={row.original.full_name ?? t('employees.page.title', 'Employee')}
                            className="h-10 w-10 rounded-full border object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
                            {initials || t('employees.common.na', 'NA')}
                        </div>
                    )}
                </div>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: 'id',
        header: t('employees.table.id', 'ID'),
    },
    {
        accessorKey: 'full_name',
        header: t('employees.table.name', 'Name'),
    },
    {
        accessorKey: 'phone',
        header: t('employees.table.phone', 'Phone'),
        cell: ({ row }) => row.original.phone || t('employees.common.empty', '—'),
    },
    {
        accessorKey: 'employment_type',
        header: t('employees.table.employmentType', 'Employment Type'),
        cell: ({ row }) =>
            row.original.employment_type || t('employees.common.empty', '—'),
    },
    {
        accessorKey: 'shift',
        header: t('employees.table.shift', 'Shift'),
        cell: ({ row }) => {
            const shift = row.original.shift;
            if (!shift) {
                return t('employees.common.empty', '—');
            }

            const nameMatch = shift.match(/^(.*?)\s*\((.*?)\)$/);
            if (!nameMatch) {
                return shift;
            }

            const [, name, time] = nameMatch;

            return (
                <div className="leading-tight">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{time}</p>
                </div>
            );
        },
    },
    {
        accessorKey: 'employee_position',
        header: t('employees.table.position', 'Position'),
        cell: ({ row }) =>
            row.original.employee_position || t('employees.common.empty', '—'),
    },
    {
        accessorKey: 'property',
        header: t('employees.filters.property', 'Property'),
        cell: ({ row }) => row.original.property || t('employees.common.empty', '—'),
    },
    {
        accessorKey: 'salary',
        header: t('employees.table.salary', 'Salary'),
        cell: ({ row }) => {
            const compensation =
                row.original.contract_amount ?? row.original.salary;
            if (
                compensation === null ||
                compensation === undefined ||
                compensation === ''
            ) {
                return t('employees.common.empty', '—');
            }

            const numericSalary = Number(compensation);
            if (Number.isNaN(numericSalary)) {
                return t('employees.common.empty', '—');
            }

            return `${formatNumber(numericSalary)} ${row.original.salary_currency ?? 'AFN'}${row.original.contract_amount ? ` (${t('employees.common.contract', 'Contract')})` : ''}`;
        },
    },
    {
        accessorKey: 'status',
        header: t('employees.table.status', 'Status'),
        cell: ({ row }) => {
            const active = row.original.is_active;
            const status =
                row.original.status || (active ? 'active' : 'inactive');
            const label = t(
                `employees.statuses.${status}`,
                status
                    .split('_')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' '),
            );

            return active ? (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    {label}
                </Badge>
            ) : (
                <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                    <Ban className="h-4 w-4 text-red-600" />
                    {label}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: t('employees.table.createdAt', 'Created At'),
        cell: ({ row }) => {
            const createdAt = row.original.created_at;
            if (!createdAt) {
                return t('employees.common.empty', '—');
            }

            return new Intl.DateTimeFormat(
                locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                },
            ).format(new Date(createdAt));
        },
    },
    {
        id: 'actions',
        header: t('employees.table.actions', 'Actions'),
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                properties={properties}
                employmentTypes={employmentTypes}
                employeePositions={employeePositions}
                shifts={shifts}
                canDelete={canDelete}
            />
        ),
    },
];
