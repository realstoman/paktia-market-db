'use client';

import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
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
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import { useLocalization } from '@/lib/localization';
import { Branch, Kitchen, Printer, PrinterAssignment } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Plus, Printer as PrinterIcon, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface PrintersClientProps {
    data: Printer[];
    branches: Branch[];
    kitchens: Kitchen[];
}

interface PrinterFormState {
    name: string;
    branch_id: string;
    ip_address: string;
    port: string;
    connection_type: 'network';
    paper_width: '58mm' | '80mm';
    copies: string;
    is_active: boolean;
    notes: string;
    assignments: Array<{
        assignment_type: PrinterAssignment['assignment_type'];
        kitchen_id: string;
        order_type: string;
        station_label: string;
        is_active: boolean;
    }>;
}

const emptyAssignment = () => ({
    assignment_type: 'kitchen' as const,
    kitchen_id: '',
    order_type: '',
    station_label: '',
    is_active: true,
});

const emptyForm = (): PrinterFormState => ({
    name: '',
    branch_id: '',
    ip_address: '',
    port: '9100',
    connection_type: 'network',
    paper_width: '80mm',
    copies: '1',
    is_active: true,
    notes: '',
    assignments: [emptyAssignment()],
});

export function PrintersClient({
    data,
    branches,
    kitchens,
}: PrintersClientProps) {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingPrinter, setEditingPrinter] = React.useState<Printer | null>(null);
    const [deleteTarget, setDeleteTarget] = React.useState<Printer | null>(null);
    const [form, setForm] = React.useState<PrinterFormState>(emptyForm);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const branchOptions = React.useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        [branches],
    );

    useAutoSelectSingleOption(
        branchOptions,
        form.branch_id,
        (value) =>
            setForm((current) => ({
                ...current,
                branch_id: value,
            })),
    );

    const resetForm = React.useCallback(() => {
        setEditingPrinter(null);
        setForm(emptyForm());
        setErrors({});
    }, []);

    const openCreate = React.useCallback(() => {
        resetForm();
        setIsOpen(true);
    }, [resetForm]);

    const openEdit = React.useCallback((printer: Printer) => {
        setEditingPrinter(printer);
        setForm({
            name: printer.name,
            branch_id: printer.branch_id ? String(printer.branch_id) : '',
            ip_address: printer.ip_address,
            port: String(printer.port),
            connection_type: printer.connection_type ?? 'network',
            paper_width: printer.paper_width ?? '80mm',
            copies: String(printer.copies ?? 1),
            is_active: Boolean(printer.is_active),
            notes: printer.notes ?? '',
            assignments:
                printer.assignments && printer.assignments.length > 0
                    ? printer.assignments.map((assignment) => ({
                          assignment_type: assignment.assignment_type,
                          kitchen_id: assignment.kitchen_id
                              ? String(assignment.kitchen_id)
                              : '',
                          order_type: assignment.order_type ?? '',
                          station_label: assignment.station_label ?? '',
                          is_active: assignment.is_active !== false,
                      }))
                    : [emptyAssignment()],
        });
        setErrors({});
        setIsOpen(true);
    }, []);

    const updateAssignment = (
        index: number,
        patch: Partial<PrinterFormState['assignments'][number]>,
    ) => {
        setForm((current) => ({
            ...current,
            assignments: current.assignments.map((assignment, assignmentIndex) =>
                assignmentIndex === index ? { ...assignment, ...patch } : assignment,
            ),
        }));
    };

    const addAssignment = () => {
        setForm((current) => ({
            ...current,
            assignments: [...current.assignments, emptyAssignment()],
        }));
    };

    const removeAssignment = (index: number) => {
        setForm((current) => ({
            ...current,
            assignments:
                current.assignments.length === 1
                    ? [emptyAssignment()]
                    : current.assignments.filter((_, assignmentIndex) => assignmentIndex !== index),
        }));
    };

    const submit = React.useCallback(() => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        const payload = {
            name: form.name,
            branch_id: form.branch_id ? Number(form.branch_id) : null,
            ip_address: form.ip_address,
            port: Number(form.port || 9100),
            connection_type: form.connection_type,
            paper_width: form.paper_width,
            copies: Number(form.copies || 1),
            is_active: form.is_active,
            notes: form.notes || null,
            assignments: form.assignments.map((assignment) => ({
                assignment_type: assignment.assignment_type,
                kitchen_id: assignment.kitchen_id ? Number(assignment.kitchen_id) : null,
                order_type: assignment.order_type || null,
                station_label: assignment.station_label || null,
                is_active: assignment.is_active,
            })),
        };

        const endpoint = editingPrinter ? `/printers/${editingPrinter.id}` : '/printers';
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    editingPrinter
                        ? t('printers.feedback.updated', 'Printer updated successfully.')
                        : t('printers.feedback.created', 'Printer created successfully.'),
                );
                setIsOpen(false);
                resetForm();
            },
            onError: (incomingErrors: Record<string, string>) => {
                setErrors(incomingErrors);
            },
            onFinish: () => setIsSubmitting(false),
        };

        if (editingPrinter) {
            router.put(endpoint, payload, options);
            return;
        }

        router.post(endpoint, payload, options);
    }, [editingPrinter, form, isSubmitting, resetForm, t]);

    const testPrint = React.useCallback(
        (printer: Printer) => {
            router.post(
                `/printers/${printer.id}/test-print`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const flash = page.props.flash as
                            | { success?: string; error?: string }
                            | undefined;

                        if (flash?.error) {
                            toast.error(flash.error);
                            return;
                        }

                        toast.success(
                            flash?.success ??
                                t('printers.feedback.testSent', 'Test print sent successfully.'),
                        );
                    },
                },
            );
        },
        [t],
    );

    const confirmDelete = React.useCallback(() => {
        if (!deleteTarget) {
            return;
        }

        router.delete(`/printers/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('printers.feedback.deleted', 'Printer deleted successfully.'));
                setDeleteTarget(null);
            },
        });
    }, [deleteTarget, t]);

    const columns = React.useMemo(
        () =>
            buildColumns({
                t,
                onEdit: openEdit,
                onDelete: setDeleteTarget,
                onTestPrint: testPrint,
            }),
        [openEdit, t, testPrint],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t('navigation.printers', 'Printers')}: ${formatNumber(data.length)}`}
                    description={t(
                        'printers.description',
                        'Register local LAN printers, assign them to kitchens or stations, and test thermal connectivity from the branch server.',
                    )}
                />
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('printers.newPrinter', 'New Printer')}
                </Button>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={data}
                    searchKey={['name', 'ip_address', 'notes']}
                    searchPlaceholder={t(
                        'printers.searchPlaceholder',
                        'Search printer name, IP address, or notes...',
                    )}
                />
            </div>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPrinter
                                ? t('printers.editPrinter', 'Edit Printer')
                                : t('printers.createPrinter', 'Create Printer')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'printers.formDescription',
                                'Store the local network endpoint and the assignment rules that this printer should receive.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>{t('printers.fields.name', 'Printer Name')}</Label>
                                <Input
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('printers.fields.branch', 'Branch')}</Label>
                                <SearchableDropdown
                                    value={form.branch_id || 'all'}
                                    options={[
                                        {
                                            value: 'all',
                                            label: t('printers.allBranches', 'All Branches'),
                                        },
                                        ...branches.map((branch) => ({
                                            value: String(branch.id),
                                            label: branch.name,
                                        })),
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            branch_id: value === 'all' ? '' : value,
                                        }))
                                    }
                                    placeholder={t('printers.selectBranch', 'Select branch')}
                                    searchPlaceholder={t(
                                        'printers.searchBranches',
                                        'Search branches...',
                                    )}
                                    emptyText={t('printers.noBranchFound', 'No branch found.')}
                                />
                                <InputError message={errors.branch_id} />
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="grid gap-2 md:col-span-1">
                                <Label>{t('printers.fields.ipAddress', 'IP Address')}</Label>
                                <Input
                                    value={form.ip_address}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            ip_address: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.ip_address} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('printers.fields.port', 'Port')}</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={65535}
                                    value={form.port}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            port: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.port} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('printers.fields.copies', 'Copies')}</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={form.copies}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            copies: event.target.value,
                                        }))
                                    }
                                />
                                <InputError message={errors.copies} />
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>{t('printers.fields.connectionType', 'Connection Type')}</Label>
                                <SearchableDropdown
                                    value={form.connection_type}
                                    options={[
                                        {
                                            value: 'network',
                                            label: t('printers.network', 'Network (LAN)'),
                                        },
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            connection_type: value as 'network',
                                        }))
                                    }
                                    placeholder={t('printers.fields.connectionType', 'Connection Type')}
                                    searchPlaceholder={t('printers.searchConnectionTypes', 'Search connection types...')}
                                    emptyText={t('printers.noConnectionTypeFound', 'No connection type found.')}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('printers.fields.paperWidth', 'Paper Width')}</Label>
                                <SearchableDropdown
                                    value={form.paper_width}
                                    options={[
                                        { value: '58mm', label: '58mm' },
                                        { value: '80mm', label: '80mm' },
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            paper_width: value as '58mm' | '80mm',
                                        }))
                                    }
                                    placeholder={t('printers.fields.paperWidth', 'Paper Width')}
                                    searchPlaceholder={t('printers.searchPaperWidths', 'Search paper widths...')}
                                    emptyText={t('printers.noPaperWidthFound', 'No paper width found.')}
                                />
                            </div>
                            <div className="flex items-end">
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
                                    {t('printers.fields.active', 'Active printer')}
                                </label>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>{t('printers.fields.notes', 'Notes')}</Label>
                            <Textarea
                                rows={3}
                                value={form.notes}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'printers.notesPlaceholder',
                                    'Kitchen wall printer near Afghan dishes pass.',
                                )}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        {t('printers.assignmentsTitle', 'Printer Assignments')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'printers.assignmentsDescription',
                                            'Map this printer to kitchens, order types, or stations.',
                                        )}
                                    </p>
                                </div>
                                <Button type="button" variant="outline" onClick={addAssignment}>
                                    {t('printers.addAssignment', 'Add Assignment')}
                                </Button>
                            </div>

                            {form.assignments.map((assignment, index) => (
                                <div
                                    key={`assignment-${index}`}
                                    className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                                >
                                    <div className="grid gap-3 md:grid-cols-4">
                                        <div className="grid gap-2">
                                            <Label>{t('printers.fields.assignmentType', 'Assignment Type')}</Label>
                                            <SearchableDropdown
                                                value={assignment.assignment_type}
                                                options={[
                                                    { value: 'kitchen', label: t('printers.assignmentKitchen', 'Kitchen') },
                                                    { value: 'order_taker', label: t('printers.assignmentOrderTaker', 'Order-Taker') },
                                                    { value: 'cashier', label: t('printers.assignmentCashier', 'Cashier') },
                                                    { value: 'order_type', label: t('printers.assignmentOrderType', 'Order Type') },
                                                    { value: 'generic', label: t('printers.assignmentGeneric', 'Generic') },
                                                ]}
                                                onValueChange={(value) =>
                                                    updateAssignment(index, {
                                                        assignment_type: value as PrinterAssignment['assignment_type'],
                                                        kitchen_id: value === 'kitchen' ? assignment.kitchen_id : '',
                                                        order_type: value === 'order_type' ? assignment.order_type : '',
                                                    })
                                                }
                                                placeholder={t('printers.fields.assignmentType', 'Assignment Type')}
                                                searchPlaceholder={t('printers.searchAssignments', 'Search assignment types...')}
                                                emptyText={t('printers.noAssignmentFound', 'No assignment type found.')}
                                            />
                                            <InputError
                                                message={errors[`assignments.${index}.assignment_type`]}
                                            />
                                        </div>

                                        {assignment.assignment_type === 'kitchen' ? (
                                            <div className="grid gap-2">
                                                <Label>{t('printers.fields.kitchen', 'Kitchen')}</Label>
                                                <SearchableDropdown
                                                    value={assignment.kitchen_id || 'none'}
                                                    options={[
                                                        {
                                                            value: 'none',
                                                            label: t('printers.selectKitchen', 'Select kitchen'),
                                                        },
                                                        ...kitchens.map((kitchen) => ({
                                                            value: String(kitchen.id),
                                                            label: kitchen.name ?? `Kitchen #${kitchen.id}`,
                                                        })),
                                                    ]}
                                                    onValueChange={(value) =>
                                                        updateAssignment(index, {
                                                            kitchen_id: value === 'none' ? '' : value,
                                                        })
                                                    }
                                                    placeholder={t('printers.selectKitchen', 'Select kitchen')}
                                                    searchPlaceholder={t('printers.searchKitchens', 'Search kitchens...')}
                                                    emptyText={t('printers.noKitchenFound', 'No kitchen found.')}
                                                />
                                                <InputError
                                                    message={errors[`assignments.${index}.kitchen_id`]}
                                                />
                                            </div>
                                        ) : null}

                                        {assignment.assignment_type === 'order_type' ? (
                                            <div className="grid gap-2">
                                                <Label>{t('printers.fields.orderType', 'Order Type')}</Label>
                                                <SearchableDropdown
                                                    value={assignment.order_type || 'none'}
                                                    options={[
                                                        { value: 'none', label: t('printers.selectOrderType', 'Select order type') },
                                                        { value: 'dine_in', label: t('orders.orderType.dine_in', 'Dine In') },
                                                        { value: 'takeaway', label: t('orders.orderType.takeaway', 'Takeaway') },
                                                        { value: 'delivery', label: t('orders.orderType.delivery', 'Delivery') },
                                                    ]}
                                                    onValueChange={(value) =>
                                                        updateAssignment(index, {
                                                            order_type: value === 'none' ? '' : value,
                                                        })
                                                    }
                                                    placeholder={t('printers.selectOrderType', 'Select order type')}
                                                    searchPlaceholder={t('printers.searchOrderTypes', 'Search order types...')}
                                                    emptyText={t('printers.noOrderTypeFound', 'No order type found.')}
                                                />
                                                <InputError
                                                    message={errors[`assignments.${index}.order_type`]}
                                                />
                                            </div>
                                        ) : null}

                                        {assignment.assignment_type !== 'kitchen' ? (
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label>{t('printers.fields.stationLabel', 'Station Label')}</Label>
                                                <Input
                                                    value={assignment.station_label}
                                                    onChange={(event) =>
                                                        updateAssignment(index, {
                                                            station_label: event.target.value,
                                                        })
                                                    }
                                                    placeholder={t(
                                                        'printers.stationPlaceholder',
                                                        'Cashier Desk 1',
                                                    )}
                                                />
                                                <InputError
                                                    message={errors[`assignments.${index}.station_label`]}
                                                />
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                                            <input
                                                type="checkbox"
                                                checked={assignment.is_active}
                                                onChange={(event) =>
                                                    updateAssignment(index, {
                                                        is_active: event.target.checked,
                                                    })
                                                }
                                                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                                            />
                                            {t('printers.fields.assignmentActive', 'Assignment active')}
                                        </label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => removeAssignment(index)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('common.remove', 'Remove')}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={submit} disabled={isSubmitting} className="gap-2">
                            <PrinterIcon className="h-4 w-4" />
                            {editingPrinter
                                ? t('printers.updatePrinter', 'Update Printer')
                                : t('printers.createPrinter', 'Create Printer')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('printers.deleteTitle', 'Delete printer?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'printers.deleteDescription',
                                'This will remove the printer endpoint, assignment rules, and future local print routing for it.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            {t('common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
