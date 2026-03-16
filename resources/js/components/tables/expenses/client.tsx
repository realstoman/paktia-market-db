'use client';

import Heading from '@/components/shared/heading';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import {
    Branch,
    Expense,
    ExpenseCategory,
    FinanceAccount,
    Vendor,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { Plus, ReceiptText } from 'lucide-react';
import React from 'react';
import { buildColumns } from './columns';

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

interface ExpenseClientProps {
    expenses: Expense[];
    branches: Branch[];
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    ledgerAccounts: FinanceAccount[];
    paidFromAccounts: FinanceAccount[];
}

export function ExpenseClient({
    expenses,
    branches,
    expenseCategories,
    vendors,
    ledgerAccounts,
    paidFromAccounts,
}: ExpenseClientProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
        null,
    );
    const [form, setForm] = React.useState<ExpenseFormState>(emptyForm);
    const [branchFilter, setBranchFilter] = React.useState('all');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const branchOptions = React.useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
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
        () =>
            vendors.map((vendor) => ({
                value: String(vendor.id),
                label: vendor.name,
            })),
        [vendors],
    );
    const ledgerAccountOptions = React.useMemo(
        () =>
            ledgerAccounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        [ledgerAccounts],
    );
    const paidFromAccountOptions = React.useMemo(
        () =>
            paidFromAccounts.map((account) => ({
                value: String(account.id),
                label: `${account.code} - ${account.name}`,
            })),
        [paidFromAccounts],
    );

    const openCreate = React.useCallback(() => {
        setEditingExpense(null);
        setForm(emptyForm);
        setIsOpen(true);
    }, []);

    const openEdit = React.useCallback((expense: Expense) => {
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
    }, []);

    const syncCategoryAccount = React.useCallback(
        (categoryId: string) => {
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
        },
        [expenseCategories],
    );

    const submit = React.useCallback(() => {
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
    }, [editingExpense, form]);

    const approve = React.useCallback((expense: Expense) => {
        router.post(
            `/finance/expenses/${expense.id}/approve`,
            {},
            { preserveScroll: true },
        );
    }, []);

    const filteredExpenses = React.useMemo(() => {
        return expenses.filter((expense) => {
            if (
                branchFilter !== 'all' &&
                String(expense.branch_id) !== branchFilter
            ) {
                return false;
            }

            if (
                categoryFilter !== 'all' &&
                String(expense.expense_category_id ?? '') !== categoryFilter
            ) {
                return false;
            }

            if (
                statusFilter !== 'all' &&
                (expense.approval_status ?? 'draft') !== statusFilter
            ) {
                return false;
            }

            return true;
        });
    }, [branchFilter, categoryFilter, expenses, statusFilter]);

    const columns = React.useMemo(
        () =>
            buildColumns({
                onEdit: openEdit,
                onApprove: approve,
            }),
        [approve, openEdit],
    );

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={branchFilter}
                options={[
                    { value: 'all', label: 'All Branches' },
                    ...branchOptions,
                ]}
                onValueChange={setBranchFilter}
                placeholder="Branch"
                searchPlaceholder="Search branches..."
                emptyText="No branches found."
                className="w-[180px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={categoryFilter}
                options={[
                    { value: 'all', label: 'All Categories' },
                    ...categoryOptions,
                ]}
                onValueChange={setCategoryFilter}
                placeholder="Category"
                searchPlaceholder="Search categories..."
                emptyText="No categories found."
                className="w-[200px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={statusFilter}
                options={[
                    { value: 'all', label: 'All Statuses' },
                    ...APPROVAL_OPTIONS,
                ]}
                onValueChange={setStatusFilter}
                placeholder="Status"
                searchPlaceholder="Search statuses..."
                emptyText="No statuses found."
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Expenses: ${formatNumber(filteredExpenses.length)}`}
                    description="Create, review, approve, and manage operating expenses."
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance"
                            className="bg-white dark:bg-neutral-900"
                        >
                            Back to Finance
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance/expense-categories"
                            className="bg-white dark:bg-neutral-900"
                        >
                            Expense Categories
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Expense
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5" />
                        Expense Register
                    </CardTitle>
                    <CardDescription>
                        Same table system as the other management sections, with
                        search, filters, and pagination.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredExpenses}
                    searchKey={[
                        'title',
                        'branch.name',
                        'expense_category.name',
                        'payment_method',
                        'approval_status',
                    ]}
                    searchPlaceholder="Search expenses by title, branch, category, or status..."
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingExpense ? 'Edit Expense' : 'Create Expense'}
                        </DialogTitle>
                        <DialogDescription>
                            Record a finance expense with branch, category,
                            payment method, amount, and optional approval
                            status.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <SearchableDropdown
                                value={form.branch_id}
                                options={branchOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        branch_id: value,
                                    }))
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
                                placeholder="0.00"
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
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
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
                                options={vendorOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        vendor_id: value,
                                    }))
                                }
                                placeholder="Select vendor or payee"
                                searchPlaceholder="Search vendors..."
                                emptyText="No vendor found."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Ledger Account</Label>
                            <SearchableDropdown
                                value={form.account_id}
                                options={ledgerAccountOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        account_id: value,
                                    }))
                                }
                                placeholder="Select ledger account"
                                searchPlaceholder="Search ledger accounts..."
                                emptyText="No account found."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Paid From Account</Label>
                            <SearchableDropdown
                                value={form.paid_from_account_id}
                                options={paidFromAccountOptions}
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

                        <div className="grid gap-2">
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
                                    <SelectValue placeholder="Select approval status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {APPROVAL_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                placeholder="Optional notes or receipt details"
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
                            {editingExpense ? 'Update Expense' : 'Create Expense'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
