import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
import { Link, router } from '@inertiajs/react';
import { Plus, ShieldCheck, User as UserIcon, X } from 'lucide-react';
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
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
    const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
    const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('');
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
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
    const roleFilterOptions = useMemo(
        () => [
            { value: '', label: 'All roles' },
            ...roles.map((role) => ({
                value: String(role.id),
                label: role.name,
            })),
        ],
        [roles],
    );
    const countryFilterOptions = useMemo(
        () => [
            { value: '', label: 'All countries' },
            ...countries.map((country) => ({
                value: String(country.id),
                label: country.name,
            })),
        ],
        [countries],
    );
    const provinceFilterOptions = useMemo(
        () => [
            { value: '', label: 'All cities' },
            ...provinces
                .filter((province) => {
                    if (!selectedCountryFilter) {
                        return true;
                    }

                    return (
                        String(province.country_id ?? '') ===
                        selectedCountryFilter
                    );
                })
                .map((province) => ({
                    value: String(province.id),
                    label: province.name,
                })),
        ],
        [provinces, selectedCountryFilter],
    );
    const branchFilterOptions = useMemo(
        () => [
            { value: '', label: 'All branches' },
            ...branches
                .filter((branch) => {
                    const matchesCountry = selectedCountryFilter
                        ? String(branch.country_id ?? '') ===
                          selectedCountryFilter
                        : true;
                    const matchesProvince = selectedProvinceFilter
                        ? String(branch.province_id ?? '') ===
                          selectedProvinceFilter
                        : true;

                    return matchesCountry && matchesProvince;
                })
                .map((branch) => ({
                    value: String(branch.id),
                    label: branch.name,
                })),
        ],
        [branches, selectedCountryFilter, selectedProvinceFilter],
    );
    const filteredUsers = useMemo(
        () =>
            data.filter((user) => {
                const matchesRole = selectedRoleFilter
                    ? (user.roles ?? []).some((role) => {
                          if (typeof role === 'string') {
                              const matchedRole = roles.find(
                                  (item) => item.name === role,
                              );

                              return (
                                  String(matchedRole?.id ?? '') ===
                                  selectedRoleFilter
                              );
                          }

                          return String(role.id) === selectedRoleFilter;
                      })
                    : true;
                const matchesCountry = selectedCountryFilter
                    ? String(user.country_id ?? '') === selectedCountryFilter
                    : true;
                const matchesProvince = selectedProvinceFilter
                    ? String(user.province_id ?? '') === selectedProvinceFilter
                    : true;
                const matchesBranch = selectedBranchFilter
                    ? String(user.branch_id ?? '') === selectedBranchFilter
                    : true;

                return (
                    matchesRole &&
                    matchesCountry &&
                    matchesProvince &&
                    matchesBranch
                );
            }),
        [
            data,
            roles,
            selectedRoleFilter,
            selectedCountryFilter,
            selectedProvinceFilter,
            selectedBranchFilter,
        ],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Users: ${formatNumber(data.length)}`}
                    description="Manage system users"
                />
                <div className="gap-2">
                    <Link href="/roles">
                        <Button className="mr-2 gap-2" variant={'outline'}>
                            <ShieldCheck className="h-4 w-4" />
                            Roles
                        </Button>
                    </Link>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                </div>
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
                data={filteredUsers}
                isLoading={isLoading}
                searchPlaceholder="Search users by name or email..."
                toolbar={
                    <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                        <SearchableDropdown
                            value={selectedRoleFilter}
                            options={roleFilterOptions}
                            onValueChange={setSelectedRoleFilter}
                            placeholder="All roles"
                            searchPlaceholder="Search roles..."
                            emptyText="No roles found."
                            className="xl:w-[180px]"
                        />
                        <SearchableDropdown
                            value={selectedCountryFilter}
                            options={countryFilterOptions}
                            onValueChange={(value) => {
                                setSelectedCountryFilter(value);
                                setSelectedProvinceFilter('');
                                setSelectedBranchFilter('');
                            }}
                            placeholder="All countries"
                            searchPlaceholder="Search countries..."
                            emptyText="No countries found."
                            className="xl:w-[180px]"
                        />
                        <SearchableDropdown
                            value={selectedProvinceFilter}
                            options={provinceFilterOptions}
                            onValueChange={(value) => {
                                setSelectedProvinceFilter(value);
                                setSelectedBranchFilter('');
                            }}
                            placeholder="All cities"
                            searchPlaceholder="Search cities..."
                            emptyText="No cities found."
                            className="xl:w-[180px]"
                        />
                        <SearchableDropdown
                            value={selectedBranchFilter}
                            options={branchFilterOptions}
                            onValueChange={setSelectedBranchFilter}
                            placeholder="All branches"
                            searchPlaceholder="Search branches..."
                            emptyText="No branches found."
                            className="xl:w-[180px]"
                        />
                    </div>
                }
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
