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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Expense, ExpenseCategory, FinanceAccount, Vendor } from '@/types';
import { formatAfn } from '@/utils/format';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCheck, Pencil, Plus, ReceiptText } from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Expenses', href: '/finance/expenses' },
];

const PAYMENT_METHOD_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' },
];

const APPROVAL_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
];

interface ExpensesPageProps {
    expenses: Expense[];
    branches: Branch[];
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    financeAccounts: FinanceAccount[];
}

interface ExpenseFormState {
    branch_id: string;
    vendor_id: string;
    expense_category_id: string;
    account_id: string;
    paid_from_account_id: string;
    title: string;
    amount: string;
    payment_method: string;
    description: string;
    expense_date: string;
    approval_status: string;
}

const emptyForm: ExpenseFormState = {
    branch_id: '',
    vendor_id: '',
    expense_category_id: '',
    account_id: '',
    paid_from_account_id: '',
    title: '',
    amount: '',
    payment_method: 'cash',
    description: '',
    expense_date: new Date().toISOString().slice(0, 10),
    approval_status: 'draft',
};

function badgeTone(status?: string) {
    if (status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }
    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

export default function ExpensesPage({
    expenses,
    branches,
    expenseCategories,
    vendors,
    financeAccounts,
}: ExpensesPageProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
    const [form, setForm] = React.useState<ExpenseFormState>(emptyForm);

    const branchOptions = React.useMemo(
        () => branches.map((branch) => ({ value: String(branch.id), label: branch.name })),
        [branches],
    );
    const categoryOptions = React.useMemo(
        () =>
            expenseCategories.map((category) => ({
                value: String(category.id),
                label: category.name,
            })),
        [expenseCategories],
    );
    const vendorOptions = React.useMemo(
        () => vendors.map((vendor) => ({ value: String(vendor.id), label: vendor.name })),
        [vendors],
    );
    const accountOptions = React.useMemo(
        () =>
            financeAccounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        [financeAccounts],
    );

    const openCreate = () => {
        setEditingExpense(null);
        setForm(emptyForm);
        setIsOpen(true);
    };

    const openEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setForm({
            branch_id: String(expense.branch_id),
            vendor_id: expense.vendor_id ? String(expense.vendor_id) : '',
            expense_category_id: expense.expense_category_id
                ? String(expense.expense_category_id)
                : '',
            account_id: expense.account_id ? String(expense.account_id) : '',
            paid_from_account_id: expense.paid_from_account_id
                ? String(expense.paid_from_account_id)
                : '',
            title: expense.title,
            amount: String(expense.amount),
            payment_method: expense.payment_method ?? 'cash',
            description: expense.description ?? '',
            expense_date: expense.expense_date ?? emptyForm.expense_date,
            approval_status: expense.approval_status ?? 'draft',
        });
        setIsOpen(true);
    };

    const syncCategoryAccount = (categoryId: string) => {
        const selectedCategory = expenseCategories.find(
            (category) => String(category.id) === categoryId,
        );

        setForm((current) => ({
            ...current,
            expense_category_id: categoryId,
            account_id: selectedCategory?.expense_account_id
                ? String(selectedCategory.expense_account_id)
                : current.account_id,
        }));
    };

    const submit = () => {
        const payload = {
            branch_id: Number(form.branch_id),
            vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
            expense_category_id: Number(form.expense_category_id),
            account_id: form.account_id ? Number(form.account_id) : null,
            paid_from_account_id: form.paid_from_account_id
                ? Number(form.paid_from_account_id)
                : null,
            title: form.title,
            amount: Number(form.amount),
            payment_method: form.payment_method,
            description: form.description || null,
            expense_date: form.expense_date,
            approval_status: form.approval_status,
        };

        if (editingExpense) {
            router.put(`/finance/expenses/${editingExpense.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => setIsOpen(false),
            });
            return;
        }

        router.post('/finance/expenses', payload, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
        });
    };

    const approve = (expense: Expense) => {
        router.post(
            `/finance/expenses/${expense.id}/approve`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Expenses" />

            <div className="space-y-4 pt-3 pb-8">
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <ReceiptText className="h-5 w-5" />
                                Expenses
                            </CardTitle>
                            <CardDescription>
                                Create and manage daily expenses like internet,
                                electricity, rent, fuel, and other operating costs.
                            </CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/finance">Back to Finance</Link>
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="h-4 w-4" />
                                New Expense
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell>{expense.expense_date}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{expense.title}</p>
                                                {expense.description ? (
                                                    <p className="text-xs text-muted-foreground">
                                                        {expense.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                        <TableCell>{expense.branch?.name ?? '-'}</TableCell>
                                        <TableCell>
                                            {expense.expense_category?.name ?? expense.expense_type ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {expense.payment_method
                                                ? expense.payment_method.replace('_', ' ')
                                                : '-'}
                                        </TableCell>
                                        <TableCell>{formatAfn(expense.amount)}</TableCell>
                                        <TableCell>
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeTone(expense.approval_status)}`}>
                                                {expense.approval_status ?? 'draft'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {expense.approval_status !== 'approved' ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => approve(expense)}
                                                    >
                                                        <CheckCheck className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEdit(expense)}
                                                >
                                                    <Pencil className="h-4 w-4" />
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
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingExpense ? 'Edit Expense' : 'Create Expense'}
                            </DialogTitle>
                            <DialogDescription>
                                Record a finance expense with branch, category,
                                payment method, amount, and optional approval status.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-2 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Branch</Label>
                                <SearchableDropdown
                                    value={form.branch_id}
                                    options={branchOptions}
                                    onValueChange={(value) =>
                                        setForm((current) => ({ ...current, branch_id: value }))
                                    }
                                    placeholder="Select branch"
                                    searchPlaceholder="Search branches..."
                                    emptyText="No branch found."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Expense Category</Label>
                                <SearchableDropdown
                                    value={form.expense_category_id}
                                    options={categoryOptions}
                                    onValueChange={syncCategoryAccount}
                                    placeholder="Select expense category"
                                    searchPlaceholder="Search expense categories..."
                                    emptyText="No expense category found."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                    placeholder="Internet bill - March"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Amount</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            amount: event.target.value,
                                        }))
                                    }
                                    placeholder="2500"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Payment Method</Label>
                                <Select
                                    value={form.payment_method}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            payment_method: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Expense Date</Label>
                                <Input
                                    type="date"
                                    value={form.expense_date}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            expense_date: event.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Vendor / Payee</Label>
                                <SearchableDropdown
                                    value={form.vendor_id}
                                    options={[
                                        { value: '', label: 'No vendor' },
                                        ...vendorOptions,
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({ ...current, vendor_id: value }))
                                    }
                                    placeholder="Select vendor"
                                    searchPlaceholder="Search vendors..."
                                    emptyText="No vendor found."
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Ledger Account</Label>
                                <SearchableDropdown
                                    value={form.account_id}
                                    options={[
                                        { value: '', label: 'Use category default' },
                                        ...accountOptions,
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({ ...current, account_id: value }))
                                    }
                                    placeholder="Select ledger account"
                                    searchPlaceholder="Search ledger accounts..."
                                    emptyText="No ledger account found."
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Paid From Account</Label>
                                <SearchableDropdown
                                    value={form.paid_from_account_id}
                                    options={[
                                        { value: '', label: 'Not specified' },
                                        ...accountOptions,
                                    ]}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            paid_from_account_id: value,
                                        }))
                                    }
                                    placeholder="Select source account"
                                    searchPlaceholder="Search source accounts..."
                                    emptyText="No account found."
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    placeholder="Monthly internet payment for branch office."
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label>Approval Status</Label>
                                <Select
                                    value={form.approval_status}
                                    onValueChange={(value) =>
                                        setForm((current) => ({
                                            ...current,
                                            approval_status: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {APPROVAL_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-3 md:col-span-2">
                                <Button variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={submit}>
                                    {editingExpense ? 'Update Expense' : 'Create Expense'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
