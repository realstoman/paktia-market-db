'use client';

import { AttachmentViewDialog } from '@/components/shared/attachment-view-dialog';
import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { useLocalization } from '@/lib/localization';
import { buildColumns as buildScheduleColumns } from '@/components/tables/contract-payment-schedules/columns';
import { ContractPaymentVoucherPrintDialog } from '@/components/tables/contract-payment-schedules/contract-payment-voucher-print-dialog';
import { buildColumns as buildContractColumns } from '@/components/tables/contract-plans/columns';
import { ContractSummaryPrintDialog } from '@/components/tables/contract-plans/contract-summary-print-dialog';
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
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import {
    Branch,
    Employee,
    EmployeeContract,
    EmployeeContractPaymentSchedule,
    PayrollRun,
    SharedData,
} from '@/types';
import {
    formatAfghanDate,
    formatAfghanMonthLabel,
} from '@/utils/afghan-calendar';
import { formatAfn, formatNumber } from '@/utils/format';
import { Link, router, usePage } from '@inertiajs/react';
import {
    BadgeDollarSign,
    Banknote,
    CalendarRange,
    FileText,
    Plus,
    Printer,
    UploadCloud,
    Users,
    X,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';
import { PayrollVoucherPrintDialog } from './payroll-voucher-print-dialog';

const PAYMENT_METHOD_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
];

interface PayrollFormState {
    branch_id: string;
    afghan_month_key: string;
    period_start: string;
    period_end: string;
    status: string;
    payment_method: string;
    notes: string;
}

interface ContractFormState {
    employee_id: string;
    branch_id: string;
    contract_amount: string;
    start_date: string;
    end_date: string;
    payment_plan_type: string;
    installment_count: string;
    milestone_percentages: string;
    status: string;
    notes: string;
}

interface ScheduleFormState {
    employee_contract_id: string;
    due_date: string;
    title: string;
    percentage: string;
    amount: string;
    status: string;
    payment_method: string;
    notes: string;
}

const emptyForm: PayrollFormState = {
    branch_id: '',
    afghan_month_key: '',
    period_start: new Date().toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    status: 'draft',
    payment_method: 'cash',
    notes: '',
};

const emptyContractForm: ContractFormState = {
    employee_id: '',
    branch_id: '',
    contract_amount: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    payment_plan_type: 'equal_installments',
    installment_count: '6',
    milestone_percentages: '',
    status: 'draft',
    notes: '',
};

const emptyScheduleForm: ScheduleFormState = {
    employee_contract_id: '',
    due_date: new Date().toISOString().slice(0, 10),
    title: '',
    percentage: '',
    amount: '',
    status: 'draft',
    payment_method: 'bank_transfer',
    notes: '',
};

interface PayrollClientProps {
    runs: PayrollRun[];
    contracts: EmployeeContract[];
    branches: Branch[];
    employees: Employee[];
    afghanPayrollMonths: AfghanPayrollMonth[];
    currentAfghanPayrollMonth: AfghanPayrollMonth | null;
    payrollGeneration: Record<string, PayrollGenerationState>;
    canCreate: boolean;
    canApprove: boolean;
    canPay: boolean;
    summary: {
        activeEmployees: number;
        draftRuns: number;
        submittedRuns: number;
        unpaidPayroll: number;
        paidThisMonth: number;
        outstandingAdvances: number;
    };
}

interface AfghanPayrollMonth {
    year: number;
    month: number;
    month_name: string;
    label: string;
    start: string;
    end: string;
}

interface PayrollGenerationState {
    next_due_month: AfghanPayrollMonth | null;
    open_run: {
        id: number;
        status: string;
        period_start?: string | null;
        period_end?: string | null;
        label: string;
    } | null;
    latest_paid_month?: string | null;
}

function employeeName(employee?: Employee | null) {
    if (!employee) {
        return '-';
    }

    return (
        employee.full_name ||
        `${employee.first_name} ${employee.last_name}`.trim()
    );
}

function payrollItemEmployeeName(item: {
    employee_name?: string;
    employee?: Employee | null;
    employee_id: number;
}) {
    if (item.employee_name && item.employee_name.trim().length > 0) {
        return item.employee_name;
    }

    const relatedName = employeeName(item.employee ?? null);
    if (relatedName !== '-') {
        return relatedName;
    }

    return `Employee #${item.employee_id}`;
}

function payrollCoveredMonths(item: {
    covered_period_dates?: string[];
    payment_date?: string | null;
}) {
    const dates = item.covered_period_dates ?? [];

    if (dates.length > 0) {
        return dates.map((date) => formatAfghanMonthLabel(date));
    }

    return item.payment_date ? [formatAfghanMonthLabel(item.payment_date)] : [];
}

function payrollAdvanceBreakdownTotals(item: PayrollRunItem) {
    return (item.advance_breakdown ?? []).reduce(
        (totals, entry) => {
            const amount = Number(entry.amount ?? 0);

            if ((entry.type ?? 'advance') === 'employee_order') {
                totals.employeeOrder += amount;
            } else {
                totals.advance += amount;
            }

            return totals;
        },
        { employeeOrder: 0, advance: 0 },
    );
}

function statusTone(status?: string) {
    if (status === 'paid' || status === 'approved') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }

    if (status === 'submitted') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
    }

    return 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200';
}

export function PayrollClient({
    runs,
    contracts,
    branches,
    employees,
    afghanPayrollMonths,
    currentAfghanPayrollMonth,
    payrollGeneration,
    canCreate,
    canApprove,
    canPay,
    summary,
}: PayrollClientProps) {
    const { auth } = usePage<SharedData>().props;
    const { t } = useLocalization();
    const canDelete = auth.is_super_admin === true;
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedRun, setSelectedRun] = React.useState<PayrollRun | null>(
        runs[0] ?? null,
    );
    const [isContractOpen, setIsContractOpen] = React.useState(false);
    const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
    const [editingContract, setEditingContract] =
        React.useState<EmployeeContract | null>(null);
    const [editingSchedule, setEditingSchedule] =
        React.useState<EmployeeContractPaymentSchedule | null>(null);
    const [printContract, setPrintContract] =
        React.useState<EmployeeContract | null>(null);
    const [isContractPrintOpen, setIsContractPrintOpen] = React.useState(false);
    const [printSchedule, setPrintSchedule] =
        React.useState<EmployeeContractPaymentSchedule | null>(null);
    const [isSchedulePrintOpen, setIsSchedulePrintOpen] = React.useState(false);
    const [isScheduleAttachmentOpen, setIsScheduleAttachmentOpen] =
        React.useState(false);
    const [printRun, setPrintRun] = React.useState<PayrollRun | null>(null);
    const [printItemId, setPrintItemId] = React.useState<number | null>(null);
    const [isPrintOpen, setIsPrintOpen] = React.useState(false);
    const [approvalTarget, setApprovalTarget] =
        React.useState<PayrollRun | null>(null);
    const [scheduleApprovalTarget, setScheduleApprovalTarget] =
        React.useState<EmployeeContractPaymentSchedule | null>(null);
    const [deleteScheduleTarget, setDeleteScheduleTarget] =
        React.useState<EmployeeContractPaymentSchedule | null>(null);
    const [deleteContractTarget, setDeleteContractTarget] =
        React.useState<EmployeeContract | null>(null);
    const [deleteRunTarget, setDeleteRunTarget] =
        React.useState<PayrollRun | null>(null);
    const [scheduleAttachmentTarget, setScheduleAttachmentTarget] =
        React.useState<EmployeeContractPaymentSchedule | null>(null);
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [branchFilter, setBranchFilter] = React.useState('all');
    const [contractEmployeeFilter, setContractEmployeeFilter] =
        React.useState('all');
    const [contractBranchFilter, setContractBranchFilter] =
        React.useState('all');
    const [contractStatusFilter, setContractStatusFilter] =
        React.useState('all');
    const [scheduleStatusFilter, setScheduleStatusFilter] =
        React.useState('all');
    const [form, setForm] = React.useState<PayrollFormState>(emptyForm);
    const [contractForm, setContractForm] =
        React.useState<ContractFormState>(emptyContractForm);
    const [scheduleForm, setScheduleForm] =
        React.useState<ScheduleFormState>(emptyScheduleForm);
    const [scheduleReceiptFile, setScheduleReceiptFile] =
        React.useState<File | null>(null);

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
                label: employeeName(employee),
            })),
        [employees],
    );

    const contractOptions = React.useMemo(
        () =>
            contracts.map((contract) => ({
                value: String(contract.id),
                label: `${employeeName(contract.employee ?? null)} - ${contract.payment_plan_type.replaceAll('_', ' ')}`,
            })),
        [contracts],
    );

    const filteredRuns = React.useMemo(() => {
        return runs.filter((run) => {
            if (statusFilter !== 'all' && run.status !== statusFilter) {
                return false;
            }

            if (
                branchFilter !== 'all' &&
                String(run.branch_id ?? '') !== branchFilter
            ) {
                return false;
            }

            return true;
        });
    }, [branchFilter, runs, statusFilter]);

    const filteredContracts = React.useMemo(() => {
        return contracts.filter((contract) => {
            if (
                contractEmployeeFilter !== 'all' &&
                String(contract.employee_id) !== contractEmployeeFilter
            ) {
                return false;
            }

            if (
                contractBranchFilter !== 'all' &&
                String(contract.branch_id ?? '') !== contractBranchFilter
            ) {
                return false;
            }

            if (
                contractStatusFilter !== 'all' &&
                contract.status !== contractStatusFilter
            ) {
                return false;
            }

            return true;
        });
    }, [
        contractBranchFilter,
        contractEmployeeFilter,
        contractStatusFilter,
        contracts,
    ]);

    const flattenedSchedules = React.useMemo(() => {
        return contracts.flatMap((contract) =>
            (contract.schedules ?? []).map((schedule) => ({
                ...schedule,
                contract: {
                    ...schedule.contract,
                    employee: contract.employee ?? null,
                    branch: contract.branch ?? null,
                    payment_plan_type: contract.payment_plan_type,
                },
            })),
        );
    }, [contracts]);

    const filteredSchedules = React.useMemo(() => {
        return flattenedSchedules.filter((schedule) => {
            if (
                scheduleStatusFilter !== 'all' &&
                schedule.status !== scheduleStatusFilter
            ) {
                return false;
            }

            return true;
        });
    }, [flattenedSchedules, scheduleStatusFilter]);

    React.useEffect(() => {
        if (!selectedRun && filteredRuns[0]) {
            setSelectedRun(filteredRuns[0]);
        }

        if (
            selectedRun &&
            !filteredRuns.some((run) => run.id === selectedRun.id)
        ) {
            setSelectedRun(filteredRuns[0] ?? null);
        }
    }, [filteredRuns, selectedRun]);

    const payrollMonthOptions = React.useMemo(
        () =>
            afghanPayrollMonths.map((month) => ({
                value: `${month.year}-${month.month}`,
                label: month.label,
            })),
        [afghanPayrollMonths],
    );
    const selectedPayrollGeneration = React.useMemo(() => {
        const branchKey = form.branch_id || 'all';

        return (
            payrollGeneration[branchKey] ??
            payrollGeneration.all ?? {
                next_due_month: null,
                open_run: null,
                latest_paid_month: null,
            }
        );
    }, [form.branch_id, payrollGeneration]);

    const statusOptions = React.useMemo(
        () => [
            {
                value: 'draft',
                label: t('financePayroll.statuses.draft', 'Draft'),
            },
            {
                value: 'submitted',
                label: t('financePayroll.statuses.submitted', 'Submitted'),
            },
            {
                value: 'approved',
                label: t('financePayroll.statuses.approved', 'Approved'),
            },
            {
                value: 'paid',
                label: t('financePayroll.statuses.paid', 'Paid'),
            },
        ],
        [t],
    );

    const createStatusOptions = React.useMemo(
        () => [
            {
                value: 'draft',
                label: t('financePayroll.statuses.draft', 'Draft'),
            },
            {
                value: 'submitted',
                label: t('financePayroll.statuses.submitted', 'Submitted'),
            },
        ],
        [t],
    );

    const paymentMethodOptions = React.useMemo(
        () =>
            PAYMENT_METHOD_OPTIONS.map((option) => ({
                value: option.value,
                label: t(
                    `orders.paymentMethod.${option.value}`,
                    option.label,
                ),
            })),
        [t],
    );

    const contractPlanTypeOptions = React.useMemo(
        () => [
            {
                value: 'equal_installments',
                label: t(
                    'financePayroll.form.equalInstallments',
                    'Equal Installments',
                ),
            },
            {
                value: 'custom_schedule',
                label: t(
                    'financePayroll.form.customSchedule',
                    'Custom Schedule',
                ),
            },
            {
                value: 'manual_milestones',
                label: t(
                    'financePayroll.form.manualMilestones',
                    'Manual Milestones',
                ),
            },
        ],
        [t],
    );

    const openCreate = React.useCallback(() => {
        const month =
            payrollGeneration.all?.next_due_month ??
            currentAfghanPayrollMonth ??
            afghanPayrollMonths[0] ??
            null;

        setForm({
            ...emptyForm,
            afghan_month_key: month ? `${month.year}-${month.month}` : '',
            period_start: month?.start ?? emptyForm.period_start,
            period_end: month?.end ?? emptyForm.period_end,
        });
        setIsOpen(true);
    }, [afghanPayrollMonths, currentAfghanPayrollMonth, payrollGeneration]);

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const month = selectedPayrollGeneration.next_due_month;

        setForm((current) => ({
            ...current,
            afghan_month_key: month ? `${month.year}-${month.month}` : '',
            period_start: month?.start ?? current.period_start,
            period_end: month?.end ?? current.period_end,
        }));
    }, [isOpen, selectedPayrollGeneration]);

    const openContractCreate = React.useCallback(() => {
        setEditingContract(null);
        setContractForm(emptyContractForm);
        setIsContractOpen(true);
    }, []);

    const openContractEdit = React.useCallback((contract: EmployeeContract) => {
        setEditingContract(contract);
        setContractForm({
            employee_id: String(contract.employee_id),
            branch_id: contract.branch_id ? String(contract.branch_id) : '',
            contract_amount: String(contract.contract_amount),
            start_date: contract.start_date,
            end_date: contract.end_date ?? '',
            payment_plan_type: contract.payment_plan_type,
            installment_count: contract.installment_count
                ? String(contract.installment_count)
                : '',
            milestone_percentages: '',
            status: contract.status,
            notes: contract.notes ?? '',
        });
        setIsContractOpen(true);
    }, []);

    const openContractPrint = React.useCallback(
        (contract: EmployeeContract) => {
            setPrintContract(contract);
            setIsContractPrintOpen(true);
        },
        [],
    );

    const openSchedulePrint = React.useCallback(
        (schedule: EmployeeContractPaymentSchedule) => {
            setPrintSchedule(schedule);
            setIsSchedulePrintOpen(true);
        },
        [],
    );

    const openScheduleAttachment = React.useCallback(
        (schedule: EmployeeContractPaymentSchedule) => {
            setScheduleAttachmentTarget(schedule);
            setIsScheduleAttachmentOpen(true);
        },
        [],
    );

    const openScheduleCreate = React.useCallback(() => {
        setEditingSchedule(null);
        setScheduleForm(emptyScheduleForm);
        setScheduleReceiptFile(null);
        setIsScheduleOpen(true);
    }, []);

    const openScheduleEdit = React.useCallback(
        (schedule: EmployeeContractPaymentSchedule) => {
            setEditingSchedule(schedule);
            setScheduleForm({
                employee_contract_id: String(schedule.employee_contract_id),
                due_date: schedule.due_date,
                title: schedule.title ?? '',
                percentage:
                    schedule.percentage != null
                        ? String(schedule.percentage)
                        : '',
                amount: String(schedule.amount),
                status: schedule.status,
                payment_method: schedule.payment_method ?? 'bank_transfer',
                notes: schedule.notes ?? '',
            });
            setScheduleReceiptFile(null);
            setIsScheduleOpen(true);
        },
        [],
    );

    const openItemPrint = React.useCallback(
        (run: PayrollRun, itemId: number) => {
            setPrintRun(run);
            setPrintItemId(itemId);
            setIsPrintOpen(true);
        },
        [],
    );

    const printAllVouchers = React.useCallback(
        (run: PayrollRun) => {
            if (!run.items?.length) {
                toast.error('No payroll items found for this run.');
                return;
            }

            const [firstItem, ...restItems] = run.items;
            openItemPrint(run, firstItem.id);

            if (restItems.length > 0) {
                toast.message(
                    `Opened the first voucher. You can print the remaining ${restItems.length} employee vouchers from the list below.`,
                );
            }
        },
        [openItemPrint],
    );

    const submit = React.useCallback(() => {
        router.post(
            '/finance/payroll',
            {
                branch_id: form.branch_id ? Number(form.branch_id) : null,
                afghan_year: form.afghan_month_key
                    ? Number(form.afghan_month_key.split('-')[0])
                    : null,
                afghan_month: form.afghan_month_key
                    ? Number(form.afghan_month_key.split('-')[1])
                    : null,
                period_start: form.period_start,
                period_end: form.period_end,
                status: form.status,
                payment_method: form.payment_method,
                notes: form.notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIsOpen(false),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(
                        typeof firstError === 'string' && firstError
                            ? firstError
                            : t(
                                  'financePayroll.toasts.generateRunFailed',
                                  'Failed to generate payroll run.',
                              ),
                    );
                },
            },
        );
    }, [form, t]);

    const submitContract = React.useCallback(() => {
        const milestonePercentages = contractForm.milestone_percentages
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0);

        const payload = {
            employee_id: Number(contractForm.employee_id),
            branch_id: contractForm.branch_id
                ? Number(contractForm.branch_id)
                : null,
            contract_amount: Number(contractForm.contract_amount),
            start_date: contractForm.start_date,
            end_date: contractForm.end_date || null,
            payment_plan_type: contractForm.payment_plan_type,
            installment_count: contractForm.installment_count
                ? Number(contractForm.installment_count)
                : null,
            milestone_percentages:
                milestonePercentages.length > 0 ? milestonePercentages : null,
            status: contractForm.status,
            notes: contractForm.notes || null,
        };

        if (editingContract) {
            router.put(
                `/finance/payroll/contracts/${editingContract.id}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsContractOpen(false);
                        toast.success(
                            t(
                                'financePayroll.toasts.contractUpdated',
                                'Contract plan updated successfully.',
                            ),
                        );
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        toast.error(
                            typeof firstError === 'string'
                                ? firstError
                                : t(
                                      'financePayroll.toasts.contractUpdateFailed',
                                      'Failed to update contract plan.',
                                  ),
                        );
                    },
                },
            );
            return;
        }

        router.post('/finance/payroll/contracts', payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsContractOpen(false);
                toast.success(
                    t(
                        'financePayroll.toasts.contractCreated',
                        'Contract plan created successfully.',
                    ),
                );
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    typeof firstError === 'string'
                        ? firstError
                        : t(
                              'financePayroll.toasts.contractCreateFailed',
                              'Failed to create contract plan.',
                          ),
                );
            },
        });
    }, [contractForm, editingContract, t]);

    const submitSchedule = React.useCallback(() => {
        const payload: Record<string, string | number | null | File> = {
            employee_contract_id: Number(scheduleForm.employee_contract_id),
            due_date: scheduleForm.due_date,
            title: scheduleForm.title || null,
            percentage: scheduleForm.percentage
                ? Number(scheduleForm.percentage)
                : null,
            amount: Number(scheduleForm.amount),
            status: scheduleForm.status,
            payment_method: scheduleForm.payment_method,
            notes: scheduleForm.notes || null,
        };
        if (scheduleReceiptFile) {
            payload.receipt = scheduleReceiptFile;
        }

        if (editingSchedule) {
            router.put(
                `/finance/payroll/contract-schedules/${editingSchedule.id}`,
                payload,
                {
                    preserveScroll: true,
                    forceFormData: Boolean(scheduleReceiptFile),
                    onSuccess: () => {
                        setIsScheduleOpen(false);
                        setScheduleReceiptFile(null);
                        toast.success(
                            t(
                                'financePayroll.toasts.scheduleUpdated',
                                'Contract schedule updated successfully.',
                            ),
                        );
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        toast.error(
                            typeof firstError === 'string'
                                ? firstError
                                : t(
                                      'financePayroll.toasts.scheduleUpdateFailed',
                                      'Failed to update schedule.',
                                  ),
                        );
                    },
                },
            );
            return;
        }

        router.post('/finance/payroll/contract-schedules', payload, {
            preserveScroll: true,
            forceFormData: Boolean(scheduleReceiptFile),
            onSuccess: () => {
                setIsScheduleOpen(false);
                setScheduleReceiptFile(null);
                toast.success(
                    t(
                        'financePayroll.toasts.scheduleCreated',
                        'Contract schedule created successfully.',
                    ),
                );
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    typeof firstError === 'string'
                        ? firstError
                        : t(
                              'financePayroll.toasts.scheduleCreateFailed',
                              'Failed to create schedule.',
                          ),
                );
            },
        });
    }, [editingSchedule, scheduleForm, scheduleReceiptFile, t]);

    const approve = React.useCallback((run: PayrollRun) => {
        router.post(
            `/finance/payroll/${run.id}/approve`,
            {},
            {
                preserveScroll: true,
            },
        );
    }, []);

    const reject = React.useCallback((run: PayrollRun) => {
        router.post(
            `/finance/payroll/${run.id}/reject`,
            {},
            {
                preserveScroll: true,
            },
        );
    }, []);

    const approveSchedule = React.useCallback(
        (schedule: EmployeeContractPaymentSchedule) => {
            router.post(
                `/finance/payroll/contract-schedules/${schedule.id}/approve`,
                {},
                {
                    preserveScroll: true,
                },
            );
        },
        [],
    );

    const rejectSchedule = React.useCallback(
        (schedule: EmployeeContractPaymentSchedule) => {
            router.post(
                `/finance/payroll/contract-schedules/${schedule.id}/reject`,
                {},
                {
                    preserveScroll: true,
                },
            );
        },
        [],
    );

    const markPaid = React.useCallback((run: PayrollRun) => {
        router.post(
            `/finance/payroll/${run.id}/mark-paid`,
            {},
            {
                preserveScroll: true,
            },
        );
    }, []);

    const deleteRun = React.useCallback((run: PayrollRun) => {
        router.delete(`/finance/payroll/${run.id}`, {
            preserveScroll: true,
        });
    }, []);

    const deleteSchedule = React.useCallback(
        (schedule: EmployeeContractPaymentSchedule) => {
            router.delete(
                `/finance/payroll/contract-schedules/${schedule.id}`,
                {
                    preserveScroll: true,
                },
            );
        },
        [],
    );

    const deleteContract = React.useCallback((contract: EmployeeContract) => {
        router.delete(`/finance/payroll/contracts/${contract.id}`, {
            preserveScroll: true,
        });
    }, []);

    const columns = React.useMemo(
        () =>
            buildColumns({
                t,
                onView: setSelectedRun,
                onReviewApproval: setApprovalTarget,
                onMarkPaid: markPaid,
                onDelete: setDeleteRunTarget,
                canApprove,
                canPay,
                canDelete,
            }),
        [canApprove, canDelete, canPay, markPaid, t],
    );

    const scheduleColumns = React.useMemo(
        () =>
            buildScheduleColumns({
                t,
                onEdit: openScheduleEdit,
                onDelete: setDeleteScheduleTarget,
                onPrint: openSchedulePrint,
                onViewAttachment: openScheduleAttachment,
                onReviewApproval: setScheduleApprovalTarget,
                canApprove,
                canDelete,
            }),
        [
            canDelete,
            canApprove,
            openScheduleAttachment,
            openScheduleEdit,
            openSchedulePrint,
            t,
        ],
    );

    const contractColumns = React.useMemo(
        () =>
            buildContractColumns({
                t,
                onEdit: openContractEdit,
                onDelete: setDeleteContractTarget,
                onPrint: openContractPrint,
                canDelete,
            }),
        [canDelete, openContractEdit, openContractPrint, t],
    );

    const selectedPrintItem = React.useMemo(
        () => printRun?.items?.find((item) => item.id === printItemId) ?? null,
        [printItemId, printRun],
    );

    const toolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={branchFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financePayroll.filters.allBranches',
                            'All Branches',
                        ),
                    },
                    ...branchOptions,
                ]}
                onValueChange={setBranchFilter}
                placeholder={t('financePayroll.filters.branch', 'Branch')}
                searchPlaceholder={t(
                    'financePayroll.filters.searchBranches',
                    'Search branches...',
                )}
                emptyText={t(
                    'financePayroll.filters.noBranchFound',
                    'No branch found.',
                )}
                className="w-[190px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={statusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financePayroll.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...statusOptions,
                ]}
                onValueChange={setStatusFilter}
                placeholder={t('financePayroll.filters.status', 'Status')}
                searchPlaceholder={t(
                    'financePayroll.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financePayroll.filters.noStatusFound',
                    'No status found.',
                )}
                className="w-[190px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    const scheduleToolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={scheduleStatusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financePayroll.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...statusOptions,
                ]}
                onValueChange={setScheduleStatusFilter}
                placeholder={t(
                    'financePayroll.filters.scheduleStatus',
                    'Schedule Status',
                )}
                searchPlaceholder={t(
                    'financePayroll.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financePayroll.filters.noStatusFound',
                    'No status found.',
                )}
                className="w-[210px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    const contractToolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={contractEmployeeFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financePayroll.filters.allEmployees',
                            'All Employees',
                        ),
                    },
                    ...employeeOptions,
                ]}
                onValueChange={setContractEmployeeFilter}
                placeholder={t('financePayroll.filters.employee', 'Employee')}
                searchPlaceholder={t(
                    'financePayroll.filters.searchEmployees',
                    'Search employees...',
                )}
                emptyText={t(
                    'financePayroll.filters.noEmployeeFound',
                    'No employee found.',
                )}
                className="w-[175px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={contractBranchFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financePayroll.filters.allBranches',
                            'All Branches',
                        ),
                    },
                    ...branchOptions,
                ]}
                onValueChange={setContractBranchFilter}
                placeholder={t('financePayroll.filters.branch', 'Branch')}
                searchPlaceholder={t(
                    'financePayroll.filters.searchBranches',
                    'Search branches...',
                )}
                emptyText={t(
                    'financePayroll.filters.noBranchFound',
                    'No branch found.',
                )}
                className="w-[155px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={contractStatusFilter}
                options={[
                    {
                        value: 'all',
                        label: t(
                            'financePayroll.filters.allStatuses',
                            'All Statuses',
                        ),
                    },
                    ...statusOptions.filter((option) => option.value !== 'paid'),
                    {
                        value: 'active',
                        label: t('financePayroll.statuses.active', 'Active'),
                    },
                ]}
                onValueChange={setContractStatusFilter}
                placeholder={t('financePayroll.filters.status', 'Status')}
                searchPlaceholder={t(
                    'financePayroll.filters.searchStatuses',
                    'Search statuses...',
                )}
                emptyText={t(
                    'financePayroll.filters.noStatusFound',
                    'No status found.',
                )}
                className="w-[145px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`${t('financePayroll.heading.title', 'Payroll Runs')}: ${formatNumber(filteredRuns.length)}`}
                    description={t(
                        'financePayroll.heading.description',
                        'Generate payroll runs, deduct approved employee advances, and track approval and payment in one clean workflow.',
                    )}
                />
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link
                            href="/finance"
                            className="bg-white dark:bg-neutral-900"
                        >
                            {t(
                                'financePayroll.actions.backToFinance',
                                'Back to Finance',
                            )}
                        </Link>
                    </Button>
                    {canCreate ? (
                        <Button
                            onClick={openCreate}
                            className="gap-2"
                            disabled={
                                Boolean(payrollGeneration.all?.open_run) ||
                                !payrollGeneration.all?.next_due_month
                            }
                        >
                            <Plus className="h-4 w-4" />
                            {t(
                                'financePayroll.actions.generatePayroll',
                                'Generate Payroll',
                            )}
                        </Button>
                    ) : null}
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <section className="rounded-3xl border border-neutral-200 bg-[linear-gradient(135deg,#f5f8ff_0%,#ffffff_48%,#eefaf3_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#0f1c15_100%)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                            {t('financePayroll.hero.eyebrow', 'Finance Module')}
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                            {t('financePayroll.hero.title', 'Payroll')}
                        </h1>
                        <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                            {t(
                                'financePayroll.hero.description',
                                'This is where finance turns active employees, salary setup, and approved advances into a structured payroll run ready for approval and payout.',
                            )}
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[600px] lg:grid-cols-3">
                        <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-neutral-900/80">
                            <p className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.activeStaff',
                                    'Active Staff',
                                )}
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {formatNumber(summary.activeEmployees)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-neutral-900/80">
                            <p className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.unpaidPayroll',
                                    'Unpaid Payroll',
                                )}
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {formatAfn(summary.unpaidPayroll)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-neutral-900/80">
                            <p className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.advancesToDeduct',
                                    'Advances To Deduct',
                                )}
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {formatAfn(summary.outstandingAdvances)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-neutral-200">
                    {payrollGeneration.all?.open_run ? (
                        <span>
                            {t(
                                'financePayroll.notices.resolveOpenRun',
                                'Finish or delete payroll run',
                            )}{' '}
                            #{payrollGeneration.all.open_run.id}{' '}
                            {t('financePayroll.notices.forMonth', 'for')}{' '}
                            {payrollGeneration.all.open_run.label}{' '}
                            {t(
                                'financePayroll.notices.beforeAnotherRun',
                                'before generating another payroll run.',
                            )}
                        </span>
                    ) : payrollGeneration.all?.next_due_month ? (
                        <span>
                            {t(
                                'financePayroll.notices.nextDueMonth',
                                'Next due payroll month',
                            )}
                            : {payrollGeneration.all.next_due_month.label}
                        </span>
                    ) : (
                        <span>
                            {t(
                                'financePayroll.notices.noDueMonth',
                                'No payroll month is due yet. Payroll becomes available after the current month is fully closed.',
                            )}
                        </span>
                    )}
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="flex items-start justify-between p-5">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.draftRuns',
                                    'Draft Runs',
                                )}
                            </p>
                            <p className="text-2xl font-semibold">
                                {formatNumber(summary.draftRuns)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                            <CalendarRange className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="flex items-start justify-between p-5">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.submittedRuns',
                                    'Submitted Runs',
                                )}
                            </p>
                            <p className="text-2xl font-semibold">
                                {formatNumber(summary.submittedRuns)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                            <BadgeDollarSign className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="flex items-start justify-between p-5">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.paidThisMonth',
                                    'Paid This Month',
                                )}
                            </p>
                            <p className="text-2xl font-semibold">
                                {formatAfn(summary.paidThisMonth)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                            <Banknote className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="flex items-start justify-between p-5">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                {t(
                                    'financePayroll.summary.employeesInFocus',
                                    'Employees In Focus',
                                )}
                            </p>
                            <p className="text-2xl font-semibold">
                                {formatNumber(employees.length)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-neutral-950 p-3 text-white dark:bg-neutral-100 dark:text-neutral-950">
                            <Users className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <div className="space-y-4">
                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'financePayroll.register.title',
                                    'Payroll Register',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'financePayroll.register.description',
                                    'Recent payroll runs with employee counts, gross pay, advance deductions, and payout status.',
                                )}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                        <DataTable
                            columns={columns}
                            data={filteredRuns}
                            searchKey={['period', 'status', 'branch.name']}
                            searchPlaceholder={t(
                                'financePayroll.register.searchPlaceholder',
                                'Search payroll runs by period, branch, or status...',
                            )}
                            toolbar={toolbar}
                        />
                    </div>

                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>
                                        {t(
                                            'financePayroll.contracts.title',
                                            'Contract Plans',
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {t(
                                            'financePayroll.contracts.description',
                                            'Manage employee contract payment plans and print contract summary vouchers.',
                                        )}
                                    </CardDescription>
                                </div>
                                {canCreate ? (
                                    <Button onClick={openContractCreate}>
                                        {t(
                                            'financePayroll.actions.newContractPlan',
                                            'New Contract Plan',
                                        )}
                                    </Button>
                                ) : null}
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                        <DataTable
                            columns={contractColumns}
                            data={filteredContracts}
                            searchKey={[
                                'employee_name',
                                'period',
                                'payment_plan_type',
                                'status',
                            ]}
                            searchPlaceholder={t(
                                'financePayroll.contracts.searchPlaceholder',
                                'Search contract plans by employee, period, plan type, or status...',
                            )}
                            toolbar={contractToolbar}
                        />
                    </div>

                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>
                                        {t(
                                            'financePayroll.schedules.title',
                                            'Contract Payment Schedules',
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {t(
                                            'financePayroll.schedules.description',
                                            'Manage contract payment plans and due schedule items that payroll will pull instead of raw contract amounts.',
                                        )}
                                    </CardDescription>
                                </div>
                                {canCreate ? (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={openScheduleCreate}
                                        >
                                            {t(
                                                'financePayroll.actions.newSchedule',
                                                'New Schedule',
                                            )}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </CardHeader>
                    </Card>

                    <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                        <DataTable
                            columns={scheduleColumns}
                            data={filteredSchedules}
                            searchKey={[
                                'employee_name',
                                'title',
                                'due_date',
                                'status',
                            ]}
                            searchPlaceholder={t(
                                'financePayroll.schedules.searchPlaceholder',
                                'Search schedules by employee, title, due date, or status...',
                            )}
                            toolbar={scheduleToolbar}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {selectedRun
                                    ? `${t('financePayroll.details.run', 'Payroll Run')} #${selectedRun.id}`
                                    : t(
                                          'financePayroll.details.title',
                                          'Payroll Details',
                                      )}
                            </CardTitle>
                            <CardDescription>
                                {selectedRun
                                    ? `${selectedRun.payroll_period_label ?? formatAfghanMonthLabel(selectedRun.period_end)} • ${selectedRun.branch?.name ?? t('financePayroll.filters.allBranches', 'All Branches')}`
                                    : t(
                                          'financePayroll.details.description',
                                          'Select a payroll run to review employee-level payroll items.',
                                      )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedRun ? (
                                <>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/80">
                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                {t(
                                                    'financePayroll.table.netPayroll',
                                                    'Net Payroll',
                                                )}
                                            </p>
                                            <p className="mt-2 text-xl font-semibold">
                                                {formatAfn(
                                                    selectedRun.net_total ?? 0,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/80">
                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                {t(
                                                    'financePayroll.table.status',
                                                    'Status',
                                                )}
                                            </p>
                                            <div className="mt-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(selectedRun.status)}`}
                                                >
                                                    {t(
                                                        `financePayroll.statuses.${selectedRun.status}`,
                                                        selectedRun.status,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                            onClick={() =>
                                                printAllVouchers(selectedRun)
                                            }
                                        >
                                            <Printer className="h-4 w-4" />
                                            {t(
                                                'financePayroll.actions.printVouchers',
                                                'Print Vouchers',
                                            )}
                                        </Button>
                                        {canApprove &&
                                        selectedRun.status !== 'approved' &&
                                        selectedRun.status !== 'paid' ? (
                                            <Button
                                                onClick={() =>
                                                    setApprovalTarget(
                                                        selectedRun,
                                                    )
                                                }
                                                className="gap-2"
                                            >
                                                {t(
                                                    'financePayroll.actions.reviewApproval',
                                                    'Review Approval',
                                                )}
                                            </Button>
                                        ) : null}
                                        {canPay &&
                                        selectedRun.status === 'approved' ? (
                                            <Button
                                                onClick={() =>
                                                    markPaid(selectedRun)
                                                }
                                                className="gap-2"
                                            >
                                                {t(
                                                    'financePayroll.actions.markPaid',
                                                    'Mark Paid',
                                                )}
                                            </Button>
                                        ) : null}
                                    </div>

                                    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                                        {(selectedRun.items ?? []).map(
                                            (item) => {
                                                const deductionBreakdown =
                                                    payrollAdvanceBreakdownTotals(
                                                        item,
                                                    );

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="rounded-2xl border border-neutral-200/80 p-4 dark:border-neutral-800"
                                                    >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium">
                                                                {payrollItemEmployeeName(
                                                                    item,
                                                                )}
                                                            </p>
                                                            <p className="mt-1 text-xs text-neutral-500">
                                                                {item.salary_type.replaceAll(
                                                                    '_',
                                                                    ' ',
                                                                )}{' '}
                                                                •{' '}
                                                                {item.payment_method?.replaceAll(
                                                                    '_',
                                                                    ' ',
                                                                ) ?? 'cash'}
                                                            </p>
                                                            {payrollCoveredMonths(
                                                                item,
                                                            ).length ? (
                                                                <p className="mt-1 text-xs text-neutral-500">
                                                                    {t(
                                                                        'financePayroll.details.paymentForMonth',
                                                                        'Payment for month',
                                                                    )}{' '}
                                                                    {payrollCoveredMonths(
                                                                        item,
                                                                    ).join(
                                                                        ', ',
                                                                    )}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(item.payment_status)}`}
                                                        >
                                                            {t(
                                                                `financePayroll.statuses.${item.payment_status}`,
                                                                item.payment_status,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.table.gross',
                                                                    'Gross',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    item.gross_salary,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.details.advanceDeduction',
                                                                    'Advance Deduction',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    item.advances_deducted,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.details.employeeOrderDeduction',
                                                                    'Employee order deduction',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    deductionBreakdown.employeeOrder,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.details.otherAdvanceDeduction',
                                                                    'Other advances',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    deductionBreakdown.advance,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.details.netSalary',
                                                                    'Net Salary',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    item.net_salary,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.details.paymentDate',
                                                                    'Payment Date',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {item.payment_date
                                                                    ? formatAfghanDate(
                                                                          item.payment_date,
                                                                      )
                                                                    : '-'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {item.advance_breakdown &&
                                                    item.advance_breakdown
                                                        .length ? (
                                                        <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                                            <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                                                                {t(
                                                                    'financePayroll.details.deductionBreakdown',
                                                                    'Deduction breakdown',
                                                                )}
                                                            </p>
                                                            <div className="mt-3 space-y-2">
                                                                {item.advance_breakdown.map(
                                                                    (
                                                                        entry,
                                                                        index,
                                                                    ) => (
                                                                        <div
                                                                            key={`${item.id}-deduction-${entry.advance_id ?? index}`}
                                                                            className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 text-sm dark:bg-neutral-950/50"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                                                                                    {entry.type ===
                                                                                    'employee_order'
                                                                                        ? t(
                                                                                              'financePayroll.details.employeeCoveredOrder',
                                                                                              'Employee-covered order',
                                                                                          )
                                                                                        : t(
                                                                                              'financePayroll.details.salaryAdvance',
                                                                                              'Salary advance',
                                                                                          )}
                                                                                </p>
                                                                                <p className="truncate text-xs text-neutral-500">
                                                                                    {entry.reason ??
                                                                                        '-'}
                                                                                </p>
                                                                            </div>
                                                                            <span className="font-semibold whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                                                                                {formatAfn(
                                                                                    Number(
                                                                                        entry.amount ??
                                                                                            0,
                                                                                    ),
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                    <div className="mt-4 flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() =>
                                                                openItemPrint(
                                                                    selectedRun,
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                            {t(
                                                                'financePayroll.actions.printVoucher',
                                                                'Print Voucher',
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-sm text-neutral-500 dark:border-neutral-700">
                                    {t(
                                        'financePayroll.details.empty',
                                        'No payroll run selected yet.',
                                    )}
                                </div>
                            )}

                            {!canApprove ? (
                                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                                    {t(
                                        'financePayroll.notices.approvalHidden',
                                        'Approval actions are hidden. Only users with payroll approval permission can approve or reject payroll runs after vouchers are reviewed.',
                                    )}
                                </div>
                            ) : null}

                            {!canPay ? (
                                <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-4 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-200">
                                    {t(
                                        'financePayroll.notices.paymentHidden',
                                        'Payment actions are hidden. Only users with payroll payment permission can mark payroll runs as paid.',
                                    )}
                                </div>
                            ) : null}

                            {!canApprove ? (
                                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                                    {t(
                                        'financePayroll.notices.scheduleApprovalHidden',
                                        'Contract schedule approval actions are hidden. Only users with payroll approval permission can approve or reject schedule payouts.',
                                    )}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'financePayroll.form.generateTitle',
                                'Generate Payroll Run',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'financePayroll.form.generateDescription',
                                'Create a payroll run by Afghan month. Employees with salary or contract amount will be included automatically, and approved employee advances will be proposed as deductions.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300 md:col-span-2">
                            {selectedPayrollGeneration.open_run ? (
                                <span>
                                    {t(
                                        'financePayroll.notices.resolveOpenRun',
                                        'Finish or delete payroll run',
                                    )}{' '}
                                    #{selectedPayrollGeneration.open_run.id}{' '}
                                    {t('financePayroll.notices.forMonth', 'for')}{' '}
                                    {selectedPayrollGeneration.open_run.label}{' '}
                                    {t(
                                        'financePayroll.notices.beforeAnotherRun',
                                        'before generating another payroll run.',
                                    )}
                                </span>
                            ) : selectedPayrollGeneration.next_due_month ? (
                                <span>
                                    {t(
                                        'financePayroll.notices.nextDueMonth',
                                        'Next due payroll month',
                                    )}
                                    : {selectedPayrollGeneration.next_due_month.label}
                                </span>
                            ) : (
                                <span>
                                    {t(
                                        'financePayroll.notices.noDueMonth',
                                        'No payroll month is due yet. Payroll becomes available after the current month is fully closed.',
                                    )}
                                </span>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('financePayroll.filters.branch', 'Branch')}</Label>
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
                                    'financePayroll.filters.allBranches',
                                    'All branches',
                                )}
                                searchPlaceholder={t(
                                    'financePayroll.filters.searchBranches',
                                    'Search branches...',
                                )}
                                emptyText={t(
                                    'financePayroll.filters.noBranchFound',
                                    'No branch found.',
                                )}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('financePayroll.filters.status', 'Status')}</Label>
                            <SearchableDropdown
                                value={form.status}
                                options={createStatusOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        status: value,
                                    }))
                                }
                                placeholder={t(
                                    'financePayroll.form.selectStatus',
                                    'Select status',
                                )}
                                searchPlaceholder={t(
                                    'financePayroll.filters.searchStatuses',
                                    'Search statuses...',
                                )}
                                emptyText={t(
                                    'financePayroll.filters.noStatusFound',
                                    'No status found.',
                                )}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financePayroll.form.afghanPayrollMonth',
                                    'Afghan Payroll Month',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.afghan_month_key}
                                options={
                                    selectedPayrollGeneration.next_due_month
                                        ? [
                                              {
                                                  value: `${selectedPayrollGeneration.next_due_month.year}-${selectedPayrollGeneration.next_due_month.month}`,
                                                  label: selectedPayrollGeneration
                                                      .next_due_month.label,
                                              },
                                          ]
                                        : payrollMonthOptions
                                }
                                onValueChange={() => undefined}
                                placeholder={t(
                                    'financePayroll.form.selectAfghanMonth',
                                    'Select Afghan month',
                                )}
                                searchPlaceholder={t(
                                    'financePayroll.form.searchAfghanMonths',
                                    'Search Afghan months...',
                                )}
                                emptyText={t(
                                    'financePayroll.form.noAfghanMonthFound',
                                    'No Afghan month found.',
                                )}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financePayroll.form.gregorianStart',
                                    'Gregorian Start',
                                )}
                            </Label>
                            <Input
                                type="date"
                                value={form.period_start}
                                readOnly
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'financePayroll.form.gregorianEnd',
                                    'Gregorian End',
                                )}
                            </Label>
                            <Input type="date" value={form.period_end} readOnly />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>
                                {t(
                                    'financePayroll.form.defaultPaymentMethod',
                                    'Default Payment Method',
                                )}
                            </Label>
                            <SearchableDropdown
                                value={form.payment_method}
                                options={paymentMethodOptions}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        payment_method: value,
                                    }))
                                }
                                placeholder={t(
                                    'financePayroll.form.selectPaymentMethod',
                                    'Select payment method',
                                )}
                                searchPlaceholder={t(
                                    'financePayroll.form.searchMethods',
                                    'Search methods...',
                                )}
                                emptyText={t(
                                    'financePayroll.form.noMethodFound',
                                    'No method found.',
                                )}
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>{t('financePayroll.form.notes', 'Notes')}</Label>
                            <Textarea
                                value={form.notes}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder={t(
                                    'financePayroll.form.notesPlaceholder',
                                    'Optional payroll note for the period, branch context, or payout instructions.',
                                )}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/80">
                        <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                            {t(
                                'financePayroll.form.whatThisWillDo',
                                'What this will do',
                            )}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <li>
                                Process payroll by Afghan month such as حمل،
                                ثور، جوزا
                            </li>
                            <li>
                                Generate employee-level payroll items
                                automatically
                            </li>
                            <li>
                                Deduct approved outstanding employee advances
                                from net salary
                            </li>
                            <li>
                                Keep the run in draft or submitted until finance
                                approves it
                            </li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={submit}
                            disabled={
                                Boolean(selectedPayrollGeneration.open_run) ||
                                !selectedPayrollGeneration.next_due_month
                            }
                        >
                            {t(
                                'financePayroll.actions.generateRun',
                                'Generate Run',
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingContract
                                ? 'Edit Contract Payment Plan'
                                : 'Create Contract Payment Plan'}
                        </DialogTitle>
                        <DialogDescription>
                            Set the contract amount and payment plan. Equal
                            installments can auto-generate schedule rows for
                            each due period.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Employee</Label>
                            <SearchableDropdown
                                value={contractForm.employee_id}
                                options={employeeOptions}
                                onValueChange={(value) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        employee_id: value,
                                    }))
                                }
                                placeholder="Select employee"
                                searchPlaceholder="Search employees..."
                                emptyText="No employee found."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <SearchableDropdown
                                value={contractForm.branch_id}
                                options={branchOptions}
                                onValueChange={(value) =>
                                    setContractForm((current) => ({
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
                            <Label>Contract Amount</Label>
                            <NumericInput
                                value={contractForm.contract_amount}
                                onValueChange={(value) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        contract_amount: value,
                                    }))
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={contractForm.start_date}
                                onChange={(event) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        start_date: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={contractForm.end_date}
                                onChange={(event) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        end_date: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Payment Plan Type</Label>
                            <SearchableDropdown
                                value={contractForm.payment_plan_type}
                                options={contractPlanTypeOptions}
                                onValueChange={(value) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        payment_plan_type: value,
                                    }))
                                }
                                placeholder="Plan type"
                                searchPlaceholder="Search plan types..."
                                emptyText="No plan type found."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Installment Count</Label>
                            <NumericInput
                                value={contractForm.installment_count}
                                onValueChange={(value) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        installment_count: value,
                                    }))
                                }
                                placeholder="6"
                            />
                        </div>
                        {contractForm.payment_plan_type !==
                        'equal_installments' ? (
                            <div className="grid gap-2 md:col-span-2">
                                <Label>Milestone Percentages</Label>
                                <Input
                                    value={contractForm.milestone_percentages}
                                    onChange={(event) =>
                                        setContractForm((current) => ({
                                            ...current,
                                            milestone_percentages:
                                                event.target.value,
                                        }))
                                    }
                                    placeholder="20, 30, 50"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Optional. Enter comma-separated milestone
                                    percentages that add up to 100 and the
                                    schedule rows will be generated
                                    automatically by month from the start date
                                    when the plan is created.
                                </p>
                            </div>
                        ) : null}
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Status</Label>
                            <SearchableDropdown
                                value={contractForm.status}
                                options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'submitted', label: 'Submitted' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'active', label: 'Active' },
                                ]}
                                onValueChange={(value) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        status: value,
                                    }))
                                }
                                placeholder="Status"
                                searchPlaceholder="Search statuses..."
                                emptyText="No status found."
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={contractForm.notes}
                                onChange={(event) =>
                                    setContractForm((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder="Contract payment notes, milestone details, or payout instructions."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsContractOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submitContract}>
                            {editingContract ? 'Update Plan' : 'Create Plan'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isScheduleOpen}
                onOpenChange={(open) => {
                    setIsScheduleOpen(open);
                    if (!open) {
                        setScheduleReceiptFile(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSchedule
                                ? 'Edit Contract Schedule'
                                : 'Create Contract Schedule'}
                        </DialogTitle>
                        <DialogDescription>
                            Create or update a due payment schedule item.
                            Payroll will pull due submitted or approved
                            schedules for contract employees.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Contract Plan</Label>
                            <SearchableDropdown
                                value={scheduleForm.employee_contract_id}
                                options={contractOptions}
                                onValueChange={(value) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        employee_contract_id: value,
                                    }))
                                }
                                placeholder="Select contract plan"
                                searchPlaceholder="Search plans..."
                                emptyText="No plan found."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={scheduleForm.due_date}
                                onChange={(event) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        due_date: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={scheduleForm.title}
                                onChange={(event) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder="Installment 1 or Mobilization Payment"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Percentage</Label>
                            <NumericInput
                                value={scheduleForm.percentage}
                                onValueChange={(value) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        percentage: value,
                                    }))
                                }
                                placeholder="20"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Amount</Label>
                            <NumericInput
                                value={scheduleForm.amount}
                                onValueChange={(value) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        amount: value,
                                    }))
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <SearchableDropdown
                                value={scheduleForm.status}
                                options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'submitted', label: 'Submitted' },
                                    { value: 'approved', label: 'Approved' },
                                    { value: 'paid', label: 'Paid' },
                                ]}
                                onValueChange={(value) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        status: value,
                                    }))
                                }
                                placeholder="Status"
                                searchPlaceholder="Search statuses..."
                                emptyText="No status found."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Payment Method</Label>
                            <SearchableDropdown
                                value={scheduleForm.payment_method}
                                options={PAYMENT_METHOD_OPTIONS}
                                onValueChange={(value) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        payment_method: value,
                                    }))
                                }
                                placeholder="Payment method"
                                searchPlaceholder="Search methods..."
                                emptyText="No method found."
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={scheduleForm.notes}
                                onChange={(event) =>
                                    setScheduleForm((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder="Optional schedule note or milestone detail."
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Supporting Attachment</Label>
                            <label
                                htmlFor="schedule-receipt"
                                className="group cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition-[background-color,border-color,box-shadow] hover:border-slate-400 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
                            >
                                <input
                                    id="schedule-receipt"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="hidden"
                                    onChange={(event) =>
                                        setScheduleReceiptFile(
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
                                            {scheduleReceiptFile
                                                ? scheduleReceiptFile.name
                                                : editingSchedule?.attachment_path
                                                  ? 'Replace current attachment'
                                                  : 'Upload supporting file (JPG, PNG, PDF)'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Milestone certificate, contract
                                            invoice, or signed approval note.
                                            Max 5MB.
                                        </p>
                                    </div>
                                    {scheduleReceiptFile ? (
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setScheduleReceiptFile(null);
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
                            onClick={() => setIsScheduleOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={submitSchedule}>
                            {editingSchedule
                                ? 'Update Schedule'
                                : 'Create Schedule'}
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
                        <AlertDialogTitle>Review Payroll Run</AlertDialogTitle>
                        <AlertDialogDescription>
                            Review the printed vouchers first, then either
                            approve this payroll run or send it back to draft
                            for correction.
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
                            Reject
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={() => {
                                if (approvalTarget) {
                                    approve(approvalTarget);
                                }
                                setApprovalTarget(null);
                            }}
                        >
                            Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {canDelete ? (
                <>
                    <AlertDialog
                        open={deleteRunTarget !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setDeleteRunTarget(null);
                            }
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete Payroll Run
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove the selected unpaid payroll
                                    run and all of its employee payroll items.
                                    Paid payroll runs stay protected and cannot
                                    be deleted.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setDeleteRunTarget(null)}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (deleteRunTarget) {
                                            deleteRun(deleteRunTarget);
                                        }
                                        setDeleteRunTarget(null);
                                    }}
                                >
                                    Delete Run
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog
                        open={deleteContractTarget !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setDeleteContractTarget(null);
                            }
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete Contract Plan
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove the contract plan and its unpaid
                                    schedule rows. Paid schedules are already protected
                                    and cannot be deleted through this action.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setDeleteContractTarget(null)}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (deleteContractTarget) {
                                            deleteContract(deleteContractTarget);
                                        }
                                        setDeleteContractTarget(null);
                                    }}
                                >
                                    Delete Plan
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog
                        open={deleteScheduleTarget !== null}
                        onOpenChange={(open) => {
                            if (!open) {
                                setDeleteScheduleTarget(null);
                            }
                        }}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete Contract Schedule
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove the selected schedule row and its
                                    uploaded attachment. Paid schedules are already
                                    protected and cannot be deleted.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setDeleteScheduleTarget(null)}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (deleteScheduleTarget) {
                                            deleteSchedule(deleteScheduleTarget);
                                        }
                                        setDeleteScheduleTarget(null);
                                    }}
                                >
                                    Delete Schedule
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            ) : null}

            <AlertDialog
                open={scheduleApprovalTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setScheduleApprovalTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Review Contract Schedule
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Confirm whether you want to approve this contract
                            payment schedule or send it back to draft for
                            correction.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setScheduleApprovalTarget(null)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (scheduleApprovalTarget) {
                                    rejectSchedule(scheduleApprovalTarget);
                                }
                                setScheduleApprovalTarget(null);
                            }}
                        >
                            Reject
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={() => {
                                if (scheduleApprovalTarget) {
                                    approveSchedule(scheduleApprovalTarget);
                                }
                                setScheduleApprovalTarget(null);
                            }}
                        >
                            Approve
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PayrollVoucherPrintDialog
                open={isPrintOpen}
                onOpenChange={setIsPrintOpen}
                run={printRun}
                item={selectedPrintItem}
                branch={
                    printRun
                        ? (branches.find(
                              (branch) => branch.id === printRun.branch_id,
                          ) ?? null)
                        : null
                }
            />

            <ContractSummaryPrintDialog
                open={isContractPrintOpen}
                onOpenChange={setIsContractPrintOpen}
                contract={printContract}
                branch={
                    printContract
                        ? (branches.find(
                              (branch) => branch.id === printContract.branch_id,
                          ) ?? null)
                        : null
                }
            />

            <ContractPaymentVoucherPrintDialog
                open={isSchedulePrintOpen}
                onOpenChange={setIsSchedulePrintOpen}
                schedule={printSchedule}
                branch={
                    printSchedule
                        ? (branches.find(
                              (branch) =>
                                  branch.id ===
                                  (printSchedule.contract?.branch?.id ?? null),
                          ) ?? null)
                        : null
                }
            />

            <AttachmentViewDialog
                open={isScheduleAttachmentOpen}
                onOpenChange={(open) => {
                    setIsScheduleAttachmentOpen(open);
                    if (!open) {
                        setScheduleAttachmentTarget(null);
                    }
                }}
                path={scheduleAttachmentTarget?.attachment_path ?? null}
                title="Contract Schedule Attachment"
            />
        </div>
    );
}
