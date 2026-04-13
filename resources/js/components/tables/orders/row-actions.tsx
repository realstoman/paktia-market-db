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
import { useLocalization } from '@/lib/localization';
import { BranchTable, Order, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    Edit3,
    Eye,
    MoreHorizontal,
    Plus,
    Printer,
    Save,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ORDER_STATUSES = [
    'pending',
    'in_progress',
    'ready',
    'cancelled',
];

interface OrderRowActionsProps {
    order: Order;
    branchTables: BranchTable[];
    onEdit: (order: Order) => void;
    onView: (order: Order) => void;
    onAddItems: (order: Order) => void;
    onAssignTable: (order: Order, branchTableId: number) => void;
    onUpdateStatus: (
        order: Order,
        status: string,
        paymentMethod?: string,
    ) => void;
    onPrint: (order: Order) => void;
}

export function OrderRowActions({
    order,
    branchTables,
    onEdit,
    onView,
    onAddItems,
    onAssignTable,
    onUpdateStatus,
    onPrint,
}: OrderRowActionsProps) {
    const { auth } = usePage<SharedData>().props;
    const { t, isRtl } = useLocalization();
    const [isAssignTableOpen, setIsAssignTableOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [branchTableId, setBranchTableId] = useState(
        order.branch_table_id ? String(order.branch_table_id) : '',
    );
    const [status, setStatus] = useState(order.status ?? 'pending');
    const [error, setError] = useState('');
    const isCompleted = (order.status ?? 'pending') === 'completed';
    const canPrintReceipt = ['ready', 'completed'].includes(
        order.status ?? 'pending',
    );
    const canEditOrder = !isCompleted;
    const canAddOrderItems = !isCompleted;
    const canAssignOrderTable = !isCompleted;
    const canUpdateStatus = !isCompleted || auth.is_super_admin === true;
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
            setError(
                t(
                    'orders.rowActions.selectTableError',
                    'Please select a table number.',
                ),
            );
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
                        <span className="sr-only">
                            {t('orders.rowActions.openMenu', 'Open menu')}
                        </span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={isRtl ? 'start' : 'end'}
                    className={isRtl ? 'text-right' : ''}
                >
                    <DropdownMenuLabel className={isRtl ? 'text-right' : ''}>
                        {t('orders.rowActions.actions', 'Actions')}
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                        onClick={() => onView(order)}
                    >
                        <Eye
                            className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        />
                        {t('orders.rowActions.viewDetails', 'Details')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                        onClick={() => canEditOrder && onEdit(order)}
                        disabled={!canEditOrder}
                    >
                        <Edit3
                            className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        />
                        {t('orders.rowActions.editOrder', 'Edit Order')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                        onClick={() => canAddOrderItems && onAddItems(order)}
                        disabled={!canAddOrderItems}
                    >
                        <Plus
                            className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        />
                        {t('orders.rowActions.addItem', 'Add Item')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                        onClick={() => canPrintReceipt && onPrint(order)}
                        disabled={!canPrintReceipt}
                    >
                        <Printer
                            className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        />
                        {t('orders.rowActions.printReceipt', 'Print Receipt')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                        onClick={() => {
                            if (!canAssignOrderTable) {
                                return;
                            }
                            setBranchTableId(
                                order.branch_table_id
                                    ? String(order.branch_table_id)
                                    : '',
                            );
                            setError('');
                            setIsAssignTableOpen(true);
                        }}
                        disabled={!canAssignOrderTable}
                    >
                        <Edit3
                            className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        />
                        {t('orders.rowActions.assignTable', 'Assign Table')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className={
                            isRtl
                                ? 'w-full flex-row-reverse justify-start text-right'
                                : ''
                        }
                        onClick={() => {
                            if (!canUpdateStatus) {
                                return;
                            }
                            setStatus(order.status ?? 'pending');
                            setIsStatusOpen(true);
                        }}
                        disabled={!canUpdateStatus}
                    >
                        <Edit3
                            className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                        />
                        {t('orders.rowActions.updateStatus', 'Update Status')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={isAssignTableOpen}
                onOpenChange={setIsAssignTableOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'orders.rowActions.assignTableTitle',
                                'Assign Table Number',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'orders.rowActions.assignTableDescriptionPrefix',
                                'Change table number for order #',
                            )}
                            {order.id}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label>
                            {t('orders.form.tableNumber', 'Table Number')}
                        </Label>
                        <Select
                            value={branchTableId}
                            onValueChange={setBranchTableId}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={t(
                                        'orders.form.tableNumberPlaceholder',
                                        'Select table number',
                                    )}
                                />
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
                            {t('orders.rowActions.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={handleAssign}>
                            <Save className="mr-2 h-4 w-4" />
                            {t('orders.rowActions.updateTable', 'Update Table')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'orders.rowActions.updateStatusTitle',
                                'Update Order Status',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'orders.rowActions.updateStatusDescriptionPrefix',
                                'Change status for order #',
                            )}
                            {order.id}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <Label>
                            {t('orders.detailsModal.status', 'Status')}
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUSES.map((entry) => (
                                    <SelectItem key={entry} value={entry}>
                                        {t(`orders.status.${entry}`, entry)}
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
                            {t('orders.rowActions.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                onUpdateStatus(order, status);
                                setIsStatusOpen(false);
                            }}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t(
                                'orders.rowActions.updateStatus',
                                'Update Status',
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
