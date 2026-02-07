import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Branch, Kitchen } from '@/types';
import { router } from '@inertiajs/react';
import {
    Eye,
    MapPin,
    MapPinOff,
    MoreHorizontal,
    Pencil,
    Trash,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Kitchen;
    branches: Branch[];
}

export const CellAction: React.FC<CellActionProps> = ({ data, branches }) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [name, setName] = useState(data.name ?? '');
    const [branchId, setBranchId] = useState(
        data.branch_id ? String(data.branch_id) : '',
    );
    const [type, setType] = useState(data.type ?? '');
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetEdit = () => {
        setName(data.name ?? '');
        setBranchId(data.branch_id ? String(data.branch_id) : '');
        setType(data.type ?? '');
        setEditErrors({});
    };

    const handleEditSubmit = () => {
        if (!name.trim() || !branchId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/kitchens/${data.id}`,
            {
                name: name.trim(),
                branch_id: Number(branchId),
                type: type.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kitchen updated successfully.');
                    setIsEditOpen(false);
                },
                onError: (errors) => {
                    setEditErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleToggle = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/kitchens/${data.id}/toggle`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? 'Kitchen deactivated successfully.'
                        : 'Kitchen activated successfully.',
                );
                setIsToggleOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/kitchens/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kitchen deleted successfully.');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
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
                    <DropdownMenuItem
                        onClick={() => router.visit(`/kitchens/${data.id}`)}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            resetEdit();
                            setIsEditOpen(true);
                        }}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsToggleOpen(true)}>
                        {data.is_active ? (
                            <MapPinOff className="mr-2 h-4 w-4" />
                        ) : (
                            <MapPin className="mr-2 h-4 w-4" />
                        )}
                        {data.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Kitchen</DialogTitle>
                        <DialogDescription>
                            Update kitchen details and branch assignment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`kitchen-name-${data.id}`}>
                                Name
                            </Label>
                            <Input
                                id={`kitchen-name-${data.id}`}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.branch_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`kitchen-type-${data.id}`}>Type</Label>
                            <Input
                                id={`kitchen-type-${data.id}`}
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                            />
                            <InputError message={editErrors.type} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={!name.trim() || !branchId || isSubmitting}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? 'Deactivate kitchen'
                                : 'Activate kitchen'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? 'This will mark the kitchen as inactive.'
                                : 'This will mark the kitchen as active.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleToggle}
                            disabled={isSubmitting}
                        >
                            {data.is_active ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete kitchen</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the kitchen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
