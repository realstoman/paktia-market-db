'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CashMovement } from '@/types';
import { useLocalization } from '@/lib/localization';
import { CheckCheck, MoreHorizontal, Pencil, Printer } from 'lucide-react';

interface CellActionProps {
    data: CashMovement;
    onEdit: (movement: CashMovement) => void;
    onApprove: (movement: CashMovement) => void;
    onPrint: (movement: CashMovement) => void;
}

export function CellAction({
    data,
    onEdit,
    onApprove,
    onPrint,
}: CellActionProps) {
    const { t } = useLocalization();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">
                        {t('financeCashBank.actions.openMenu', 'Open menu')}
                    </span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    {t('financeCashBank.actions.title', 'Actions')}
                </DropdownMenuLabel>
                {data.approval_status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('financeCashBank.actions.edit', 'Edit')}
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => onPrint(data)}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t('financeCashBank.actions.printVoucher', 'Print Voucher')}
                </DropdownMenuItem>
                {data.approval_status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onApprove(data)}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        {t('financeCashBank.actions.approve', 'Approve')}
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
