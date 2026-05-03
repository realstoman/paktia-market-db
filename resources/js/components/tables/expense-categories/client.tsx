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
import { useLocalization } from '@/lib/localization';
import { ExpenseCategory, FinanceAccount, SharedData } from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router, usePage } from '@inertiajs/react';
import { Plus, Tags, Trash2 } from 'lucide-react';
import React from 'react';
import { buildColumns } from './columns';

interface ExpenseCategoryFormState {
    name: string;
    slug: string;
    description: string;
    expense_account_id: string;
    sort_order: string;
    is_active: boolean;
}

const emptyForm: ExpenseCategoryFormState = {
    name: '',
    slug: '',
    description: '',
    expense_account_id: '',
    sort_order: '0',
    is_active: true,
};

interface ExpenseCategoryClientProps {
    expenseCategories: ExpenseCategory[];
    financeAccounts: FinanceAccount[];
}

export function ExpenseCategoryClient({
    expenseCategories,
    financeAccounts,
}: ExpenseCategoryClientProps) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocalization();
    const canDelete = auth.is_super_admin === true;
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingCategory, setEditingCategory] =
        React.useState<ExpenseCategory | null>(null);
    const [form, setForm] = React.useState<ExpenseCategoryFormState>(emptyForm);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [mappingFilter, setMappingFilter] = React.useState('all');
    const [deleteTarget, setDeleteTarget] =
        React.useState<ExpenseCategory | null>(null);
    const [replacementCategoryId, setReplacementCategoryId] =
        React.useState('');
    const [deleteErrors, setDeleteErrors] = React.useState<
        Record<string, string>
    >({});
    const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);

    const accountOptions = React.useMemo(
        () =>
            financeAccounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        [financeAccounts],
    );

    const openCreate = React.useCallback(() => {
        setEditingCategory(null);
        setForm(emptyForm);
        setIsOpen(true);
    }, []);

    const openEdit = React.useCallback((category: ExpenseCategory) => {
        setEditingCategory(category);
        setForm({
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            expense_account_id: category.expense_account_id
                ? String(category.expense_account_id)
                : '',
            sort_order: String(category.sort_order ?? 0),
            is_active: Boolean(category.is_active),
        });
        setIsOpen(true);
    }, []);

    const submit = React.useCallback(() => {
        const payload = {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            expense_account_id: form.expense_account_id || null,
            sort_order: Number(form.sort_order || 0),
            is_active: form.is_active,
        };

        if (editingCategory) {
            router.put(
                `/finance/expense-categories/${editingCategory.id}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => setIsOpen(false),
                },
            );
            return;
        }

        router.post('/finance/expense-categories', payload, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    }, [editingCategory, form]);

    const remove = React.useCallback((category: ExpenseCategory) => {
        setDeleteTarget(category);
        setReplacementCategoryId('');
        setDeleteErrors({});
    }, []);

    const replacementCategoryOptions = React.useMemo(
        () =>
            expenseCategories
                .filter((category) => category.id !== deleteTarget?.id)
                .map((category) => ({
                    value: String(category.id),
                    label: category.name,
                })),
        [deleteTarget?.id, expenseCategories],
    );

    const confirmDelete = React.useCallback(() => {
        if (!deleteTarget || isDeleteSubmitting) {
            return;
        }

        setIsDeleteSubmitting(true);
        setDeleteErrors({});

        router.delete(`/finance/expense-categories/${deleteTarget.id}`, {
            preserveScroll: true,
            data: replacementCategoryId
                ? {
                      replacement_category_id: Number(replacementCategoryId),
                  }
                : {},
            onSuccess: () => {
                setDeleteTarget(null);
                setReplacementCategoryId('');
            },
            onError: (errors) => {
                setDeleteErrors(errors);
            },
            onFinish: () => {
                setIsDeleteSubmitting(false);
            },
        });
    }, [deleteTarget, isDeleteSubmitting, replacementCategoryId]);

    const filteredCategories = React.useMemo(() => {
        return expenseCategories.filter((category) => {
            if (statusFilter !== 'all') {
                const expected = statusFilter === 'active';
                if (Boolean(category.is_active) !== expected) {
                    return false;
                }
            }

            if (mappingFilter === 'mapped' && !category.expense_account_id) {
                return false;
            }

            if (mappingFilter === 'unmapped' && category.expense_account_id) {
                return false;
            }

            return true;
        });
    }, [expenseCategories, mappingFilter, statusFilter]);

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
                value={statusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeExpenseCategories.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    {
                        value: 'active',
                        label: t(
                            'financeExpenseCategories.status.active',
                            'Active',
                        ),
                    },
                    {
                        value: 'inactive',
                        label: t(
                            'financeExpenseCategories.status.inactive',
                            'Inactive',
                        ),
                    },
                ]}
                onValueChange={setStatusFilter}
                placeholder={t(
                    'financeExpenseCategories.filters.status',
                    'Status',
                )}
                searchPlaceholder={t(
                    'financeExpenseCategories.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financeExpenseCategories.filters.noStatusesFound',
                    'No statuses found.',
                )}
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={mappingFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeExpenseCategories.filters.allMappings',
                            'All Mappings',
                        ),
                    },
                    {
                        value: 'mapped',
                        label: t(
                            'financeExpenseCategories.filters.mapped',
                            'Mapped',
                        ),
                    },
                    {
                        value: 'unmapped',
                        label: t(
                            'financeExpenseCategories.filters.unmapped',
                            'Unmapped',
                        ),
                    },
                ]}
                onValueChange={setMappingFilter}
                placeholder={t(
                    'financeExpenseCategories.filters.ledgerMapping',
                    'Ledger Mapping',
                )}
                searchPlaceholder={t(
                    'financeExpenseCategories.filters.searchMappingStatus',
                    'Search mapping status...',
                )}
                emptyText={t(
                    'financeExpenseCategories.filters.noMappingStatusFound',
                    'No mapping status found.',
                )}
                className="w-[190px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t(
                        'financeExpenseCategories.heading.title',
                        'Expense Categories',
                    )}: ${formatNumber(filteredCategories.length)}`}
                    description={t(
                        'financeExpenseCategories.heading.description',
                        'Manage the expense category catalog, ledger mappings, and activation state for finance operations.',
                    )}
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance/expenses"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeExpenseCategories.actions.backToExpenses',
                                'Back to Expenses',
                            )}
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t(
                            'financeExpenseCategories.actions.addCategory',
                            'Add Category',
                        )}
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5" />
                        {t(
                            'financeExpenseCategories.register.title',
                            'Expense Category Register',
                        )}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            'financeExpenseCategories.register.description',
                            'Same table system as the expense register, with search, filters, pagination, and category management actions.',
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredCategories}
                    searchKey={[
                        'name',
                        'slug',
                        'expense_account.name',
                        'expenses_count',
                    ]}
                    searchPlaceholder={t(
                        'financeExpenseCategories.table.searchPlaceholder',
                        'Search categories by name, slug, ledger account, or usage...',
                    )}
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory
                                ? t(
                                      'financeExpenseCategories.form.editTitle',
                                      'Edit Expense Category',
                                  )
                                : t(
                                      'financeExpenseCategories.form.createTitle',
                                      'Create Expense Category',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financeExpenseCategories.form.description',
                                'Define the category, optional ledger mapping, display order, and whether it is active for new expense entries.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="expense-category-name">
                                {t(
                                    'financeExpenseCategories.form.name',
                                    'Name',
                                )}
                            </Label>
                            <Input
                                id="expense-category-name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenseCategories.form.namePlaceholder',
                                    'Internet',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expense-category-slug">
                                {t(
                                    'financeExpenseCategories.form.slug',
                                    'Slug',
                                )}
                            </Label>
                            <Input
                                id="expense-category-slug"
                                value={form.slug}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        slug: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenseCategories.form.slugPlaceholder',
                                    'internet',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenseCategories.form.ledgerAccount',
                                    'Ledger Account',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.expense_account_id}
                                options={accountOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        expense_account_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenseCategories.form.selectLedgerAccount',
                                    'Select ledger account',
                                )}
                                searchPlaceholder={t(
                                    'financeExpenseCategories.form.searchLedgerAccounts',
                                    'Search ledger accounts...',
                                )}
                                emptyText={t(
                                    'financeExpenseCategories.form.noAccountFound',
                                    'No account found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expense-category-sort-order">
                                {t(
                                    'financeExpenseCategories.form.sortOrder',
                                    'Sort Order',
                                )}
                            </Label>
                            <NumericInput
                                id="expense-category-sort-order"
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
                            <Label htmlFor="expense-category-description">
                                {t(
                                    'financeExpenseCategories.form.descriptionLabel',
                                    'Description',
                                )}
                            </Label>
                            <Textarea
                                id="expense-category-description"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenseCategories.form.descriptionPlaceholder',
                                    'Monthly internet and connectivity costs.',
                                )}
                                rows={4}
                            />
                        </div>

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
                            {t(
                                'financeExpenseCategories.form.activeLabel',
                                'Active and available for new expense entries',
                            )}
                        </label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={submit}>
                            {editingCategory
                                ? t(
                                      'financeExpenseCategories.form.updateCategory',
                                      'Update Category',
                                  )
                                : t(
                                      'financeExpenseCategories.form.createCategory',
                                      'Create Category',
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
                        setReplacementCategoryId('');
                        setDeleteErrors({});
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'financeExpenseCategories.delete.title',
                                'Delete Expense Category',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteTarget?.expenses_count
                                ? t(
                                      'financeExpenseCategories.delete.reassignBeforeDeleting',
                                      'This category is already assigned to expenses. Reassign those records before deleting it.',
                                  )
                                : t(
                                      'financeExpenseCategories.delete.description',
                                      'This will permanently remove the selected expense category.',
                                  )}
                        </DialogDescription>
                    </DialogHeader>

                    {deleteTarget ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <div className="font-medium">
                                    {deleteTarget.name}
                                </div>
                                <div className="mt-1 text-muted-foreground">
                                    {deleteTarget.expenses_count
                                        ? t(
                                              'financeExpenseCategories.delete.expensesWillBeMoved',
                                              ':count expenses will be moved to another category.',
                                          ).replace(
                                              ':count',
                                              formatNumber(
                                                  deleteTarget.expenses_count,
                                              ),
                                          )
                                        : t(
                                              'financeExpenseCategories.delete.noExpensesAssigned',
                                              'No expenses are currently assigned to this category.',
                                          )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'financeExpenseCategories.delete.replacementCategory',
                                        'Replacement Category',
                                    )}
                                </Label>
                                <SearchableDropdown
                                    value={replacementCategoryId}
                                    options={replacementCategoryOptions}
                                    onValueChange={setReplacementCategoryId}
                                    placeholder={t(
                                        'financeExpenseCategories.delete.selectReplacementCategory',
                                        'Select replacement category',
                                    )}
                                    searchPlaceholder={t(
                                        'financeExpenseCategories.delete.searchCategories',
                                        'Search categories...',
                                    )}
                                    emptyText={t(
                                        'financeExpenseCategories.delete.noReplacementCategoryFound',
                                        'No replacement category found.',
                                    )}
                                />
                                <InputError
                                    message={
                                        deleteErrors.replacement_category_id
                                    }
                                />
                                {deleteTarget.expenses_count &&
                                replacementCategoryOptions.length === 0 ? (
                                    <p className="text-xs text-amber-600">
                                        {t(
                                            'financeExpenseCategories.delete.createAnotherCategory',
                                            'Create another category before deleting this one.',
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
                                setReplacementCategoryId('');
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
                                (Boolean(deleteTarget?.expenses_count) &&
                                    !replacementCategoryId)
                            }
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t(
                                'financeExpenseCategories.actions.delete',
                                'Delete',
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
