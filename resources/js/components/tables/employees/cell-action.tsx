import InputError from '@/components/input-error';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Branch, Employee, EmployeePosition, EmploymentType } from '@/types';
import { router } from '@inertiajs/react';
import {
    Ban,
    CheckCircle,
    Edit,
    MoreHorizontal,
    Save,
    Trash,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Employee;
    branches: Branch[];
    employmentTypes: EmploymentType[];
    employeePositions: EmployeePosition[];
}

const EMPLOYEE_STATUSES = ['active', 'inactive', 'suspended', 'terminated'];
const CURRENCIES = ['AFN', 'USD'];

export const CellAction: React.FC<CellActionProps> = ({
    data,
    branches,
    employmentTypes,
    employeePositions,
}) => {
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
    const [editSalary, setEditSalary] = useState(
        data.salary !== null && data.salary !== undefined ? String(data.salary) : '',
    );
    const [editSalaryCurrency, setEditSalaryCurrency] = useState(
        data.salary_currency ?? 'AFN',
    );
    const [editStatus, setEditStatus] = useState(
        data.status ?? (data.is_active ? 'active' : 'inactive'),
    );
    const [editAddress, setEditAddress] = useState(data.address ?? '');
    const [editDescription, setEditDescription] = useState(data.description ?? '');

    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setEditSalary(
            data.salary !== null && data.salary !== undefined ? String(data.salary) : '',
        );
        setEditSalaryCurrency(data.salary_currency ?? 'AFN');
        setEditStatus(data.status ?? (data.is_active ? 'active' : 'inactive'));
        setEditAddress(data.address ?? '');
        setEditDescription(data.description ?? '');
        setEditErrors({});
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
                salary: editSalary.trim() ? Number(editSalary) : null,
                salary_currency: editSalaryCurrency,
                status: editStatus,
                is_active: editStatus === 'active',
                address: editAddress.trim() || null,
                description: editDescription.trim() || null,
            },
            {
                preserveScroll: true,
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
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update employee profile, employment type, position, and salary details.
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
                                <Label htmlFor={`edit-phone-${data.id}`}>Phone</Label>
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
                                <Label htmlFor={`edit-salary-${data.id}`}>
                                    Salary
                                </Label>
                                <Input
                                    id={`edit-salary-${data.id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editSalary}
                                    onChange={(event) =>
                                        setEditSalary(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.salary} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Salary currency</Label>
                                <Select
                                    value={editSalaryCurrency}
                                    onValueChange={setEditSalaryCurrency}
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
                                            <SelectItem key={status} value={status}>
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
        </>
    );
};
