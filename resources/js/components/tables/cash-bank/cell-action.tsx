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
import { CheckCheck, MoreHorizontal, Pencil } from 'lucide-react';

interface CellActionProps {
    data: CashMovement;
    onEdit: (movement: CashMovement) => void;
    onApprove: (movement: CashMovement) => void;
}

export function CellAction({ data, onEdit, onApprove }: CellActionProps) {
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
                {data.approval_status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onEdit(data)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                ) : null}
                {data.approval_status !== 'approved' ? (
                    <DropdownMenuItem onClick={() => onApprove(data)}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Approve
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
