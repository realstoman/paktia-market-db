import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
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
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Branch, Employee, EmployeePosition, EmploymentType } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    FileText,
    ImagePlus,
    Pencil,
    Plus,
    Shapes,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface EmployeeClientProps {
    data: Employee[];
    branches: Branch[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    isLoading?: boolean;
}

interface SelectedAttachment {
    id: string;
    file: File;
}

const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended', 'terminated'];
const CURRENCIES = ['AFN', 'USD'];
const MAX_ATTACHMENTS = 25;

export const EmployeeClient: React.FC<EmployeeClientProps> = ({
    data,
    branches,
    employmentTypes,
    employeePositions,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [branchId, setBranchId] = useState('');
    const [employmentTypeId, setEmploymentTypeId] = useState('');
    const [employeePositionId, setEmployeePositionId] = useState('');
    const [salary, setSalary] = useState('');
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
        setBranchId('');
        setEmploymentTypeId('');
        setEmployeePositionId('');
        setSalary('');
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
                    `You can upload up to ${MAX_ATTACHMENTS} attachments.`,
                );
                return merged.slice(0, MAX_ATTACHMENTS);
            }

            return merged;
        });
    };

    const removeAttachment = (id: string) => {
        setAttachments((current) => current.filter((item) => item.id !== id));
    };

    const handleCreateSubmit = () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !branchId ||
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
                branch_id: Number(branchId),
                employment_type_id: employmentTypeId
                    ? Number(employmentTypeId)
                    : null,
                employee_position_id: employeePositionId
                    ? Number(employeePositionId)
                    : null,
                salary: salary.trim() ? Number(salary) : null,
                salary_currency: salaryCurrency,
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
                    toast.success('Employee created successfully.');
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
                    toast.success('Employee position updated.');
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
                toast.success('Employee position created.');
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

        setIsPositionSubmitting(true);

        router.delete(`/employee-positions/${position.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee position deleted.');
                if (editingPositionId === position.id) {
                    resetPositionForm();
                }
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
                        toast.success('Employment type updated.');
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
                toast.success('Employment type created.');
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

        setIsEmploymentTypeSubmitting(true);

        router.delete(`/employment-types/${type.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employment type deleted.');
                if (editingEmploymentTypeId === type.id) {
                    resetEmploymentTypeForm();
                }
            },
            onFinish: () => {
                setIsEmploymentTypeSubmitting(false);
            },
        });
    };

    const tableColumns = useMemo(
        () => buildColumns(branches, employmentTypes, employeePositions),
        [branches, employmentTypes, employeePositions],
    );

    const attachmentError =
        createErrors.attachments ??
        Object.entries(createErrors).find(([key]) =>
            key.startsWith('attachments.'),
        )?.[1];

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Employees: ${formatNumber(data.length)}`}
                    description="Manage employee records"
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsEmploymentTypesOpen(true)}
                        className="gap-2"
                    >
                        <Shapes className="h-4 w-4" />
                        Employment Types
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsPositionsOpen(true)}
                        className="gap-2"
                    >
                        <BriefcaseBusiness className="h-4 w-4" />
                        Positions
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'full_name',
                    'phone',
                    'branch',
                    'employee_position',
                    'employment_type',
                    'status',
                ]}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search employees by name, phone, or branch..."
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
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <Shapes className="h-5 w-5" />
                            Employment Type Manager
                        </DialogTitle>
                        <DialogDescription>
                            Add, edit, and remove employment types.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="employment-type-name">
                                    Type name
                                </Label>
                                <Input
                                    id="employment-type-name"
                                    value={employmentTypeName}
                                    onChange={(event) =>
                                        setEmploymentTypeName(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. Full Time"
                                />
                                <InputError
                                    message={employmentTypeErrors.name}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="employment-type-description">
                                    Description
                                </Label>
                                <Input
                                    id="employment-type-description"
                                    value={employmentTypeDescription}
                                    onChange={(event) =>
                                        setEmploymentTypeDescription(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Optional"
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
                                        ? 'Update Employment Type'
                                        : 'Add Employment Type'}
                                </Button>
                                {editingEmploymentTypeId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetEmploymentTypeForm}
                                        disabled={isEmploymentTypeSubmitting}
                                    >
                                        Cancel Edit
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
                                                    {type.description || '—'}
                                                </p>
                                            </div>
                                            <div className="ml-3 flex items-center gap-1">
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
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No employment types found.
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
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <BriefcaseBusiness className="h-5 w-5" />
                            Employee Position Manager
                        </DialogTitle>
                        <DialogDescription>
                            Add, edit, and remove employee positions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="position-name">
                                    Position name
                                </Label>
                                <Input
                                    id="position-name"
                                    value={positionName}
                                    onChange={(event) =>
                                        setPositionName(event.target.value)
                                    }
                                    placeholder="e.g. Floor Manager"
                                />
                                <InputError message={positionErrors.name} />
                            </div>
                            <div className="grid gap-2 sm:col-span-1">
                                <Label htmlFor="position-description">
                                    Description
                                </Label>
                                <Input
                                    id="position-description"
                                    value={positionDescription}
                                    onChange={(event) =>
                                        setPositionDescription(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Optional"
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
                                        ? 'Update Position'
                                        : 'Add Position'}
                                </Button>
                                {editingPositionId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetPositionForm}
                                        disabled={isPositionSubmitting}
                                    >
                                        Cancel Edit
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
                                                        '—'}
                                                </p>
                                            </div>
                                            <div className="ml-3 flex items-center gap-1">
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
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No positions found.
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
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <UserRound className="h-5 w-5" />
                            Add Employee
                        </DialogTitle>
                        <DialogDescription>
                            Add employee profile, employment type, position, and
                            salary details.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh]">
                        <div className="grid gap-4 px-1 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="employee-first-name">
                                    First name
                                </Label>
                                <Input
                                    id="employee-first-name"
                                    value={firstName}
                                    onChange={(event) =>
                                        setFirstName(event.target.value)
                                    }
                                    placeholder="First name"
                                />
                                <InputError message={createErrors.first_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-last-name">
                                    Last name
                                </Label>
                                <Input
                                    id="employee-last-name"
                                    value={lastName}
                                    onChange={(event) =>
                                        setLastName(event.target.value)
                                    }
                                    placeholder="Last name"
                                />
                                <InputError message={createErrors.last_name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-phone">Phone</Label>
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
                                <Label>Branch</Label>
                                <Select
                                    value={branchId}
                                    onValueChange={setBranchId}
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
                                <InputError message={createErrors.branch_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Employment type</Label>
                                <Select
                                    value={employmentTypeId}
                                    onValueChange={setEmploymentTypeId}
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
                                    message={createErrors.employment_type_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Employee position</Label>
                                <Select
                                    value={employeePositionId}
                                    onValueChange={setEmployeePositionId}
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
                                    message={createErrors.employee_position_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-salary">Salary</Label>
                                <Input
                                    id="employee-salary"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={salary}
                                    onChange={(event) =>
                                        setSalary(event.target.value)
                                    }
                                    placeholder="0.00"
                                />
                                <InputError message={createErrors.salary} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Salary currency</Label>
                                <Select
                                    value={salaryCurrency}
                                    onValueChange={setSalaryCurrency}
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
                                    message={createErrors.salary_currency}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={setStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EMPLOYEE_STATUSES.map(
                                            (employeeStatus) => (
                                                <SelectItem
                                                    key={employeeStatus}
                                                    value={employeeStatus}
                                                >
                                                    {employeeStatus
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
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <InputError message={createErrors.status} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="employee-address">
                                    Address
                                </Label>
                                <Input
                                    id="employee-address"
                                    value={address}
                                    onChange={(event) =>
                                        setAddress(event.target.value)
                                    }
                                    placeholder="Address"
                                />
                                <InputError message={createErrors.address} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="employee-description">
                                    Description
                                </Label>
                                <Textarea
                                    id="employee-description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="Notes about this employee"
                                />
                                <InputError
                                    message={createErrors.description}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Profile picture</Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Upload employee profile picture.
                                        </p>
                                        <Label
                                            htmlFor="employee-profile-picture"
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            Select Picture
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
                                                alt="Profile preview"
                                                className="h-full w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-1 right-1 rounded bg-black/65 p-1 text-white"
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
                                    Attachments (up to {MAX_ATTACHMENTS})
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Upload multiple files, documents,
                                            and images.
                                        </p>
                                        <Label
                                            htmlFor="employee-attachments"
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            Select Files
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
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={
                                !firstName.trim() ||
                                !lastName.trim() ||
                                !branchId ||
                                isSubmitting
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
