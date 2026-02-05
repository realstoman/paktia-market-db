import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Role } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

interface CellActionProps {
    data: Role;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    // const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [open, setOpen] = useState(false);

    const onView = () => {
        router.visit(`/users/${data.id}`);
    };

    const onEdit = () => {
        router.visit(`/roles/${data.id}/edit`);
    };

    // const onConfirm = async () => {
    //     setLoading(true);
    //     router.delete(`/users/${data.id}`, {
    //         onFinish: () => {
    //             setLoading(false);
    //             setOpen(false);
    //         },
    //     });
    // };

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
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};
