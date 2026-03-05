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
import { Plus, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface EmployeeClientProps {
    data: Employee[];
    branches: Branch[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
    isLoading?: boolean;
}

const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended', 'terminated'];
const CURRENCIES = ['AFN', 'USD'];

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
    const [attachments, setAttachments] = useState<File[]>([]);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                attachments,
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

    const tableColumns = useMemo(
        () => buildColumns(branches, employmentTypes, employeePositions),
        [branches, employmentTypes, employeePositions],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Employees: ${formatNumber(data.length)}`}
                    description="Manage employee records"
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Employee
                </Button>
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
                            Create Employee
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
                            <div className="grid gap-2">
                                <Label htmlFor="employee-profile-picture">
                                    Employee picture
                                </Label>
                                <Input
                                    id="employee-profile-picture"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setProfilePicture(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                {profilePicture ? (
                                    <p className="text-xs text-muted-foreground">
                                        Selected: {profilePicture.name}
                                    </p>
                                ) : null}
                                <InputError
                                    message={createErrors.profile_picture}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="employee-attachments">
                                    Attachments
                                </Label>
                                <Input
                                    id="employee-attachments"
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                    onChange={(event) =>
                                        setAttachments(
                                            Array.from(
                                                event.target.files ?? [],
                                            ),
                                        )
                                    }
                                />
                                {attachments.length > 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        {attachments.length} file(s) selected
                                    </p>
                                ) : null}
                                <InputError
                                    message={
                                        createErrors.attachments ??
                                        Object.entries(createErrors).find(
                                            ([key]) =>
                                                key.startsWith('attachments.'),
                                        )?.[1]
                                    }
                                />
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
                            Create Employee
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
