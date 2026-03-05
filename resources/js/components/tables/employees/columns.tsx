import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Branch, Employee, EmployeePosition, EmploymentType } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

export const buildColumns = (
    branches: Branch[],
    employmentTypes: EmploymentType[],
    employeePositions: EmployeePosition[],
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
            const salary = row.original.salary;
            if (salary === null || salary === undefined || salary === '') {
                return '—';
            }

            const numericSalary = Number(salary);
            if (Number.isNaN(numericSalary)) {
                return '—';
            }

            return `${numericSalary.toLocaleString()} ${row.original.salary_currency ?? 'AFN'}`;
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
            />
        ),
    },
];
