import InputError from '@/components/input-error';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Permission, Role } from '@/types';
import { router } from '@inertiajs/react';
import { Copy, Eye, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Role;
    permissions: Permission[];
    onDuplicate: (role: Role) => void;
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    permissions,
    onDuplicate,
}) => {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editName, setEditName] = useState(data.name);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<
        Set<number>
    >(new Set(data.permissions?.map((permission) => permission.id)));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const rolePermissions = data.permissions ?? [];

    const sortedPermissions = useMemo(
        () => [...permissions].sort((a, b) => a.name.localeCompare(b.name)),
        [permissions],
    );

    useEffect(() => {
        if (isEditOpen) {
            setEditName(data.name);
            setSelectedPermissionIds(
                new Set(rolePermissions.map((permission) => permission.id)),
            );
            setEditErrors({});
        }
    }, [data.name, isEditOpen, rolePermissions]);

    const togglePermission = (permissionId: number) => {
        setSelectedPermissionIds((prev) => {
            const next = new Set(prev);
            if (next.has(permissionId)) {
                next.delete(permissionId);
            } else {
                next.add(permissionId);
            }
            return next;
        });
    };

    const handleEditSubmit = () => {
        if (!editName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/roles/${data.id}`,
            {
                name: editName.trim(),
                permissions: Array.from(selectedPermissionIds),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Role updated successfully.');
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

    const editPermissionError =
        editErrors.permissions ??
        Object.entries(editErrors).find(([key]) =>
            key.startsWith('permissions.'),
        )?.[1];

    const handleDelete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/roles/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Role deleted successfully.');
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
                    <DropdownMenuItem onClick={() => setIsViewOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(data)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Role Details</DialogTitle>
                        <DialogDescription>
                            Review role metadata and permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground">
                                    Name:{' '}
                                </span>
                                <span className="font-medium">{data.name}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Created:{' '}
                                </span>
                                <span>
                                    {new Date(data.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Updated:{' '}
                                </span>
                                <span>
                                    {new Date(data.updated_at).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">
                                Permissions ({rolePermissions.length})
                            </div>
                            {rolePermissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No permissions assigned.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {rolePermissions.map((permission) => (
                                        <Badge
                                            key={`${permission.id}-${permission.name}`}
                                            variant="secondary"
                                        >
                                            {permission.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                            Update the role name and permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Role name
                            </label>
                            <Input
                                value={editName}
                                onChange={(event) =>
                                    setEditName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Permissions
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {selectedPermissionIds.size} of{' '}
                                    {permissions.length} selected
                                </span>
                            </div>
                            <ScrollArea className="h-64 rounded-md border p-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {sortedPermissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedPermissionIds.has(
                                                    permission.id,
                                                )}
                                                onCheckedChange={() =>
                                                    togglePermission(
                                                        permission.id,
                                                    )
                                                }
                                            />
                                            <span className="leading-snug">
                                                {permission.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </ScrollArea>
                            <InputError message={editPermissionError} />
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
                            disabled={!editName.trim() || isSubmitting}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete role</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the role and detach it from all
                            users. This action cannot be undone.
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
                            Delete Role
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
