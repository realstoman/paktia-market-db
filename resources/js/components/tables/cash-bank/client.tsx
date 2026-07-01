'use client';

import { AttachmentViewDialog } from '@/components/shared/attachment-view-dialog';
import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { useLocalization } from '@/lib/localization';
import { MovementVoucherPrintDialog } from '@/components/tables/cash-bank/movement-voucher-print-dialog';
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
import {
    Property,
    CashMovement,
    CashMovementType,
    FinanceAccount,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { ArrowLeftRight, FileText, Plus, UploadCloud, X } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
];

const APPROVAL_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
];

interface CashMovementFormState {
    property_id: string;
    destination_property_id: string;
    movement_type: string;
    direction: string;
    movement_date: string;
    amount: string;
    payment_method: string;
    account_id: string;
    counterparty_account_id: string;
    approval_status: string;
    description: string;
}

const emptyForm: CashMovementFormState = {
    property_id: '',
    destination_property_id: '',
    movement_type: 'owner_deposit',
    direction: 'in',
    movement_date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_method: 'cash',
    account_id: '',
    counterparty_account_id: '',
    approval_status: 'draft',
    description: '',
};

interface CashBankClientProps {
    movements: CashMovement[];
    properties: Property[];
    sourceAccounts: FinanceAccount[];
    targetAccounts: FinanceAccount[];
    movementTypes: CashMovementType[];
    printMovementId?: number | null;
}

export function CashBankClient({
    movements,
    properties,
    sourceAccounts,
    targetAccounts,
    movementTypes,
    printMovementId = null,
}: CashBankClientProps) {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingMovement, setEditingMovement] =
        React.useState<CashMovement | null>(null);
    const [approvalTarget, setApprovalTarget] =
        React.useState<CashMovement | null>(null);
    const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
    const [attachmentPath, setAttachmentPath] = React.useState<string | null>(
        null,
    );
    const [isPrintOpen, setIsPrintOpen] = React.useState(false);
    const [printMovement, setPrintMovement] =
        React.useState<CashMovement | null>(null);
    const [form, setForm] = React.useState<CashMovementFormState>(emptyForm);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [propertyFilter, setPropertyFilter] = React.useState('all');

    const propertyOptions = React.useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(
        propertyOptions,
        form.property_id,
        (value) =>
            setForm((current) => ({
                ...current,
                property_id: value,
            })),
    );
    const movementTypeOptions = React.useMemo(
        () =>
            movementTypes.map((movementType) => ({
                value: movementType.slug,
                label: movementType.name,
            })),
        [movementTypes],
    );

    const accountOptions = React.useCallback(
        (accounts: FinanceAccount[], propertyId: string) =>
            accounts
                .filter((account) => {
                    if (!propertyId) {
                        return true;
                    }

                    return (
                        account.property_id === null ||
                        account.property_id === undefined ||
                        String(account.property_id) === propertyId
                    );
                })
                .map((account) => ({
                    value: String(account.id),
                    label: `${account.code} - ${account.name}${account.currency_code ? ` · ${account.currency_code}` : ''}`,
                })),
        [],
    );

    const sourceAccountOptions = React.useMemo(
        () => accountOptions(sourceAccounts, form.property_id),
        [accountOptions, form.property_id, sourceAccounts],
    );

    const targetAccountOptions = React.useMemo(
        () => accountOptions(targetAccounts, form.destination_property_id),
        [accountOptions, form.destination_property_id, targetAccounts],
    );

    const filteredMovements = React.useMemo(() => {
        return movements.filter((movement) => {
            if (
                statusFilter !== 'all' &&
                (movement.approval_status ?? 'draft') !== statusFilter
            ) {
                return false;
            }

            if (
                propertyFilter !== 'all' &&
                String(movement.property_id ?? '') !== propertyFilter
            ) {
                return false;
            }

            return true;
        });
    }, [propertyFilter, movements, statusFilter]);

    const openCreate = React.useCallback(() => {
        setEditingMovement(null);
        const defaultMovementType = movementTypes[0];
        setForm({
            ...emptyForm,
            movement_type: defaultMovementType?.slug ?? emptyForm.movement_type,
            direction:
                defaultMovementType?.default_direction ?? emptyForm.direction,
        });
        setReceiptFile(null);
        setIsOpen(true);
    }, [movementTypes]);

    const openEdit = React.useCallback(
        (movement: CashMovement) => {
            const pairedMovement =
                movement.reference_type === 'cash_transfer' &&
                movement.reference_id
                    ? (movements.find(
                          (item) => item.id === movement.reference_id,
                      ) ?? null)
                    : null;

            const sourceMovement =
                movement.reference_type === 'cash_transfer'
                    ? movement.direction === 'out'
                        ? movement
                        : (pairedMovement ?? movement)
                    : movement;
            const destinationMovement =
                movement.reference_type === 'cash_transfer'
                    ? movement.direction === 'out'
                        ? pairedMovement
                        : movement
                    : null;

            setEditingMovement(movement);
            setReceiptFile(null);
            setForm({
                property_id: sourceMovement.property_id
                    ? String(sourceMovement.property_id)
                    : '',
                destination_property_id: destinationMovement?.property_id
                    ? String(destinationMovement.property_id)
                    : '',
                movement_type: sourceMovement.movement_type,
                direction: sourceMovement.direction ?? 'in',
                movement_date: sourceMovement.movement_date,
                amount: String(sourceMovement.amount),
                payment_method: sourceMovement.payment_method ?? 'cash',
                account_id: sourceMovement.account_id
                    ? String(sourceMovement.account_id)
                    : '',
                counterparty_account_id: sourceMovement.counterparty_account_id
                    ? String(sourceMovement.counterparty_account_id)
                    : '',
                approval_status: sourceMovement.approval_status ?? 'draft',
                description: sourceMovement.description ?? '',
            });
            setIsOpen(true);
        },
        [movements],
    );

    React.useEffect(() => {
        if (!printMovementId) {
            return;
        }

        const target = movements.find(
            (movement) => movement.id === printMovementId,
        );
        if (!target) {
            return;
        }

        setPrintMovement(target);
        setIsPrintOpen(true);
    }, [movements, printMovementId]);

    const submit = React.useCallback(() => {
        const payload: Record<string, string | number | null | File> = {
            property_id: form.property_id ? Number(form.property_id) : null,
            destination_property_id: form.destination_property_id
                ? Number(form.destination_property_id)
                : null,
            movement_type: form.movement_type,
            direction: form.direction,
            movement_date: form.movement_date,
            amount: Number(form.amount),
            payment_method: form.payment_method,
            account_id: Number(form.account_id),
            counterparty_account_id: form.counterparty_account_id
                ? Number(form.counterparty_account_id)
                : null,
            approval_status: form.approval_status,
            description: form.description || null,
        };
        if (receiptFile) {
            payload.receipt = receiptFile;
        }

        const onLocalizedError = (errors: Record<string, string>) => {
            const firstError = Object.values(errors)[0];
            if (typeof firstError === 'string' && firstError.length > 0) {
                toast.error(firstError);
                return;
            }

            toast.error(
                t(
                    'financeCashBank.toasts.saveFailed',
                    'Failed to save cash movement.',
                ),
            );
        };

        if (editingMovement) {
            router.put(`/finance/cash-bank/${editingMovement.id}`, payload, {
                preserveScroll: true,
                forceFormData: Boolean(receiptFile),
                onSuccess: () => {
                    setIsOpen(false);
                    setReceiptFile(null);
                    setEditingMovement(null);
                },
                onError: onLocalizedError,
            });
            return;
        }

        router.post('/finance/cash-bank', payload, {
            preserveScroll: true,
            forceFormData: Boolean(receiptFile),
            onSuccess: () => {
                setIsOpen(false);
                setReceiptFile(null);
            },
            onError: onLocalizedError,
        });
    }, [editingMovement, form, receiptFile, t]);

    const approve = React.useCallback((movement: CashMovement) => {
        router.post(
            `/finance/cash-bank/${movement.id}/approve`,
            {},
            { preserveScroll: true },
        );
    }, []);

    const reject = React.useCallback((movement: CashMovement) => {
        router.post(
            `/finance/cash-bank/${movement.id}/reject`,
            {},
            { preserveScroll: true },
        );
    }, []);

    const columns = React.useMemo(
        () =>
            buildColumns({
                t,
                onEdit: openEdit,
                onApprove: setApprovalTarget,
                onViewAttachment: setAttachmentPath,
                onPrint: (movement) => {
                    setPrintMovement(movement);
                    setIsPrintOpen(true);
                },
            }),
        [openEdit, t],
    );

    const selectedMovementType = React.useMemo(
        () =>
            movementTypes.find(
                (movementType) => movementType.slug === form.movement_type,
            ) ?? null,
        [form.movement_type, movementTypes],
    );

    const isTransfer = Boolean(selectedMovementType?.requires_counterparty);

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={statusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeCashBank.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...APPROVAL_OPTIONS,
                ]}
                onValueChange={setStatusFilter}
                placeholder={t('financeCashBank.filters.status', 'Status')}
                searchPlaceholder={t(
                    'financeCashBank.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financeCashBank.filters.noStatusFound',
                    'No status found.',
                )}
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={propertyFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeCashBank.filters.allProperties',
                            'All Properties',
                        ),
                    },
                    ...propertyOptions,
                ]}
                onValueChange={setPropertyFilter}
                placeholder={t('financeCashBank.filters.property', 'Property')}
                searchPlaceholder={t(
                    'financeCashBank.filters.searchProperties',
                    'Search properties...',
                )}
                emptyText={t(
                    'financeCashBank.filters.noPropertyFound',
                    'No property found.',
                )}
                className="w-[180px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t('financeCashBank.heading.title', 'Cash & Bank Movements')}: ${formatNumber(filteredMovements.length)}`}
                    description={t(
                        'financeCashBank.heading.description',
                        'Record owner funding, cash to bank movements, and petty cash top-ups with property-level control.',
                    )}
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeCashBank.actions.backToFinance',
                                'Back to Finance',
                            )}
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance/cash-movement-types"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeCashBank.actions.movementTypes',
                                'Movement Types',
                            )}
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t(
                            'financeCashBank.actions.newMovement',
                            'New Movement',
                        )}
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        {t(
                            'financeCashBank.register.title',
                            'Cash & Bank Register',
                        )}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            'financeCashBank.register.description',
                            'Add cash in hand funding, bank funding, and transfers to petty cash or other properties.',
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredMovements}
                    searchKey={[
                        'movement_type',
                        'property.name',
                        'account.name',
                        'counterparty_account.name',
                        'payment_method',
                        'approval_status',
                    ]}
                    searchPlaceholder={t(
                        'financeCashBank.register.searchPlaceholder',
                        'Search movement type, property, account, method, or status...',
                    )}
                    toolbar={toolbar}
                />
            </div>

            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    setIsOpen(open);
                    if (!open) {
                        setEditingMovement(null);
                        setReceiptFile(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMovement
                                ? t(
                                      'financeCashBank.form.editTitle',
                                      'Edit Cash Movement',
                                  )
                                : t(
                                      'financeCashBank.form.createTitle',
                                      'Create Cash Movement',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financeCashBank.form.description',
                                'Use this to add owner funding and transfer amounts between cash, bank, and petty cash accounts.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.movementType',
                                    'Movement Type',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.movement_type}
                                options={movementTypeOptions}
                                onValueChange={(value) =>
                                    setForm((current) => {
                                        const selectedType = movementTypes.find(
                                            (item) => item.slug === value,
                                        );

                                        return {
                                            ...current,
                                            movement_type: value,
                                            direction:
                                                selectedType?.default_direction ??
                                                current.direction,
                                            counterparty_account_id:
                                                selectedType?.requires_counterparty
                                                    ? current.counterparty_account_id
                                                    : '',
                                        };
                                    })
                                }
                                placeholder={t(
                                    'financeCashBank.form.selectMovementType',
                                    'Select movement type',
                                )}
                                searchPlaceholder={t(
                                    'financeCashBank.form.searchMovementTypes',
                                    'Search movement types...',
                                )}
                                emptyText={t(
                                    'financeCashBank.form.noMovementTypeFound',
                                    'No movement type found.',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.paymentMethod',
                                    'Payment Method',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.payment_method}
                                options={PAYMENT_METHODS.map((option) => ({
                                    value: option.value,
                                    label: t(
                                        `paymentMethods.${option.value}`,
                                        option.label,
                                    ),
                                }))}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        payment_method: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeCashBank.form.selectPaymentMethod',
                                    'Select payment method',
                                )}
                                searchPlaceholder={t(
                                    'financeCashBank.form.searchPaymentMethods',
                                    'Search payment methods...',
                                )}
                                emptyText={t(
                                    'financeCashBank.form.noPaymentMethodFound',
                                    'No payment method found.',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.sourceProperty',
                                    'Source Property',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.property_id}
                                options={propertyOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        property_id: value,
                                        account_id: '',
                                    }))
                                }
                                placeholder={t(
                                    'financeCashBank.form.selectSourceProperty',
                                    'Select source property',
                                )}
                                searchPlaceholder={t(
                                    'financeCashBank.filters.searchProperties',
                                    'Search properties...',
                                )}
                                emptyText={t(
                                    'financeCashBank.filters.noPropertyFound',
                                    'No property found.',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>

                        {isTransfer ? (
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'financeCashBank.form.destinationProperty',
                                        'Destination Property',
                                    )}
                                </Label>
                                <SearchableDropdown
                                    value={form.destination_property_id}
                                    options={propertyOptions}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            destination_property_id: value,
                                            counterparty_account_id: '',
                                        }))
                                    }
                                    placeholder={t(
                                        'financeCashBank.form.selectDestinationProperty',
                                        'Select destination property',
                                    )}
                                    searchPlaceholder={t(
                                        'financeCashBank.filters.searchProperties',
                                        'Search properties...',
                                    )}
                                    emptyText={t(
                                        'financeCashBank.filters.noPropertyFound',
                                        'No property found.',
                                    )}
                                    className="bg-white dark:bg-neutral-900"
                                />
                            </div>
                        ) : null}

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.sourceAccount',
                                    'Source Account',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.account_id}
                                options={sourceAccountOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        account_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeCashBank.form.selectSourceAccount',
                                    'Select source account',
                                )}
                                searchPlaceholder={t(
                                    'financeCashBank.form.searchSourceAccounts',
                                    'Search source accounts...',
                                )}
                                emptyText={t(
                                    'financeCashBank.form.noAccountFound',
                                    'No account found.',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>

                        {isTransfer ? (
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'financeCashBank.form.targetAccount',
                                        'Target Account',
                                    )}
                                </Label>
                                <SearchableDropdown
                                    value={form.counterparty_account_id}
                                    options={targetAccountOptions}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            counterparty_account_id: value,
                                        }))
                                    }
                                    placeholder={t(
                                        'financeCashBank.form.selectTargetAccount',
                                        'Select target account',
                                    )}
                                    searchPlaceholder={t(
                                        'financeCashBank.form.searchTargetAccounts',
                                        'Search target accounts...',
                                    )}
                                    emptyText={t(
                                        'financeCashBank.form.noAccountFound',
                                        'No account found.',
                                    )}
                                    className="bg-white dark:bg-neutral-900"
                                />
                            </div>
                        ) : null}

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.direction',
                                    'Direction',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.direction}
                                options={[
                                    {
                                        value: 'in',
                                        label: t(
                                            'financeCashBank.directions.in',
                                            'Inflow',
                                        ),
                                    },
                                    {
                                        value: 'out',
                                        label: t(
                                            'financeCashBank.directions.out',
                                            'Outflow',
                                        ),
                                    },
                                ]}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        direction: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeCashBank.form.selectDirection',
                                    'Select direction',
                                )}
                                searchPlaceholder={t(
                                    'financeCashBank.form.searchDirections',
                                    'Search directions...',
                                )}
                                emptyText={t(
                                    'financeCashBank.form.noDirectionFound',
                                    'No direction found.',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t('financeCashBank.form.amount', 'Amount')}
                            </Label>
                            <NumericInput
                                className="bg-white"
                                min="0"
                                value={form.amount}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        amount: value,
                                    }))
                                }
                                placeholder="0"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.movementDate',
                                    'Movement Date',
                                )}
                            </Label>
                            <Input
                                className="bg-white"
                                type="date"
                                value={form.movement_date}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        movement_date: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.approvalStatus',
                                    'Approval Status',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.approval_status}
                                options={APPROVAL_OPTIONS.map((option) => ({
                                    value: option.value,
                                    label: t(
                                        `financeCashBank.statuses.${option.value}`,
                                        option.label,
                                    ),
                                }))}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        approval_status: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeCashBank.form.selectApprovalStatus',
                                    'Select approval status',
                                )}
                                searchPlaceholder={t(
                                    'financeCashBank.filters.searchStatuses',
                                    'Search statuses...',
                                )}
                                emptyText={t(
                                    'financeCashBank.filters.noStatusFound',
                                    'No status found.',
                                )}
                                className="bg-white dark:bg-neutral-900"
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.descriptionLabel',
                                    'Description',
                                )}
                            </Label>
                            <Textarea
                                className="bg-white"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeCashBank.form.descriptionPlaceholder',
                                    'Owner funded start-up cash, then transferred part to petty cash.',
                                )}
                                rows={4}
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financeCashBank.form.receiptAttachment',
                                    'Bill / Receipt Attachment',
                                )}
                            </Label>
                            <label
                                htmlFor="movement-receipt"
                                className="group cursor-pointer rounded-lg border border-dashed border-slate-300 bg-white p-4 transition-[background-color,border-color,box-shadow] hover:border-slate-400 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
                            >
                                <input
                                    id="movement-receipt"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="hidden"
                                    onChange={(event) =>
                                        setReceiptFile(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <div className="flex items-center gap-3">
                                    <div className="rounded-md bg-white p-2 shadow-sm dark:bg-neutral-800">
                                        <UploadCloud className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                            {receiptFile
                                                ? receiptFile.name
                                                : editingMovement?.attachment_path
                                                  ? t(
                                                        'financeCashBank.form.replaceCurrentReceipt',
                                                        'Replace current receipt',
                                                    )
                                                  : t(
                                                        'financeCashBank.form.uploadReceipt',
                                                        'Upload receipt (JPG, PNG, PDF)',
                                                    )}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {t(
                                                'financeCashBank.form.browseFiles',
                                                'Click to browse files (max 5MB)',
                                            )}
                                        </p>
                                    </div>
                                    {receiptFile ? (
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setReceiptFile(null);
                                            }}
                                            className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-neutral-700 dark:hover:text-slate-100"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <FileText className="h-4 w-4 text-slate-400" />
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={submit}>
                            {editingMovement
                                ? t(
                                      'financeCashBank.actions.updateMovement',
                                      'Update Movement',
                                  )
                                : t(
                                      'financeCashBank.actions.saveMovement',
                                      'Save Movement',
                                  )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={approvalTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setApprovalTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(
                                'financeCashBank.approval.title',
                                'Review Cash Movement',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'financeCashBank.approval.description',
                                'Confirm whether you want to approve this movement or send it back to draft for correction.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setApprovalTarget(null)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (approvalTarget) {
                                    reject(approvalTarget);
                                }
                                setApprovalTarget(null);
                            }}
                        >
                            {t('financeCashBank.actions.reject', 'Reject')}
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={() => {
                                if (approvalTarget) {
                                    approve(approvalTarget);
                                }
                                setApprovalTarget(null);
                            }}
                        >
                            {t('financeCashBank.actions.approve', 'Approve')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <MovementVoucherPrintDialog
                open={isPrintOpen}
                onOpenChange={(open) => {
                    setIsPrintOpen(open);
                    if (!open) {
                        setPrintMovement(null);
                    }
                }}
                movement={printMovement}
                property={
                    printMovement
                        ? (properties.find(
                              (property) => property.id === printMovement.property_id,
                          ) ?? null)
                        : null
                }
                movementType={
                    printMovement
                        ? (movementTypes.find(
                              (movementType) =>
                                  movementType.slug ===
                                  printMovement.movement_type,
                          ) ?? null)
                        : null
                }
            />

            <AttachmentViewDialog
                open={attachmentPath !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setAttachmentPath(null);
                    }
                }}
                path={attachmentPath}
                title={t(
                    'financeCashBank.attachmentTitle',
                    'Cash / Bank Attachment',
                )}
            />
        </div>
    );
}
