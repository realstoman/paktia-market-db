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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Branch, Country, Province, Role, User } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Plus, User as UserIcon, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface UsersClientProps {
    data: User[];
    roles: Role[];
    countries: Country[];
    provinces: Province[];
    branches: Branch[];
    isLoading?: boolean;
}

export const UsersClient: React.FC<UsersClientProps> = ({
    data,
    roles,
    countries,
    provinces,
    branches,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState<string>('');
    const [countryId, setCountryId] = useState<string>('');
    const [provinceId, setProvinceId] = useState<string>('');
    const [branchId, setBranchId] = useState<string>('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setEmail('');
        setRoleId('');
        setCountryId('');
        setProvinceId('');
        setBranchId('');
        setPassword('');
        setPasswordConfirmation('');
        setCreateErrors({});
    };

    const handleCreateSubmit = () => {
        if (!name.trim() || !email.trim() || !password || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/users',
            {
                name: name.trim(),
                email: email.trim(),
                password,
                password_confirmation: passwordConfirmation,
                roles: roleId ? [Number(roleId)] : [],
                country_id: countryId ? Number(countryId) : null,
                province_id: provinceId ? Number(provinceId) : null,
                branch_id: branchId ? Number(branchId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('User created successfully.');
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

    const createRoleError =
        createErrors.roles ??
        Object.entries(createErrors).find(([key]) =>
            key.startsWith('roles.'),
        )?.[1];

    const tableColumns = useMemo(
        () => buildColumns(roles, countries, provinces, branches),
        [roles, countries, provinces, branches],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Users: ${formatNumber(data.length)}`}
                    description="Manage system users"
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'name',
                    'email',
                    'branch',
                    'province',
                    'country',
                    'is_active',
                ]}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search users by name or email..."
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
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <UserIcon className="h-5 w-5" />
                            Create User
                        </DialogTitle>
                        <DialogDescription>
                            Add a new user and assign roles and location.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="user-name">Name</Label>
                            <Input
                                id="user-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Full name"
                            />
                            <InputError message={createErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-email">Email</Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="user@babataste.com"
                            />
                            <InputError message={createErrors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-password">Password</Label>
                            <Input
                                id="user-password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                            <InputError message={createErrors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-password-confirm">
                                Confirm password
                            </Label>
                            <Input
                                id="user-password-confirm"
                                type="password"
                                value={passwordConfirmation}
                                onChange={(event) =>
                                    setPasswordConfirmation(event.target.value)
                                }
                            />
                            <InputError
                                message={createErrors.password_confirmation}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createRoleError} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Country</Label>
                            <Select
                                value={countryId}
                                onValueChange={(value) => {
                                    setCountryId(value);
                                    if (value !== countryId) {
                                        setProvinceId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country.id}
                                            value={String(country.id)}
                                        >
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Province</Label>
                            <Select
                                value={provinceId}
                                onValueChange={setProvinceId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((province) => (
                                        <SelectItem
                                            key={province.id}
                                            value={String(province.id)}
                                        >
                                            {province.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.province_id} />
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
                    </div>

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
                                !name.trim() ||
                                !email.trim() ||
                                !password ||
                                isSubmitting
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
