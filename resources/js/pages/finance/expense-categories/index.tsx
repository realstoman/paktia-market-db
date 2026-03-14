'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, ExpenseCategory, FinanceAccount } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Finance',
        href: '/finance',
    },
    {
        title: 'Expense Categories',
        href: '/finance/expense-categories',
    },
];

interface ExpenseCategoriesPageProps {
    expenseCategories: ExpenseCategory[];
    financeAccounts: FinanceAccount[];
}

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

export default function ExpenseCategoriesPage({
    expenseCategories,
    financeAccounts,
}: ExpenseCategoriesPageProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<ExpenseCategory | null>(null);
    const [form, setForm] = React.useState<ExpenseCategoryFormState>(emptyForm);

    const accountOptions = React.useMemo(
        () =>
            financeAccounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        [financeAccounts],
    );

    const openCreate = () => {
        setEditingCategory(null);
        setForm(emptyForm);
        setIsOpen(true);
    };

    const openEdit = (category: ExpenseCategory) => {
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
    };

    const submit = () => {
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
    };

    const remove = (category: ExpenseCategory) => {
        router.delete(`/finance/expense-categories/${category.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expense Categories" />

            <div className="space-y-4 pt-3 pb-8">
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Tags className="h-5 w-5" />
                                Expense Categories
                            </CardTitle>
                            <CardDescription>
                                Manage finance expense categories from the
                                database. These categories drive filters and
                                future expense entry forms.
                            </CardDescription>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/finance">Back to Finance</Link>
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                Add Category
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Mapped Account</TableHead>
                                    <TableHead>Sort</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Used In Expenses</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenseCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {category.name}
                                                </p>
                                                {category.description ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {category.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>{category.slug}</TableCell>
                                        <TableCell>
                                            {category.expense_account
                                                ? `${category.expense_account.code} - ${category.expense_account.name}`
                                                : 'Not mapped'}
                                        </TableCell>
                                        <TableCell>
                                            {category.sort_order ?? 0}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    category.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'
                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200'
                                                }`}
                                            >
                                                {category.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {category.expenses_count ?? 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEdit(category)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        remove(category)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory
                                    ? 'Edit Expense Category'
                                    : 'Create Expense Category'}
                            </DialogTitle>
                            <DialogDescription>
                                Define the finance category, optional ledger
                                mapping, display order, and whether it is
                                active for new expense entries.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                                <Label htmlFor="expense-category-name">
                                    Name
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
                                    placeholder="Daily Expense"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expense-category-slug">
                                    Slug
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
                                    placeholder="daily_expense"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Expense Account</Label>
                                <SearchableDropdown
                                    value={form.expense_account_id}
                                    options={[
                                        {
                                            value: '',
                                            label: 'No account mapping',
                                        },
                                        ...accountOptions,
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            expense_account_id: value,
                                        }))
                                    }
                                    placeholder="Select expense account"
                                    searchPlaceholder="Search finance account..."
                                    emptyText="No expense account found."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expense-category-sort">
                                    Sort Order
                                </Label>
                                <Input
                                    id="expense-category-sort"
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            sort_order: event.target.value,
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
                                    placeholder="Operational day-to-day branch expenses."
                                />
                            </div>

                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            is_active: event.target.checked,
                                        }))
                                    }
                                />
                                Active category
                            </label>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={submit}>
                                    {editingCategory
                                        ? 'Update Category'
                                        : 'Create Category'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
