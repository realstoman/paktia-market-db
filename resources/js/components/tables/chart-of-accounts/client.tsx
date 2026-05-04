'use client';

import Heading from '@/components/shared/heading';
import InputError from '@/components/input-error';
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
import { useLocalization } from '@/lib/localization';
import { Branch, Currency, FinanceAccount, SharedData } from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router, usePage } from '@inertiajs/react';
import { BookOpenText, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { buildColumns } from './columns';

const ACCOUNT_TYPE_OPTIONS = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'cogs', label: 'COGS' },
    { value: 'expense', label: 'Expense' },
];

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

interface FinanceAccountFormState {
    code: string;
    name: string;
    type: string;
    parent_id: string;
    branch_id: string;
    currency_code: string;
    is_postable: boolean;
    status: string;
    description: string;
}

const emptyForm: FinanceAccountFormState = {
    code: '',
    name: '',
    type: 'expense',
    parent_id: '',
    branch_id: '',
    currency_code: '',
    is_postable: true,
    status: 'active',
    description: '',
};

interface ChartOfAccountsClientProps {
    accounts: FinanceAccount[];
    parentAccounts: FinanceAccount[];
    branches: Branch[];
    currencies: Currency[];
}

export function ChartOfAccountsClient({
    accounts,
    parentAccounts,
    branches,
    currencies,
}: ChartOfAccountsClientProps) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocalization();
    const canDelete = auth.is_super_admin === true;
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingAccount, setEditingAccount] =
        React.useState<FinanceAccount | null>(null);
    const [form, setForm] = React.useState<FinanceAccountFormState>(emptyForm);
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [branchFilter, setBranchFilter] = React.useState('all');
    const [deleteTarget, setDeleteTarget] =
        React.useState<FinanceAccount | null>(null);
    const [replacementAccountId, setReplacementAccountId] =
        React.useState('');
    const [deleteErrors, setDeleteErrors] = React.useState<
        Record<string, string>
    >({});
    const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);

    const branchOptions = React.useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        [branches],
    );

    const parentOptions = React.useMemo(
        () =>
            parentAccounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        [parentAccounts],
    );

    const currencyOptions = React.useMemo(
        () => [
            {
                value: '',
                label: t(
                    'financeChartOfAccounts.form.noCurrency',
                    'No Currency',
                ),
            },
            ...currencies.map((currency) => ({
                value: currency.code,
                label: `${currency.code} - ${currency.name} (${currency.symbol})`,
            })),
        ],
        [currencies, t],
    );

    const defaultCurrencyCode = React.useMemo(
        () =>
            currencies.find((currency) => currency.code === 'AFN')?.code ??
            currencies[0]?.code ??
            '',
        [currencies],
    );

    const generateCodeForType = React.useCallback(
        (type: string) => {
            const startByType: Record<string, number> = {
                asset: 1000,
                liability: 2000,
                equity: 3000,
                revenue: 4000,
                cogs: 5000,
                expense: 6000,
            };

            const start = startByType[type] ?? 9000;
            const end = start + 999;

            const numericCodes = accounts
                .filter((account) => {
                    if (editingAccount && account.id === editingAccount.id) {
                        return false;
                    }

                    return account.type === type && /^\d+$/.test(account.code);
                })
                .map((account) => Number(account.code))
                .filter((code) => code >= start && code <= end);

            if (numericCodes.length === 0) {
                return String(start);
            }

            return String(Math.max(...numericCodes) + 10);
        },
        [accounts, editingAccount],
    );

    const openCreate = React.useCallback(() => {
        setEditingAccount(null);
        setForm({
            ...emptyForm,
            currency_code: defaultCurrencyCode,
        });
        setIsOpen(true);
    }, [defaultCurrencyCode]);

    const openEdit = React.useCallback((account: FinanceAccount) => {
        setEditingAccount(account);
        setForm({
            code: account.code,
            name: account.name,
            type: account.type,
            parent_id: account.parent_id ? String(account.parent_id) : '',
            branch_id: account.branch_id ? String(account.branch_id) : '',
            currency_code: account.currency_code ?? '',
            is_postable: Boolean(account.is_postable),
            status: account.status ?? 'active',
            description: account.description ?? '',
        });
        setIsOpen(true);
    }, []);

    const submit = React.useCallback(() => {
        const payload = {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            type: form.type,
            parent_id: form.parent_id ? Number(form.parent_id) : null,
            branch_id: form.branch_id ? Number(form.branch_id) : null,
            currency_code: form.currency_code || null,
            is_postable: form.is_postable,
            status: form.status,
            description: form.description || null,
        };

        if (editingAccount) {
            router.put(
                `/finance/chart-of-accounts/${editingAccount.id}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => setIsOpen(false),
                },
            );
            return;
        }

        router.post('/finance/chart-of-accounts', payload, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    }, [editingAccount, form]);

    const remove = React.useCallback((account: FinanceAccount) => {
        setDeleteTarget(account);
        setReplacementAccountId('');
        setDeleteErrors({});
    }, []);

    const replacementAccountOptions = React.useMemo(
        () =>
            parentAccounts
                .filter(
                    (account) =>
                        account.id !== deleteTarget?.id &&
                        account.type === deleteTarget?.type,
                )
                .map((account) => ({
                    value: String(account.id),
                    label: `${account.code} - ${account.name}`,
                })),
        [deleteTarget?.id, deleteTarget?.type, parentAccounts],
    );

    const confirmDelete = React.useCallback(() => {
        if (!deleteTarget || isDeleteSubmitting) {
            return;
        }

        setIsDeleteSubmitting(true);
        setDeleteErrors({});

        router.delete(`/finance/chart-of-accounts/${deleteTarget.id}`, {
            preserveScroll: true,
            data: replacementAccountId
                ? { replacement_account_id: Number(replacementAccountId) }
                : {},
            onSuccess: () => {
                setDeleteTarget(null);
                setReplacementAccountId('');
            },
            onError: (errors) => {
                setDeleteErrors(errors);
            },
            onFinish: () => {
                setIsDeleteSubmitting(false);
            },
        });
    }, [deleteTarget, isDeleteSubmitting, replacementAccountId]);

    const filteredAccounts = React.useMemo(() => {
        return accounts.filter((account) => {
            if (typeFilter !== 'all' && account.type !== typeFilter) {
                return false;
            }

            if (
                statusFilter !== 'all' &&
                (account.status ?? 'active') !== statusFilter
            ) {
                return false;
            }

            if (
                branchFilter !== 'all' &&
                String(account.branch_id ?? '') !== branchFilter
            ) {
                return false;
            }

            return true;
        });
    }, [accounts, branchFilter, statusFilter, typeFilter]);

    const columns = React.useMemo(
        () =>
            buildColumns({
                onEdit: openEdit,
                onDelete: remove,
                canDelete,
                t,
            }),
        [canDelete, openEdit, remove, t],
    );

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={typeFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeChartOfAccounts.filters.allTypes',
                            'All Types',
                        ),
                    },
                    ...ACCOUNT_TYPE_OPTIONS,
                ]}
                onValueChange={setTypeFilter}
                placeholder={t('financeChartOfAccounts.filters.type', 'Type')}
                searchPlaceholder={t(
                    'financeChartOfAccounts.filters.searchAccountTypes',
                    'Search account types...',
                )}
                emptyText={t(
                    'financeChartOfAccounts.filters.noTypeFound',
                    'No type found.',
                )}
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={statusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeChartOfAccounts.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...STATUS_OPTIONS,
                ]}
                onValueChange={setStatusFilter}
                placeholder={t(
                    'financeChartOfAccounts.filters.status',
                    'Status',
                )}
                searchPlaceholder={t(
                    'financeChartOfAccounts.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financeChartOfAccounts.filters.noStatusFound',
                    'No status found.',
                )}
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={branchFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeChartOfAccounts.filters.allBranches',
                            'All Branches',
                        ),
                    },
                    ...branchOptions,
                ]}
                onValueChange={setBranchFilter}
                placeholder={t(
                    'financeChartOfAccounts.filters.branch',
                    'Branch',
                )}
                searchPlaceholder={t(
                    'financeChartOfAccounts.filters.searchBranches',
                    'Search branches...',
                )}
                emptyText={t(
                    'financeChartOfAccounts.filters.noBranchFound',
                    'No branch found.',
                )}
                className="w-[180px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t(
                        'financeChartOfAccounts.heading.title',
                        'Chart of Accounts',
                    )}: ${formatNumber(filteredAccounts.length)}`}
                    description={t(
                        'financeChartOfAccounts.heading.description',
                        'Create and manage ledger accounts used across expenses, payroll, inventory, and reporting.',
                    )}
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeChartOfAccounts.actions.backToFinance',
                                'Back to Finance',
                            )}
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t(
                            'financeChartOfAccounts.actions.newLedgerAccount',
                            'New Ledger Account',
                        )}
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpenText className="h-5 w-5" />
                        {t(
                            'financeChartOfAccounts.ledgerAccounts.title',
                            'Ledger Accounts',
                        )}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            'financeChartOfAccounts.ledgerAccounts.description',
                            'Same table system as finance expenses, with search, filters, pagination, and row actions.',
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredAccounts}
                    searchKey={[
                        'code',
                        'name',
                        'type',
                        'parent.name',
                        'branch.name',
                        'status',
                    ]}
                    searchPlaceholder={t(
                        'financeChartOfAccounts.table.searchPlaceholder',
                        'Search accounts by code, name, type, parent, branch, or status...',
                    )}
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAccount
                                ? t(
                                      'financeChartOfAccounts.form.editTitle',
                                      'Edit Ledger Account',
                                  )
                                : t(
                                      'financeChartOfAccounts.form.createTitle',
                                      'Create Ledger Account',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financeChartOfAccounts.form.description',
                                'Define account code, name, type, parent grouping, and posting behavior for finance operations.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="account-code">
                                {t(
                                    'financeChartOfAccounts.form.codeOptional',
                                    'Code (optional)',
                                )}
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="account-code"
                                    value={form.code}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            code: event.target.value,
                                        }))
                                    }
                                    placeholder={t(
                                        'financeChartOfAccounts.form.codePlaceholder',
                                        'Leave empty to auto-generate',
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setForm((current) => ({
                                            ...current,
                                            code: generateCodeForType(
                                                current.type,
                                            ),
                                        }))
                                    }
                                >
                                    {t(
                                        'financeChartOfAccounts.form.generateCode',
                                        'Generate Code',
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="account-name">
                                {t(
                                    'financeChartOfAccounts.form.accountName',
                                    'Account Name',
                                )}
                            </Label>
                            <Input
                                id="account-name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.form.accountNamePlaceholder',
                                    'Internet Expense',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeChartOfAccounts.form.accountType',
                                    'Account Type',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.type}
                                options={ACCOUNT_TYPE_OPTIONS.map((option) => ({
                                    ...option,
                                    label: t(
                                        `financeChartOfAccounts.accountTypes.${option.value}`,
                                        option.label,
                                    ),
                                }))}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        type: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.form.selectAccountType',
                                    'Select account type',
                                )}
                                searchPlaceholder={t(
                                    'financeChartOfAccounts.form.searchAccountType',
                                    'Search account type...',
                                )}
                                emptyText={t(
                                    'financeChartOfAccounts.form.noAccountTypeFound',
                                    'No account type found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeChartOfAccounts.form.parentAccount',
                                    'Parent Account',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.parent_id}
                                options={parentOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        parent_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.form.optionalParentAccount',
                                    'Optional parent account',
                                )}
                                searchPlaceholder={t(
                                    'financeChartOfAccounts.form.searchParentAccounts',
                                    'Search parent accounts...',
                                )}
                                emptyText={t(
                                    'financeChartOfAccounts.form.noAccountFound',
                                    'No account found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeChartOfAccounts.form.branch',
                                    'Branch',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.branch_id}
                                options={branchOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        branch_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.filters.allBranches',
                                    'All branches',
                                )}
                                searchPlaceholder={t(
                                    'financeChartOfAccounts.filters.searchBranches',
                                    'Search branches...',
                                )}
                                emptyText={t(
                                    'financeChartOfAccounts.filters.noBranchFound',
                                    'No branch found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeChartOfAccounts.form.currency',
                                    'Currency',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.currency_code}
                                options={currencyOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        currency_code: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.form.selectCurrency',
                                    'Select currency',
                                )}
                                searchPlaceholder={t(
                                    'financeChartOfAccounts.form.searchCurrencies',
                                    'Search currencies...',
                                )}
                                emptyText={t(
                                    'financeChartOfAccounts.form.noCurrencyFound',
                                    'No currency found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeChartOfAccounts.form.status',
                                    'Status',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.status}
                                options={STATUS_OPTIONS.map((option) => ({
                                    ...option,
                                    label: t(
                                        `financeChartOfAccounts.statuses.${option.value}`,
                                        option.label,
                                    ),
                                }))}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        status: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.form.selectStatus',
                                    'Select status',
                                )}
                                searchPlaceholder={t(
                                    'financeChartOfAccounts.form.searchStatus',
                                    'Search status...',
                                )}
                                emptyText={t(
                                    'financeChartOfAccounts.filters.noStatusFound',
                                    'No status found.',
                                )}
                            />
                        </div>

                        <label className="mt-7 flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                            <input
                                type="checkbox"
                                checked={form.is_postable}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        is_postable: event.target.checked,
                                    }))
                                }
                                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                            />
                            {t(
                                'financeChartOfAccounts.form.postableAccount',
                                'Postable account',
                            )}
                        </label>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="account-description">
                                {t(
                                    'financeChartOfAccounts.form.descriptionLabel',
                                    'Description',
                                )}
                            </Label>
                            <Textarea
                                id="account-description"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeChartOfAccounts.form.descriptionPlaceholder',
                                    'Optional notes for finance team usage.',
                                )}
                                rows={4}
                            />
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
                            {editingAccount
                                ? t(
                                      'financeChartOfAccounts.form.updateLedgerAccount',
                                      'Update Ledger Account',
                                  )
                                : t(
                                      'financeChartOfAccounts.form.createLedgerAccount',
                                      'Create Ledger Account',
                                  )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setReplacementAccountId('');
                        setDeleteErrors({});
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'financeChartOfAccounts.delete.title',
                                'Delete Ledger Account',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteTarget?.is_system
                                ? t(
                                      'financeChartOfAccounts.delete.systemAccountsCannotBeDeleted',
                                      'System accounts cannot be deleted.',
                                  )
                                : deleteTarget?.dependency_count
                                  ? t(
                                        'financeChartOfAccounts.delete.reassignBeforeDeleting',
                                        'This account is already used in finance records. Reassign those records before deleting it.',
                                    )
                                  : t(
                                        'financeChartOfAccounts.delete.description',
                                        'This will permanently remove the selected ledger account.',
                                    )}
                        </DialogDescription>
                    </DialogHeader>

                    {deleteTarget ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <div className="font-medium">
                                    {deleteTarget.code} - {deleteTarget.name}
                                </div>
                                <div className="mt-1 text-muted-foreground">
                                    {deleteTarget.dependency_count
                                        ? t(
                                              'financeChartOfAccounts.delete.linkedRecordsNeedReassignment',
                                              ':count linked finance records need reassignment.',
                                          ).replace(
                                              ':count',
                                              formatNumber(
                                                  deleteTarget.dependency_count,
                                              ),
                                          )
                                        : t(
                                              'financeChartOfAccounts.delete.noLinkedRecords',
                                              'No linked finance records were detected for this account.',
                                          )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'financeChartOfAccounts.delete.replacementAccount',
                                        'Replacement Account',
                                    )}
                                </Label>
                                <SearchableDropdown
                                    value={replacementAccountId}
                                    options={replacementAccountOptions}
                                    onValueChange={setReplacementAccountId}
                                    placeholder={t(
                                        'financeChartOfAccounts.delete.selectReplacementAccount',
                                        'Select replacement account',
                                    )}
                                    searchPlaceholder={t(
                                        'financeChartOfAccounts.delete.searchAccounts',
                                        'Search accounts...',
                                    )}
                                    emptyText={t(
                                        'financeChartOfAccounts.delete.noReplacementAccountFound',
                                        'No replacement account found.',
                                    )}
                                />
                                <InputError
                                    message={deleteErrors.replacement_account_id}
                                />
                                {deleteTarget.dependency_count &&
                                replacementAccountOptions.length === 0 ? (
                                    <p className="text-xs text-amber-600">
                                        {t(
                                            'financeChartOfAccounts.delete.createAnotherAccount',
                                            'Create another :type account before deleting this one.',
                                        ).replace(
                                            ':type',
                                            deleteTarget.type,
                                        )}
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
                                setReplacementAccountId('');
                                setDeleteErrors({});
                            }}
                            disabled={isDeleteSubmitting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={
                                isDeleteSubmitting ||
                                deleteTarget?.is_system === true ||
                                (Boolean(deleteTarget?.dependency_count) &&
                                    !replacementAccountId)
                            }
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t(
                                'financeChartOfAccounts.actions.delete',
                                'Delete',
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
