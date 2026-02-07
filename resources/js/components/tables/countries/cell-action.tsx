import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Country } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MapPinOff, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';

interface CellActionProps {
    data: Country;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    // const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [open, setOpen] = useState(false);

    const onView = () => {
        router.visit(`/countries/${data.id}`);
    };

    const onEdit = () => {
        router.visit(`/countries/${data.id}/edit`);
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onView}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpen(true)}>
                        <MapPinOff className="mr-2 h-4 w-4" />
                        Deactivate
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
