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
import { Edit3, Eye, MoreHorizontal, Plus, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface OrderRowActionsProps {
    order: Order;
    branchTables: BranchTable[];
    onView: (order: Order) => void;
    onAddItems: (order: Order) => void;
    onAssignTable: (order: Order, branchTableId: number) => void;
}

export function OrderRowActions({
    order,
    branchTables,
    onView,
    onAddItems,
    onAssignTable,
}: OrderRowActionsProps) {
    const [isAssignTableOpen, setIsAssignTableOpen] = useState(false);
    const [branchTableId, setBranchTableId] = useState(
        order.branch_table_id ? String(order.branch_table_id) : '',
    );
    const [error, setError] = useState('');

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
        </>
    );
}
