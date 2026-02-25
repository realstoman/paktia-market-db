import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BranchTable, Order } from '@/types';
import { Edit3, Eye, MoreHorizontal, Plus, Printer, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const ORDER_STATUSES = [
    'pending',
    'in_progress',
    'ready',
    'completed',
    'cancelled',
];

interface OrderRowActionsProps {
    order: Order;
    branchTables: BranchTable[];
    onView: (order: Order) => void;
    onAddItems: (order: Order) => void;
    onAssignTable: (order: Order, branchTableId: number) => void;
    onUpdateStatus: (order: Order, status: string) => void;
    onPrint: (order: Order) => void;
}

export function OrderRowActions({
    order,
    branchTables,
    onView,
    onAddItems,
    onAssignTable,
    onUpdateStatus,
    onPrint,
}: OrderRowActionsProps) {
    const [isAssignTableOpen, setIsAssignTableOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [branchTableId, setBranchTableId] = useState(
        order.branch_table_id ? String(order.branch_table_id) : '',
    );
    const [status, setStatus] = useState(order.status ?? 'pending');
    const [error, setError] = useState('');
    const canPrintReceipt = (order.status ?? 'pending') === 'completed';

    const tableOptions = useMemo(
        () =>
            branchTables.filter(
                (table) =>
                    table.branch_id === order.branch_id &&
                    table.is_active !== false,
            ),
        [branchTables, order.branch_id],
    );

    const handleAssign = () => {
        if (!branchTableId) {
            setError('Please select a table number.');
            return;
        }
        setError('');
        onAssignTable(order, Number(branchTableId));
        setIsAssignTableOpen(false);
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddItems(order)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => canPrintReceipt && onPrint(order)}
                        disabled={!canPrintReceipt}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print Receipt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setBranchTableId(
                                order.branch_table_id
                                    ? String(order.branch_table_id)
                                    : '',
                            );
                            setError('');
                            setIsAssignTableOpen(true);
                        }}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Assign Table
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setStatus(order.status ?? 'pending');
                            setIsStatusOpen(true);
                        }}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Update Status
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isAssignTableOpen} onOpenChange={setIsAssignTableOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Table Number</DialogTitle>
                        <DialogDescription>
                            Change table number for order #{order.id}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label>Table Number</Label>
                        <Select
                            value={branchTableId}
                            onValueChange={setBranchTableId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select table number" />
                            </SelectTrigger>
                            <SelectContent>
                                {tableOptions.map((table) => (
                                    <SelectItem
                                        key={table.id}
                                        value={String(table.id)}
                                    >
                                        {table.table_number} - {table.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={error} />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAssignTableOpen(false)}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button onClick={handleAssign}>
                            <Save className="mr-2 h-4 w-4" />
                            Update Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Order Status</DialogTitle>
                        <DialogDescription>
                            Change status for order #{order.id}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUSES.map((entry) => (
                                    <SelectItem key={entry} value={entry}>
                                        {entry
                                            .replace('_', ' ')
                                            .replace(/\b\w/g, (c) =>
                                                c.toUpperCase(),
                                            )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsStatusOpen(false)}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                onUpdateStatus(order, status);
                                setIsStatusOpen(false);
                            }}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
