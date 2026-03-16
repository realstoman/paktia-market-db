'use client';

import Heading from '@/components/shared/heading';
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
import { ExpenseCategory, FinanceAccount } from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { Plus, Tags } from 'lucide-react';
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
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingCategory, setEditingCategory] =
        React.useState<ExpenseCategory | null>(null);
    const [form, setForm] = React.useState<ExpenseCategoryFormState>(emptyForm);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [mappingFilter, setMappingFilter] = React.useState('all');

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
            router.put(`/finance/expense-categories/${editingCategory.id}`,
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
        router.delete(`/finance/expense-categories/${category.id}`, {
            preserveScroll: true,
        });
    }, []);

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
            }),
        [openEdit, remove],
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
                emptyText="No statuses found."
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={mappingFilter}
                options={[
                    { value: 'all', label: 'All Mappings' },
                    { value: 'mapped', label: 'Mapped' },
                    { value: 'unmapped', label: 'Unmapped' },
                ]}
                onValueChange={setMappingFilter}
                placeholder="Ledger Mapping"
                searchPlaceholder="Search mapping status..."
                emptyText="No mapping status found."
                className="w-[190px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Expense Categories: ${formatNumber(filteredCategories.length)}`}
                    description="Manage the expense category catalog, ledger mappings, and activation state for finance operations."
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance/expenses"
                            className="bg-white dark:bg-neutral-900"
                        >
                            Back to Expenses
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Category
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5" />
                        Expense Category Register
                    </CardTitle>
                    <CardDescription>
                        Same table system as the expense register, with search,
                        filters, pagination, and category management actions.
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
                    searchPlaceholder="Search categories by name, slug, ledger account, or usage..."
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory
                                ? 'Edit Expense Category'
                                : 'Create Expense Category'}
                        </DialogTitle>
                        <DialogDescription>
                            Define the category, optional ledger mapping,
                            display order, and whether it is active for new
                            expense entries.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="expense-category-name">Name</Label>
                            <Input
                                id="expense-category-name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                placeholder="Internet"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expense-category-slug">Slug</Label>
                            <Input
                                id="expense-category-slug"
                                value={form.slug}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        slug: event.target.value,
                                    }))
                                }
                                placeholder="internet"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Ledger Account</Label>
                            <SearchableDropdown
                                value={form.expense_account_id}
                                options={accountOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        expense_account_id: value,
                                    }))
                                }
                                placeholder="Select ledger account"
                                searchPlaceholder="Search ledger accounts..."
                                emptyText="No account found."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="expense-category-sort-order">
                                Sort Order
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
                                Description
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
                                placeholder="Monthly internet and connectivity costs."
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
                            Active and available for new expense entries
                        </label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit}>
                            {editingCategory
                                ? 'Update Category'
                                : 'Create Category'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
