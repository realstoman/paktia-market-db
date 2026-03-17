'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmployeeContract } from '@/types';
import { FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface CellActionProps {
    data: EmployeeContract;
    onEdit: (contract: EmployeeContract) => void;
    onDelete: (contract: EmployeeContract) => void;
    onPrint: (contract: EmployeeContract) => void;
}

export function CellAction({ data, onEdit, onDelete, onPrint }: CellActionProps) {
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
                <DropdownMenuItem onClick={() => onEdit(data)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(data)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Print Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(data)}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
