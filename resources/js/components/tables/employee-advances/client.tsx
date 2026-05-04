'use client';

import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { useLocalization } from '@/lib/localization';
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
import { Branch, Employee, EmployeeAdvance } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { HandCoins, Plus } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { AdvanceVoucherPrintDialog } from './advance-voucher-print-dialog';
import { buildColumns } from './columns';

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

interface EmployeeAdvanceClientProps {
    advances: EmployeeAdvance[];
    branches: Branch[];
    employees: Employee[];
    printAdvanceId?: number | null;
    summary: {
        totalAmount: number;
        outstandingBalance: number;
        submittedCount: number;
        approvedCount: number;
    };
}

function employeeLabel(employee: Employee) {
    const name =
        employee.full_name ||
        `${employee.first_name} ${employee.last_name}`.trim();
    const branchName =
        typeof employee.branch === 'string'
            ? employee.branch
            : employee.branch?.name;

    return branchName ? `${name} - ${branchName}` : name;
}

export function EmployeeAdvanceClient({
    advances,
    branches,
    employees,
    printAdvanceId = null,
    summary,
}: EmployeeAdvanceClientProps) {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingAdvance, setEditingAdvance] =
        React.useState<EmployeeAdvance | null>(null);
    const [isPrintOpen, setIsPrintOpen] = React.useState(false);
    const [printAdvance, setPrintAdvance] =
        React.useState<EmployeeAdvance | null>(null);
    const [form, setForm] = React.useState<AdvanceFormState>(emptyForm);
    const [employeeFilter, setEmployeeFilter] = React.useState('all');
    const [branchFilter, setBranchFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [repaymentFilter, setRepaymentFilter] = React.useState('all');

    const branchOptions = React.useMemo(
        () =>
            branches.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        [branches],
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
                employees.map((employee) => [String(employee.id), employee]),
            ),
        [employees],
    );

    const openCreate = React.useCallback(() => {
        setEditingAdvance(null);
        setForm(emptyForm);
        setIsOpen(true);
    }, []);

    const openPrint = React.useCallback((advance: EmployeeAdvance) => {
        setPrintAdvance(advance);
        setIsPrintOpen(true);
    }, []);

    const openEdit = React.useCallback((advance: EmployeeAdvance) => {
        setEditingAdvance(advance);
        setForm({
            employee_id: String(advance.employee_id),
            branch_id: advance.branch_id ? String(advance.branch_id) : '',
            advance_date: advance.advance_date.includes('T')
                ? advance.advance_date.split('T')[0]
                : advance.advance_date,
            amount: String(advance.amount),
            repayment_method: advance.repayment_method ?? 'salary_deduction',
            status: advance.status ?? 'draft',
            reason: advance.reason ?? '',
        });
        setIsOpen(true);
    }, []);

    const submit = React.useCallback(() => {
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
            toast.error(
                typeof firstError === 'string' && firstError
                    ? firstError
                    : t(
                          'financeEmployeeAdvances.toasts.saveFailed',
                          'Failed to save employee advance.',
                      ),
            );
        };

        if (editingAdvance) {
            router.put(
                `/finance/employee-advances/${editingAdvance.id}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => setIsOpen(false),
                    onError,
                },
            );
            return;
        }

        router.post('/finance/employee-advances', payload, {
            preserveScroll: true,
            onSuccess: () => setIsOpen(false),
            onError,
        });
    }, [editingAdvance, form, t]);

    React.useEffect(() => {
        if (!printAdvanceId) {
            return;
        }

        const target = advances.find(
            (advance) => advance.id === printAdvanceId,
        );
        if (!target) {
            return;
        }

        setPrintAdvance(target);
        setIsPrintOpen(true);
    }, [advances, printAdvanceId]);

    const approve = React.useCallback((advance: EmployeeAdvance) => {
        router.post(
            `/finance/employee-advances/${advance.id}/approve`,
            {},
            {
                preserveScroll: true,
            },
        );
    }, []);

    const reject = React.useCallback((advance: EmployeeAdvance) => {
        router.post(
            `/finance/employee-advances/${advance.id}/reject`,
            {},
            {
                preserveScroll: true,
            },
        );
    }, []);

    const filteredAdvances = React.useMemo(() => {
        return advances.filter((advance) => {
            if (
                employeeFilter !== 'all' &&
                String(advance.employee_id) !== employeeFilter
            ) {
                return false;
            }

            if (
                branchFilter !== 'all' &&
                String(advance.branch_id ?? '') !== branchFilter
            ) {
                return false;
            }

            if (
                statusFilter !== 'all' &&
                (advance.status ?? 'draft') !== statusFilter
            ) {
                return false;
            }

            if (
                repaymentFilter !== 'all' &&
                (advance.repayment_method ?? '') !== repaymentFilter
            ) {
                return false;
            }

            return true;
        });
    }, [advances, branchFilter, employeeFilter, repaymentFilter, statusFilter]);

    const columns = React.useMemo(
        () =>
            buildColumns({
                t,
                onEdit: openEdit,
                onApprove: approve,
                onReject: reject,
                onPrint: openPrint,
            }),
        [approve, openEdit, openPrint, reject, t],
    );

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={employeeFilter}
                options={[
                    { value: 'all', label: 'All Employees' },
                    {
                        value: 'all',
                        label: t(
                            'financeEmployeeAdvances.filters.allEmployees',
                            'All Employees',
                        ),
                    },
                    ...employeeOptions,
                ]}
                onValueChange={setEmployeeFilter}
                placeholder={t(
                    'financeEmployeeAdvances.filters.employee',
                    'Employee',
                )}
                searchPlaceholder={t(
                    'financeEmployeeAdvances.filters.searchEmployees',
                    'Search employees...',
                )}
                emptyText={t(
                    'financeEmployeeAdvances.filters.noEmployeeFound',
                    'No employee found.',
                )}
                className="w-[220px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={branchFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeEmployeeAdvances.filters.allBranches',
                            'All Branches',
                        ),
                    },
                    ...branchOptions,
                ]}
                onValueChange={setBranchFilter}
                placeholder={t(
                    'financeEmployeeAdvances.filters.branch',
                    'Branch',
                )}
                searchPlaceholder={t(
                    'financeEmployeeAdvances.filters.searchBranches',
                    'Search branches...',
                )}
                emptyText={t(
                    'financeEmployeeAdvances.filters.noBranchFound',
                    'No branch found.',
                )}
                className="w-[180px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={statusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeEmployeeAdvances.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...STATUS_OPTIONS,
                ]}
                onValueChange={setStatusFilter}
                placeholder={t(
                    'financeEmployeeAdvances.filters.status',
                    'Status',
                )}
                searchPlaceholder={t(
                    'financeEmployeeAdvances.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financeEmployeeAdvances.filters.noStatusFound',
                    'No status found.',
                )}
                className="w-[180px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={repaymentFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financeEmployeeAdvances.filters.allRepaymentMethods',
                            'All Repayment Methods',
                        ),
                    },
                    ...REPAYMENT_METHODS,
                ]}
                onValueChange={setRepaymentFilter}
                placeholder={t(
                    'financeEmployeeAdvances.filters.repayment',
                    'Repayment',
                )}
                searchPlaceholder={t(
                    'financeEmployeeAdvances.filters.searchRepaymentMethods',
                    'Search repayment methods...',
                )}
                emptyText={t(
                    'financeEmployeeAdvances.filters.noMethodFound',
                    'No method found.',
                )}
                className="w-[220px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t('financeEmployeeAdvances.heading.title', 'Employee Advances')}: ${formatNumber(filteredAdvances.length)}`}
                    description={t(
                        'financeEmployeeAdvances.heading.description',
                        'Track employee takeouts, repayment methods, outstanding balances, and approval flow in one structured register.',
                    )}
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financeEmployeeAdvances.actions.backToFinance',
                                'Back to Finance',
                            )}
                        </Link>
                    </Button>
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t(
                            'financeEmployeeAdvances.actions.newAdvance',
                            'New Advance',
                        )}
                    </Button>
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="gap-2">
                        <CardDescription>
                            {t(
                                'financeEmployeeAdvances.summary.totalAdvances',
                                'Total Advances',
                            )}
                        </CardDescription>
                        <CardTitle>{formatAfn(summary.totalAmount)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="gap-2">
                        <CardDescription>
                            {t(
                                'financeEmployeeAdvances.summary.outstandingBalance',
                                'Outstanding Balance',
                            )}
                        </CardDescription>
                        <CardTitle>
                            {formatAfn(summary.outstandingBalance)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="gap-2">
                        <CardDescription>
                            {t(
                                'financeEmployeeAdvances.summary.submitted',
                                'Submitted',
                            )}
                        </CardDescription>
                        <CardTitle>
                            {formatNumber(summary.submittedCount)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardHeader className="gap-2">
                        <CardDescription>
                            {t(
                                'financeEmployeeAdvances.summary.approved',
                                'Approved',
                            )}
                        </CardDescription>
                        <CardTitle>
                            {formatNumber(summary.approvedCount)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HandCoins className="h-5 w-5" />
                        {t(
                            'financeEmployeeAdvances.records.title',
                            'Advance Records',
                        )}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            'financeEmployeeAdvances.records.description',
                            'Recent employee advances with table search, filters, actions, and 10 rows per page.',
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                <DataTable
                    columns={columns}
                    data={filteredAdvances}
                    searchKey={[
                        'employee_name',
                        'advance_date',
                        'reason',
                        'repayment_method',
                        'status',
                    ]}
                    searchPlaceholder={t(
                        'financeEmployeeAdvances.records.searchPlaceholder',
                        'Search by employee, date, reason, repayment method, or status...',
                    )}
                    toolbar={toolbar}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAdvance
                                ? t(
                                      'financeEmployeeAdvances.form.editTitle',
                                      'Edit Employee Advance',
                                  )
                                : t(
                                      'financeEmployeeAdvances.form.createTitle',
                                      'Create Employee Advance',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financeEmployeeAdvances.form.description',
                                'Record an employee takeout and keep it ready for salary deduction or settlement later.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeEmployeeAdvances.form.employee',
                                    'Employee',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.employee_id}
                                options={employeeOptions}
                                onValueChange={(value) => {
                                    const selectedEmployee =
                                        employeesById.get(value);
                                    const selectedBranchId =
                                        selectedEmployee?.branch_id != null
                                            ? String(selectedEmployee.branch_id)
                                            : '';

                                    setForm((current) => ({
                                        ...current,
                                        employee_id: value,
                                        branch_id:
                                            current.branch_id ||
                                            selectedBranchId,
                                    }));
                                }}
                                placeholder={t(
                                    'financeEmployeeAdvances.form.selectEmployee',
                                    'Select employee',
                                )}
                                searchPlaceholder={t(
                                    'financeEmployeeAdvances.filters.searchEmployees',
                                    'Search employees...',
                                )}
                                emptyText={t(
                                    'financeEmployeeAdvances.filters.noEmployeeFound',
                                    'No employee found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeEmployeeAdvances.form.branch',
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
                                    'financeEmployeeAdvances.form.selectBranch',
                                    'Select branch',
                                )}
                                searchPlaceholder={t(
                                    'financeEmployeeAdvances.filters.searchBranches',
                                    'Search branches...',
                                )}
                                emptyText={t(
                                    'financeEmployeeAdvances.filters.noBranchFound',
                                    'No branch found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeEmployeeAdvances.form.advanceDate',
                                    'Advance Date',
                                )}
                            </Label>
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
                            <Label>
                                {t(
                                    'financeEmployeeAdvances.form.amount',
                                    'Amount',
                                )}
                            </Label>
                            <NumericInput
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
                                    'financeEmployeeAdvances.form.repaymentMethod',
                                    'Repayment Method',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.repayment_method}
                                options={REPAYMENT_METHODS.map((option) => ({
                                    value: option.value,
                                    label: t(
                                        `financeEmployeeAdvances.repaymentMethods.${option.value}`,
                                        option.label,
                                    ),
                                }))}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        repayment_method: value,
                                    }))
                                }
                                placeholder={t(
                                    'financeEmployeeAdvances.form.selectRepaymentMethod',
                                    'Select repayment method',
                                )}
                                searchPlaceholder={t(
                                    'financeEmployeeAdvances.filters.searchRepaymentMethods',
                                    'Search repayment methods...',
                                )}
                                emptyText={t(
                                    'financeEmployeeAdvances.filters.noMethodFound',
                                    'No method found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financeEmployeeAdvances.form.status',
                                    'Status',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.status}
                                options={STATUS_OPTIONS.map((option) => ({
                                    value: option.value,
                                    label: t(
                                        `financeEmployeeAdvances.statuses.${option.value}`,
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
                                    'financeEmployeeAdvances.form.selectStatus',
                                    'Select status',
                                )}
                                searchPlaceholder={t(
                                    'financeEmployeeAdvances.filters.searchStatuses',
                                    'Search statuses...',
                                )}
                                emptyText={t(
                                    'financeEmployeeAdvances.filters.noStatusFound',
                                    'No status found.',
                                )}
                            />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financeEmployeeAdvances.form.reason',
                                    'Reason',
                                )}
                            </Label>
                            <Textarea
                                value={form.reason}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        reason: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder={t(
                                    'financeEmployeeAdvances.form.reasonPlaceholder',
                                    'Advance for travel, emergency support, or another approved reason.',
                                )}
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
                            {editingAdvance
                                ? t(
                                      'financeEmployeeAdvances.actions.updateAdvance',
                                      'Update Advance',
                                  )
                                : t(
                                      'financeEmployeeAdvances.actions.createAdvance',
                                      'Create Advance',
                                  )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AdvanceVoucherPrintDialog
                open={isPrintOpen}
                onOpenChange={setIsPrintOpen}
                advance={printAdvance}
                branch={
                    printAdvance
                        ? (branches.find(
                              (branch) => branch.id === printAdvance.branch_id,
                          ) ?? null)
                        : null
                }
            />
        </div>
    );
}
