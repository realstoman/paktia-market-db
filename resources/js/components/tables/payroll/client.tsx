'use client';

import { AttachmentViewDialog } from '@/components/shared/attachment-view-dialog';
import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
} from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
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

const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'paid', label: 'Paid' },
];

const CREATE_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
];

const PAYMENT_METHOD_OPTIONS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
];

interface PayrollFormState {
    branch_id: string;
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
    canCreate,
    canApprove,
    canPay,
    summary,
}: PayrollClientProps) {
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

    const openCreate = React.useCallback(() => {
        setForm(emptyForm);
        setIsOpen(true);
    }, []);

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
                            : 'Failed to generate payroll run.',
                    );
                },
            },
        );
    }, [form]);

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
                        toast.success('Contract plan updated successfully.');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        toast.error(
                            typeof firstError === 'string'
                                ? firstError
                                : 'Failed to update contract plan.',
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
                toast.success('Contract plan created successfully.');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    typeof firstError === 'string'
                        ? firstError
                        : 'Failed to create contract plan.',
                );
            },
        });
    }, [contractForm, editingContract]);

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
                            'Contract schedule updated successfully.',
                        );
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        toast.error(
                            typeof firstError === 'string'
                                ? firstError
                                : 'Failed to update schedule.',
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
                toast.success('Contract schedule created successfully.');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error(
                    typeof firstError === 'string'
                        ? firstError
                        : 'Failed to create schedule.',
                );
            },
        });
    }, [editingSchedule, scheduleForm, scheduleReceiptFile]);

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
                onView: setSelectedRun,
                onReviewApproval: setApprovalTarget,
                onMarkPaid: markPaid,
                canApprove,
                canPay,
            }),
        [canApprove, canPay, markPaid],
    );

    const scheduleColumns = React.useMemo(
        () =>
            buildScheduleColumns({
                onEdit: openScheduleEdit,
                onDelete: setDeleteScheduleTarget,
                onPrint: openSchedulePrint,
                onViewAttachment: openScheduleAttachment,
                onReviewApproval: setScheduleApprovalTarget,
                canApprove,
            }),
        [
            canApprove,
            openScheduleAttachment,
            openScheduleEdit,
            openSchedulePrint,
        ],
    );

    const contractColumns = React.useMemo(
        () =>
            buildContractColumns({
                onEdit: openContractEdit,
                onDelete: setDeleteContractTarget,
                onPrint: openContractPrint,
            }),
        [openContractEdit, openContractPrint],
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
                    { value: 'all', label: 'All Branches' },
                    ...branchOptions,
                ]}
                onValueChange={setBranchFilter}
                placeholder="Branch"
                searchPlaceholder="Search branches..."
                emptyText="No branch found."
                className="w-[190px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={statusFilter}
                options={[
                    { value: 'all', label: 'All Statuses' },
                    ...STATUS_OPTIONS,
                ]}
                onValueChange={setStatusFilter}
                placeholder="Status"
                searchPlaceholder="Search statuses..."
                emptyText="No status found."
                className="w-[190px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    const scheduleToolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={scheduleStatusFilter}
                options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'paid', label: 'Paid' },
                ]}
                onValueChange={setScheduleStatusFilter}
                placeholder="Schedule Status"
                searchPlaceholder="Search statuses..."
                emptyText="No status found."
                className="w-[210px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    const contractToolbar = (
        <div className="flex w-full flex-wrap justify-end gap-2 xl:flex-nowrap">
            <SearchableDropdown
                value={contractEmployeeFilter}
                options={[
                    { value: 'all', label: 'All Employees' },
                    ...employeeOptions,
                ]}
                onValueChange={setContractEmployeeFilter}
                placeholder="Employee"
                searchPlaceholder="Search employees..."
                emptyText="No employee found."
                className="w-[175px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={contractBranchFilter}
                options={[
                    { value: 'all', label: 'All Branches' },
                    ...branchOptions,
                ]}
                onValueChange={setContractBranchFilter}
                placeholder="Branch"
                searchPlaceholder="Search branches..."
                emptyText="No branch found."
                className="w-[155px] bg-white dark:bg-neutral-900"
            />
            <SearchableDropdown
                value={contractStatusFilter}
                options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'active', label: 'Active' },
                ]}
                onValueChange={setContractStatusFilter}
                placeholder="Status"
                searchPlaceholder="Search statuses..."
                emptyText="No status found."
                className="w-[145px] bg-white dark:bg-neutral-900"
            />
        </div>
    );

    return (
        <div className="space-y-4 pt-3 pb-8">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Payroll Runs: ${formatNumber(filteredRuns.length)}`}
                    description="Generate payroll runs, deduct approved employee advances, and track approval and payment in one clean workflow."
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
                    {canCreate ? (
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Generate Payroll
                        </Button>
                    ) : null}
                </div>
            </div>

            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />

            <section className="rounded-3xl border border-neutral-200 bg-[linear-gradient(135deg,#f5f8ff_0%,#ffffff_48%,#eefaf3_100%)] p-6 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,#0f172a_0%,#111827_48%,#0f1c15_100%)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                            Finance Module
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                            Payroll
                        </h1>
                        <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                            This is where finance turns active employees, salary
                            setup, and approved advances into a structured
                            payroll run ready for approval and payout.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[600px] lg:grid-cols-3">
                        <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-neutral-900/80">
                            <p className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase">
                                Active Staff
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {formatNumber(summary.activeEmployees)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-neutral-900/80">
                            <p className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase">
                                Unpaid Payroll
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {formatAfn(summary.unpaidPayroll)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/90 p-4 shadow-sm dark:bg-neutral-900/80">
                            <p className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase">
                                Advances To Deduct
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {formatAfn(summary.outstandingAdvances)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                    <CardContent className="flex items-start justify-between p-5">
                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-[0.22em] text-neutral-500 uppercase">
                                Draft Runs
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
                                Submitted Runs
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
                                Paid This Month
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
                                Employees In Focus
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
                            <CardTitle>Payroll Register</CardTitle>
                            <CardDescription>
                                Recent payroll runs with employee counts, gross
                                pay, advance deductions, and payout status.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
                        <DataTable
                            columns={columns}
                            data={filteredRuns}
                            searchKey={['period', 'status', 'branch.name']}
                            searchPlaceholder="Search payroll runs by period, branch, or status..."
                            toolbar={toolbar}
                        />
                    </div>

                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Contract Plans</CardTitle>
                                    <CardDescription>
                                        Manage employee contract payment plans
                                        and print contract summary vouchers.
                                    </CardDescription>
                                </div>
                                {canCreate ? (
                                    <Button onClick={openContractCreate}>
                                        New Contract Plan
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
                            searchPlaceholder="Search contract plans by employee, period, plan type, or status..."
                            toolbar={contractToolbar}
                        />
                    </div>

                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>
                                        Contract Payment Schedules
                                    </CardTitle>
                                    <CardDescription>
                                        Manage contract payment plans and due
                                        schedule items that payroll will pull
                                        instead of raw contract amounts.
                                    </CardDescription>
                                </div>
                                {canCreate ? (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={openScheduleCreate}
                                        >
                                            New Schedule
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
                            searchPlaceholder="Search schedules by employee, title, due date, or status..."
                            toolbar={scheduleToolbar}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <Card className="border-neutral-200 bg-white shadow-none dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader>
                            <CardTitle>
                                {selectedRun
                                    ? `Payroll Run #${selectedRun.id}`
                                    : 'Payroll Details'}
                            </CardTitle>
                            <CardDescription>
                                {selectedRun
                                    ? `${selectedRun.period_start} to ${selectedRun.period_end} • ${selectedRun.branch?.name ?? 'All Branches'}`
                                    : 'Select a payroll run to review employee-level payroll items.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedRun ? (
                                <>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/80">
                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                Net Payroll
                                            </p>
                                            <p className="mt-2 text-xl font-semibold">
                                                {formatAfn(
                                                    selectedRun.net_total ?? 0,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/80">
                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                Status
                                            </p>
                                            <div className="mt-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(selectedRun.status)}`}
                                                >
                                                    {selectedRun.status}
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
                                            Print Vouchers
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
                                                Review Approval
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
                                                Mark Paid
                                            </Button>
                                        ) : null}
                                    </div>

                                    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                                        {(selectedRun.items ?? []).map(
                                            (item) => (
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
                                                        </div>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(item.payment_status)}`}
                                                        >
                                                            {
                                                                item.payment_status
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                Gross
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    item.gross_salary,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                Advance
                                                                Deduction
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    item.advances_deducted,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                Net Salary
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {formatAfn(
                                                                    item.net_salary,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/70">
                                                            <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                                                                Payment Date
                                                            </p>
                                                            <p className="mt-1 font-semibold">
                                                                {item.payment_date ??
                                                                    '-'}
                                                            </p>
                                                        </div>
                                                    </div>
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
                                                            Print Voucher
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-8 text-sm text-neutral-500 dark:border-neutral-700">
                                    No payroll run selected yet.
                                </div>
                            )}

                            {!canApprove ? (
                                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                                    Approval actions are hidden. Only users with
                                    payroll approval permission can approve or
                                    reject payroll runs after vouchers are
                                    reviewed.
                                </div>
                            ) : null}

                            {!canPay ? (
                                <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-4 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-200">
                                    Payment actions are hidden. Only users with
                                    payroll payment permission can mark payroll
                                    runs as paid.
                                </div>
                            ) : null}

                            {!canApprove ? (
                                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                                    Contract schedule approval actions are
                                    hidden. Only users with payroll approval
                                    permission can approve or reject schedule
                                    payouts.
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Generate Payroll Run</DialogTitle>
                        <DialogDescription>
                            Create a payroll run for a period. Employees with
                            salary or contract amount will be included
                            automatically, and approved employee advances will
                            be proposed as deductions.
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
                                placeholder="All branches"
                                searchPlaceholder="Search branches..."
                                emptyText="No branch found."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <SearchableDropdown
                                value={form.status}
                                options={CREATE_STATUS_OPTIONS}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        status: value,
                                    }))
                                }
                                placeholder="Select status"
                                searchPlaceholder="Search statuses..."
                                emptyText="No status found."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Period Start</Label>
                            <Input
                                type="date"
                                value={form.period_start}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        period_start: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Period End</Label>
                            <Input
                                type="date"
                                value={form.period_end}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        period_end: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Default Payment Method</Label>
                            <SearchableDropdown
                                value={form.payment_method}
                                options={PAYMENT_METHOD_OPTIONS}
                                onValueChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        payment_method: value,
                                    }))
                                }
                                placeholder="Select payment method"
                                searchPlaceholder="Search methods..."
                                emptyText="No method found."
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={form.notes}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        notes: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder="Optional payroll note for the period, branch context, or payout instructions."
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-800/80">
                        <p className="text-xs tracking-[0.18em] text-neutral-500 uppercase">
                            What this will do
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <li>
                                Include active employees with salary or contract
                                amount
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
                            Cancel
                        </Button>
                        <Button onClick={submit}>Generate Run</Button>
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
                                options={[
                                    {
                                        value: 'equal_installments',
                                        label: 'Equal Installments',
                                    },
                                    {
                                        value: 'custom_schedule',
                                        label: 'Custom Schedule',
                                    },
                                    {
                                        value: 'manual_milestones',
                                        label: 'Manual Milestones',
                                    },
                                ]}
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
                                className="group cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-slate-400 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-500"
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
