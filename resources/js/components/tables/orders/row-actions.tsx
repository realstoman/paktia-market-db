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
import { BranchTable, Order } from '@/types';
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
    'completed',
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
    const { t } = useLocalization();
    const [isAssignTableOpen, setIsAssignTableOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [branchTableId, setBranchTableId] = useState(
        order.branch_table_id ? String(order.branch_table_id) : '',
    );
    const [status, setStatus] = useState(order.status ?? 'pending');
    const [paymentMethod, setPaymentMethod] = useState(
        order.payments?.[0]?.method ?? 'cash',
    );
    const [error, setError] = useState('');
    const canPrintReceipt = (order.status ?? 'pending') === 'completed';
    const paymentMethodOptions = [
        { value: 'cash', label: t('orders.paymentMethod.cash', 'Cash') },
        {
            value: 'bank_transfer',
            label: t(
                'orders.paymentMethod.bank_transfer',
                'Bank Transfer',
            ),
        },
        {
            value: 'credit_card',
            label: t('orders.paymentMethod.credit_card', 'Credit Card'),
        },
        { value: 'other', label: t('orders.paymentMethod.other', 'Other') },
    ];

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
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                        {t('orders.rowActions.actions', 'Actions')}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('orders.rowActions.viewDetails', 'Details')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        {t('orders.rowActions.editOrder', 'Edit Order')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddItems(order)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('orders.rowActions.addItem', 'Add Item')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => canPrintReceipt && onPrint(order)}
                        disabled={!canPrintReceipt}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        {t('orders.rowActions.printReceipt', 'Print Receipt')}
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
                        {t('orders.rowActions.assignTable', 'Assign Table')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            setStatus(order.status ?? 'pending');
                            setPaymentMethod(
                                order.payments?.[0]?.method ?? 'cash',
                            );
                            setIsStatusOpen(true);
                        }}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
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
                        <Label>{t('orders.detailsModal.status', 'Status')}</Label>
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

                    {status === 'completed' ? (
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'orders.form.paymentMethod',
                                    'Payment Method',
                                )}
                            </Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={setPaymentMethod}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'orders.form.paymentMethodPlaceholder',
                                            'Select payment method',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethodOptions.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

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
                                onUpdateStatus(
                                    order,
                                    status,
                                    status === 'completed'
                                        ? paymentMethod
                                        : undefined,
                                );
                                setIsStatusOpen(false);
                            }}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t('orders.rowActions.updateStatus', 'Update Status')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
