import { Badge } from '@/components/ui/badge';
import { Printer } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

interface BuildColumnsProps {
    t: (key: string, fallback?: string) => string;
    onEdit: (printer: Printer) => void;
    onDelete: (printer: Printer) => void;
    onTestPrint: (printer: Printer) => void;
}

function assignmentLabel(
    assignment: Printer['assignments'][number],
    t: (key: string, fallback?: string) => string,
) {
    if (!assignment) {
        return t('printers.unassigned', 'Unassigned');
    }

    switch (assignment.assignment_type) {
        case 'kitchen':
            return assignment.kitchen?.name
                ? `${t('printers.assignmentKitchen', 'Kitchen')}: ${assignment.kitchen.name}`
                : t('printers.assignmentKitchen', 'Kitchen');
        case 'order_type':
            return `${t('printers.assignmentOrderType', 'Order Type')}: ${assignment.order_type ?? '-'}`;
        case 'order_taker':
            return `${t('printers.assignmentOrderTaker', 'Order-Taker')}: ${assignment.station_label ?? t('printers.defaultStation', 'Default')}`;
        case 'cashier':
            return `${t('printers.assignmentCashier', 'Cashier')}: ${assignment.station_label ?? t('printers.defaultStation', 'Default')}`;
        default:
            return assignment.station_label || t('printers.assignmentGeneric', 'Generic');
    }
}

export function buildColumns({
    t,
    onEdit,
    onDelete,
    onTestPrint,
}: BuildColumnsProps): ColumnDef<Printer>[] {
    return [
        {
            accessorKey: 'name',
            header: t('printers.table.name', 'Name'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.ip_address}:{row.original.port}
                    </p>
                </div>
            ),
        },
        {
            id: 'branch',
            header: t('printers.table.branch', 'Branch'),
            cell: ({ row }) => row.original.branch?.name ?? t('printers.allBranches', 'All Branches'),
        },
        {
            id: 'assignments',
            header: t('printers.table.assignments', 'Assignments'),
            cell: ({ row }) => {
                const assignments = row.original.assignments ?? [];

                if (assignments.length === 0) {
                    return (
                        <span className="text-xs text-muted-foreground">
                            {t('printers.unassigned', 'Unassigned')}
                        </span>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {assignments.map((assignment, index) => (
                            <Badge
                                key={`${row.original.id}-${assignment.id ?? index}`}
                                variant={assignment.is_active ? 'secondary' : 'outline'}
                            >
                                {assignmentLabel(assignment, t)}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            accessorKey: 'paper_width',
            header: t('printers.table.paperWidth', 'Paper'),
        },
        {
            accessorKey: 'copies',
            header: t('printers.table.copies', 'Copies'),
        },
        {
            accessorKey: 'is_active',
            header: t('printers.table.status', 'Status'),
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'secondary' : 'outline'}>
                    {row.original.is_active
                        ? t('printers.active', 'Active')
                        : t('printers.inactive', 'Inactive')}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: t('printers.table.actions', 'Actions'),
            cell: ({ row }) => (
                <CellAction
                    data={row.original}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onTestPrint={onTestPrint}
                />
            ),
        },
    ];
}
