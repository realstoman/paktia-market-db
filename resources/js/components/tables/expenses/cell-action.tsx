'use client';

import { Button } from '@/components/ui/button';
import { Expense } from '@/types';
import { CheckCheck, Pencil } from 'lucide-react';

interface CellActionProps {
    data: Expense;
    onEdit: (expense: Expense) => void;
    onApprove: (expense: Expense) => void;
}

export function CellAction({
    data,
    onEdit,
    onApprove,
}: CellActionProps) {
    return (
        <div className="flex justify-end gap-2">
            {data.approval_status !== 'approved' ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApprove(data)}
                >
                    <CheckCheck className="h-4 w-4" />
                </Button>
            ) : null}

            <Button variant="outline" size="sm" onClick={() => onEdit(data)}>
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
    );
}
