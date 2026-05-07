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
import { Printer } from '@/types';
import { MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react';

interface CellActionProps {
    data: Printer;
    onEdit: (printer: Printer) => void;
    onDelete: (printer: Printer) => void;
    onTestPrint: (printer: Printer) => void;
}

export function CellAction({
    data,
    onEdit,
    onDelete,
    onTestPrint,
}: CellActionProps) {
    const { t } = useLocalization();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">{t('common.actions', 'Actions')}</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions', 'Actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(data)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('common.edit', 'Edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTestPrint(data)}>
                    <Play className="mr-2 h-4 w-4" />
                    {t('common.testPrint', 'Test Print')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(data)}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                    {t('common.delete', 'Delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
