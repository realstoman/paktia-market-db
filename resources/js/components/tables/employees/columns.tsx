import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Branch,
    Employee,
    EmployeePosition,
    EmploymentType,
    Shift,
} from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

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
    branches: Branch[],
    employmentTypes: EmploymentType[],
    employeePositions: EmployeePosition[],
    shifts: Shift[],
): ColumnDef<Employee>[] => [
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
        id: 'photo',
        header: 'Photo',
        cell: ({ row }) => {
            const photoUrl = publicStorageUrl(row.original.profile_picture);
            const initials = `${row.original.first_name?.charAt(0) ?? ''}${row.original.last_name?.charAt(0) ?? ''}`.toUpperCase();

            return (
                <div className="flex items-center">
                    {photoUrl ? (
                        <img
                            src={photoUrl}
                            alt={row.original.full_name ?? 'Employee'}
                            className="h-10 w-10 rounded-full border object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground">
                            {initials || 'NA'}
                        </div>
                    )}
                </div>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'full_name',
        header: 'Name',
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.phone || '—',
    },
    {
        accessorKey: 'employment_type',
        header: 'Employment Type',
        cell: ({ row }) => row.original.employment_type || '—',
    },
    {
        accessorKey: 'shift',
        header: 'Shift',
        cell: ({ row }) => {
            const shift = row.original.shift;
            if (!shift) {
                return '—';
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
        header: 'Position',
        cell: ({ row }) => row.original.employee_position || '—',
    },
    {
        accessorKey: 'branch',
        header: 'Branch',
        cell: ({ row }) => row.original.branch || '—',
    },
    {
        accessorKey: 'salary',
        header: 'Salary',
        cell: ({ row }) => {
            const compensation =
                row.original.contract_amount ?? row.original.salary;
            if (
                compensation === null ||
                compensation === undefined ||
                compensation === ''
            ) {
                return '—';
            }

            const numericSalary = Number(compensation);
            if (Number.isNaN(numericSalary)) {
                return '—';
            }

            return `${numericSalary.toLocaleString()} ${row.original.salary_currency ?? 'AFN'}${row.original.contract_amount ? ' (Contract)' : ''}`;
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const active = row.original.is_active;
            const status = row.original.status || (active ? 'active' : 'inactive');
            const label = status
                .split('_')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');

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
        header: 'Created At',
        cell: ({ row }) => {
            const createdAt = row.original.created_at;
            if (!createdAt) {
                return '—';
            }

            return new Date(createdAt).toLocaleDateString();
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                branches={branches}
                employmentTypes={employmentTypes}
                employeePositions={employeePositions}
                shifts={shifts}
            />
        ),
    },
];
