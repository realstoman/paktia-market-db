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
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { Branch, Country, Kitchen, Province, Role, User } from '@/types';
import { formatNumber } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    Plus,
    ShieldCheck,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface UsersClientProps {
    data: User[];
    roles: Role[];
    countries: Country[];
    provinces: Province[];
    branches: Branch[];
    kitchens: Kitchen[];
    isLoading?: boolean;
}

export const UsersClient: React.FC<UsersClientProps> = ({
    data,
    roles,
    countries,
    provinces,
    branches,
    kitchens,
    isLoading = false,
}) => {
    const { t, locale } = useLocalization();
    const { can } = useAuthorization();
    const canCreateUser = can('user.create');
    const canViewRoles = can('role.view') || can('roles.manage');
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
    const [kitchenId, setKitchenId] = useState<string>('none');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedCreateRole = useMemo(
        () => roles.find((role) => String(role.id) === roleId) ?? null,
        [roleId, roles],
    );
    const isCreateKitchenRole = selectedCreateRole?.name === 'kitchen';

    const resetForm = () => {
        setName('');
        setEmail('');
        setRoleId('');
        setCountryId('');
        setProvinceId('');
        setBranchId('');
        setKitchenId('none');
        setPassword('');
        setPasswordConfirmation('');
        setShowPasswords(false);
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
                kitchen_id:
                    isCreateKitchenRole && kitchenId !== 'none'
                        ? Number(kitchenId)
                        : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'users.feedback.userCreated',
                            'User created successfully.',
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

    const createRoleError =
        createErrors.roles ??
        Object.entries(createErrors).find(([key]) =>
            key.startsWith('roles.'),
        )?.[1];

    const tableColumns = useMemo(
        () => buildColumns(roles, countries, provinces, branches, kitchens, t, locale),
        [roles, countries, provinces, branches, kitchens, t, locale],
    );
    const roleFilterOptions = useMemo(
        () => [
            { value: '', label: t('users.filters.allRoles', 'All roles') },
            ...roles.map((role) => ({
                value: String(role.id),
                label: role.name,
            })),
        ],
        [roles, t],
    );
    const countryFilterOptions = useMemo(
        () => [
            {
                value: '',
                label: t('users.filters.allCountries', 'All countries'),
            },
            ...countries.map((country) => ({
                value: String(country.id),
                label: country.name,
            })),
        ],
        [countries, t],
    );
    const provinceFilterOptions = useMemo(
        () => [
            { value: '', label: t('users.filters.allCities', 'All cities') },
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
        [provinces, selectedCountryFilter, t],
    );
    const branchFilterOptions = useMemo(
        () => [
            {
                value: '',
                label: t('users.filters.allBranches', 'All branches'),
            },
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
        [branches, selectedCountryFilter, selectedProvinceFilter, t],
    );
    const createProvinceOptions = useMemo(
        () =>
            provinces.filter((province) => {
                if (!countryId) {
                    return true;
                }

                return String(province.country_id ?? '') === countryId;
            }),
        [provinces, countryId],
    );
    const createBranchOptions = useMemo(
        () =>
            branches.filter((branch) => {
                const matchesCountry = countryId
                    ? String(branch.country_id ?? '') === countryId
                    : true;
                const matchesProvince = provinceId
                    ? String(branch.province_id ?? '') === provinceId
                    : true;

                return matchesCountry && matchesProvince;
            }),
        [branches, countryId, provinceId],
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
                    title={`${t('users.page.title', 'System Users')}: ${formatNumber(data.length)}`}
                    description={t(
                        'users.page.description',
                        'Manage system users',
                    )}
                />
                <div className="gap-2">
                    {canViewRoles ? (
                        <Link href="/roles">
                            <Button className="mr-2 gap-2" variant={'outline'}>
                                <ShieldCheck className="h-4 w-4" />
                                {t('users.actions.roles', 'Roles')}
                            </Button>
                        </Link>
                    ) : null}
                    {canCreateUser ? (
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t('users.actions.addUser', 'Add User')}
                        </Button>
                    ) : null}
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
                searchPlaceholder={t(
                    'users.filters.searchPlaceholder',
                    'Search users by name or email...',
                )}
                toolbar={
                    <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                        <SearchableDropdown
                            value={selectedRoleFilter}
                            options={roleFilterOptions}
                            onValueChange={setSelectedRoleFilter}
                            placeholder={t('users.filters.allRoles', 'All roles')}
                            searchPlaceholder={t(
                                'users.filters.searchRoles',
                                'Search roles...',
                            )}
                            emptyText={t(
                                'users.filters.noRolesFound',
                                'No roles found.',
                            )}
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
                            placeholder={t(
                                'users.filters.allCountries',
                                'All countries',
                            )}
                            searchPlaceholder={t(
                                'users.filters.searchCountries',
                                'Search countries...',
                            )}
                            emptyText={t(
                                'users.filters.noCountriesFound',
                                'No countries found.',
                            )}
                            className="xl:w-[180px]"
                        />
                        <SearchableDropdown
                            value={selectedProvinceFilter}
                            options={provinceFilterOptions}
                            onValueChange={(value) => {
                                setSelectedProvinceFilter(value);
                                setSelectedBranchFilter('');
                            }}
                            placeholder={t('users.filters.allCities', 'All cities')}
                            searchPlaceholder={t(
                                'users.filters.searchCities',
                                'Search cities...',
                            )}
                            emptyText={t(
                                'users.filters.noCitiesFound',
                                'No cities found.',
                            )}
                            className="xl:w-[180px]"
                        />
                        <SearchableDropdown
                            value={selectedBranchFilter}
                            options={branchFilterOptions}
                            onValueChange={setSelectedBranchFilter}
                            placeholder={t(
                                'users.filters.allBranches',
                                'All branches',
                            )}
                            searchPlaceholder={t(
                                'users.filters.searchBranches',
                                'Search branches...',
                            )}
                            emptyText={t(
                                'users.filters.noBranchesFound',
                                'No branches found.',
                            )}
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
                            {t('users.modals.create.title', 'Create User')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'users.modals.create.description',
                                'Add a new user and assign roles and location.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="user-name">
                                {t('users.fields.name', 'Name')}
                            </Label>
                            <Input
                                id="user-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder={t('users.placeholders.fullName', 'Full name')}
                            />
                            <InputError message={createErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-email">
                                {t('users.fields.email', 'Email')}
                            </Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder={t(
                                    'users.placeholders.email',
                                    'user@babataste.com',
                                )}
                            />
                            <InputError message={createErrors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-password">
                                {t('users.fields.password', 'Password')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="user-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                                    onClick={() =>
                                        setShowPasswords((current) => !current)
                                    }
                                >
                                    {showPasswords ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <InputError message={createErrors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="user-password-confirm">
                                {t(
                                    'users.fields.confirmPassword',
                                    'Confirm password',
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="user-password-confirm"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={passwordConfirmation}
                                    onChange={(event) =>
                                        setPasswordConfirmation(
                                            event.target.value,
                                        )
                                    }
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                                    onClick={() =>
                                        setShowPasswords((current) => !current)
                                    }
                                >
                                    {showPasswords ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <InputError
                                message={createErrors.password_confirmation}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('users.fields.role', 'Role')}</Label>
                            <Select
                                value={roleId}
                                onValueChange={(value) => {
                                    setRoleId(value);

                                    const selectedRole = roles.find(
                                        (role) => String(role.id) === value,
                                    );

                                    if (selectedRole?.name !== 'kitchen') {
                                        setKitchenId('none');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectRole',
                                            'Select role',
                                        )}
                                    />
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
                        {isCreateKitchenRole ? (
                            <div className="grid gap-2">
                                <Label>{t('users.fields.kitchen', 'Kitchen')}</Label>
                                <Select
                                    value={kitchenId}
                                    onValueChange={setKitchenId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'users.placeholders.selectKitchen',
                                                'Select kitchen',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kitchens.map((kitchen) => (
                                            <SelectItem
                                                key={kitchen.id}
                                                value={String(kitchen.id)}
                                            >
                                                {kitchen.name ??
                                                    `Kitchen #${kitchen.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createErrors.kitchen_id} />
                            </div>
                        ) : null}
                        <div className="grid gap-2">
                            <Label>{t('users.fields.country', 'Country')}</Label>
                            <Select
                                value={countryId}
                                onValueChange={(value) => {
                                    setCountryId(value);
                                    if (value !== countryId) {
                                        setProvinceId('');
                                        setBranchId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectCountry',
                                            'Select country',
                                        )}
                                    />
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
                            <Label>{t('users.fields.province', 'Province')}</Label>
                            <Select
                                value={provinceId}
                                onValueChange={(value) => {
                                    setProvinceId(value);
                                    if (value !== provinceId) {
                                        setBranchId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectProvince',
                                            'Select province',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {createProvinceOptions.map((province) => (
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
                            <Label>{t('users.fields.branch', 'Branch')}</Label>
                            <Select
                                value={branchId}
                                onValueChange={setBranchId}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectBranch',
                                            'Select branch',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {createBranchOptions.map((branch) => (
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
                            {t('common.cancel', 'Cancel')}
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
                            {t('users.modals.create.submit', 'Create User')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
