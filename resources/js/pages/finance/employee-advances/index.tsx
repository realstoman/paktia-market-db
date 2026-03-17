'use client';

import { NumericInput } from '@/components/shared/numeric-input';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Employee, EmployeeAdvance } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, HandCoins, Plus, Wallet, UserCheck, Users } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Finance', href: '/finance' },
    { title: 'Employee Advances', href: '/finance/employee-advances' },
];

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
];

const REPAYMENT_METHODS = [
    { value: 'salary_deduction', label: 'Salary Deduction' },
    { value: 'cash_return', label: 'Cash Return' },
    { value: 'manual_settlement', label: 'Manual Settlement' },
];

interface EmployeeAdvancePageProps {
    filters: {
        branchId: number | null;
        employeeId: number | null;
        status: string | null;
    };
    summary: {
        totalAmount: number;
        outstandingBalance: number;
        submittedCount: number;
        approvedCount: number;
    };
    advances: EmployeeAdvance[];
    pagination: {
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
        from: number | null;
        to: number | null;
        hasMorePages: boolean;
    };
    branches: Branch[];
    employees: Employee[];
}

interface AdvanceFormState {
    employee_id: string;
    branch_id: string;
    advance_date: string;
    amount: string;
    repayment_method: string;
    status: string;
    reason: string;
}

const emptyForm: AdvanceFormState = {
    employee_id: '',
    branch_id: '',
    advance_date: new Date().toISOString().slice(0, 10),
    amount: '',
    repayment_method: 'salary_deduction',
    status: 'draft',
    reason: '',
};

function buildPageNumbers(currentPage: number, lastPage: number) {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage]);

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        if (page > 1 && page < lastPage) {
            pages.add(page);
        }
    }

    if (currentPage <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(4);
    }

    if (currentPage >= lastPage - 2) {
        pages.add(lastPage - 1);
        pages.add(lastPage - 2);
        pages.add(lastPage - 3);
    }

    return [...pages]
        .filter((page) => page >= 1 && page <= lastPage)
        .sort((left, right) => left - right);
}

function statusTone(status?: string) {
    if (status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

function employeeLabel(employee: Employee) {
    const name = employee.full_name || `${employee.first_name} ${employee.last_name}`.trim();
    const branchName =
        typeof employee.branch === 'string' ? employee.branch : employee.branch?.name;

    return branchName ? `${name} - ${branchName}` : name;
}

export default function EmployeeAdvancesPage({
    filters,
    summary,
    advances,
    pagination,
    branches,
    employees,
}: EmployeeAdvancePageProps) {
    const [branchFilter, setBranchFilter] = React.useState(
        filters.branchId ? String(filters.branchId) : 'all',
    );
    const [employeeFilter, setEmployeeFilter] = React.useState(
        filters.employeeId ? String(filters.employeeId) : 'all',
    );
    const [statusFilter, setStatusFilter] = React.useState(filters.status ?? 'all');
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingAdvance, setEditingAdvance] = React.useState<EmployeeAdvance | null>(null);
    const [form, setForm] = React.useState<AdvanceFormState>(emptyForm);

    React.useEffect(() => {
        setBranchFilter(filters.branchId ? String(filters.branchId) : 'all');
        setEmployeeFilter(filters.employeeId ? String(filters.employeeId) : 'all');
        setStatusFilter(filters.status ?? 'all');
    }, [filters]);

    const visiblePages = React.useMemo(
        () => buildPageNumbers(pagination.currentPage, pagination.lastPage),
        [pagination.currentPage, pagination.lastPage],
    );

    const employeeOptions = React.useMemo(
        () =>
            employees.map((employee) => ({
                value: String(employee.id),
                label: employeeLabel(employee),
            })),
        [employees],
    );

    const employeesById = React.useMemo(
        () =>
            new Map(
                employees.map((employee) => [
                    String(employee.id),
                    employee,
                ]),
            ),
        [employees],
    );

    const branchOptions = React.useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        [branches],
    );

    const submitFilters = React.useCallback(
        (page = 1) => {
            const params: Record<string, string> = {};

            if (branchFilter !== 'all') {
                params.branch_id = branchFilter;
            }

            if (employeeFilter !== 'all') {
                params.employee_id = employeeFilter;
            }

            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            if (page > 1) {
                params.page = String(page);
            }

            React.startTransition(() => {
                router.get('/finance/employee-advances', params, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            });
        },
        [branchFilter, employeeFilter, statusFilter],
    );

    const openCreate = () => {
        setEditingAdvance(null);
        setForm(emptyForm);
        setIsOpen(true);
    };

    const openEdit = (advance: EmployeeAdvance) => {
        setEditingAdvance(advance);
        setForm({
            employee_id: String(advance.employee_id),
            branch_id: advance.branch_id ? String(advance.branch_id) : '',
            advance_date: advance.advance_date,
            amount: String(advance.amount),
            repayment_method: advance.repayment_method ?? 'salary_deduction',
            status: advance.status ?? 'draft',
            reason: advance.reason ?? '',
        });
        setIsOpen(true);
    };

    const submit = () => {
        const payload = {
            employee_id: Number(form.employee_id),
            branch_id: form.branch_id ? Number(form.branch_id) : null,
            advance_date: form.advance_date,
            amount: Number(form.amount),
            repayment_method: form.repayment_method || null,
            status: form.status,
            reason: form.reason || null,
        };

        const onError = (errors: Record<string, string>) => {
            const firstError = Object.values(errors)[0];
            toast.error(typeof firstError === 'string' && firstError ? firstError : 'Failed to save employee advance.');
        };

        if (editingAdvance) {
            router.put(`/finance/employee-advances/${editingAdvance.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => setIsOpen(false),
                onError,
            });
            return;
        }

        router.post('/finance/employee-advances', payload, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
            onError,
        });
    };

    const approve = (advance: EmployeeAdvance) => {
        router.post(`/finance/employee-advances/${advance.id}/approve`, {}, {
            preserveScroll: true,
        });
    };

    const reject = (advance: EmployeeAdvance) => {
        router.post(`/finance/employee-advances/${advance.id}/reject`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Advances" />

            <div className="space-y-6 py-2">
                <section className="rounded-3xl border border-neutral-200/80 bg-[linear-gradient(135deg,#f8f5ff_0%,#ffffff_55%,#eef6ff_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#111827_0%,#1d1430_55%,#0f172a_100%)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                Finance Module
                            </p>
                            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                Employee Advances
                            </h1>
                            <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                Manage employee takeouts and salary-linked advances in one place, with draft,
                                submitted, approved, and outstanding balances clearly visible.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" asChild>
                                <Link href="/finance">Back to Finance</Link>
                            </Button>
                            <Button onClick={openCreate} className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Advance
                            </Button>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">Total Advances</p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.totalAmount)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <HandCoins className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">Outstanding Balance</p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatAfn(summary.outstandingBalance)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">Submitted</p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(summary.submittedCount)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardContent className="flex items-start justify-between p-5">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">Approved</p>
                                <p className="text-2xl font-semibold text-neutral-950 dark:text-neutral-50">
                                    {formatNumber(summary.approvedCount)}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>
                            Narrow employee advances by branch, employee, or status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="grid gap-2">
                                <Label>Branch</Label>
                                <SearchableDropdown
                                    value={branchFilter}
                                    options={[{ value: 'all', label: 'All Branches' }, ...branchOptions]}
                                    onValueChange={setBranchFilter}
                                    placeholder="Select branch"
                                    searchPlaceholder="Search branches..."
                                    emptyText="No branch found."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Employee</Label>
                                <SearchableDropdown
                                    value={employeeFilter}
                                    options={[{ value: 'all', label: 'All Employees' }, ...employeeOptions]}
                                    onValueChange={setEmployeeFilter}
                                    placeholder="Select employee"
                                    searchPlaceholder="Search employees..."
                                    emptyText="No employee found."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <SearchableDropdown
                                    value={statusFilter}
                                    options={[{ value: 'all', label: 'All Statuses' }, ...STATUS_OPTIONS]}
                                    onValueChange={setStatusFilter}
                                    placeholder="Select status"
                                    searchPlaceholder="Search statuses..."
                                    emptyText="No status found."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => submitFilters(1)}>Apply Filters</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200/80 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader>
                        <CardTitle>Advance Records</CardTitle>
                        <CardDescription>
                            Employee advance records, balances, and approval state.
                            {pagination.total > 0
                                ? ` Showing ${pagination.from} to ${pagination.to} of ${pagination.total} records.`
                                : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {advances.length > 0 ? (
                            advances.map((advance) => {
                                const employeeName =
                                    advance.employee?.full_name ||
                                    `${advance.employee?.first_name ?? ''} ${advance.employee?.last_name ?? ''}`.trim() ||
                                    `Employee #${advance.employee_id}`;

                                return (
                                    <div
                                        key={advance.id}
                                        className="grid gap-3 rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_1fr]"
                                    >
                                        <div>
                                            <p className="font-medium text-neutral-950 dark:text-neutral-50">
                                                {employeeName}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {advance.branch?.name ?? 'All Branches'} | {advance.advance_date}
                                            </p>
                                            {advance.reason ? (
                                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                    {advance.reason}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Amount</p>
                                            <p className="mt-1 font-semibold">{formatAfn(advance.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Deducted</p>
                                            <p className="mt-1">{formatAfn(advance.deducted_amount ?? 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Remaining</p>
                                            <p className="mt-1">{formatAfn(advance.remaining_balance ?? 0)}</p>
                                        </div>
                                        <div className="flex flex-col items-start gap-2 md:items-end">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(advance.status)}`}>
                                                {advance.status ?? 'draft'}
                                            </span>
                                            <p className="text-xs text-neutral-500">
                                                Repayment: {advance.repayment_method?.replaceAll('_', ' ') ?? '-'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {advance.status !== 'approved' ? (
                                                    <Button variant="outline" size="sm" onClick={() => openEdit(advance)}>
                                                        Edit
                                                    </Button>
                                                ) : null}
                                                {advance.status !== 'approved' ? (
                                                    <Button size="sm" onClick={() => approve(advance)}>
                                                        Approve
                                                    </Button>
                                                ) : null}
                                                {advance.status === 'submitted' ? (
                                                    <Button variant="outline" size="sm" onClick={() => reject(advance)}>
                                                        Reject
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                                No employee advances were found for the selected filters.
                            </div>
                        )}

                        {pagination.lastPage > 1 ? (
                            <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Page {pagination.currentPage} of {pagination.lastPage}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.currentPage <= 1}
                                        onClick={() => submitFilters(pagination.currentPage - 1)}
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {visiblePages.map((page, index) => {
                                        const previousPage = visiblePages[index - 1];
                                        const showGap =
                                            previousPage !== undefined && page - previousPage > 1;

                                        return (
                                            <React.Fragment key={page}>
                                                {showGap ? (
                                                    <span className="px-1 text-sm text-neutral-400">...</span>
                                                ) : null}
                                                <Button
                                                    variant={page === pagination.currentPage ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => submitFilters(page)}
                                                >
                                                    {page}
                                                </Button>
                                            </React.Fragment>
                                        );
                                    })}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination.hasMorePages}
                                        onClick={() => submitFilters(pagination.currentPage + 1)}
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAdvance ? 'Edit Employee Advance' : 'Create Employee Advance'}
                        </DialogTitle>
                        <DialogDescription>
                            Record a takeout or salary advance and track the remaining balance for payroll deduction later.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Employee</Label>
                            <SearchableDropdown
                                value={form.employee_id}
                                options={employeeOptions}
                                onValueChange={(value) => {
                                    const selectedEmployee = employeesById.get(value);
                                    const selectedBranchId =
                                        selectedEmployee?.branch_id != null
                                            ? String(selectedEmployee.branch_id)
                                            : '';

                                    setForm((current) => ({
                                        ...current,
                                        employee_id: value,
                                        branch_id:
                                            current.branch_id || selectedBranchId,
                                    }));
                                }}
                                placeholder="Select employee"
                                searchPlaceholder="Search employees..."
                                emptyText="No employee found."
                            />
                        </div>

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
                            <Label>Advance Date</Label>
                            <Input
                                type="date"
                                value={form.advance_date}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        advance_date: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Amount</Label>
                            <NumericInput
                                value={form.amount}
                                onValueChange={(value) =>
                                    setForm((current) => ({ ...current, amount: value }))
                                }
                                placeholder="0"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Repayment Method</Label>
                            <SearchableDropdown
                                value={form.repayment_method}
                                options={REPAYMENT_METHODS}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        repayment_method: value,
                                    }))
                                }
                                placeholder="Select repayment method"
                                searchPlaceholder="Search repayment methods..."
                                emptyText="No method found."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <SearchableDropdown
                                value={form.status}
                                options={STATUS_OPTIONS}
                                onValueChange={(value) =>
                                    setForm((current) => ({ ...current, status: value }))
                                }
                                placeholder="Select status"
                                searchPlaceholder="Search statuses..."
                                emptyText="No status found."
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>Reason</Label>
                            <Textarea
                                value={form.reason}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        reason: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder="Advance for urgent family support, travel, or other reason."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit}>
                            {editingAdvance ? 'Update Advance' : 'Create Advance'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
