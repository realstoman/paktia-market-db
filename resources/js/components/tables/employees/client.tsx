import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import {
    Employee,
    EmployeePosition,
    EmploymentType,
    Property,
    SharedData,
    Shift,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { router, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Clock3,
    FileText,
    ImagePlus,
    Pencil,
    Plus,
    Shapes,
    Trash2,
    UserRound,
    UsersRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface EmployeeClientProps {
    data: Employee[];
    properties: Property[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    shifts: Shift[];
    isLoading?: boolean;
}

interface SelectedAttachment {
    id: string;
    file: File;
}

const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended', 'terminated'];
const CURRENCIES = ['AFN', 'USD'];
const MAX_ATTACHMENTS = 25;
const FILTER_ALL = '__all__';

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

export const EmployeeClient: React.FC<EmployeeClientProps> = ({
    data,
    properties,
    employmentTypes,
    employeePositions,
    shifts,
    isLoading = false,
}) => {
    const { t, locale, isRtl } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const { can } = useAuthorization();
    const canCreateEmployee = can('employees.create');
    const canManageEmployeeMeta = can('employees.update');
    const canDelete = auth.is_super_admin === true && can('employees.update');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [employmentTypeId, setEmploymentTypeId] = useState('');
    const [employeePositionId, setEmployeePositionId] = useState('');
    const [shiftId, setShiftId] = useState('');
    const [salary, setSalary] = useState('');
    const [contractStartDate, setContractStartDate] = useState('');
    const [contractEndDate, setContractEndDate] = useState('');
    const [contractAmount, setContractAmount] = useState('');
    const [salaryCurrency, setSalaryCurrency] = useState('AFN');
    const [status, setStatus] = useState('active');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<SelectedAttachment[]>([]);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPositionsOpen, setIsPositionsOpen] = useState(false);
    const [positionName, setPositionName] = useState('');
    const [positionDescription, setPositionDescription] = useState('');
    const [editingPositionId, setEditingPositionId] = useState<number | null>(
        null,
    );
    const [positionErrors, setPositionErrors] = useState<
        Record<string, string>
    >({});
    const [isPositionSubmitting, setIsPositionSubmitting] = useState(false);
    const [isEmploymentTypesOpen, setIsEmploymentTypesOpen] = useState(false);
    const [employmentTypeName, setEmploymentTypeName] = useState('');
    const [employmentTypeDescription, setEmploymentTypeDescription] =
        useState('');
    const [editingEmploymentTypeId, setEditingEmploymentTypeId] = useState<
        number | null
    >(null);
    const [employmentTypeErrors, setEmploymentTypeErrors] = useState<
        Record<string, string>
    >({});
    const [isEmploymentTypeSubmitting, setIsEmploymentTypeSubmitting] =
        useState(false);
    const [isShiftsOpen, setIsShiftsOpen] = useState(false);
    const [shiftName, setShiftName] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('08:00');
    const [shiftEndTime, setShiftEndTime] = useState('16:00');
    const [shiftDescription, setShiftDescription] = useState('');
    const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
    const [shiftErrors, setShiftErrors] = useState<Record<string, string>>({});
    const [isShiftSubmitting, setIsShiftSubmitting] = useState(false);
    const [deletePositionTarget, setDeletePositionTarget] =
        useState<EmployeePosition | null>(null);
    const [deleteEmploymentTypeTarget, setDeleteEmploymentTypeTarget] =
        useState<EmploymentType | null>(null);
    const [deleteShiftTarget, setDeleteShiftTarget] = useState<Shift | null>(
        null,
    );
    const [selectedPropertyFilter, setSelectedPropertyFilter] =
        useState(FILTER_ALL);
    const [selectedEmploymentTypeFilter, setSelectedEmploymentTypeFilter] =
        useState(FILTER_ALL);
    const [selectedPositionFilter, setSelectedPositionFilter] =
        useState(FILTER_ALL);
    const [selectedShiftFilter, setSelectedShiftFilter] = useState(FILTER_ALL);
    const propertySelectOptions = useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(propertySelectOptions, propertyId, setPropertyId);

    const profilePicturePreview = useMemo(
        () => (profilePicture ? URL.createObjectURL(profilePicture) : null),
        [profilePicture],
    );

    useEffect(() => {
        return () => {
            if (profilePicturePreview) {
                URL.revokeObjectURL(profilePicturePreview);
            }
        };
    }, [profilePicturePreview]);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhone('');
        setPropertyId('');
        setEmploymentTypeId('');
        setEmployeePositionId('');
        setShiftId('');
        setSalary('');
        setContractStartDate('');
        setContractEndDate('');
        setContractAmount('');
        setSalaryCurrency('AFN');
        setStatus('active');
        setAddress('');
        setDescription('');
        setProfilePicture(null);
        setAttachments([]);
        setCreateErrors({});
    };

    const handleAttachmentChange = (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        const selected = Array.from(files).map((file) => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
        }));

        setAttachments((current) => {
            const merged = [...current, ...selected];

            if (merged.length > MAX_ATTACHMENTS) {
                toast.error(
                    t(
                        'employees.create.attachmentsLimit',
                        'You can upload up to :count attachments.',
                    ).replace(':count', String(MAX_ATTACHMENTS)),
                );
                return merged.slice(0, MAX_ATTACHMENTS);
            }

            return merged;
        });
    };

    const selectedEmploymentTypeName = useMemo(() => {
        if (!employmentTypeId) {
            return '';
        }

        return (
            employmentTypes.find((type) => String(type.id) === employmentTypeId)
                ?.name ?? ''
        );
    }, [employmentTypeId, employmentTypes]);

    const isContractBased = useMemo(
        () => selectedEmploymentTypeName.toLowerCase().includes('contract'),
        [selectedEmploymentTypeName],
    );

    const getStatusLabel = (value: string) =>
        t(
            `employees.statuses.${value}`,
            value
                .split('_')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' '),
        );

    const removeAttachment = (id: string) => {
        setAttachments((current) => current.filter((item) => item.id !== id));
    };

    const handleCreateSubmit = () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !propertyId ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/employees',
            {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim() || null,
                property_id: Number(propertyId),
                employment_type_id: employmentTypeId
                    ? Number(employmentTypeId)
                    : null,
                employee_position_id: employeePositionId
                    ? Number(employeePositionId)
                    : null,
                shift_id: shiftId ? Number(shiftId) : null,
                is_contract_based: isContractBased,
                salary:
                    !isContractBased && salary.trim() ? Number(salary) : null,
                salary_currency: salaryCurrency,
                contract_start_date: contractStartDate || null,
                contract_end_date: contractEndDate || null,
                contract_amount:
                    isContractBased && contractAmount.trim()
                        ? Number(contractAmount)
                        : null,
                status,
                is_active: status === 'active',
                address: address.trim() || null,
                description: description.trim() || null,
                profile_picture: profilePicture,
                attachments: attachments.map((item) => item.file),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'employees.toasts.employeeCreated',
                            'Employee created successfully.',
                        ),
                    );
                    setIsCreateOpen(false);
                    resetForm();
                },
                onError: (errors) => {
                    setCreateErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const resetPositionForm = () => {
        setPositionName('');
        setPositionDescription('');
        setEditingPositionId(null);
        setPositionErrors({});
    };

    const handleSavePosition = () => {
        if (!positionName.trim() || isPositionSubmitting) {
            return;
        }

        setIsPositionSubmitting(true);

        const payload = {
            name: positionName.trim(),
            description: positionDescription.trim() || null,
            is_active: true,
        };

        if (editingPositionId) {
            router.put(`/employee-positions/${editingPositionId}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'employees.toasts.positionUpdated',
                            'Employee position updated.',
                        ),
                    );
                    resetPositionForm();
                },
                onError: (errors) => {
                    setPositionErrors(errors);
                },
                onFinish: () => {
                    setIsPositionSubmitting(false);
                },
            });
            return;
        }

        router.post('/employee-positions', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'employees.toasts.positionCreated',
                        'Employee position created.',
                    ),
                );
                resetPositionForm();
            },
            onError: (errors) => {
                setPositionErrors(errors);
            },
            onFinish: () => {
                setIsPositionSubmitting(false);
            },
        });
    };

    const startEditingPosition = (position: EmployeePosition) => {
        setEditingPositionId(position.id);
        setPositionName(position.name);
        setPositionDescription(position.description ?? '');
        setPositionErrors({});
    };

    const handleDeletePosition = (position: EmployeePosition) => {
        if (isPositionSubmitting) {
            return;
        }

        setDeletePositionTarget(position);
    };

    const confirmDeletePosition = () => {
        if (!deletePositionTarget || isPositionSubmitting) {
            return;
        }

        setIsPositionSubmitting(true);

        router.delete(`/employee-positions/${deletePositionTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'employees.toasts.positionDeleted',
                        'Employee position deleted.',
                    ),
                );
                if (editingPositionId === deletePositionTarget.id) {
                    resetPositionForm();
                }
                setDeletePositionTarget(null);
            },
            onFinish: () => {
                setIsPositionSubmitting(false);
            },
        });
    };

    const resetEmploymentTypeForm = () => {
        setEmploymentTypeName('');
        setEmploymentTypeDescription('');
        setEditingEmploymentTypeId(null);
        setEmploymentTypeErrors({});
    };

    const handleSaveEmploymentType = () => {
        if (!employmentTypeName.trim() || isEmploymentTypeSubmitting) {
            return;
        }

        setIsEmploymentTypeSubmitting(true);

        const payload = {
            name: employmentTypeName.trim(),
            description: employmentTypeDescription.trim() || null,
            is_active: true,
        };

        if (editingEmploymentTypeId) {
            router.put(
                `/employment-types/${editingEmploymentTypeId}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(
                            t(
                                'employees.toasts.employmentTypeUpdated',
                                'Employment type updated.',
                            ),
                        );
                        resetEmploymentTypeForm();
                    },
                    onError: (errors) => {
                        setEmploymentTypeErrors(errors);
                    },
                    onFinish: () => {
                        setIsEmploymentTypeSubmitting(false);
                    },
                },
            );
            return;
        }

        router.post('/employment-types', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'employees.toasts.employmentTypeCreated',
                        'Employment type created.',
                    ),
                );
                resetEmploymentTypeForm();
            },
            onError: (errors) => {
                setEmploymentTypeErrors(errors);
            },
            onFinish: () => {
                setIsEmploymentTypeSubmitting(false);
            },
        });
    };

    const startEditingEmploymentType = (type: EmploymentType) => {
        setEditingEmploymentTypeId(type.id);
        setEmploymentTypeName(type.name);
        setEmploymentTypeDescription(type.description ?? '');
        setEmploymentTypeErrors({});
    };

    const handleDeleteEmploymentType = (type: EmploymentType) => {
        if (isEmploymentTypeSubmitting) {
            return;
        }

        setDeleteEmploymentTypeTarget(type);
    };

    const confirmDeleteEmploymentType = () => {
        if (!deleteEmploymentTypeTarget || isEmploymentTypeSubmitting) {
            return;
        }

        setIsEmploymentTypeSubmitting(true);

        router.delete(`/employment-types/${deleteEmploymentTypeTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'employees.toasts.employmentTypeDeleted',
                        'Employment type deleted.',
                    ),
                );
                if (editingEmploymentTypeId === deleteEmploymentTypeTarget.id) {
                    resetEmploymentTypeForm();
                }
                setDeleteEmploymentTypeTarget(null);
            },
            onFinish: () => {
                setIsEmploymentTypeSubmitting(false);
            },
        });
    };

    const resetShiftForm = () => {
        setShiftName('');
        setShiftStartTime('08:00');
        setShiftEndTime('16:00');
        setShiftDescription('');
        setEditingShiftId(null);
        setShiftErrors({});
    };

    const handleSaveShift = () => {
        if (!shiftName.trim() || isShiftSubmitting) {
            return;
        }

        setIsShiftSubmitting(true);

        const payload = {
            name: shiftName.trim(),
            start_time: shiftStartTime,
            end_time: shiftEndTime,
            description: shiftDescription.trim() || null,
            is_active: true,
        };

        if (editingShiftId) {
            router.put(`/shifts/${editingShiftId}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t('employees.toasts.shiftUpdated', 'Shift updated.'),
                    );
                    resetShiftForm();
                },
                onError: (errors) => {
                    setShiftErrors(errors);
                },
                onFinish: () => {
                    setIsShiftSubmitting(false);
                },
            });
            return;
        }

        router.post('/shifts', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t('employees.toasts.shiftCreated', 'Shift created.'),
                );
                resetShiftForm();
            },
            onError: (errors) => {
                setShiftErrors(errors);
            },
            onFinish: () => {
                setIsShiftSubmitting(false);
            },
        });
    };

    const startEditingShift = (shift: Shift) => {
        setEditingShiftId(shift.id);
        setShiftName(shift.name);
        setShiftStartTime(String(shift.start_time).slice(0, 5));
        setShiftEndTime(String(shift.end_time).slice(0, 5));
        setShiftDescription(shift.description ?? '');
        setShiftErrors({});
    };

    const handleDeleteShift = (shift: Shift) => {
        if (isShiftSubmitting) {
            return;
        }

        setDeleteShiftTarget(shift);
    };

    const confirmDeleteShift = () => {
        if (!deleteShiftTarget || isShiftSubmitting) {
            return;
        }

        setIsShiftSubmitting(true);

        router.delete(`/shifts/${deleteShiftTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t('employees.toasts.shiftDeleted', 'Shift deleted.'),
                );
                if (editingShiftId === deleteShiftTarget.id) {
                    resetShiftForm();
                }
                setDeleteShiftTarget(null);
            },
            onFinish: () => {
                setIsShiftSubmitting(false);
            },
        });
    };

    const tableColumns = useMemo(
        () =>
            buildColumns(
                properties,
                employmentTypes,
                employeePositions,
                shifts,
                canDelete,
                t,
                locale,
            ),
        [
            properties,
            canDelete,
            employmentTypes,
            employeePositions,
            locale,
            shifts,
            t,
        ],
    );

    const attachmentError =
        createErrors.attachments ??
        Object.entries(createErrors).find(([key]) =>
            key.startsWith('attachments.'),
        )?.[1];
    const filteredData = useMemo(() => {
        return data.filter((employee) => {
            const propertyMatch =
                selectedPropertyFilter === FILTER_ALL ||
                String(employee.property_id ?? '') === selectedPropertyFilter;
            const employmentTypeMatch =
                selectedEmploymentTypeFilter === FILTER_ALL ||
                String(employee.employment_type_id ?? '') ===
                    selectedEmploymentTypeFilter;
            const positionMatch =
                selectedPositionFilter === FILTER_ALL ||
                String(employee.employee_position_id ?? '') ===
                    selectedPositionFilter;
            const shiftMatch =
                selectedShiftFilter === FILTER_ALL ||
                String(employee.shift_id ?? '') === selectedShiftFilter;

            return (
                propertyMatch &&
                employmentTypeMatch &&
                positionMatch &&
                shiftMatch
            );
        });
    }, [
        data,
        selectedPropertyFilter,
        selectedEmploymentTypeFilter,
        selectedPositionFilter,
        selectedShiftFilter,
    ]);

    const filterControlClassName =
        'w-full rounded-xl bg-white dark:bg-neutral-900';

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-5">
            <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-[#18233f] p-3 text-white shadow-sm dark:bg-indigo-300 dark:text-indigo-950">
                        <UsersRound className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {t(
                                'employees.page.heading',
                                'Employees: :count',
                            ).replace(':count', formatNumber(data.length))}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-neutral-400">
                            {t(
                                'employees.page.headingDescription',
                                'Manage employee records',
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap justify-start gap-2">
                    {canManageEmployeeMeta ? (
                        <Button
                            variant="outline"
                            onClick={() => setIsEmploymentTypesOpen(true)}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <Shapes className="h-4 w-4" />
                            {t(
                                'employees.employmentTypes.managerButton',
                                'Employment Types',
                            )}
                        </Button>
                    ) : null}
                    {canManageEmployeeMeta ? (
                        <Button
                            variant="outline"
                            onClick={() => setIsShiftsOpen(true)}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <Clock3 className="h-4 w-4" />
                            {t('employees.shifts.managerButton', 'Shifts')}
                        </Button>
                    ) : null}
                    {canManageEmployeeMeta ? (
                        <Button
                            variant="outline"
                            onClick={() => setIsPositionsOpen(true)}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <BriefcaseBusiness className="h-4 w-4" />
                            {t(
                                'employees.positions.managerButton',
                                'Positions',
                            )}
                        </Button>
                    ) : null}
                    {canCreateEmployee ? (
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-10 gap-2 rounded-xl bg-[#18233f] px-4 text-white shadow-sm hover:bg-[#26355b] dark:bg-indigo-300 dark:text-indigo-950 dark:hover:bg-indigo-200"
                        >
                            <Plus className="h-4 w-4" />
                            {t('employees.create.button', 'Add Employee')}
                        </Button>
                    ) : null}
                </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-neutral-700" />
            <DataTable
                searchKey={[
                    'full_name',
                    'phone',
                    'property',
                    'employee_position',
                    'employment_type',
                    'status',
                ]}
                columns={tableColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder={t(
                    'employees.filters.searchPlaceholder',
                    'Search employees by name, phone, or property...',
                )}
                toolbar={
                    <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <SearchableDropdown
                            value={selectedPropertyFilter}
                            onValueChange={setSelectedPropertyFilter}
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'employees.filters.allProperties',
                                        'All Properties',
                                    ),
                                },
                                ...properties.map((property) => ({
                                    value: String(property.id),
                                    label: property.name,
                                })),
                            ]}
                            placeholder={t(
                                'employees.filters.property',
                                'Property',
                            )}
                            searchPlaceholder={t(
                                'employees.filters.searchProperties',
                                'Search properties...',
                            )}
                            emptyText={t(
                                'employees.filters.noProperties',
                                'No properties found.',
                            )}
                            className={filterControlClassName}
                        />

                        <SearchableDropdown
                            value={selectedEmploymentTypeFilter}
                            onValueChange={setSelectedEmploymentTypeFilter}
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'employees.filters.allEmploymentTypes',
                                        'All Employment Types',
                                    ),
                                },
                                ...employmentTypes.map((type) => ({
                                    value: String(type.id),
                                    label: type.name,
                                })),
                            ]}
                            placeholder={t(
                                'employees.filters.employmentType',
                                'Employment Type',
                            )}
                            searchPlaceholder={t(
                                'employees.filters.searchEmploymentTypes',
                                'Search employment types...',
                            )}
                            emptyText={t(
                                'employees.filters.noEmploymentTypes',
                                'No employment types found.',
                            )}
                            className={filterControlClassName}
                        />

                        <SearchableDropdown
                            value={selectedPositionFilter}
                            onValueChange={setSelectedPositionFilter}
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'employees.filters.allPositions',
                                        'All Positions',
                                    ),
                                },
                                ...employeePositions.map((position) => ({
                                    value: String(position.id),
                                    label: position.name,
                                })),
                            ]}
                            placeholder={t(
                                'employees.filters.position',
                                'Position',
                            )}
                            searchPlaceholder={t(
                                'employees.filters.searchPositions',
                                'Search positions...',
                            )}
                            emptyText={t(
                                'employees.filters.noPositions',
                                'No positions found.',
                            )}
                            className={filterControlClassName}
                        />

                        <SearchableDropdown
                            value={selectedShiftFilter}
                            onValueChange={setSelectedShiftFilter}
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'employees.filters.allShifts',
                                        'All Shifts',
                                    ),
                                },
                                ...shifts.map((shift) => ({
                                    value: String(shift.id),
                                    label: shift.name,
                                })),
                            ]}
                            placeholder={t('employees.filters.shift', 'Shift')}
                            searchPlaceholder={t(
                                'employees.filters.searchShifts',
                                'Search shifts...',
                            )}
                            emptyText={t(
                                'employees.filters.noShifts',
                                'No shifts found.',
                            )}
                            className={filterControlClassName}
                        />
                    </div>
                }
            />

            <Dialog
                open={isEmploymentTypesOpen}
                onOpenChange={(open) => {
                    setIsEmploymentTypesOpen(open);
                    if (!open) {
                        resetEmploymentTypeForm();
                    }
                }}
            >
                <DialogContent
                    className={
                        isRtl
                            ? "text-right sm:max-w-3xl [&_[data-slot='select-trigger']]:text-right [&_input]:text-right [&_label]:text-right [&_textarea]:text-right"
                            : 'sm:max-w-3xl'
                    }
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <Shapes className="h-5 w-5" />
                            {t(
                                'employees.employmentTypes.managerTitle',
                                'Employment Type Manager',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.employmentTypes.managerDescription',
                                'Add, edit, and remove employment types.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="employment-type-name">
                                    {t(
                                        'employees.employmentTypes.typeName',
                                        'Type name',
                                    )}
                                </Label>
                                <Input
                                    id="employment-type-name"
                                    value={employmentTypeName}
                                    onChange={(event) =>
                                        setEmploymentTypeName(
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employees.employmentTypes.typeNamePlaceholder',
                                        'e.g. Full Time',
                                    )}
                                />
                                <InputError
                                    message={employmentTypeErrors.name}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="employment-type-description">
                                    {t(
                                        'employees.common.description',
                                        'Description',
                                    )}
                                </Label>
                                <Input
                                    id="employment-type-description"
                                    value={employmentTypeDescription}
                                    onChange={(event) =>
                                        setEmploymentTypeDescription(
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employees.common.optional',
                                        'Optional',
                                    )}
                                />
                                <InputError
                                    message={employmentTypeErrors.description}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Button
                                    onClick={handleSaveEmploymentType}
                                    disabled={
                                        !employmentTypeName.trim() ||
                                        isEmploymentTypeSubmitting
                                    }
                                >
                                    {editingEmploymentTypeId
                                        ? t(
                                              'employees.employmentTypes.updateButton',
                                              'Update Employment Type',
                                          )
                                        : t(
                                              'employees.employmentTypes.addButton',
                                              'Add Employment Type',
                                          )}
                                </Button>
                                {editingEmploymentTypeId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetEmploymentTypeForm}
                                        disabled={isEmploymentTypeSubmitting}
                                    >
                                        {t(
                                            'employees.common.cancelEdit',
                                            'Cancel Edit',
                                        )}
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] rounded-lg border p-3">
                            <div className="space-y-2">
                                {employmentTypes.length > 0 ? (
                                    employmentTypes.map((type) => (
                                        <div
                                            key={type.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {type.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {type.description ||
                                                        t(
                                                            'employees.common.empty',
                                                            '—',
                                                        )}
                                                </p>
                                            </div>
                                            <div className="ms-3 flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        startEditingEmploymentType(
                                                            type,
                                                        )
                                                    }
                                                    disabled={
                                                        isEmploymentTypeSubmitting
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {canDelete ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDeleteEmploymentType(
                                                                type,
                                                            )
                                                        }
                                                        disabled={
                                                            isEmploymentTypeSubmitting
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'employees.employmentTypes.empty',
                                            'No employment types found.',
                                        )}
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isShiftsOpen}
                onOpenChange={(open) => {
                    setIsShiftsOpen(open);
                    if (!open) {
                        resetShiftForm();
                    }
                }}
            >
                <DialogContent
                    className={
                        isRtl
                            ? "text-right sm:max-w-3xl [&_[data-slot='select-trigger']]:text-right [&_input]:text-right [&_label]:text-right [&_textarea]:text-right"
                            : 'sm:max-w-3xl'
                    }
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <Clock3 className="h-5 w-5" />
                            {t(
                                'employees.shifts.managerTitle',
                                'Shift Manager',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.shifts.managerDescription',
                                'Add, edit, and remove employee shifts.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="shift-name">
                                    {t(
                                        'employees.shifts.shiftName',
                                        'Shift name',
                                    )}
                                </Label>
                                <Input
                                    id="shift-name"
                                    value={shiftName}
                                    onChange={(event) =>
                                        setShiftName(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.shifts.shiftNamePlaceholder',
                                        'e.g. Day Shift',
                                    )}
                                />
                                <InputError message={shiftErrors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="shift-start-time">
                                    {t(
                                        'employees.shifts.startTime',
                                        'Start time',
                                    )}
                                </Label>
                                <Input
                                    id="shift-start-time"
                                    type="time"
                                    value={shiftStartTime}
                                    onChange={(event) =>
                                        setShiftStartTime(event.target.value)
                                    }
                                />
                                <InputError message={shiftErrors.start_time} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="shift-end-time">
                                    {t('employees.shifts.endTime', 'End time')}
                                </Label>
                                <Input
                                    id="shift-end-time"
                                    type="time"
                                    value={shiftEndTime}
                                    onChange={(event) =>
                                        setShiftEndTime(event.target.value)
                                    }
                                />
                                <InputError message={shiftErrors.end_time} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="shift-description">
                                    {t(
                                        'employees.common.description',
                                        'Description',
                                    )}
                                </Label>
                                <Input
                                    id="shift-description"
                                    value={shiftDescription}
                                    onChange={(event) =>
                                        setShiftDescription(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.common.optional',
                                        'Optional',
                                    )}
                                />
                                <InputError message={shiftErrors.description} />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Button
                                    onClick={handleSaveShift}
                                    disabled={
                                        !shiftName.trim() || isShiftSubmitting
                                    }
                                >
                                    {editingShiftId
                                        ? t(
                                              'employees.shifts.updateButton',
                                              'Update Shift',
                                          )
                                        : t(
                                              'employees.shifts.addButton',
                                              'Add Shift',
                                          )}
                                </Button>
                                {editingShiftId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetShiftForm}
                                        disabled={isShiftSubmitting}
                                    >
                                        {t(
                                            'employees.common.cancelEdit',
                                            'Cancel Edit',
                                        )}
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] rounded-lg border p-3">
                            <div className="space-y-2">
                                {shifts.length > 0 ? (
                                    shifts.map((shift) => (
                                        <div
                                            key={shift.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {shift.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {`${formatTimeTo12Hour(shift.start_time)} - ${formatTimeTo12Hour(shift.end_time)}`}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {shift.description ||
                                                        t(
                                                            'employees.common.empty',
                                                            '—',
                                                        )}
                                                </p>
                                            </div>
                                            <div className="ms-3 flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        startEditingShift(shift)
                                                    }
                                                    disabled={isShiftSubmitting}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {canDelete ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDeleteShift(
                                                                shift,
                                                            )
                                                        }
                                                        disabled={
                                                            isShiftSubmitting
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'employees.shifts.empty',
                                            'No shifts found.',
                                        )}
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isPositionsOpen}
                onOpenChange={(open) => {
                    setIsPositionsOpen(open);
                    if (!open) {
                        resetPositionForm();
                    }
                }}
            >
                <DialogContent
                    className={
                        isRtl
                            ? "text-right sm:max-w-3xl [&_[data-slot='select-trigger']]:text-right [&_input]:text-right [&_label]:text-right [&_textarea]:text-right"
                            : 'sm:max-w-3xl'
                    }
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <BriefcaseBusiness className="h-5 w-5" />
                            {t(
                                'employees.positions.managerTitle',
                                'Employee Position Manager',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.positions.managerDescription',
                                'Add, edit, and remove employee positions.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="position-name">
                                    {t(
                                        'employees.positions.positionName',
                                        'Position name',
                                    )}
                                </Label>
                                <Input
                                    id="position-name"
                                    value={positionName}
                                    onChange={(event) =>
                                        setPositionName(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.positions.positionNamePlaceholder',
                                        'e.g. Floor Manager',
                                    )}
                                />
                                <InputError message={positionErrors.name} />
                            </div>
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="position-description">
                                    {t(
                                        'employees.common.description',
                                        'Description',
                                    )}
                                </Label>
                                <Input
                                    id="position-description"
                                    value={positionDescription}
                                    onChange={(event) =>
                                        setPositionDescription(
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'employees.common.optional',
                                        'Optional',
                                    )}
                                />
                                <InputError
                                    message={positionErrors.description}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Button
                                    onClick={handleSavePosition}
                                    disabled={
                                        !positionName.trim() ||
                                        isPositionSubmitting
                                    }
                                >
                                    {editingPositionId
                                        ? t(
                                              'employees.positions.updateButton',
                                              'Update Position',
                                          )
                                        : t(
                                              'employees.positions.addButton',
                                              'Add Position',
                                          )}
                                </Button>
                                {editingPositionId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetPositionForm}
                                        disabled={isPositionSubmitting}
                                    >
                                        {t(
                                            'employees.common.cancelEdit',
                                            'Cancel Edit',
                                        )}
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] rounded-lg border p-3">
                            <div className="space-y-2">
                                {employeePositions.length > 0 ? (
                                    employeePositions.map((position) => (
                                        <div
                                            key={position.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {position.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {position.description ||
                                                        t(
                                                            'employees.common.empty',
                                                            '—',
                                                        )}
                                                </p>
                                            </div>
                                            <div className="ms-3 flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        startEditingPosition(
                                                            position,
                                                        )
                                                    }
                                                    disabled={
                                                        isPositionSubmitting
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {canDelete ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDeletePosition(
                                                                position,
                                                            )
                                                        }
                                                        disabled={
                                                            isPositionSubmitting
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'employees.positions.empty',
                                            'No positions found.',
                                        )}
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <DialogContent
                    className={
                        isRtl
                            ? "text-right sm:max-w-4xl [&_[data-slot='select-trigger']]:text-right [&_input]:text-right [&_label]:text-right [&_textarea]:text-right"
                            : 'sm:max-w-4xl'
                    }
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <UserRound className="h-5 w-5" />
                            {t('employees.create.title', 'Add Employee')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'employees.create.description',
                                'Add employee profile, employment type, position, and compensation details.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="grid gap-4 px-1 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="employee-first-name">
                                    {t(
                                        'employees.form.firstName',
                                        'First name',
                                    )}
                                </Label>
                                <Input
                                    id="employee-first-name"
                                    value={firstName}
                                    onChange={(event) =>
                                        setFirstName(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.form.firstName',
                                        'First name',
                                    )}
                                />
                                <InputError message={createErrors.first_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-last-name">
                                    {t('employees.form.lastName', 'Last name')}
                                </Label>
                                <Input
                                    id="employee-last-name"
                                    value={lastName}
                                    onChange={(event) =>
                                        setLastName(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.form.lastName',
                                        'Last name',
                                    )}
                                />
                                <InputError message={createErrors.last_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-phone">
                                    {t('employees.form.phone', 'Phone')}
                                </Label>
                                <Input
                                    id="employee-phone"
                                    value={phone}
                                    onChange={(event) =>
                                        setPhone(event.target.value)
                                    }
                                    placeholder="07xx xxx xxx"
                                />
                                <InputError message={createErrors.phone} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'employees.filters.property',
                                        'Property',
                                    )}
                                </Label>
                                <Select
                                    value={propertyId}
                                    onValueChange={setPropertyId}
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
                                <InputError
                                    message={createErrors.property_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'employees.filters.employmentType',
                                        'Employment type',
                                    )}
                                </Label>
                                <Select
                                    value={employmentTypeId}
                                    onValueChange={setEmploymentTypeId}
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
                                    message={createErrors.employment_type_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'employees.form.employeePosition',
                                        'Employee position',
                                    )}
                                </Label>
                                <SearchableDropdown
                                    value={employeePositionId}
                                    onValueChange={setEmployeePositionId}
                                    options={employeePositions.map(
                                        (position) => ({
                                            value: String(position.id),
                                            label: position.name,
                                        }),
                                    )}
                                    placeholder={t(
                                        'employees.form.selectPosition',
                                        'Select position',
                                    )}
                                    searchPlaceholder={t(
                                        'employees.filters.positionSearch',
                                        'Search positions...',
                                    )}
                                    emptyText={t(
                                        'employees.filters.noPositionsFound',
                                        'No positions found.',
                                    )}
                                />
                                <InputError
                                    message={createErrors.employee_position_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('employees.filters.shift', 'Shift')}
                                </Label>
                                <Select
                                    value={shiftId}
                                    onValueChange={setShiftId}
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
                                <InputError message={createErrors.shift_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contract-start-date">
                                    {isContractBased
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
                                    id="contract-start-date"
                                    type="date"
                                    value={contractStartDate}
                                    onChange={(event) =>
                                        setContractStartDate(event.target.value)
                                    }
                                />
                                <InputError
                                    message={createErrors.contract_start_date}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contract-end-date">
                                    {isContractBased
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
                                    id="contract-end-date"
                                    type="date"
                                    value={contractEndDate}
                                    onChange={(event) =>
                                        setContractEndDate(event.target.value)
                                    }
                                />
                                <InputError
                                    message={createErrors.contract_end_date}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-salary">
                                    {isContractBased
                                        ? t(
                                              'employees.form.contractAmount',
                                              'Contract Amount',
                                          )
                                        : t('employees.table.salary', 'Salary')}
                                </Label>
                                <NumericInput
                                    id="employee-salary"
                                    min="0"
                                    showControls={false}
                                    value={
                                        isContractBased
                                            ? contractAmount
                                            : salary
                                    }
                                    onValueChange={(value) =>
                                        isContractBased
                                            ? setContractAmount(value)
                                            : setSalary(value)
                                    }
                                    placeholder="0"
                                />
                                <InputError
                                    message={
                                        isContractBased
                                            ? createErrors.contract_amount
                                            : createErrors.salary
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'employees.form.paymentCurrency',
                                        'Payment Currency',
                                    )}
                                </Label>
                                <Select
                                    value={salaryCurrency}
                                    onValueChange={setSalaryCurrency}
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
                                    message={createErrors.salary_currency}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('employees.table.status', 'Status')}
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
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
                                        {EMPLOYEE_STATUSES.map(
                                            (employeeStatus) => (
                                                <SelectItem
                                                    key={employeeStatus}
                                                    value={employeeStatus}
                                                >
                                                    {getStatusLabel(
                                                        employeeStatus,
                                                    )}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={createErrors.status} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="employee-address">
                                    {t('employees.form.address', 'Address')}
                                </Label>
                                <Input
                                    id="employee-address"
                                    value={address}
                                    onChange={(event) =>
                                        setAddress(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.form.address',
                                        'Address',
                                    )}
                                />
                                <InputError message={createErrors.address} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="employee-description">
                                    {t(
                                        'employees.common.description',
                                        'Description',
                                    )}
                                </Label>
                                <Textarea
                                    id="employee-description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder={t(
                                        'employees.form.descriptionPlaceholder',
                                        'Notes about this employee',
                                    )}
                                />
                                <InputError
                                    message={createErrors.description}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'employees.form.profilePicture',
                                        'Profile picture',
                                    )}
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'employees.form.profilePictureHelp',
                                                'Upload employee profile picture.',
                                            )}
                                        </p>
                                        <Label
                                            htmlFor="employee-profile-picture"
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
                                        id="employee-profile-picture"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) =>
                                            setProfilePicture(
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                    {profilePicturePreview ? (
                                        <div className="relative mt-3 h-24 w-24 overflow-hidden rounded-md border">
                                            <img
                                                src={profilePicturePreview}
                                                alt={t(
                                                    'employees.form.profilePreview',
                                                    'Profile preview',
                                                )}
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                className="absolute end-1 top-1 rounded bg-black/65 p-1 text-white"
                                                onClick={() =>
                                                    setProfilePicture(null)
                                                }
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                                <InputError
                                    message={createErrors.profile_picture}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'employees.form.attachmentsLabel',
                                        'Attachments (up to :count)',
                                    ).replace(
                                        ':count',
                                        String(MAX_ATTACHMENTS),
                                    )}
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'employees.form.attachmentsHelp',
                                                'Upload multiple files, documents, and images.',
                                            )}
                                        </p>
                                        <Label
                                            htmlFor="employee-attachments"
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
                                        id="employee-attachments"
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                        className="hidden"
                                        onChange={(event) =>
                                            handleAttachmentChange(
                                                event.target.files,
                                            )
                                        }
                                    />
                                    {attachments.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                            {attachments.map((item) => (
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
                                                            removeAttachment(
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
                            onClick={() => setIsCreateOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="me-2 h-4 w-4" />
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={
                                !firstName.trim() ||
                                !lastName.trim() ||
                                !propertyId ||
                                !contractStartDate ||
                                !contractEndDate ||
                                (isContractBased &&
                                    (!contractStartDate ||
                                        !contractEndDate ||
                                        !contractAmount.trim())) ||
                                (!isContractBased && !salary.trim()) ||
                                isSubmitting
                            }
                        >
                            <Plus className="me-2 h-4 w-4" />
                            {t('employees.create.button', 'Add Employee')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={deleteEmploymentTypeTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteEmploymentTypeTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(
                                'employees.employmentTypes.deleteTitle',
                                'Delete employment type',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteEmploymentTypeTarget
                                ? t(
                                      'employees.employmentTypes.deleteDescriptionNamed',
                                      'This will permanently delete :name.',
                                  ).replace(
                                      ':name',
                                      deleteEmploymentTypeTarget.name,
                                  )
                                : t(
                                      'employees.employmentTypes.deleteDescription',
                                      'This will permanently delete the selected employment type.',
                                  )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={isEmploymentTypeSubmitting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeleteEmploymentType}
                            disabled={isEmploymentTypeSubmitting}
                        >
                            {t('employees.common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
                open={deleteShiftTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteShiftTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('employees.shifts.deleteTitle', 'Delete shift')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteShiftTarget
                                ? t(
                                      'employees.shifts.deleteDescriptionNamed',
                                      'This will permanently delete :name.',
                                  ).replace(':name', deleteShiftTarget.name)
                                : t(
                                      'employees.shifts.deleteDescription',
                                      'This will permanently delete the selected shift.',
                                  )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isShiftSubmitting}>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeleteShift}
                            disabled={isShiftSubmitting}
                        >
                            {t('employees.common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
                open={deletePositionTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeletePositionTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(
                                'employees.positions.deleteTitle',
                                'Delete position',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletePositionTarget
                                ? t(
                                      'employees.positions.deleteDescriptionNamed',
                                      'This will permanently delete :name.',
                                  ).replace(':name', deletePositionTarget.name)
                                : t(
                                      'employees.positions.deleteDescription',
                                      'This will permanently delete the selected position.',
                                  )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPositionSubmitting}>
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeletePosition}
                            disabled={isPositionSubmitting}
                        >
                            {t('employees.common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
