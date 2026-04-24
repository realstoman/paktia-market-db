import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatNumber } from '@/utils/format';
import { Textarea } from '@/components/ui/textarea';
import {
    Branch,
    Employee,
    EmployeePosition,
    EmploymentType,
    SharedData,
    Shift,
} from '@/types';
import { router, usePage } from '@inertiajs/react';
import {
    Ban,
    CheckCircle,
    Edit,
    Eye,
    FileText,
    ImagePlus,
    MoreHorizontal,
    Save,
    Trash,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Employee;
    branches: Branch[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    shifts: Shift[];
    canDelete: boolean;
}

interface SelectedAttachment {
    id: string;
    file: File;
}

const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended', 'terminated'];
const CURRENCIES = ['AFN', 'USD'];
const MAX_ATTACHMENTS = 25;

const formatTimeTo12Hour = (time?: string | null) => {
    if (!time) {
        return '';
    }

    const [hourPart, minutePart] = String(time).split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart ?? '0');

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return String(time);
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;
    const normalizedMinute = String(minute).padStart(2, '0');

    return `${normalizedHour}:${normalizedMinute} ${suffix}`;
};

const publicStorageUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('/storage/')) {
        return path;
    }

    return `/storage/${path.replace(/^\/+/, '')}`;
};

const fileNameFromPath = (path: string) => {
    const segments = path.split('/');
    return segments[segments.length - 1] || path;
};

export const CellAction: React.FC<CellActionProps> = ({
    data,
    branches,
    employmentTypes,
    employeePositions,
    shifts,
    canDelete,
}) => {
    const { t, locale } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canDeleteEmployee = canDelete && auth.is_super_admin === true;
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isFinanceOpen, setIsFinanceOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [editFirstName, setEditFirstName] = useState(data.first_name ?? '');
    const [editLastName, setEditLastName] = useState(data.last_name ?? '');
    const [editPhone, setEditPhone] = useState(data.phone ?? '');
    const [editBranchId, setEditBranchId] = useState(
        data.branch_id ? String(data.branch_id) : '',
    );
    const [editEmploymentTypeId, setEditEmploymentTypeId] = useState(
        data.employment_type_id ? String(data.employment_type_id) : '',
    );
    const [editEmployeePositionId, setEditEmployeePositionId] = useState(
        data.employee_position_id ? String(data.employee_position_id) : '',
    );
    const [editShiftId, setEditShiftId] = useState(
        data.shift_id ? String(data.shift_id) : '',
    );
    const [editSalary, setEditSalary] = useState(
        data.salary !== null && data.salary !== undefined
            ? String(data.salary)
            : '',
    );
    const [editContractStartDate, setEditContractStartDate] = useState(
        data.contract_start_date ?? '',
    );
    const [editContractEndDate, setEditContractEndDate] = useState(
        data.contract_end_date ?? '',
    );
    const [editContractAmount, setEditContractAmount] = useState(
        data.contract_amount !== null && data.contract_amount !== undefined
            ? String(data.contract_amount)
            : '',
    );
    const [editSalaryCurrency, setEditSalaryCurrency] = useState(
        data.salary_currency ?? 'AFN',
    );
    const [editStatus, setEditStatus] = useState(
        data.status ?? (data.is_active ? 'active' : 'inactive'),
    );
    const [editAddress, setEditAddress] = useState(data.address ?? '');
    const [editDescription, setEditDescription] = useState(
        data.description ?? '',
    );

    const [editProfilePicture, setEditProfilePicture] = useState<File | null>(
        null,
    );
    const [editAttachments, setEditAttachments] = useState<
        SelectedAttachment[]
    >([]);

    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const editProfilePicturePreview = useMemo(
        () =>
            editProfilePicture ? URL.createObjectURL(editProfilePicture) : null,
        [editProfilePicture],
    );

    useEffect(() => {
        return () => {
            if (editProfilePicturePreview) {
                URL.revokeObjectURL(editProfilePicturePreview);
            }
        };
    }, [editProfilePicturePreview]);

    const currentProfilePictureUrl = useMemo(() => {
        if (!data.profile_picture) {
            return null;
        }

        return publicStorageUrl(data.profile_picture);
    }, [data.profile_picture]);

    const existingAttachments = useMemo(
        () => (Array.isArray(data.attachments) ? data.attachments : []),
        [data.attachments],
    );

    const editEmploymentTypeName = useMemo(() => {
        if (!editEmploymentTypeId) {
            return '';
        }

        return (
            employmentTypes.find(
                (type) => String(type.id) === editEmploymentTypeId,
            )?.name ?? ''
        );
    }, [editEmploymentTypeId, employmentTypes]);

    const editIsContractBased = useMemo(
        () => editEmploymentTypeName.toLowerCase().includes('contract'),
        [editEmploymentTypeName],
    );

    const getStatusLabel = (value: string) =>
        t(
            `employees.statuses.${value}`,
            value
                .split('_')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' '),
        );

    const formatLocalizedDate = (value?: string | null) => {
        if (!value) {
            return '';
        }

        return new Intl.DateTimeFormat(
            locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
        ).format(new Date(value));
    };

    const staticPreviousPayments = useMemo(
        () => [
            {
                id: '1',
                date: '2026-02-28',
                type: t('employees.finance.salaryType', 'Salary'),
                amount: 25000,
                currency: data.salary_currency ?? 'AFN',
                note: t(
                    'employees.finance.notes.monthlySalaryFebruary',
                    'Monthly salary - February',
                ),
            },
            {
                id: '2',
                date: '2026-02-16',
                type: t('employees.finance.takeoutType', 'Takeout'),
                amount: 3500,
                currency: data.salary_currency ?? 'AFN',
                note: t(
                    'employees.finance.notes.personalAdvance',
                    'Personal advance',
                ),
            },
            {
                id: '3',
                date: '2026-01-31',
                type: t('employees.finance.salaryType', 'Salary'),
                amount: 25000,
                currency: data.salary_currency ?? 'AFN',
                note: t(
                    'employees.finance.notes.monthlySalaryJanuary',
                    'Monthly salary - January',
                ),
            },
        ],
        [data.salary_currency, t],
    );

    const nextSalaryDate = useMemo(() => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1, 0);
        return formatLocalizedDate(next.toISOString());
    }, [formatLocalizedDate]);

    const resetEdit = () => {
        setEditFirstName(data.first_name ?? '');
        setEditLastName(data.last_name ?? '');
        setEditPhone(data.phone ?? '');
        setEditBranchId(data.branch_id ? String(data.branch_id) : '');
        setEditEmploymentTypeId(
            data.employment_type_id ? String(data.employment_type_id) : '',
        );
        setEditEmployeePositionId(
            data.employee_position_id ? String(data.employee_position_id) : '',
        );
        setEditShiftId(data.shift_id ? String(data.shift_id) : '');
        setEditSalary(
            data.salary !== null && data.salary !== undefined
                ? String(data.salary)
                : '',
        );
        setEditContractStartDate(data.contract_start_date ?? '');
        setEditContractEndDate(data.contract_end_date ?? '');
        setEditContractAmount(
            data.contract_amount !== null && data.contract_amount !== undefined
                ? String(data.contract_amount)
                : '',
        );
        setEditSalaryCurrency(data.salary_currency ?? 'AFN');
        setEditStatus(data.status ?? (data.is_active ? 'active' : 'inactive'));
        setEditAddress(data.address ?? '');
        setEditDescription(data.description ?? '');
        setEditProfilePicture(null);
        setEditAttachments([]);
        setEditErrors({});
    };

    const handleEditAttachmentChange = (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        const selected = Array.from(files).map((file) => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
        }));

        setEditAttachments((current) => {
            const totalCount =
                existingAttachments.length + current.length + selected.length;

            if (totalCount > MAX_ATTACHMENTS) {
                toast.error(
                    `Total attachments cannot exceed ${MAX_ATTACHMENTS}.`,
                );

                const allowedNew = Math.max(
                    0,
                    MAX_ATTACHMENTS -
                        existingAttachments.length -
                        current.length,
                );

                return [...current, ...selected.slice(0, allowedNew)];
            }

            return [...current, ...selected];
        });
    };

    const removeEditAttachment = (id: string) => {
        setEditAttachments((current) =>
            current.filter((attachment) => attachment.id !== id),
        );
    };

    const handleEditSubmit = () => {
        if (
            !editFirstName.trim() ||
            !editLastName.trim() ||
            !editBranchId ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/employees/${data.id}`,
            {
                first_name: editFirstName.trim(),
                last_name: editLastName.trim(),
                phone: editPhone.trim() || null,
                branch_id: Number(editBranchId),
                employment_type_id: editEmploymentTypeId
                    ? Number(editEmploymentTypeId)
                    : null,
                employee_position_id: editEmployeePositionId
                    ? Number(editEmployeePositionId)
                    : null,
                shift_id: editShiftId ? Number(editShiftId) : null,
                is_contract_based: editIsContractBased,
                salary:
                    !editIsContractBased && editSalary.trim()
                        ? Number(editSalary)
                        : null,
                salary_currency: editSalaryCurrency,
                contract_start_date: editContractStartDate || null,
                contract_end_date: editContractEndDate || null,
                contract_amount:
                    editIsContractBased && editContractAmount.trim()
                        ? Number(editContractAmount)
                        : null,
                status: editStatus,
                is_active: editStatus === 'active',
                address: editAddress.trim() || null,
                description: editDescription.trim() || null,
                profile_picture: editProfilePicture,
                attachments: editAttachments.map((item) => item.file),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Employee updated successfully.');
                    setIsEditOpen(false);
                },
                onError: (errors) => {
                    setEditErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const attachmentError =
        editErrors.attachments ??
        Object.entries(editErrors).find(([key]) =>
            key.startsWith('attachments.'),
        )?.[1];

    const handleToggleStatus = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/employees/${data.id}/toggle-active`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? 'Employee marked inactive.'
                        : 'Employee marked active.',
                );
                setIsStatusOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/employees/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee deleted successfully.');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFinanceOpen(true)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Employee Finances
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            resetEdit();
                            setIsEditOpen(true);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsStatusOpen(true)}>
                        <Ban className="mr-2 h-4 w-4" />
                        {data.is_active ? 'Mark Inactive' : 'Mark Active'}
                    </DropdownMenuItem>
                    {canDeleteEmployee ? (
                        <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                            <Trash className="mr-2 h-4 w-4 text-red-600" />
                            Delete
                        </DropdownMenuItem>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Employee Details</DialogTitle>
                        <DialogDescription>
                            Profile overview and attachments.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 px-1">
                            <div className="rounded-xl border bg-gradient-to-r from-neutral-50 to-white p-5 dark:from-neutral-900 dark:to-neutral-950">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    {currentProfilePictureUrl ? (
                                        <img
                                            src={currentProfilePictureUrl}
                                            alt={data.full_name ?? 'Employee'}
                                            className="h-24 w-24 rounded-xl border object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-muted text-xl font-semibold text-muted-foreground">
                                            {`${data.first_name?.charAt(0) ?? ''}${data.last_name?.charAt(0) ?? ''}`.toUpperCase() ||
                                                'NA'}
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold">
                                            {data.full_name ??
                                                `${data.first_name} ${data.last_name}`}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {data.employee_position ??
                                                'No position assigned'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    data.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {(
                                                    data.status ??
                                                    (data.is_active
                                                        ? 'active'
                                                        : 'inactive')
                                                )
                                                    .split('_')
                                                    .map(
                                                        (part) =>
                                                            part
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            part.slice(1),
                                                    )
                                                    .join(' ')}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                {data.employment_type ??
                                                    'No employment type'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Contact
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-medium">
                                                Phone:
                                            </span>{' '}
                                            {data.phone || '—'}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Address:
                                            </span>{' '}
                                            {data.address || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        Employment
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-medium">
                                                Branch:
                                            </span>{' '}
                                            {data.branch || '—'}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Salary:
                                            </span>{' '}
                                            {data.contract_amount
                                                ? `${formatNumber(Number(data.contract_amount))} ${data.salary_currency ?? 'AFN'} (Contract)`
                                                : data.salary
                                                  ? `${formatNumber(Number(data.salary))} ${data.salary_currency ?? 'AFN'}`
                                                  : '—'}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                {data.contract_amount
                                                    ? 'Contract Duration:'
                                                    : 'Work Duration:'}
                                            </span>{' '}
                                            {data.contract_start_date &&
                                            data.contract_end_date
                                                ? `${new Date(data.contract_start_date).toLocaleDateString()} - ${new Date(data.contract_end_date).toLocaleDateString()}`
                                                : '—'}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Shift:
                                            </span>{' '}
                                            {data.shift || '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Description
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {data.description ||
                                        'No description provided.'}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Attachments
                                </p>
                                {existingAttachments.length > 0 ? (
                                    <div className="space-y-2">
                                        {existingAttachments.map(
                                            (path, index) => (
                                                <a
                                                    key={`${path}-${index}`}
                                                    href={publicStorageUrl(
                                                        path,
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                                                >
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    <span className="truncate">
                                                        {fileNameFromPath(path)}
                                                    </span>
                                                </a>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No attachments uploaded.
                                    </p>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={isFinanceOpen} onOpenChange={setIsFinanceOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Employee Finances</DialogTitle>
                        <DialogDescription>
                            Static preview of salary and takeout records.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 px-1">
                            <div className="rounded-xl border bg-gradient-to-r from-emerald-50 to-white p-5 dark:from-emerald-950/30 dark:to-neutral-950">
                                <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                    Upcoming Payment
                                </p>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-2xl font-semibold">
                                            {`${formatNumber(Number(data.contract_amount ?? data.salary ?? 25000))} ${data.salary_currency ?? 'AFN'}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Monthly salary for{' '}
                                            {data.full_name ??
                                                `${data.first_name} ${data.last_name}`}
                                        </p>
                                    </div>
                                    <div className="rounded-md border bg-white/70 px-3 py-2 text-sm dark:bg-neutral-900/60">
                                        Due date: {nextSalaryDate}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">
                                        Previous Payments
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                        Salary + Takeouts
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Note</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {staticPreviousPayments.map(
                                                (payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>
                                                            {new Date(
                                                                payment.date,
                                                            ).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    payment.type ===
                                                                    'Salary'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {payment.type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {`${formatNumber(payment.amount)} ${payment.currency}`}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {payment.note}
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update employee profile, employment type, position,
                            salary details, and files.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="grid gap-4 px-1 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-first-name-${data.id}`}>
                                    First name
                                </Label>
                                <Input
                                    id={`edit-first-name-${data.id}`}
                                    value={editFirstName}
                                    onChange={(event) =>
                                        setEditFirstName(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.first_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-last-name-${data.id}`}>
                                    Last name
                                </Label>
                                <Input
                                    id={`edit-last-name-${data.id}`}
                                    value={editLastName}
                                    onChange={(event) =>
                                        setEditLastName(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.last_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-phone-${data.id}`}>
                                    Phone
                                </Label>
                                <Input
                                    id={`edit-phone-${data.id}`}
                                    value={editPhone}
                                    onChange={(event) =>
                                        setEditPhone(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Branch</Label>
                                <Select
                                    value={editBranchId}
                                    onValueChange={setEditBranchId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem
                                                key={branch.id}
                                                value={String(branch.id)}
                                            >
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.branch_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Employment type</Label>
                                <Select
                                    value={editEmploymentTypeId}
                                    onValueChange={setEditEmploymentTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employmentTypes.map((type) => (
                                            <SelectItem
                                                key={type.id}
                                                value={String(type.id)}
                                            >
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editErrors.employment_type_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Employee position</Label>
                                <Select
                                    value={editEmployeePositionId}
                                    onValueChange={setEditEmployeePositionId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employeePositions.map((position) => (
                                            <SelectItem
                                                key={position.id}
                                                value={String(position.id)}
                                            >
                                                {position.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editErrors.employee_position_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Shift</Label>
                                <Select
                                    value={editShiftId}
                                    onValueChange={setEditShiftId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select shift" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {shifts.map((shift) => (
                                            <SelectItem
                                                key={shift.id}
                                                value={String(shift.id)}
                                            >
                                                {`${shift.name} (${formatTimeTo12Hour(shift.start_time)} - ${formatTimeTo12Hour(shift.end_time)})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.shift_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-salary-${data.id}`}>
                                    {editIsContractBased
                                        ? 'Contract Amount'
                                        : 'Salary'}
                                </Label>
                                <NumericInput
                                    id={`edit-salary-${data.id}`}
                                    min="0"
                                    value={
                                        editIsContractBased
                                            ? editContractAmount
                                            : editSalary
                                    }
                                    onValueChange={(value) =>
                                        editIsContractBased
                                            ? setEditContractAmount(value)
                                            : setEditSalary(value)
                                    }
                                />
                                <InputError
                                    message={
                                        editIsContractBased
                                            ? editErrors.contract_amount
                                            : editErrors.salary
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={`edit-contract-start-${data.id}`}
                                >
                                    {editIsContractBased
                                        ? 'Contract start date'
                                        : 'Work start date'}
                                </Label>
                                <Input
                                    id={`edit-contract-start-${data.id}`}
                                    type="date"
                                    value={editContractStartDate}
                                    onChange={(event) =>
                                        setEditContractStartDate(
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={editErrors.contract_start_date}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-contract-end-${data.id}`}>
                                    {editIsContractBased
                                        ? 'Contract end date'
                                        : 'Work end date'}
                                </Label>
                                <Input
                                    id={`edit-contract-end-${data.id}`}
                                    type="date"
                                    value={editContractEndDate}
                                    onChange={(event) =>
                                        setEditContractEndDate(
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={editErrors.contract_end_date}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Payment currency</Label>
                                <Select
                                    value={editSalaryCurrency}
                                    onValueChange={(value) =>
                                        setEditSalaryCurrency(
                                            value as typeof editSalaryCurrency,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CURRENCIES.map((currency) => (
                                            <SelectItem
                                                key={currency}
                                                value={currency}
                                            >
                                                {currency}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editErrors.salary_currency}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={editStatus}
                                    onValueChange={setEditStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EMPLOYEE_STATUSES.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {status
                                                    .split('_')
                                                    .map(
                                                        (part) =>
                                                            part
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            part.slice(1),
                                                    )
                                                    .join(' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.status} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`edit-address-${data.id}`}>
                                    Address
                                </Label>
                                <Input
                                    id={`edit-address-${data.id}`}
                                    value={editAddress}
                                    onChange={(event) =>
                                        setEditAddress(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.address} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`edit-description-${data.id}`}>
                                    Description
                                </Label>
                                <Textarea
                                    id={`edit-description-${data.id}`}
                                    value={editDescription}
                                    onChange={(event) =>
                                        setEditDescription(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.description} />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Profile picture</Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Replace employee profile picture.
                                        </p>
                                        <Label
                                            htmlFor={`edit-profile-picture-${data.id}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            Select Picture
                                        </Label>
                                    </div>
                                    <Input
                                        id={`edit-profile-picture-${data.id}`}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) =>
                                            setEditProfilePicture(
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    <div className="mt-3 flex items-center gap-3">
                                        {currentProfilePictureUrl ? (
                                            <img
                                                src={currentProfilePictureUrl}
                                                alt="Current profile"
                                                className="h-16 w-16 rounded-md border object-cover"
                                            />
                                        ) : null}
                                        {editProfilePicturePreview ? (
                                            <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                                <img
                                                    src={
                                                        editProfilePicturePreview
                                                    }
                                                    alt="New profile preview"
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 rounded bg-black/65 p-1 text-white"
                                                    onClick={() =>
                                                        setEditProfilePicture(
                                                            null,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <InputError
                                    message={editErrors.profile_picture}
                                />
                            </div>

                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    Attachments (up to {MAX_ATTACHMENTS} total)
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Add new attachment files.
                                        </p>
                                        <Label
                                            htmlFor={`edit-attachments-${data.id}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            Select Files
                                        </Label>
                                    </div>
                                    <Input
                                        id={`edit-attachments-${data.id}`}
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                        className="hidden"
                                        onChange={(event) =>
                                            handleEditAttachmentChange(
                                                event.target.files,
                                            )
                                        }
                                    />

                                    {existingAttachments.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Current attachments
                                            </p>
                                            {existingAttachments.map(
                                                (path, index) => (
                                                    <a
                                                        key={`${path}-${index}`}
                                                        href={publicStorageUrl(
                                                            path,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {fileNameFromPath(
                                                                path,
                                                            )}
                                                        </span>
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    ) : null}

                                    {editAttachments.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                New attachments to add
                                            </p>
                                            {editAttachments.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {item.file.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground hover:bg-muted"
                                                        onClick={() =>
                                                            removeEditAttachment(
                                                                item.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                <InputError message={attachmentError} />
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={
                                !editFirstName.trim() ||
                                !editLastName.trim() ||
                                !editBranchId ||
                                !editContractStartDate ||
                                !editContractEndDate ||
                                (editIsContractBased &&
                                    (!editContractStartDate ||
                                        !editContractEndDate ||
                                        !editContractAmount.trim())) ||
                                (!editIsContractBased && !editSalary.trim()) ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? 'Mark employee inactive'
                                : 'Mark employee active'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? 'This will mark employee as inactive in the system.'
                                : 'This will mark employee as active in the system.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleToggleStatus}
                            disabled={isSubmitting}
                        >
                            {data.is_active ? (
                                <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Mark Inactive
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark Active
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {canDeleteEmployee ? (
                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete employee</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently remove the employee record.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete employee
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : null}
        </>
    );
};
