'use client';

import Heading from '@/components/shared/heading';
import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import { CashMovementType, SharedData } from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router, usePage } from '@inertiajs/react';
import { Plus, Tags, Trash2 } from 'lucide-react';
import React from 'react';
import { buildColumns } from './columns';

const DIRECTION_OPTIONS = [
    { value: '', label: 'Flexible' },
    { value: 'in', label: 'Inflow' },
    { value: 'out', label: 'Outflow' },
];

interface MovementTypeFormState {
    name: string;
    slug: string;
    default_direction: string;
    requires_counterparty: boolean;
    is_active: boolean;
    sort_order: string;
    description: string;
}

const emptyForm: MovementTypeFormState = {
    name: '',
    slug: '',
    default_direction: '',
    requires_counterparty: false,
    is_active: true,
    sort_order: '0',
    description: '',
};

interface CashMovementTypeClientProps {
    movementTypes: CashMovementType[];
}

export function CashMovementTypeClient({
    movementTypes,
}: CashMovementTypeClientProps) {
    const { auth } = usePage<SharedData>().props;
    const canDelete = auth.is_super_admin === true;
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingType, setEditingType] =
        React.useState<CashMovementType | null>(null);
    const [form, setForm] = React.useState<MovementTypeFormState>(emptyForm);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [deleteTarget, setDeleteTarget] =
        React.useState<CashMovementType | null>(null);
    const [replacementTypeId, setReplacementTypeId] = React.useState('');
    const [deleteErrors, setDeleteErrors] = React.useState<
        Record<string, string>
    >({});
    const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);

    const openCreate = React.useCallback(() => {
        setEditingType(null);
        setForm(emptyForm);
        setIsOpen(true);
    }, []);

    const openEdit = React.useCallback((movementType: CashMovementType) => {
        setEditingType(movementType);
        setForm({
            name: movementType.name,
            slug: movementType.slug,
            default_direction: movementType.default_direction ?? '',
            requires_counterparty: Boolean(movementType.requires_counterparty),
            is_active: Boolean(movementType.is_active),
            sort_order: String(movementType.sort_order ?? 0),
            description: movementType.description ?? '',
        });
        setIsOpen(true);
    }, []);

    const submit = React.useCallback(() => {
        const payload = {
            name: form.name,
            slug: form.slug,
            default_direction: form.default_direction || null,
            requires_counterparty: form.requires_counterparty,
            is_active: form.is_active,
            sort_order: Number(form.sort_order || 0),
            description: form.description || null,
        };

        if (editingType) {
            router.put(
                `/finance/cash-movement-types/${editingType.id}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => setIsOpen(false),
                },
            );
            return;
        }

        router.post('/finance/cash-movement-types', payload, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    }, [editingType, form]);

    const remove = React.useCallback((movementType: CashMovementType) => {
        setDeleteTarget(movementType);
        setReplacementTypeId('');
        setDeleteErrors({});
    }, []);

    const replacementMovementOptions = React.useMemo(
        () =>
            movementTypes
                .filter((movementType) => movementType.id !== deleteTarget?.id)
                .map((movementType) => ({
                    value: String(movementType.id),
                    label: movementType.name,
                })),
        [deleteTarget?.id, movementTypes],
    );

    const confirmDelete = React.useCallback(() => {
        if (!deleteTarget || isDeleteSubmitting) {
            return;
        }

        setIsDeleteSubmitting(true);
        setDeleteErrors({});

        router.delete(`/finance/cash-movement-types/${deleteTarget.id}`, {
            preserveScroll: true,
            data: replacementTypeId
                ? { replacement_movement_type_id: Number(replacementTypeId) }
                : {},
            onSuccess: () => {
                setDeleteTarget(null);
                setReplacementTypeId('');
            },
            onError: (errors) => {
                setDeleteErrors(errors);
            },
            onFinish: () => {
                setIsDeleteSubmitting(false);
            },
        });
    }, [deleteTarget, isDeleteSubmitting, replacementTypeId]);

    const filteredMovementTypes = React.useMemo(() => {
        return movementTypes.filter((movementType) => {
            if (statusFilter === 'all') {
                return true;
            }

            const expected = statusFilter === 'active';
            return Boolean(movementType.is_active) === expected;
        });
    }, [movementTypes, statusFilter]);

    const columns = React.useMemo(
        () =>
            buildColumns({
                onEdit: openEdit,
                onDelete: remove,
                canDelete,
            }),
        [canDelete, openEdit, remove],
    );

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={statusFilter}
                options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                ]}
                onValueChange={setStatusFilter}
                placeholder="Status"
                searchPlaceholder="Search statuses..."
                emptyText="No status found."
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Movement Types: ${formatNumber(filteredMovementTypes.length)}`}
                    description="Manage movement types used by New Movement in the cash and bank section."
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance/cash-bank"
                            className="bg-white dark:bg-neutral-900"
                        >
                            Back to Cash & Bank
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Movement Type
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5" />
                        Cash Movement Types
                    </CardTitle>
                    <CardDescription>
                        Data-table based management for available movement
                        types, their default direction, and transfer behavior.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredMovementTypes}
                    searchKey={[
                        'name',
                        'slug',
                        'default_direction',
                        'description',
                    ]}
                    searchPlaceholder="Search movement type, slug, direction, or description..."
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingType
                                ? 'Edit Movement Type'
                                : 'Create Movement Type'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure name, slug, direction behavior, and
                            whether this type needs a target account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="Owner Deposit"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Slug</Label>
                            <Input
                                value={form.slug}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        slug: event.target.value,
                                    }))
                                }
                                placeholder="owner_deposit"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Default Direction</Label>
                            <SearchableDropdown
                                value={form.default_direction}
                                options={DIRECTION_OPTIONS}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        default_direction: value,
                                    }))
                                }
                                placeholder="Select direction"
                                searchPlaceholder="Search directions..."
                                emptyText="No direction found."
                            />
                        </div>

                        <label className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            <input
                                type="checkbox"
                                checked={form.requires_counterparty}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        requires_counterparty:
                                            event.target.checked,
                                    }))
                                }
                                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                            />
                            Requires target account (transfer-style movement)
                        </label>

                        <label className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        is_active: event.target.checked,
                                    }))
                                }
                                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                            />
                            Active and available in New Movement
                        </label>

                        <div className="grid gap-2">
                            <Label>Sort Order</Label>
                            <NumericInput
                                min="0"
                                value={form.sort_order}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        sort_order: value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder="Use for owner funding, transfer, or adjustment movements."
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submit}>
                            {editingType ? 'Update Type' : 'Create Type'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setReplacementTypeId('');
                        setDeleteErrors({});
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Delete Movement Type</DialogTitle>
                        <DialogDescription>
                            {deleteTarget?.movement_count
                                ? 'This movement type is already assigned to cash movement records. Reassign those records before deleting it.'
                                : 'This will permanently remove the selected movement type.'}
                        </DialogDescription>
                    </DialogHeader>

                    {deleteTarget ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <div className="font-medium">
                                    {deleteTarget.name}
                                </div>
                                <div className="mt-1 text-muted-foreground">
                                    {deleteTarget.movement_count
                                        ? `${formatNumber(deleteTarget.movement_count)} movement records will be moved to another type.`
                                        : 'No cash movement records are currently assigned to this type.'}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Replacement Movement Type</Label>
                                <SearchableDropdown
                                    value={replacementTypeId}
                                    options={replacementMovementOptions}
                                    onValueChange={setReplacementTypeId}
                                    placeholder="Select replacement movement type"
                                    searchPlaceholder="Search movement types..."
                                    emptyText="No replacement movement type found."
                                />
                                <InputError
                                    message={
                                        deleteErrors.replacement_movement_type_id
                                    }
                                />
                                {deleteTarget.movement_count &&
                                replacementMovementOptions.length === 0 ? (
                                    <p className="text-xs text-amber-600">
                                        Create another movement type before
                                        deleting this one.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteTarget(null);
                                setReplacementTypeId('');
                                setDeleteErrors({});
                            }}
                            disabled={isDeleteSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={
                                isDeleteSubmitting ||
                                (Boolean(deleteTarget?.movement_count) &&
                                    !replacementTypeId)
                            }
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
