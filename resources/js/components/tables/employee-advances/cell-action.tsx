'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmployeeAdvance } from '@/types';
import {
    CheckCircle2,
    MoreHorizontal,
    Pencil,
    Printer,
    RotateCcw,
} from 'lucide-react';

interface CellActionProps {
    data: EmployeeAdvance;
    onEdit: (advance: EmployeeAdvance) => void;
    onApprove: (advance: EmployeeAdvance) => void;
    onReject: (advance: EmployeeAdvance) => void;
    onPrint: (advance: EmployeeAdvance) => void;
}

export function CellAction({
    data,
    onEdit,
    onApprove,
    onReject,
    onPrint,
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
                {data.status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => onPrint(data)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Voucher
                </DropdownMenuItem>
                {data.status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onApprove(data)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                    </DropdownMenuItem>
                ) : null}
                {data.status === 'submitted' ? (
                    <DropdownMenuItem onClick={() => onReject(data)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reject to Draft
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
