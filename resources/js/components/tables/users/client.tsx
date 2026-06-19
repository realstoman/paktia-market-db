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
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { Country, Property, Province, Role, User } from '@/types';
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
    properties: Property[];
    isLoading?: boolean;
}

export const UsersClient: React.FC<UsersClientProps> = ({
    data,
    roles,
    countries,
    provinces,
    properties,
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
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState<string>('');
    const [countryId, setCountryId] = useState<string>('');
    const [provinceId, setProvinceId] = useState<string>('');
    const [propertyId, setPropertyId] = useState<string>('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
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
        setPropertyId('');
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
                property_id: propertyId ? Number(propertyId) : null,
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
        () => buildColumns(roles, countries, provinces, properties, t, locale),
        [roles, countries, provinces, properties, t, locale],
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
    const propertyFilterOptions = useMemo(
        () => [
            {
                value: '',
                label: t('users.filters.allProperties', 'All properties'),
            },
            ...properties
                .filter((property) => {
                    const matchesCountry = selectedCountryFilter
                        ? String(property.country_id ?? '') ===
                          selectedCountryFilter
                        : true;
                    const matchesProvince = selectedProvinceFilter
                        ? String(property.province_id ?? '') ===
                          selectedProvinceFilter
                        : true;

                    return matchesCountry && matchesProvince;
                })
                .map((property) => ({
                    value: String(property.id),
                    label: property.name,
                })),
        ],
        [properties, selectedCountryFilter, selectedProvinceFilter, t],
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
    const createPropertyOptions = useMemo(
        () =>
            properties.filter((property) => {
                const matchesCountry = countryId
                    ? String(property.country_id ?? '') === countryId
                    : true;
                const matchesProvince = provinceId
                    ? String(property.province_id ?? '') === provinceId
                    : true;

                return matchesCountry && matchesProvince;
            }),
        [properties, countryId, provinceId],
    );
    const createPropertySelectOptions = useMemo(
        () =>
            createPropertyOptions.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [createPropertyOptions],
    );

    useAutoSelectSingleOption(
        createPropertySelectOptions,
        propertyId,
        setPropertyId,
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
                const matchesProperty = selectedPropertyFilter
                    ? String(user.property_id ?? '') === selectedPropertyFilter
                    : true;

                return (
                    matchesRole &&
                    matchesCountry &&
                    matchesProvince &&
                    matchesProperty
                );
            }),
        [
            data,
            roles,
            selectedRoleFilter,
            selectedCountryFilter,
            selectedProvinceFilter,
            selectedPropertyFilter,
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
                        <Link href="/roles" className="ml-2">
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
                            <Plus className="mr-2 h-4 w-4" />
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
                    'property',
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
                            placeholder={t(
                                'users.filters.allRoles',
                                'All roles',
                            )}
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
                                setSelectedPropertyFilter('');
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
                                setSelectedPropertyFilter('');
                            }}
                            placeholder={t(
                                'users.filters.allCities',
                                'All cities',
                            )}
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
                            value={selectedPropertyFilter}
                            options={propertyFilterOptions}
                            onValueChange={setSelectedPropertyFilter}
                            placeholder={t(
                                'users.filters.allProperties',
                                'All properties',
                            )}
                            searchPlaceholder={t(
                                'users.filters.searchProperties',
                                'Search properties...',
                            )}
                            emptyText={t(
                                'users.filters.noPropertiesFound',
                                'No properties found.',
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
                                placeholder={t(
                                    'users.placeholders.fullName',
                                    'Full name',
                                )}
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
                                    'user@paktiamarket.com',
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
                            <SearchableDropdown
                                value={roleId}
                                onValueChange={setRoleId}
                                options={roles.map((role) => ({
                                    value: String(role.id),
                                    label: role.name,
                                }))}
                                placeholder={t(
                                    'users.placeholders.selectRole',
                                    'Select role',
                                )}
                                searchPlaceholder={t(
                                    'users.filters.searchRoles',
                                    'Search roles...',
                                )}
                                emptyText={t(
                                    'users.filters.noRolesFound',
                                    'No roles found.',
                                )}
                            />
                            <InputError message={createRoleError} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('users.fields.country', 'Country')}
                            </Label>
                            <SearchableDropdown
                                value={countryId}
                                onValueChange={(value) => {
                                    setCountryId(value);
                                    if (value !== countryId) {
                                        setProvinceId('');
                                        setPropertyId('');
                                    }
                                }}
                                options={countries.map((country) => ({
                                    value: String(country.id),
                                    label: country.name,
                                }))}
                                placeholder={t(
                                    'users.placeholders.selectCountry',
                                    'Select country',
                                )}
                            />
                            <InputError message={createErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('users.fields.province', 'Province')}
                            </Label>
                            <SearchableDropdown
                                value={provinceId}
                                onValueChange={(value) => {
                                    setProvinceId(value);
                                    if (value !== provinceId) {
                                        setPropertyId('');
                                    }
                                }}
                                options={createProvinceOptions.map(
                                    (province) => ({
                                        value: String(province.id),
                                        label: province.name,
                                    }),
                                )}
                                placeholder={t(
                                    'users.placeholders.selectProvince',
                                    'Select province',
                                )}
                            />
                            <InputError message={createErrors.province_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('users.fields.property', 'Property')}
                            </Label>
                            <SearchableDropdown
                                value={propertyId}
                                onValueChange={setPropertyId}
                                options={createPropertyOptions.map(
                                    (property) => ({
                                        value: String(property.id),
                                        label: property.name,
                                    }),
                                )}
                                placeholder={t(
                                    'users.placeholders.selectProperty',
                                    'Select property',
                                )}
                            />
                            <InputError message={createErrors.property_id} />
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
