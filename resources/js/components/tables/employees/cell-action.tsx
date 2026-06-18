import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
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
import { useAuthorization } from '@/lib/permissions';
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
    Property,
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Employee;
    properties: Property[];
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
    properties,
    employmentTypes,
    employeePositions,
    shifts,
    canDelete,
}) => {
    const { t, locale, isRtl } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const { can } = useAuthorization();
    const canViewEmployee = can('employees.view');
    const canManageEmployee = can('employees.update');
    const canDeleteEmployee =
        canDelete && auth.is_super_admin === true && canManageEmployee;
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isFinanceOpen, setIsFinanceOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [editFirstName, setEditFirstName] = useState(data.first_name ?? '');
    const [editLastName, setEditLastName] = useState(data.last_name ?? '');
    const [editPhone, setEditPhone] = useState(data.phone ?? '');
    const [editPropertyId, setEditPropertyId] = useState(
        data.property_id ? String(data.property_id) : '',
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
    const propertySelectOptions = useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(
        propertySelectOptions,
        editPropertyId,
        setEditPropertyId,
    );

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
    const [removedAttachmentPaths, setRemovedAttachmentPaths] = useState<
        string[]
    >([]);
    const visibleExistingAttachments = useMemo(
        () =>
            existingAttachments.filter(
                (path) => !removedAttachmentPaths.includes(path),
            ),
        [existingAttachments, removedAttachmentPaths],
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

    const formatLocalizedDate = useCallback((value?: string | null) => {
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
    }, [locale]);

    const financeEntries = useMemo(() => {
        const advanceEntries = (data.advances ?? []).map((advance) => ({
            id: `advance-${advance.id}`,
            date: advance.advance_date,
            type: t('employees.finance.takeoutType', 'Takeout'),
            amount: Number(advance.amount ?? 0),
            currency: data.salary_currency ?? 'AFN',
            status: advance.status ?? 'draft',
            note:
                advance.reason ||
                t(
                    'employees.finance.defaultAdvanceReason',
                    'Employee advance / takeout',
                ),
        }));

        const payrollEntries = (data.payroll_items ?? []).map((item) => {
            const advanceTotal = (item.advance_breakdown ?? [])
                .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);

            const breakdownNotes = [
                advanceTotal > 0
                    ? t(
                          'employees.finance.advanceDeductionNote',
                          'Advances: :amount',
                      ).replace(
                          ':amount',
                          `${formatNumber(advanceTotal)} ${data.salary_currency ?? 'AFN'}`,
                      )
                    : null,
            ]
                .filter(Boolean)
                .join(' • ');

            return {
                id: `payroll-${item.id}`,
                date:
                    item.payment_date ??
                    item.payroll_run?.period_end ??
                    item.payroll_run?.period_start,
                type:
                    item.salary_type === 'contract' ||
                    item.salary_type === 'contract_payment'
                        ? t(
                              'employees.finance.contractType',
                              'Contract Payment',
                          )
                        : t('employees.finance.salaryType', 'Salary'),
                amount: Number(item.net_salary ?? 0),
                currency: data.salary_currency ?? 'AFN',
                status:
                    item.payment_status ?? item.payroll_run?.status ?? 'draft',
                note: [
                    item.payroll_run?.period_end
                        ? t(
                              'employees.finance.payrollPeriodNote',
                              'Payroll period ending :date',
                          ).replace(
                              ':date',
                              formatLocalizedDate(item.payroll_run.period_end),
                          )
                        : t(
                              'employees.finance.generatedFromPayroll',
                              'Generated from payroll',
                          ),
                    breakdownNotes || null,
                ]
                    .filter(Boolean)
                    .join(' • '),
            };
        });

        return [...advanceEntries, ...payrollEntries].sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return bTime - aTime;
        });
    }, [data.advances, data.payroll_items, data.salary_currency, formatLocalizedDate, t]);

    const upcomingPayment = useMemo(() => {
        const fallbackDate = (() => {
            const next = new Date();
            next.setMonth(next.getMonth() + 1, 0);
            return next.toISOString().slice(0, 10);
        })();

        return {
            amount: Number(data.upcoming_payment?.amount ?? 0),
            currency: data.upcoming_payment?.currency ?? data.salary_currency ?? 'AFN',
            status: data.upcoming_payment?.status ?? 'scheduled',
            dueDate: data.upcoming_payment?.due_date ?? fallbackDate,
            title:
                data.upcoming_payment?.title ??
                t('employees.finance.upcomingPayment', 'Upcoming Payment'),
        };
    }, [data.salary_currency, data.upcoming_payment, t]);

    const resetEdit = () => {
        setEditFirstName(data.first_name ?? '');
        setEditLastName(data.last_name ?? '');
        setEditPhone(data.phone ?? '');
        setEditPropertyId(data.property_id ? String(data.property_id) : '');
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
        setRemovedAttachmentPaths([]);
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
                visibleExistingAttachments.length +
                current.length +
                selected.length;

            if (totalCount > MAX_ATTACHMENTS) {
                toast.error(
                    t(
                        'employees.edit.attachmentsLimit',
                        'Total attachments cannot exceed :count.',
                    ).replace(':count', String(MAX_ATTACHMENTS)),
                );

                const allowedNew = Math.max(
                    0,
                    MAX_ATTACHMENTS -
                        visibleExistingAttachments.length -
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

    const removeExistingAttachment = (path: string) => {
        setRemovedAttachmentPaths((current) =>
            current.includes(path)
                ? current
                : [...current, path],
        );
    };

    const handleEditSubmit = () => {
        if (
            !editFirstName.trim() ||
            !editLastName.trim() ||
            !editPropertyId ||
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
                property_id: Number(editPropertyId),
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
                remove_attachment_paths: removedAttachmentPaths,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'employees.toasts.employeeUpdated',
                            'Employee updated successfully.',
                        ),
                    );
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
                        ? t(
                              'employees.toasts.employeeMarkedInactive',
                              'Employee marked inactive.',
                          )
                        : t(
                              'employees.toasts.employeeMarkedActive',
                              'Employee marked active.',
                          ),
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
                toast.success(
                    t(
                        'employees.toasts.employeeDeleted',
                        'Employee deleted successfully.',
                    ),
                );
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            {canViewEmployee || canManageEmployee || canDeleteEmployee ? (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">
                                {t('employees.actions.openMenu', 'Open menu')}
                            </span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className={isRtl ? 'text-right' : ''}
                    >
                        <DropdownMenuLabel className={isRtl ? 'text-right' : ''}>
                            {t('employees.table.actions', 'Actions')}
                        </DropdownMenuLabel>
                        {canViewEmployee ? (
                            <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('employees.actions.viewDetails', 'View Details')}
                            </DropdownMenuItem>
                        ) : null}
                        {canViewEmployee ? (
                            <DropdownMenuItem onClick={() => setIsFinanceOpen(true)}>
                                <Wallet className="mr-2 h-4 w-4" />
                                {t(
                                    'employees.actions.employeeFinances',
                                    'Employee Finances',
                                )}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageEmployee ? (
                            <DropdownMenuItem
                                onClick={() => {
                                    resetEdit();
                                    setIsEditOpen(true);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('employees.actions.edit', 'Edit')}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageEmployee ? (
                            <DropdownMenuItem onClick={() => setIsStatusOpen(true)}>
                                <Ban className="mr-2 h-4 w-4" />
                                {data.is_active
                                    ? t(
                                          'employees.actions.markInactive',
                                          'Mark Inactive',
                                      )
                                    : t('employees.actions.markActive', 'Mark Active')}
                            </DropdownMenuItem>
                        ) : null}
                        {canDeleteEmployee ? (
                            <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                                <Trash className="mr-2 h-4 w-4 text-red-600" />
                                {t('employees.common.delete', 'Delete')}
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('employees.details.title', 'Employee Details')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.details.description',
                                'Profile overview and attachments.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 px-1">
                            <div className="rounded-xl border bg-gradient-to-r from-neutral-50 to-white p-5 dark:from-neutral-900 dark:to-neutral-950">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                    {currentProfilePictureUrl ? (
                                        <img
                                            src={currentProfilePictureUrl}
                                            alt={
                                                data.full_name ??
                                                t('employees.page.title', 'Employee')
                                            }
                                            className="h-24 w-24 rounded-xl border object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-muted text-xl font-semibold text-muted-foreground">
                                            {`${data.first_name?.charAt(0) ?? ''}${data.last_name?.charAt(0) ?? ''}`.toUpperCase() ||
                                                t('employees.common.na', 'NA')}
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold">
                                            {data.full_name ??
                                                `${data.first_name} ${data.last_name}`}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {data.employee_position ??
                                                t(
                                                    'employees.details.noPositionAssigned',
                                                    'No position assigned',
                                                )}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                    data.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {getStatusLabel(
                                                    data.status ??
                                                        (data.is_active
                                                            ? 'active'
                                                            : 'inactive'),
                                                )}
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                {data.employment_type ??
                                                    t(
                                                        'employees.details.noEmploymentType',
                                                        'No employment type',
                                                    )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border p-4">
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        {t('employees.details.contact', 'Contact')}
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-medium">
                                                {t('employees.form.phone', 'Phone')}:
                                            </span>{' '}
                                            {data.phone ||
                                                t('employees.common.empty', '—')}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                {t('employees.form.address', 'Address')}:
                                            </span>{' '}
                                            {data.address ||
                                                t('employees.common.empty', '—')}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                        {t('employees.details.employment', 'Employment')}
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="font-medium">
                                                {t('employees.filters.property', 'Property')}:
                                            </span>{' '}
                                            {data.property ||
                                                t('employees.common.empty', '—')}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                {t('employees.table.salary', 'Salary')}:
                                            </span>{' '}
                                            {data.contract_amount
                                                ? `${formatNumber(Number(data.contract_amount))} ${data.salary_currency ?? 'AFN'} (${t('employees.common.contract', 'Contract')})`
                                                : data.salary
                                                  ? `${formatNumber(Number(data.salary))} ${data.salary_currency ?? 'AFN'}`
                                                  : t('employees.common.empty', '—')}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                {data.contract_amount
                                                    ? t(
                                                          'employees.details.contractDuration',
                                                          'Contract Duration:',
                                                      )
                                                    : t(
                                                          'employees.details.workDuration',
                                                          'Work Duration:',
                                                      )}
                                            </span>{' '}
                                            {data.contract_start_date &&
                                            data.contract_end_date
                                                ? `${formatLocalizedDate(data.contract_start_date)} - ${formatLocalizedDate(data.contract_end_date)}`
                                                : t('employees.common.empty', '—')}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                {t('employees.filters.shift', 'Shift')}:
                                            </span>{' '}
                                            {data.shift ||
                                                t('employees.common.empty', '—')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {t('employees.common.description', 'Description')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {data.description ||
                                        t(
                                            'employees.details.noDescription',
                                            'No description provided.',
                                        )}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {t('employees.form.attachments', 'Attachments')}
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
                                        {t(
                                            'employees.details.noAttachments',
                                            'No attachments uploaded.',
                                        )}
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
                        <DialogTitle>
                            {t(
                                'employees.finance.title',
                                'Employee Finances',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.finance.description',
                                'Static preview of salary and takeout records.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="space-y-6 px-1">
                            <div className="rounded-xl border bg-gradient-to-r from-emerald-50 to-white p-5 dark:from-emerald-950/30 dark:to-neutral-950">
                                <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                    {t(
                                        'employees.finance.upcomingPayment',
                                        'Upcoming Payment',
                                    )}
                                </p>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-2xl font-semibold">
                                            {`${formatNumber(upcomingPayment.amount)} ${upcomingPayment.currency}`}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {upcomingPayment.title}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="rounded-full border bg-white/70 px-3 py-1 text-center text-xs font-medium dark:bg-neutral-900/60">
                                            {t(
                                                `employees.finance.paymentStatus.${upcomingPayment.status}`,
                                                upcomingPayment.status,
                                            )}
                                        </div>
                                        <div className="rounded-md border bg-white/70 px-3 py-2 text-sm dark:bg-neutral-900/60">
                                        {t('employees.finance.dueDate', 'Due date')}:{' '}
                                        {formatLocalizedDate(upcomingPayment.dueDate)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-sm font-semibold">
                                        {t(
                                            'employees.finance.historyTitle',
                                            'Payment History',
                                        )}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                        {t(
                                            'employees.finance.salaryAndTakeouts',
                                            'Salary + Takeouts',
                                        )}
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>
                                                    {t(
                                                        'employees.finance.table.date',
                                                        'Date',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t('employees.finance.table.type', 'Type')}
                                                </TableHead>
                                                <TableHead>
                                                    {t('employees.finance.table.amount', 'Amount')}
                                                </TableHead>
                                                <TableHead>
                                                    {t('employees.finance.table.note', 'Note')}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {financeEntries.length > 0 ? (
                                                financeEntries.map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>
                                                            {formatLocalizedDate(
                                                                payment.date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    payment.type ===
                                                                    t(
                                                                        'employees.finance.salaryType',
                                                                        'Salary',
                                                                    )
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : payment.type ===
                                                                            t(
                                                                                'employees.finance.contractType',
                                                                                'Contract Payment',
                                                                            )
                                                                          ? 'bg-violet-100 text-violet-700'
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
                                                            <div className="space-y-1">
                                                                <p>{payment.note}</p>
                                                                <p className="text-xs">
                                                                    {t(
                                                                        `employees.finance.paymentStatus.${payment.status}`,
                                                                        payment.status,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="text-center text-muted-foreground"
                                                    >
                                                        {t(
                                                            'employees.finance.empty',
                                                            'No finance records found for this employee.',
                                                        )}
                                                    </TableCell>
                                                </TableRow>
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
                        <DialogTitle>
                            {t('employees.edit.title', 'Edit Employee')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.edit.description',
                                'Update employee profile, employment type, position, salary details, and files.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="grid gap-4 px-1 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-first-name-${data.id}`}>
                                    {t('employees.form.firstName', 'First name')}
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
                                    {t('employees.form.lastName', 'Last name')}
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
                                    {t('employees.form.phone', 'Phone')}
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
                                <Label>{t('employees.filters.property', 'Property')}</Label>
                                <Select
                                    value={editPropertyId}
                                    onValueChange={setEditPropertyId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'employees.form.selectProperty',
                                                'Select property',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map((property) => (
                                            <SelectItem
                                                key={property.id}
                                                value={String(property.id)}
                                            >
                                                {property.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.property_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'employees.filters.employmentType',
                                        'Employment type',
                                    )}
                                </Label>
                                <Select
                                    value={editEmploymentTypeId}
                                    onValueChange={setEditEmploymentTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'employees.form.selectEmploymentType',
                                                'Select employment type',
                                            )}
                                        />
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
                                <Label>
                                    {t('employees.form.employeePosition', 'Employee position')}
                                </Label>
                                <Select
                                    value={editEmployeePositionId}
                                    onValueChange={setEditEmployeePositionId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'employees.form.selectPosition',
                                                'Select position',
                                            )}
                                        />
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
                                <Label>{t('employees.filters.shift', 'Shift')}</Label>
                                <Select
                                    value={editShiftId}
                                    onValueChange={setEditShiftId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'employees.form.selectShift',
                                                'Select shift',
                                            )}
                                        />
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
                                <Label
                                    htmlFor={`edit-contract-start-${data.id}`}
                                >
                                    {editIsContractBased
                                        ? t(
                                              'employees.form.contractStartDate',
                                              'Contract start date',
                                          )
                                        : t(
                                              'employees.form.workStartDate',
                                              'Work start date',
                                          )}
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
                                        ? t(
                                              'employees.form.contractEndDate',
                                              'Contract end date',
                                          )
                                        : t(
                                              'employees.form.workEndDate',
                                              'Work end date',
                                          )}
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
                                <Label htmlFor={`edit-salary-${data.id}`}>
                                    {editIsContractBased
                                        ? t(
                                              'employees.form.contractAmount',
                                              'Contract Amount',
                                          )
                                        : t('employees.table.salary', 'Salary')}
                                </Label>
                                <NumericInput
                                    id={`edit-salary-${data.id}`}
                                    min="0"
                                    showControls={false}
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
                                <Label>
                                    {t(
                                        'employees.form.paymentCurrency',
                                        'Payment currency',
                                    )}
                                </Label>
                                <Select
                                    value={editSalaryCurrency}
                                    onValueChange={(value) =>
                                        setEditSalaryCurrency(
                                            value as typeof editSalaryCurrency,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'employees.form.selectCurrency',
                                                'Select currency',
                                            )}
                                        />
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
                                <Label>{t('employees.table.status', 'Status')}</Label>
                                <Select
                                    value={editStatus}
                                    onValueChange={setEditStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'employees.form.selectStatus',
                                                'Select status',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EMPLOYEE_STATUSES.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {getStatusLabel(status)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.status} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`edit-address-${data.id}`}>
                                    {t('employees.form.address', 'Address')}
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
                                    {t('employees.common.description', 'Description')}
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
                                <Label>
                                    {t('employees.form.profilePicture', 'Profile picture')}
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'employees.edit.profilePictureHelp',
                                                'Replace employee profile picture.',
                                            )}
                                        </p>
                                        <Label
                                            htmlFor={`edit-profile-picture-${data.id}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            {t(
                                                'employees.form.selectPicture',
                                                'Select Picture',
                                            )}
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
                                                alt={t(
                                                    'employees.edit.currentProfile',
                                                    'Current profile',
                                                )}
                                                className="h-16 w-16 rounded-md border object-cover"
                                            />
                                        ) : null}
                                        {editProfilePicturePreview ? (
                                            <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                                <img
                                                    src={
                                                        editProfilePicturePreview
                                                    }
                                                    alt={t(
                                                        'employees.edit.newProfilePreview',
                                                        'New profile preview',
                                                    )}
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
                                    {t(
                                        'employees.edit.attachmentsLabel',
                                        'Attachments (up to :count total)',
                                    ).replace(':count', String(MAX_ATTACHMENTS))}
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'employees.edit.attachmentsHelp',
                                                'Add new attachment files.',
                                            )}
                                        </p>
                                        <Label
                                            htmlFor={`edit-attachments-${data.id}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            {t(
                                                'employees.form.selectFiles',
                                                'Select Files',
                                            )}
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

                                    {visibleExistingAttachments.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {t(
                                                    'employees.edit.currentAttachments',
                                                    'Current attachments',
                                                )}
                                            </p>
                                            {visibleExistingAttachments.map(
                                                (path, index) => (
                                                    <div
                                                        key={`${path}-${index}`}
                                                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                                                    >
                                                        <a
                                                            href={publicStorageUrl(
                                                                path,
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex min-w-0 items-center gap-2 hover:text-primary"
                                                        >
                                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <span className="truncate">
                                                                {fileNameFromPath(
                                                                    path,
                                                                )}
                                                            </span>
                                                        </a>
                                                        <button
                                                            type="button"
                                                            className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                                                            onClick={() =>
                                                                removeExistingAttachment(
                                                                    path,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : null}

                                    {editAttachments.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {t(
                                                    'employees.edit.newAttachments',
                                                    'New attachments to add',
                                                )}
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
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={
                                !editFirstName.trim() ||
                                !editLastName.trim() ||
                                !editPropertyId ||
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
                            {t('employees.edit.saveChanges', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? t(
                                      'employees.statusDialog.markInactiveTitle',
                                      'Mark employee inactive',
                                  )
                                : t(
                                      'employees.statusDialog.markActiveTitle',
                                      'Mark employee active',
                                  )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? t(
                                      'employees.statusDialog.markInactiveDescription',
                                      'This will mark employee as inactive in the system.',
                                  )
                                : t(
                                      'employees.statusDialog.markActiveDescription',
                                      'This will mark employee as active in the system.',
                                  )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4" />
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleToggleStatus}
                            disabled={isSubmitting}
                        >
                            {data.is_active ? (
                                <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t(
                                        'employees.actions.markInactive',
                                        'Mark Inactive',
                                    )}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t('employees.actions.markActive', 'Mark Active')}
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
                            <AlertDialogTitle>
                                {t('employees.delete.title', 'Delete employee')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t(
                                    'employees.delete.description',
                                    'This will permanently remove the employee record.',
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>
                                <X className="mr-2 h-4 w-4" />
                                {t('common.cancel', 'Cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t(
                                    'employees.delete.confirmButton',
                                    'Delete employee',
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : null}
        </>
    );
};
