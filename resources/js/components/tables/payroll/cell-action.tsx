'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PayrollRun } from '@/types';
import {
    AlertTriangle,
    BadgeCheck,
    CreditCard,
    Trash2,
    Eye,
    MoreHorizontal,
    RotateCcw,
} from 'lucide-react';
import { useLocalization } from '@/lib/localization';

interface CellActionProps {
    data: PayrollRun;
    onView: (run: PayrollRun) => void;
    onReviewApproval: (run: PayrollRun) => void;
    onMarkPaid: (run: PayrollRun) => void;
    onDelete: (run: PayrollRun) => void;
    canApprove: boolean;
    canPay: boolean;
    canDelete: boolean;
}

export function CellAction({
    data,
    onView,
    onReviewApproval,
    onMarkPaid,
    onDelete,
    canApprove,
    canPay,
    canDelete,
}: CellActionProps) {
    const { t } = useLocalization();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">
                        {t('financePayroll.actions.openMenu', 'Open menu')}
                    </span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    {t('financePayroll.actions.title', 'Actions')}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(data)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t('financePayroll.actions.viewRun', 'View Run')}
                </DropdownMenuItem>
                {canApprove && data.status === 'draft' ? (
                    <DropdownMenuItem onClick={() => onReviewApproval(data)}>
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        {t(
                            'financePayroll.actions.reviewApproval',
                            'Review Approval',
                        )}
                    </DropdownMenuItem>
                ) : null}
                {canApprove && data.status === 'submitted' ? (
                    <DropdownMenuItem onClick={() => onReviewApproval(data)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t(
                            'financePayroll.actions.approveReject',
                            'Approve / Reject',
                        )}
                    </DropdownMenuItem>
                ) : null}
                {canPay && data.status === 'approved' ? (
                    <DropdownMenuItem onClick={() => onMarkPaid(data)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('financePayroll.actions.markPaid', 'Mark Paid')}
                    </DropdownMenuItem>
                ) : null}
                {canDelete && data.status !== 'paid' ? (
                    <DropdownMenuItem
                        onClick={() => onDelete(data)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t(
                            'financePayroll.actions.deleteRun',
                            'Delete Run',
                        )}
                    </DropdownMenuItem>
                ) : null}
                {canDelete && data.status === 'paid' ? (
                    <DropdownMenuItem disabled>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        {t(
                            'financePayroll.actions.paidRunLocked',
                            'Paid run is locked',
                        )}
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
