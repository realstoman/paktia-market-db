import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Permission, Role } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface RolesClientProps {
    data: Role[];
    permissions: Permission[];
    isLoading?: boolean;
}

export const RolesClient: React.FC<RolesClientProps> = ({
    data,
    permissions,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPermissionOpen, setIsPermissionOpen] = useState(false);
    const [name, setName] = useState('');
    const [permissionName, setPermissionName] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [permissionErrors, setPermissionErrors] = useState<
        Record<string, string>
    >({});
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<
        Set<number>
    >(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedCount = selectedPermissionIds.size;
    const totalPermissions = permissions.length;

    const sortedPermissions = useMemo(
        () => [...permissions].sort((a, b) => a.name.localeCompare(b.name)),
        [permissions],
    );

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

    const resetForm = () => {
        setName('');
        setSelectedPermissionIds(new Set());
        setCreateErrors({});
    };

    const resetPermissionForm = () => {
        setPermissionName('');
        setPermissionErrors({});
    };

    const handleSubmit = () => {
        if (!name.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/roles',
            {
                name: name.trim(),
                permissions: Array.from(selectedPermissionIds),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Role created successfully.');
                    setIsCreateOpen(false);
                    resetForm();
                },
                onError: (errors) => {
                    setCreateErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handlePermissionSubmit = () => {
        if (!permissionName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/permissions',
            {
                name: permissionName.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Permission created successfully.');
                    setIsPermissionOpen(false);
                    resetPermissionForm();
                },
                onError: (errors) => {
                    setPermissionErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const createPermissionError =
        createErrors.permissions ??
        Object.entries(createErrors).find(([key]) =>
            key.startsWith('permissions.'),
        )?.[1];

    const handleDuplicateRole = useCallback((role: Role) => {
        setName(`${role.name} Copy`);
        setSelectedPermissionIds(
            new Set(role.permissions?.map((permission) => permission.id)),
        );
        setCreateErrors({});
        setIsCreateOpen(true);
    }, []);

    const tableColumns = useMemo(
        () => buildColumns(permissions, handleDuplicateRole),
        [permissions, handleDuplicateRole],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Roles: ${data.length}`}
                    description="Manage system roles and permissions"
                />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsPermissionOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Permission
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Role
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name']}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search roles by name..."
            />

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Role</DialogTitle>
                        <DialogDescription>
                            Define a role name and assign permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Role name
                            </label>
                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="e.g. Manager"
                            />
                            <InputError message={createErrors.name} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    Permissions
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {selectedCount} of {totalPermissions}{' '}
                                    selected
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
                            <InputError message={createPermissionError} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!name.trim() || isSubmitting}
                        >
                            Create Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isPermissionOpen}
                onOpenChange={(open) => {
                    setIsPermissionOpen(open);
                    if (!open) {
                        resetPermissionForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Permission</DialogTitle>
                        <DialogDescription>
                            Add a new permission to assign to roles.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Permission name
                        </label>
                        <Input
                            value={permissionName}
                            onChange={(event) =>
                                setPermissionName(event.target.value)
                            }
                            placeholder="e.g. roles.create"
                        />
                        <InputError message={permissionErrors.name} />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPermissionOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePermissionSubmit}
                            disabled={!permissionName.trim() || isSubmitting}
                        >
                            Create Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
