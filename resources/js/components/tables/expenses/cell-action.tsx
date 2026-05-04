'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/localization';
import { Expense } from '@/types';
import { Ban, CheckCheck, MoreHorizontal, Pencil, Printer } from 'lucide-react';

interface CellActionProps {
    data: Expense;
    onEdit: (expense: Expense) => void;
    onApprove: (expense: Expense) => void;
    onCancel: (expense: Expense) => void;
    onPrint: (expense: Expense) => void;
}

export function CellAction({
    data,
    onEdit,
    onApprove,
    onCancel,
    onPrint,
}: CellActionProps) {
    const { t } = useLocalization();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">
                        {t('financeExpenses.actions.openMenu', 'Open menu')}
                    </span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    {t('financeExpenses.actions.title', 'Actions')}
                </DropdownMenuLabel>
                {data.approval_status !== 'approved' &&
                data.approval_status !== 'cancelled' ? (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('financeExpenses.actions.edit', 'Edit')}
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => onPrint(data)}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t(
                        'financeExpenses.actions.printVoucher',
                        'Print Voucher',
                    )}
                </DropdownMenuItem>
                {data.approval_status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onApprove(data)}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        {t('financeExpenses.actions.approve', 'Approve')}
                    </DropdownMenuItem>
                ) : null}
                {data.approval_status === 'approved' ? (
                    <DropdownMenuItem onClick={() => onCancel(data)}>
                        <Ban className="mr-2 h-4 w-4" />
                        {t(
                            'financeExpenses.actions.cancelExpense',
                            'Cancel Expense',
                        )}
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
