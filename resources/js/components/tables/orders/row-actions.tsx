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
import { useAuthorization } from '@/lib/permissions';
import { BranchTable, Order, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    Eye,
    FilePenLine,
    MoreHorizontal,
    Plus,
    Printer,
    Save,
    SquarePen,
    Utensils,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ORDER_STATUSES = ['pending', 'in_progress', 'ready', 'cancelled'];

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
    mode?: 'dropdown' | 'panel';
    onAction?: () => void;
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
    mode = 'dropdown',
    onAction,
}: OrderRowActionsProps) {
    const { auth } = usePage<SharedData>().props;
    const { t, isRtl } = useLocalization();
    const { can } = useAuthorization();
    const [isAssignTableOpen, setIsAssignTableOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [branchTableId, setBranchTableId] = useState(
        order.branch_table_id ? String(order.branch_table_id) : '',
    );
    const [status, setStatus] = useState(order.status ?? 'pending');
    const [error, setError] = useState('');
    const isCompleted = (order.status ?? 'pending') === 'completed';
    const canViewOrder = can('orders.view');
    const canManageOrder = can('orders.update');
    const canPrintReceipt = ['ready', 'completed'].includes(
        order.status ?? 'pending',
    ) && canViewOrder;
    const canEditOrder = canManageOrder && !isCompleted;
    const canAddOrderItems = canManageOrder && !isCompleted;
    const canAssignOrderTable = canManageOrder && !isCompleted;
    const canUpdateStatus =
        canManageOrder && (!isCompleted || auth.is_super_admin === true);
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
        onAction?.();
    };

    const handleView = () => {
        onView(order);
        onAction?.();
    };

    const handleEdit = () => {
        if (!canEditOrder) {
            return;
        }

        onEdit(order);
        onAction?.();
    };

    const handleAddItems = () => {
        if (!canAddOrderItems) {
            return;
        }

        onAddItems(order);
        onAction?.();
    };

    const handlePrint = () => {
        if (!canPrintReceipt) {
            return;
        }

        onPrint(order);
        onAction?.();
    };

    const handleAssignOpen = () => {
        if (!canAssignOrderTable) {
            return;
        }
        setBranchTableId(
            order.branch_table_id ? String(order.branch_table_id) : '',
        );
        setError('');
        setIsAssignTableOpen(true);
    };

    const handleStatusOpen = () => {
        if (!canUpdateStatus) {
            return;
        }
        setStatus(order.status ?? 'pending');
        setIsStatusOpen(true);
    };

    const actionItems = (
        <>
            {canViewOrder ? (
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start"
                    onClick={handleView}
                >
                    <Eye className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('orders.rowActions.viewDetails', 'Details')}
                </Button>
            ) : null}
            {canManageOrder ? (
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start"
                    onClick={handleEdit}
                    disabled={!canEditOrder}
                >
                    <SquarePen
                        className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                    />
                    {t('orders.rowActions.editOrder', 'Edit Order')}
                </Button>
            ) : null}
            {canManageOrder ? (
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start"
                    onClick={handleAddItems}
                    disabled={!canAddOrderItems}
                >
                    <Plus className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('orders.rowActions.addItem', 'Add Item')}
                </Button>
            ) : null}
            {canViewOrder ? (
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start"
                    onClick={handlePrint}
                    disabled={!canPrintReceipt}
                >
                    <Printer className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('orders.rowActions.printReceipt', 'Print Receipt')}
                </Button>
            ) : null}
            {canManageOrder ? (
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start"
                    onClick={handleAssignOpen}
                    disabled={!canAssignOrderTable}
                >
                    <Utensils className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                    {t('orders.rowActions.assignTable', 'Assign Table')}
                </Button>
            ) : null}
            {canManageOrder ? (
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-start"
                    onClick={handleStatusOpen}
                    disabled={!canUpdateStatus}
                >
                    <FilePenLine
                        className={isRtl ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'}
                    />
                    {t('orders.rowActions.updateStatus', 'Update Status')}
                </Button>
            ) : null}
        </>
    );
    const hasVisibleActions = canViewOrder || canManageOrder;
    const renderedActions =
        mode === 'dropdown' ? (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <span className="sr-only">
                            {t('orders.rowActions.openMenu', 'Open menu')}
                        </span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    preserveRtlAlign
                    className={isRtl ? 'text-right' : ''}
                >
                    <DropdownMenuLabel className={isRtl ? 'text-right' : ''}>
                        {t('orders.rowActions.actions', 'Actions')}
                    </DropdownMenuLabel>
                    {canViewOrder ? (
                        <DropdownMenuItem onClick={handleView}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('orders.rowActions.viewDetails', 'Details')}
                        </DropdownMenuItem>
                    ) : null}
                    {canManageOrder ? (
                        <DropdownMenuItem
                            onClick={handleEdit}
                            disabled={!canEditOrder}
                        >
                            <SquarePen className="mr-2 h-4 w-4" />
                            {t('orders.rowActions.editOrder', 'Edit Order')}
                        </DropdownMenuItem>
                    ) : null}
                    {canManageOrder ? (
                        <DropdownMenuItem
                            onClick={handleAddItems}
                            disabled={!canAddOrderItems}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t('orders.rowActions.addItem', 'Add Item')}
                        </DropdownMenuItem>
                    ) : null}
                    {canViewOrder ? (
                        <DropdownMenuItem
                            onClick={handlePrint}
                            disabled={!canPrintReceipt}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            {t(
                                'orders.rowActions.printReceipt',
                                'Print Receipt',
                            )}
                        </DropdownMenuItem>
                    ) : null}
                    {canManageOrder ? (
                        <DropdownMenuItem
                            onClick={handleAssignOpen}
                            disabled={!canAssignOrderTable}
                        >
                            <Utensils className="mr-2 h-4 w-4" />
                            {t('orders.rowActions.assignTable', 'Assign Table')}
                        </DropdownMenuItem>
                    ) : null}
                    {canManageOrder ? (
                        <DropdownMenuItem
                            onClick={handleStatusOpen}
                            disabled={!canUpdateStatus}
                        >
                            <FilePenLine className="mr-2 h-4 w-4" />
                            {t(
                                'orders.rowActions.updateStatus',
                                'Update Status',
                            )}
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            <div className="grid gap-1.5">{actionItems}</div>
        );

    return (
        <>
            {hasVisibleActions ? renderedActions : null}

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
                                onAction?.();
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
