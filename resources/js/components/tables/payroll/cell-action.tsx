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
    BadgeCheck,
    CreditCard,
    Eye,
    MoreHorizontal,
    RotateCcw,
} from 'lucide-react';

interface CellActionProps {
    data: PayrollRun;
    onView: (run: PayrollRun) => void;
    onReviewApproval: (run: PayrollRun) => void;
    onMarkPaid: (run: PayrollRun) => void;
    canApprove: boolean;
    canPay: boolean;
}

export function CellAction({
    data,
    onView,
    onReviewApproval,
    onMarkPaid,
    canApprove,
    canPay,
}: CellActionProps) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(data)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Run
                </DropdownMenuItem>
                {canApprove && data.status === 'draft' ? (
                    <DropdownMenuItem onClick={() => onReviewApproval(data)}>
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        Review Approval
                    </DropdownMenuItem>
                ) : null}
                {canApprove && data.status === 'submitted' ? (
                    <DropdownMenuItem onClick={() => onReviewApproval(data)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Approve / Reject
                    </DropdownMenuItem>
                ) : null}
                {canPay && data.status === 'approved' ? (
                    <DropdownMenuItem onClick={() => onMarkPaid(data)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Mark Paid
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
