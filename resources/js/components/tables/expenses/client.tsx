'use client';

import { AttachmentViewDialog } from '@/components/shared/attachment-view-dialog';
import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { ExpenseVoucherPrintDialog } from '@/components/tables/expenses/expense-voucher-print-dialog';
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
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { useLocalization } from '@/lib/localization';
import {
    Expense,
    ExpenseCategory,
    FinanceAccount,
    Property,
    Vendor,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { FileText, Plus, ReceiptText, UploadCloud, X } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

const PAYMENT_METHOD_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
];

const APPROVAL_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'cancelled', label: 'Cancelled' },
];

interface ExpenseFormState {
    property_id: string;
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
    property_id: '',
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
    properties: Property[];
    expenseCategories: ExpenseCategory[];
    vendors: Vendor[];
    ledgerAccounts: FinanceAccount[];
    paidFromAccounts: FinanceAccount[];
    printExpenseId?: number | null;
}

export function ExpenseClient({
    expenses,
    properties,
    expenseCategories,
    vendors,
    ledgerAccounts,
    paidFromAccounts,
    printExpenseId = null,
}: ExpenseClientProps) {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
        null,
    );
    const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
    const [isPrintOpen, setIsPrintOpen] = React.useState(false);
    const [printExpense, setPrintExpense] = React.useState<Expense | null>(
        null,
    );
    const [attachmentPath, setAttachmentPath] = React.useState<string | null>(
        null,
    );
    const [approvalTarget, setApprovalTarget] = React.useState<Expense | null>(
        null,
    );
    const [form, setForm] = React.useState<ExpenseFormState>(emptyForm);
    const [propertyFilter, setPropertyFilter] = React.useState('all');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');

    const propertyOptions = React.useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(propertyOptions, form.property_id, (value) =>
        setForm((current) => ({
            ...current,
            property_id: value,
        })),
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
        setReceiptFile(null);
        setIsOpen(true);
    }, []);

    const openEdit = React.useCallback((expense: Expense) => {
        setEditingExpense(expense);
        setReceiptFile(null);
        setForm({
            property_id: String(expense.property_id),
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

    React.useEffect(() => {
        if (!printExpenseId) {
            return;
        }

        const target = expenses.find(
            (expense) => expense.id === printExpenseId,
        );
        if (!target) {
            return;
        }

        setPrintExpense(target);
        setIsPrintOpen(true);
    }, [expenses, printExpenseId]);

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
        const payload: Record<string, string | number | null | File> = {
            property_id: Number(form.property_id),
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
        if (receiptFile) {
            payload.receipt = receiptFile;
        }

        if (editingExpense) {
            const previousStatus = editingExpense.approval_status ?? 'draft';
            const shouldPrintAfterUpdate =
                previousStatus === 'draft' &&
                form.approval_status === 'submitted';

            router.put(`/finance/expenses/${editingExpense.id}`, payload, {
                preserveScroll: true,
                forceFormData: Boolean(receiptFile),
                onSuccess: () => {
                    setIsOpen(false);
                    setReceiptFile(null);
                    if (!shouldPrintAfterUpdate) {
                        setPrintExpense(null);
                    }
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    if (
                        typeof firstError === 'string' &&
                        firstError.length > 0
                    ) {
                        toast.error(firstError);
                        return;
                    }

                    toast.error(
                        t(
                            'financeExpenses.toasts.updateFailed',
                            'Failed to update expense.',
                        ),
                    );
                },
            });
            return;
        }

        router.post('/finance/expenses', payload, {
            preserveScroll: true,
            forceFormData: Boolean(receiptFile),
            onSuccess: () => {
                setIsOpen(false);
                setReceiptFile(null);
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                if (typeof firstError === 'string' && firstError.length > 0) {
                    toast.error(firstError);
                    return;
                }

                toast.error(
                    t(
                        'financeExpenses.toasts.createFailed',
                        'Failed to create expense.',
                    ),
                );
            },
        });
    }, [editingExpense, form, receiptFile, t]);

    const approve = React.useCallback((expense: Expense) => {
        router.post(
            `/finance/expenses/${expense.id}/approve`,
            {},
            { preserveScroll: true },
        );
    }, []);

    const reject = React.useCallback((expense: Expense) => {
        router.post(
            `/finance/expenses/${expense.id}/reject`,
            {},
            { preserveScroll: true },
        );
    }, []);

    const filteredExpenses = React.useMemo(() => {
        return expenses.filter((expense) => {
            if (
                propertyFilter !== 'all' &&
                String(expense.property_id) !== propertyFilter
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
    }, [propertyFilter, categoryFilter, expenses, statusFilter]);

    const columns = React.useMemo(
        () =>
            buildColumns({
                onEdit: openEdit,
                onApprove: setApprovalTarget,
                onCancel: reject,
                onViewAttachment: setAttachmentPath,
                onPrint: (expense) => {
                    setPrintExpense(expense);
                    setIsPrintOpen(true);
                },
                t,
            }),
        [openEdit, reject, t],
    );

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={propertyFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeExpenses.filters.allProperties',
                            'All Properties',
                        ),
                    },
                    ...propertyOptions,
                ]}
                onValueChange={setPropertyFilter}
                placeholder={t('financeExpenses.filters.property', 'Property')}
                searchPlaceholder={t(
                    'financeExpenses.filters.searchProperties',
                    'Search properties...',
                )}
                emptyText={t(
                    'financeExpenses.filters.noPropertiesFound',
                    'No properties found.',
                )}
                className="w-[180px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={categoryFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeExpenses.filters.allCategories',
                            'All Categories',
                        ),
                    },
                    ...categoryOptions,
                ]}
                onValueChange={setCategoryFilter}
                placeholder={t('financeExpenses.filters.category', 'Category')}
                searchPlaceholder={t(
                    'financeExpenses.filters.searchCategories',
                    'Search categories...',
                )}
                emptyText={t(
                    'financeExpenses.filters.noCategoriesFound',
                    'No categories found.',
                )}
                className="w-[200px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={statusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeExpenses.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...APPROVAL_OPTIONS.map((option) => ({
                        ...option,
                        label: t(
                            `financeExpenses.status.${option.value}`,
                            option.label,
                        ),
                    })),
                ]}
                onValueChange={setStatusFilter}
                placeholder={t('financeExpenses.filters.status', 'Status')}
                searchPlaceholder={t(
                    'financeExpenses.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financeExpenses.filters.noStatusesFound',
                    'No statuses found.',
                )}
                className="w-[170px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t('financeExpenses.heading.title', 'Expenses')}: ${formatNumber(filteredExpenses.length)}`}
                    description={t(
                        'financeExpenses.heading.description',
                        'Create, review, approve, and manage operating expenses.',
                    )}
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeExpenses.actions.backToFinance',
                                'Back to Finance',
                            )}
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance/expense-categories"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeExpenses.actions.expenseCategories',
                                'Expense Categories',
                            )}
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t('financeExpenses.actions.newExpense', 'New Expense')}
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ReceiptText className="h-5 w-5" />
                        {t(
                            'financeExpenses.register.title',
                            'Expense Register',
                        )}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            'financeExpenses.register.description',
                            'Same table system as the other management sections, with search, filters, and pagination.',
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredExpenses}
                    searchKey={[
                        'title',
                        'property.name',
                        'expense_category.name',
                        'payment_method',
                        'approval_status',
                    ]}
                    searchPlaceholder={t(
                        'financeExpenses.table.searchPlaceholder',
                        'Search expenses by title, property, category, or status...',
                    )}
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingExpense
                                ? t(
                                      'financeExpenses.form.editTitle',
                                      'Edit Expense',
                                  )
                                : t(
                                      'financeExpenses.form.createTitle',
                                      'Create Expense',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financeExpenses.form.description',
                                'Record a finance expense with property, category, payment method, amount, and optional approval status.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                {t('financeExpenses.form.property', 'Property')}
                            </Label>
                            <SearchableDropdown
                                value={form.property_id}
                                options={propertyOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        property_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.selectProperty',
                                    'Select property',
                                )}
                                searchPlaceholder={t(
                                    'financeExpenses.filters.searchProperties',
                                    'Search properties...',
                                )}
                                emptyText={t(
                                    'financeExpenses.form.noPropertyFound',
                                    'No property found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.expenseCategory',
                                    'Expense Category',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.expense_category_id}
                                options={categoryOptions}
                                onValueChange={syncCategoryAccount}
                                placeholder={t(
                                    'financeExpenses.form.selectExpenseCategory',
                                    'Select expense category',
                                )}
                                searchPlaceholder={t(
                                    'financeExpenses.form.searchExpenseCategories',
                                    'Search expense categories...',
                                )}
                                emptyText={t(
                                    'financeExpenses.form.noExpenseCategoryFound',
                                    'No expense category found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t('financeExpenses.form.title', 'Title')}
                            </Label>
                            <Input
                                value={form.title}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.titlePlaceholder',
                                    'Internet bill - March',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t('financeExpenses.form.amount', 'Amount')}
                            </Label>
                            <NumericInput
                                min="0"
                                value={form.amount}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        amount: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.amountPlaceholder',
                                    '0',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.paymentMethod',
                                    'Payment Method',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.payment_method}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        payment_method: value,
                                    }))
                                }
                                options={PAYMENT_METHOD_OPTIONS.map(
                                    (option) => ({
                                        value: option.value,
                                        label: t(
                                            'paymentMethods.' + option.value,
                                            option.label,
                                        ),
                                    }),
                                )}
                                placeholder={t(
                                    'financeExpenses.form.selectPaymentMethod',
                                    'Select payment method',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.expenseDate',
                                    'Expense Date',
                                )}
                            </Label>
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
                            <Label>
                                {t(
                                    'financeExpenses.form.vendorPayee',
                                    'Vendor / Payee',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.vendor_id}
                                options={vendorOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        vendor_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.selectVendorPayee',
                                    'Select vendor or payee',
                                )}
                                searchPlaceholder={t(
                                    'financeExpenses.form.searchVendors',
                                    'Search vendors...',
                                )}
                                emptyText={t(
                                    'financeExpenses.form.noVendorFound',
                                    'No vendor found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.expenseLedgerAccount',
                                    'Expense Ledger Account',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.account_id}
                                options={ledgerAccountOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        account_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.selectExpenseLedgerAccount',
                                    'Select expense ledger account',
                                )}
                                searchPlaceholder={t(
                                    'financeExpenses.form.searchExpenseLedgerAccounts',
                                    'Search expense ledger accounts...',
                                )}
                                emptyText={t(
                                    'financeExpenses.form.noAccountFound',
                                    'No account found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.paymentSourceAccount',
                                    'Payment Source Account',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.paid_from_account_id}
                                options={paidFromAccountOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        paid_from_account_id: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.selectPaymentSourceAccount',
                                    'Select payment source account',
                                )}
                                searchPlaceholder={t(
                                    'financeExpenses.form.searchPaymentSourceAccounts',
                                    'Search payment source accounts...',
                                )}
                                emptyText={t(
                                    'financeExpenses.form.noAccountFound',
                                    'No account found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.approvalStatus',
                                    'Approval Status',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.approval_status}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        approval_status: value,
                                    }))
                                }
                                disabled={
                                    editingExpense?.approval_status ===
                                    'approved'
                                }
                                options={APPROVAL_OPTIONS.map((option) => ({
                                    value: option.value,
                                    label: t(
                                        'financeExpenses.status.' +
                                            option.value,
                                        option.label,
                                    ),
                                }))}
                                placeholder={t(
                                    'financeExpenses.form.selectApprovalStatus',
                                    'Select approval status',
                                )}
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.descriptionLabel',
                                    'Description',
                                )}
                            </Label>
                            <Textarea
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder={t(
                                    'financeExpenses.form.descriptionPlaceholder',
                                    'Optional notes or receipt details',
                                )}
                                rows={4}
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financeExpenses.form.receiptAttachment',
                                    'Bill / Receipt Attachment',
                                )}
                            </Label>
                            <label
                                htmlFor="expense-receipt"
                                className="group cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition-[background-color,border-color,box-shadow] hover:border-slate-400 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
                            >
                                <input
                                    id="expense-receipt"
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
                                                : editingExpense
                                                        ?.attachments?.[0]
                                                  ? t(
                                                        'financeExpenses.form.replaceCurrentReceipt',
                                                        'Replace current receipt',
                                                    )
                                                  : t(
                                                        'financeExpenses.form.uploadReceipt',
                                                        'Upload receipt (JPG, PNG, PDF)',
                                                    )}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {t(
                                                'financeExpenses.form.browseFiles',
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
                            {editingExpense
                                ? t(
                                      'financeExpenses.form.updateExpense',
                                      'Update Expense',
                                  )
                                : t(
                                      'financeExpenses.form.createExpense',
                                      'Create Expense',
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
                                'financeExpenses.review.title',
                                'Review Expense Submission',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'financeExpenses.review.description',
                                'Confirm whether you want to approve this expense or send it back for correction. Approved expenses can later be cancelled, but not edited.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setApprovalTarget(null)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (approvalTarget) {
                                    reject(approvalTarget);
                                }
                                setApprovalTarget(null);
                            }}
                        >
                            {t('financeExpenses.actions.reject', 'Reject')}
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={() => {
                                if (approvalTarget) {
                                    approve(approvalTarget);
                                }
                                setApprovalTarget(null);
                            }}
                        >
                            {t('financeExpenses.actions.approve', 'Approve')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ExpenseVoucherPrintDialog
                open={isPrintOpen}
                onOpenChange={(open) => {
                    setIsPrintOpen(open);
                    if (!open) {
                        setPrintExpense(null);
                    }
                }}
                expense={printExpense}
                property={
                    printExpense
                        ? (properties.find(
                              (property) =>
                                  property.id === printExpense.property_id,
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
                    'financeExpenses.attachmentTitle',
                    'Expense Attachment',
                )}
            />
        </div>
    );
}
