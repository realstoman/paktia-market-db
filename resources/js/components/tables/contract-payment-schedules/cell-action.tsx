'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmployeeContractPaymentSchedule } from '@/types';
import {
    BadgeCheck,
    Eye,
    FileText,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';

interface CellActionProps {
    data: EmployeeContractPaymentSchedule;
    onEdit: (schedule: EmployeeContractPaymentSchedule) => void;
    onDelete: (schedule: EmployeeContractPaymentSchedule) => void;
    onPrint: (schedule: EmployeeContractPaymentSchedule) => void;
    onViewAttachment: (schedule: EmployeeContractPaymentSchedule) => void;
    onReviewApproval: (schedule: EmployeeContractPaymentSchedule) => void;
    canApprove: boolean;
    canDelete: boolean;
}

export function CellAction({
    data,
    onEdit,
    onDelete,
    onPrint,
    onViewAttachment,
    onReviewApproval,
    canApprove,
    canDelete,
}: CellActionProps) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" preserveRtlAlign>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(data)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(data)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Print Voucher
                </DropdownMenuItem>
                {data.attachment_path ? (
                    <DropdownMenuItem onClick={() => onViewAttachment(data)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Attachment
                    </DropdownMenuItem>
                ) : null}
                {canApprove &&
                data.status !== 'approved' &&
                data.status !== 'paid' ? (
                    <DropdownMenuItem onClick={() => onReviewApproval(data)}>
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        Review Approval
                    </DropdownMenuItem>
                ) : null}
                {canDelete ? (
                    <DropdownMenuItem onClick={() => onDelete(data)}>
                        <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
