import InputError from '@/components/input-error';
import { PropertyImageUpload } from '@/components/properties/property-image-upload';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    BreadcrumbItem,
    Country,
    Property,
    PropertyType,
    Province,
} from '@/types';
import { formatNumber } from '@/utils/format';
import {
    Head,
    Link,
    router,
    useForm,
    type InertiaFormProps,
} from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpRight,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    Home,
    Layers3,
    ListOrdered,
    MapPin,
    Pencil,
    Plus,
    Search,
    Store,
    Tags,
    Trash2,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface Props {
    properties: Property[];
    propertyOptions: Property[];
    countries: Country[];
    provinces: Province[];
    propertyTypes: PropertyType[];
    openCreate?: boolean;
}

interface PropertyForm {
    name: string;
    name_ps: string;
    name_en: string;
    parent_property_id: string;
    property_type: string;
    usage_type: string;
    host_market_name: string;
    host_market_name_ps: string;
    host_market_name_en: string;
    external_unit_number: string;
    external_floor: string;
    ownership_type: string;
    operating_mode: string;
    business_activities: string[];
    title_deed_number: string;
    country_id: string;
    province_id: string;
    address: string;
    address_ps: string;
    address_en: string;
    description: string;
    description_ps: string;
    description_en: string;
    distance_from_city_km: string;
    land_area_sqm: string;
    building_area_sqm: string;
    declared_floors: string;
    declared_units: string;
    rooms_count: string;
    kitchens_count: string;
    halls_count: string;
    bathrooms_count: string;
    parking_spaces: string;
    year_built: string;
    notes: string;
    image: File | null;
    images: File[];
}

interface PropertyTypeForm {
    name: string;
    name_ps: string;
    name_en: string;
    behavior: PropertyType['behavior'];
    is_active: boolean;
}

type NumericPropertyField =
    | 'distance_from_city_km'
    | 'land_area_sqm'
    | 'building_area_sqm'
    | 'declared_floors'
    | 'declared_units'
    | 'rooms_count'
    | 'kitchens_count'
    | 'halls_count'
    | 'bathrooms_count'
    | 'parking_spaces';

const typeBehavior = (
    key: string | undefined,
    propertyTypes: PropertyType[],
): PropertyType['behavior'] => {
    const resolved = propertyTypes.find((type) => type.key === key)?.behavior;

    if (resolved) return resolved;
    if (key === 'mall') return 'market';
    if (
        key === 'market' ||
        key === 'block' ||
        key === 'house' ||
        key === 'commercial_unit'
    ) {
        return key;
    }

    return 'market';
};

const propertyTypeName = (
    key: string | undefined,
    propertyTypes: PropertyType[],
    locale: string,
    fallback: (key: string, fallback?: string) => string,
) => {
    const type = propertyTypes.find((item) => item.key === key);
    if (type) {
        return (
            type.name_translations?.[
                locale as keyof NonNullable<PropertyType['name_translations']>
            ] ||
            type.name_translations?.fa ||
            type.name
        );
    }

    return fallback(
        `propertyWorkspace.types.${key ?? 'market'}`,
        key ?? 'Property',
    );
};

function PropertyTypeIcon({
    propertyType,
    propertyTypes,
    className,
}: {
    propertyType?: string;
    propertyTypes: PropertyType[];
    className?: string;
}) {
    const behavior = typeBehavior(propertyType, propertyTypes);

    if (behavior === 'block') return <Layers3 className={className} />;
    if (behavior === 'house') return <Home className={className} />;
    if (behavior === 'commercial_unit') {
        return <BriefcaseBusiness className={className} />;
    }

    return <Store className={className} />;
}

const emptyForm: PropertyForm = {
    name: '',
    name_ps: '',
    name_en: '',
    parent_property_id: '',
    property_type: 'market',
    usage_type: 'commercial',
    host_market_name: '',
    host_market_name_ps: '',
    host_market_name_en: '',
    external_unit_number: '',
    external_floor: '',
    ownership_type: 'owned',
    operating_mode: 'owner_occupied',
    business_activities: [],
    title_deed_number: '',
    country_id: '',
    province_id: '',
    address: '',
    address_ps: '',
    address_en: '',
    description: '',
    description_ps: '',
    description_en: '',
    distance_from_city_km: '',
    land_area_sqm: '',
    building_area_sqm: '',
    declared_floors: '',
    declared_units: '',
    rooms_count: '',
    kitchens_count: '',
    halls_count: '',
    bathrooms_count: '',
    parking_spaces: '',
    year_built: '',
    notes: '',
    image: null,
    images: [],
};

function firstPropertyImageError(
    errors: Partial<Record<string, string>>,
): string | undefined {
    return (
        errors.images ??
        errors.image ??
        Object.entries(errors).find(([key]) => key.startsWith('images.'))?.[1]
    );
}

export default function PropertiesPage({
    properties,
    propertyOptions,
    countries,
    provinces,
    propertyTypes,
    openCreate = false,
}: Props) {
    const { t, locale } = useLocalization();
    const [open, setOpen] = useState(openCreate);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const form = useForm<PropertyForm>(emptyForm);
    const activePropertyTypes = useMemo(
        () =>
            propertyTypes.filter(
                (propertyType) =>
                    propertyType.is_active ||
                    properties.some(
                        (property) =>
                            property.property_type === propertyType.key,
                    ),
            ),
        [properties, propertyTypes],
    );
    const selectedTypeBehavior = typeBehavior(
        form.data.property_type,
        propertyTypes,
    );
    const provinceOptions = provinces.filter(
        (province) =>
            !form.data.country_id ||
            String(province.country_id) === form.data.country_id,
    );
    const visible = useMemo(
        () =>
            properties.filter((property) => {
                const haystack =
                    `${property.name} ${property.address ?? ''} ${property.host_market_name ?? ''} ${property.external_unit_number ?? ''} ${resolveLocationName(property.province) ?? ''}`.toLowerCase();
                return (
                    (type === 'all' || property.property_type === type) &&
                    haystack.includes(search.toLowerCase())
                );
            }),
        [properties, search, type],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/properties', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
            onError: () => setOpen(true),
        });
    };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('propertyWorkspace.title'), href: '/properties' },
    ];

    const typeLabel = (value?: string) =>
        propertyTypeName(value, propertyTypes, locale, t);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('propertyWorkspace.title')} />
            <div className="space-y-4 **:data-[slot=card]:shadow-none">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('propertyWorkspace.title')}
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            {t('propertyWorkspace.subtitle')}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <PropertyOrderDialog
                            properties={properties}
                            propertyTypes={propertyTypes}
                        />
                        <PropertyTypesDialog propertyTypes={propertyTypes} />
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="me-2 h-4 w-4" />
                                    {t('propertyWorkspace.register')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto rounded-2xl bg-[#f8f9fd] sm:max-w-4xl [&_input]:bg-white [&_textarea]:bg-white">
                                <DialogHeader>
                                    <DialogTitle>
                                        {t('propertyWorkspace.registerTitle')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('propertyWorkspace.registerHelp')}
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={submit}
                                    className="grid min-w-0 gap-4 lg:grid-cols-4"
                                >
                                    <LocalizedFields form={form} />

                                    <Field
                                        label={t(
                                            'propertyWorkspace.fields.type',
                                        )}
                                        error={form.errors.property_type}
                                    >
                                        <SearchableDropdown
                                            value={form.data.property_type}
                                            onValueChange={(value) => {
                                                form.setData(
                                                    'property_type',
                                                    value,
                                                );
                                                if (
                                                    typeBehavior(
                                                        value,
                                                        propertyTypes,
                                                    ) === 'commercial_unit'
                                                ) {
                                                    form.setData(
                                                        'usage_type',
                                                        'commercial',
                                                    );
                                                    form.setData(
                                                        'parent_property_id',
                                                        '',
                                                    );
                                                }
                                            }}
                                            options={activePropertyTypes
                                                .filter(
                                                    (item) =>
                                                        item.is_active ||
                                                        item.key ===
                                                            form.data
                                                                .property_type,
                                                )
                                                .map((item) => ({
                                                    value: item.key,
                                                    label: typeLabel(item.key),
                                                }))}
                                            placeholder={t(
                                                'propertyWorkspace.fields.type',
                                            )}
                                            searchPlaceholder={t(
                                                'propertyWorkspace.searchOptions',
                                            )}
                                            emptyText={t(
                                                'propertyWorkspace.noOptions',
                                            )}
                                        />
                                    </Field>
                                    {selectedTypeBehavior !==
                                        'commercial_unit' && (
                                        <Field
                                            label={t(
                                                'propertyWorkspace.fields.usage',
                                            )}
                                        >
                                            <SearchableDropdown
                                                value={form.data.usage_type}
                                                onValueChange={(value) =>
                                                    form.setData(
                                                        'usage_type',
                                                        value,
                                                    )
                                                }
                                                options={[
                                                    'commercial',
                                                    'residential',
                                                    'mixed',
                                                ].map((value) => ({
                                                    value,
                                                    label: t(
                                                        `propertyWorkspace.usage.${value}`,
                                                    ),
                                                }))}
                                            placeholder={t(
                                                'propertyWorkspace.fields.usage',
                                            )}
                                            searchPlaceholder={t(
                                                'propertyWorkspace.searchOptions',
                                            )}
                                            emptyText={t(
                                                'propertyWorkspace.noOptions',
                                            )}
                                        />
                                        </Field>
                                    )}
                                    <Field
                                        label={t(
                                            'propertyWorkspace.fields.country',
                                        )}
                                        error={form.errors.country_id}
                                    >
                                        <SearchableDropdown
                                            value={form.data.country_id}
                                            onValueChange={(value) => {
                                                form.setData(
                                                    'country_id',
                                                    value,
                                                );
                                                form.setData('province_id', '');
                                            }}
                                            options={countries.map(
                                                (country) => ({
                                                    value: String(country.id),
                                                    label: country.name,
                                                }),
                                            )}
                                            placeholder={t(
                                                'propertyWorkspace.selectCountry',
                                            )}
                                            searchPlaceholder={t(
                                                'propertyWorkspace.searchOptions',
                                            )}
                                            emptyText={t(
                                                'propertyWorkspace.noOptions',
                                            )}
                                        />
                                    </Field>
                                    <Field
                                        label={t(
                                            'propertyWorkspace.fields.province',
                                        )}
                                        error={form.errors.province_id}
                                    >
                                        <SearchableDropdown
                                            value={form.data.province_id}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'province_id',
                                                    value,
                                                )
                                            }
                                            options={provinceOptions.map(
                                                (province) => ({
                                                    value: String(province.id),
                                                    label: province.name,
                                                }),
                                            )}
                                            placeholder={t(
                                                'propertyWorkspace.selectProvince',
                                            )}
                                            searchPlaceholder={t(
                                                'propertyWorkspace.searchOptions',
                                            )}
                                            emptyText={t(
                                                'propertyWorkspace.noOptions',
                                            )}
                                        />
                                    </Field>
                                    {selectedTypeBehavior !==
                                        'commercial_unit' && (
                                        <Field
                                            label={t(
                                                'propertyWorkspace.relatedLocation',
                                            )}
                                            className="lg:col-span-4"
                                            error={
                                                form.errors.parent_property_id
                                            }
                                        >
                                            <SearchableDropdown
                                                value={
                                                    form.data
                                                        .parent_property_id ||
                                                    'none'
                                                }
                                                onValueChange={(value) =>
                                                    form.setData(
                                                        'parent_property_id',
                                                        value === 'none'
                                                            ? ''
                                                            : value,
                                                    )
                                                }
                                                options={[
                                                    {
                                                        value: 'none',
                                                        label: t(
                                                            'propertyWorkspace.independent',
                                                        ),
                                                    },
                                                    ...propertyOptions.map(
                                                        (property) => ({
                                                            value: String(
                                                                property.id,
                                                            ),
                                                            label: `${property.name} · ${typeLabel(property.property_type)}`,
                                                        }),
                                                    ),
                                                ]}
                                                placeholder={t(
                                                    'propertyWorkspace.independent',
                                                )}
                                                searchPlaceholder={t(
                                                    'propertyWorkspace.searchOptions',
                                                )}
                                                emptyText={t(
                                                    'propertyWorkspace.noOptions',
                                                )}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    'propertyWorkspace.relatedHelp',
                                                )}
                                            </p>
                                        </Field>
                                    )}

                                    {selectedTypeBehavior ===
                                        'commercial_unit' && (
                                        <>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.hostMarketName',
                                                )}
                                                error={
                                                    form.errors.host_market_name
                                                }
                                            >
                                                <Input
                                                    dir="rtl"
                                                    value={
                                                        form.data
                                                            .host_market_name
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'host_market_name',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label={`${t('propertyWorkspace.fields.hostMarketName')} — ${t('propertyWorkspace.languages.ps')}`}
                                            >
                                                <Input
                                                    dir="rtl"
                                                    value={
                                                        form.data
                                                            .host_market_name_ps
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'host_market_name_ps',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label={`${t('propertyWorkspace.fields.hostMarketName')} — ${t('propertyWorkspace.languages.en')}`}
                                            >
                                                <Input
                                                    dir="ltr"
                                                    value={
                                                        form.data
                                                            .host_market_name_en
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'host_market_name_en',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.externalUnitNumber',
                                                )}
                                                error={
                                                    form.errors
                                                        .external_unit_number
                                                }
                                            >
                                                <Input
                                                    value={
                                                        form.data
                                                            .external_unit_number
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'external_unit_number',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.externalFloor',
                                                )}
                                            >
                                                <Input
                                                    value={
                                                        form.data.external_floor
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'external_floor',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.titleDeedNumber',
                                                )}
                                            >
                                                <Input
                                                    value={
                                                        form.data
                                                            .title_deed_number
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'title_deed_number',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.ownershipType',
                                                )}
                                            >
                                                <SearchableDropdown
                                                    value={
                                                        form.data.ownership_type
                                                    }
                                                    onValueChange={(value) =>
                                                        form.setData(
                                                            'ownership_type',
                                                            value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'propertyWorkspace.selectOwnershipType',
                                                    )}
                                                    options={[
                                                        'owned',
                                                        'leased',
                                                        'managed',
                                                    ].map((value) => ({
                                                        value,
                                                        label: t(
                                                            `propertyWorkspace.ownership.${value}`,
                                                        ),
                                                    }))}
                                                    searchPlaceholder={t(
                                                        'propertyWorkspace.searchOptions',
                                                    )}
                                                    emptyText={t(
                                                        'propertyWorkspace.noOptions',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.operatingMode',
                                                )}
                                            >
                                                <SearchableDropdown
                                                    value={
                                                        form.data.operating_mode
                                                    }
                                                    onValueChange={(value) =>
                                                        form.setData(
                                                            'operating_mode',
                                                            value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'propertyWorkspace.selectOwnershipType',
                                                    )}
                                                    options={[
                                                        'owner_occupied',
                                                        'vacant',
                                                        'rented',
                                                        'maintenance',
                                                    ].map((value) => ({
                                                        value,
                                                        label: t(
                                                            `propertyWorkspace.operatingMode.${value}`,
                                                        ),
                                                    }))}
                                                    searchPlaceholder={t(
                                                        'propertyWorkspace.searchOptions',
                                                    )}
                                                    emptyText={t(
                                                        'propertyWorkspace.noOptions',
                                                    )}
                                                />
                                            </Field>
                                            <Field
                                                label={t(
                                                    'propertyWorkspace.fields.businessActivities',
                                                )}
                                                className="md:col-span-2"
                                            >
                                                <div className="grid gap-2 rounded-xl border bg-white p-3 sm:grid-cols-2">
                                                    {[
                                                        'money_exchange',
                                                        'jewelry',
                                                        'office',
                                                        'retail',
                                                        'other',
                                                    ].map((activity) => (
                                                        <label
                                                            key={activity}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <Checkbox
                                                                checked={form.data.business_activities.includes(
                                                                    activity,
                                                                )}
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    form.setData(
                                                                        'business_activities',
                                                                        checked
                                                                            ? [
                                                                                  ...form
                                                                                      .data
                                                                                      .business_activities,
                                                                                  activity,
                                                                              ]
                                                                            : form.data.business_activities.filter(
                                                                                  (
                                                                                      value,
                                                                                  ) =>
                                                                                      value !==
                                                                                      activity,
                                                                              ),
                                                                    )
                                                                }
                                                            />
                                                            {t(
                                                                `propertyWorkspace.businessActivities.${activity}`,
                                                            )}
                                                        </label>
                                                    ))}
                                                </div>
                                            </Field>
                                        </>
                                    )}

                                    <NumberField
                                        label={t(
                                            'propertyWorkspace.fields.distance',
                                        )}
                                        name="distance_from_city_km"
                                        form={form}
                                    />
                                    {selectedTypeBehavior !==
                                        'commercial_unit' && (
                                        <NumberField
                                            label={t(
                                                'propertyWorkspace.fields.landArea',
                                            )}
                                            name="land_area_sqm"
                                            form={form}
                                        />
                                    )}
                                    <NumberField
                                        label={t(
                                            'propertyWorkspace.fields.buildingArea',
                                        )}
                                        name="building_area_sqm"
                                        form={form}
                                    />
                                    {selectedTypeBehavior !==
                                        'commercial_unit' && (
                                        <>
                                            <NumberField
                                                label={t(
                                                    'propertyWorkspace.fields.floors',
                                                )}
                                                name="declared_floors"
                                                form={form}
                                            />
                                            <NumberField
                                                label={t(
                                                    selectedTypeBehavior ===
                                                        'market'
                                                        ? 'propertyWorkspace.fields.expectedShops'
                                                        : 'propertyWorkspace.fields.expectedApartments',
                                                )}
                                                name="declared_units"
                                                form={form}
                                            />
                                            <NumberField
                                                label={t(
                                                    'propertyWorkspace.fields.parking',
                                                )}
                                                name="parking_spaces"
                                                form={form}
                                            />
                                        </>
                                    )}
                                    {['house', 'commercial_unit'].includes(
                                        selectedTypeBehavior,
                                    ) && (
                                        <>
                                            <NumberField
                                                label={t(
                                                    'propertyWorkspace.fields.rooms',
                                                )}
                                                name="rooms_count"
                                                form={form}
                                            />
                                            <NumberField
                                                label={t(
                                                    'propertyWorkspace.fields.kitchens',
                                                )}
                                                name="kitchens_count"
                                                form={form}
                                            />
                                            <NumberField
                                                label={t(
                                                    'propertyWorkspace.fields.bathrooms',
                                                )}
                                                name="bathrooms_count"
                                                form={form}
                                            />
                                        </>
                                    )}
                                    <PropertyImageUpload
                                        value={form.data.image}
                                        onChange={() => undefined}
                                        multiple
                                        files={form.data.images}
                                        onFilesChange={(files) =>
                                            form.setData('images', files)
                                        }
                                        error={
                                            firstPropertyImageError(
                                                form.errors,
                                            )
                                        }
                                        className="lg:col-span-4"
                                    />
                                    <div className="flex justify-end gap-2 border-t border-[#002452]/10 pt-4 lg:col-span-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setOpen(false)}
                                        >
                                            {t('propertyWorkspace.cancel')}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={form.processing}
                                        >
                                            {t('propertyWorkspace.create')}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Portfolio Metrics */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <PortfolioMetric
                        icon={Building2}
                        label={t('propertyWorkspace.total')}
                        value={properties.length}
                    />
                    <PortfolioMetric
                        icon={Store}
                        label={t('propertyWorkspace.markets')}
                        value={
                            properties.filter((item) =>
                                typeBehavior(item.property_type, propertyTypes) ===
                                'market',
                            ).length
                        }
                    />
                    <PortfolioMetric
                        icon={Home}
                        label={t('propertyWorkspace.homes')}
                        value={
                            properties.filter((item) =>
                                ['house', 'block'].includes(
                                    typeBehavior(
                                        item.property_type,
                                        propertyTypes,
                                    ),
                                ),
                            ).length
                        }
                    />
                    <PortfolioMetric
                        icon={BriefcaseBusiness}
                        label={t('propertyWorkspace.types.commercial_unit')}
                        value={
                            properties.filter(
                                (item) =>
                                    typeBehavior(
                                        item.property_type,
                                        propertyTypes,
                                    ) === 'commercial_unit',
                            ).length
                        }
                    />
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-card p-3 shadow-none sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute inset-s-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="bg-white ps-9 dark:bg-neutral-900"
                            placeholder={t('propertyWorkspace.search')}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <SearchableDropdown
                        value={type}
                        onValueChange={setType}
                        options={[
                            {
                                value: 'all',
                                label: t('propertyWorkspace.allTypes'),
                            },
                            ...activePropertyTypes.map((item) => ({
                                value: item.key,
                                label: typeLabel(item.key),
                            })),
                        ]}
                        placeholder={t('propertyWorkspace.allTypes')}
                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                        emptyText={t('propertyWorkspace.noOptions')}
                        className="sm:w-56"
                    />
                </div>

                {visible.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {visible.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                propertyTypes={propertyTypes}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">
                        {t('propertyWorkspace.noResults')}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function PropertyOrderDialog({
    properties,
    propertyTypes,
}: {
    properties: Property[];
    propertyTypes: PropertyType[];
}) {
    const { t, locale } = useLocalization();
    const [open, setOpen] = useState(false);
    const [movingId, setMovingId] = useState<number | null>(null);

    const move = (property: Property, direction: 'up' | 'down') => {
        setMovingId(property.id);
        router.patch(
            `/properties/${property.id}/order`,
            { direction },
            {
                preserveScroll: true,
                onFinish: () => setMovingId(null),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ListOrdered className="me-2 size-4" />
                    {t('propertyWorkspace.manageOrder')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('propertyWorkspace.orderTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('propertyWorkspace.orderHelp')}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pe-1">
                    {properties.map((property, index) => {
                        const isMoving = movingId === property.id;

                        return (
                            <div
                                key={property.id}
                                className="flex items-center gap-3 rounded-xl border bg-card p-3"
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                                    {index + 1}
                                </span>
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                                    <PropertyTypeIcon
                                        propertyType={property.property_type}
                                        propertyTypes={propertyTypes}
                                        className="size-4"
                                    />
                                </span>
                                <div className="min-w-0 flex-1 text-start">
                                    <p className="truncate text-sm font-semibold">
                                        {property.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {propertyTypeName(
                                            property.property_type,
                                            propertyTypes,
                                            locale,
                                            t,
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={
                                            index === 0 || movingId !== null
                                        }
                                        aria-label={t(
                                            'propertyWorkspace.moveUp',
                                        )}
                                        onClick={() => move(property, 'up')}
                                    >
                                        <ArrowUp
                                            className={`size-4 ${isMoving ? 'animate-pulse' : ''}`}
                                        />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        disabled={
                                            index === properties.length - 1 ||
                                            movingId !== null
                                        }
                                        aria-label={t(
                                            'propertyWorkspace.moveDown',
                                        )}
                                        onClick={() => move(property, 'down')}
                                    >
                                        <ArrowDown
                                            className={`size-4 ${isMoving ? 'animate-pulse' : ''}`}
                                        />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PropertyTypesDialog({
    propertyTypes,
}: {
    propertyTypes: PropertyType[];
}) {
    const { t, locale, isRtl } = useLocalization();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PropertyType | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PropertyType | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const form = useForm<PropertyTypeForm>({
        name: '',
        name_ps: '',
        name_en: '',
        behavior: 'market',
        is_active: true,
    });
    const behaviorOptions: PropertyType['behavior'][] = [
        'market',
        'block',
        'house',
        'commercial_unit',
    ];
    const resetForm = () => {
        setEditing(null);
        form.setData({
            name: '',
            name_ps: '',
            name_en: '',
            behavior: 'market',
            is_active: true,
        });
        form.clearErrors();
    };
    const editType = (type: PropertyType) => {
        setEditing(type);
        form.setData({
            name: type.name_translations?.fa || type.name,
            name_ps: type.name_translations?.ps || '',
            name_en: type.name_translations?.en || '',
            behavior: type.behavior,
            is_active: type.is_active,
        });
        form.clearErrors();
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: resetForm,
        };

        if (editing) {
            form.put(`/property-types/${editing.id}`, options);
            return;
        }

        form.post('/property-types', options);
    };
    const deleteType = () => {
        if (!deleteTarget) return;

        setDeletingId(deleteTarget.id);
        router.delete(`/property-types/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (editing?.id === deleteTarget.id) {
                    resetForm();
                }
            },
            onFinish: () => {
                setDeletingId(null);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    if (!nextOpen) resetForm();
                }}
            >
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Tags className="me-2 size-4" />
                        {t('propertyWorkspace.manageTypes')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-[#f8f9fd] sm:max-w-4xl [&_input]:bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            {t('propertyWorkspace.typesManager.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('propertyWorkspace.typesManager.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-2xl border bg-white p-4"
                        >
                            <Field
                                label={t(
                                    'propertyWorkspace.typesManager.nameFa',
                                )}
                                error={form.errors.name}
                            >
                                <Input
                                    dir="rtl"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label={t(
                                    'propertyWorkspace.typesManager.namePs',
                                )}
                                error={form.errors.name_ps}
                            >
                                <Input
                                    dir="rtl"
                                    value={form.data.name_ps}
                                    onChange={(event) =>
                                        form.setData(
                                            'name_ps',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label={t(
                                    'propertyWorkspace.typesManager.nameEn',
                                )}
                                error={form.errors.name_en}
                            >
                                <Input
                                    dir="ltr"
                                    value={form.data.name_en}
                                    onChange={(event) =>
                                        form.setData(
                                            'name_en',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label={t(
                                    'propertyWorkspace.typesManager.behavior',
                                )}
                                error={form.errors.behavior}
                            >
                                <SearchableDropdown
                                    value={form.data.behavior}
                                    onValueChange={(value) =>
                                        form.setData('behavior', value)
                                    }
                                    options={behaviorOptions.map(
                                        (behavior) => ({
                                            value: behavior,
                                            label: t(
                                                `propertyWorkspace.typeBehaviors.${behavior}`,
                                            ),
                                        }),
                                    )}
                                    placeholder={t(
                                        'propertyWorkspace.typesManager.behavior',
                                    )}
                                />
                            </Field>
                            <label className="flex items-center gap-2 rounded-xl border bg-[#f8f9fd] p-3 text-sm">
                                <Checkbox
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_active',
                                            Boolean(checked),
                                        )
                                    }
                                />
                                {t('propertyWorkspace.typesManager.active')}
                            </label>
                            <div className="flex justify-end gap-2">
                                {editing && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={resetForm}
                                    >
                                        {t('propertyWorkspace.cancel')}
                                    </Button>
                                )}
                                <Button disabled={form.processing}>
                                    {editing
                                        ? t('propertyWorkspace.save')
                                        : t(
                                              'propertyWorkspace.typesManager.create',
                                          )}
                                </Button>
                            </div>
                        </form>
                        <div className="space-y-2">
                            {propertyTypes.map((type) => (
                                <div
                                    key={type.id}
                                    className="flex items-center gap-3 rounded-2xl border bg-white p-3"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                                        <PropertyTypeIcon
                                            propertyType={type.key}
                                            propertyTypes={propertyTypes}
                                            className="size-5"
                                        />
                                    </span>
                                    <div className="min-w-0 flex-1 text-start">
                                        <p className="truncate font-semibold">
                                            {propertyTypeName(
                                                type.key,
                                                propertyTypes,
                                                locale,
                                                t,
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                `propertyWorkspace.typeBehaviors.${type.behavior}`,
                                            )}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            type.is_active
                                                ? 'success'
                                                : 'outline'
                                        }
                                    >
                                        {t(
                                            type.is_active
                                                ? 'propertyWorkspace.active'
                                                : 'propertyWorkspace.inactive',
                                        )}
                                    </Badge>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="bg-white"
                                        onClick={() => editType(type)}
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        className="border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                                        disabled={deletingId === type.id}
                                        onClick={() => setDeleteTarget(type)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen && deletingId === null) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader className={isRtl ? 'text-right' : ''}>
                        <AlertDialogTitle>
                            {t(
                                'propertyWorkspace.typesManager.deleteTitle',
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'propertyWorkspace.typesManager.deleteDescription',
                            ).replace(
                                ':name',
                                deleteTarget
                                    ? propertyTypeName(
                                          deleteTarget.key,
                                          propertyTypes,
                                          locale,
                                          t,
                                      )
                                    : '',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletingId !== null}>
                            {t('propertyWorkspace.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={deletingId !== null}
                            onClick={deleteType}
                        >
                            {t('propertyWorkspace.typesManager.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function LocalizedFields({ form }: { form: InertiaFormProps<PropertyForm> }) {
    const { t } = useLocalization();

    return (
        <div className="grid min-w-0 gap-4 rounded-2xl border border-[#002452]/10 bg-white p-4 lg:col-span-4 lg:grid-cols-3">
            <div className="space-y-1 border-b border-[#002452]/10 pb-3 lg:col-span-3">
                <p className="text-sm font-semibold text-[#002452]">
                    {t('propertyWorkspace.languages.fa')}
                </p>
                <p className="text-xs text-muted-foreground">
                    {t('propertyWorkspace.dariRequired')}
                </p>
            </div>
            <Field
                label={t('propertyWorkspace.fields.name')}
                error={form.errors.name}
            >
                <Input
                    dir="rtl"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                />
            </Field>
            <Field
                label={t('propertyWorkspace.fields.address')}
                error={form.errors.address}
            >
                <Input
                    dir="rtl"
                    value={form.data.address}
                    onChange={(event) =>
                        form.setData('address', event.target.value)
                    }
                />
            </Field>
            <Field label={t('propertyWorkspace.fields.description')}>
                <Textarea
                    dir="rtl"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
            </Field>
            {(['ps', 'en'] as const).map((locale) => (
                <div key={locale} className="contents">
                    <Field
                        label={`${t('propertyWorkspace.fields.name')} — ${t(`propertyWorkspace.languages.${locale}`)}`}
                    >
                        <Input
                            dir={locale === 'ps' ? 'rtl' : 'ltr'}
                            value={form.data[`name_${locale}`]}
                            onChange={(event) =>
                                form.setData(
                                    `name_${locale}`,
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field
                        label={`${t('propertyWorkspace.fields.address')} — ${t(`propertyWorkspace.languages.${locale}`)}`}
                    >
                        <Input
                            dir={locale === 'ps' ? 'rtl' : 'ltr'}
                            value={form.data[`address_${locale}`]}
                            onChange={(event) =>
                                form.setData(
                                    `address_${locale}`,
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field
                        label={`${t('propertyWorkspace.fields.description')} — ${t(`propertyWorkspace.languages.${locale}`)}`}
                    >
                        <Textarea
                            dir={locale === 'ps' ? 'rtl' : 'ltr'}
                            value={form.data[`description_${locale}`]}
                            onChange={(event) =>
                                form.setData(
                                    `description_${locale}`,
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                </div>
            ))}
        </div>
    );
}

function PropertyCard({
    property,
    propertyTypes,
}: {
    property: Property;
    propertyTypes: PropertyType[];
}) {
    const { t, locale } = useLocalization();
    const behavior = typeBehavior(property.property_type, propertyTypes);
    const spacesLabel = behavior === 'market'
        ? t('propertyWorkspace.shops')
        : behavior === 'block'
          ? t('propertyWorkspace.apartments')
          : behavior === 'commercial_unit'
            ? t('propertyWorkspace.commercialUnit')
            : t('propertyWorkspace.rooms');

    return (
        <Link
            href={`/properties/${property.id}`}
            className="group block h-full"
        >
            <Card className="flex h-full flex-col overflow-hidden p-0 shadow-none transition hover:border-primary/30 hover:shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
                <div className="relative h-64 overflow-hidden bg-muted">
                    {property.image_url ? (
                        <img
                            src={property.image_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <PropertyTypeIcon
                                propertyType={property.property_type}
                                propertyTypes={propertyTypes}
                                className="h-12 w-12 text-slate-400"
                            />
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
                    <Badge
                        variant="outline"
                        className={
                            property.is_active
                                ? 'absolute top-3 left-3 border-emerald-200 bg-emerald-50/95 text-emerald-700 backdrop-blur'
                                : 'absolute top-3 left-3 border-slate-200 bg-slate-50/95 text-slate-500 backdrop-blur'
                        }
                    >
                        {property.is_active && (
                            <CheckCircle2 className="me-1 h-3.5 w-3.5 text-emerald-600" />
                        )}
                        {t(
                            property.is_active
                                ? 'propertyWorkspace.active'
                                : 'propertyWorkspace.inactive',
                        )}
                    </Badge>
                    <span className="absolute inset-e-3 bottom-3 inline-flex translate-y-1 items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-primary opacity-0 shadow-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                        {t('propertyWorkspace.viewDetails')}
                        <ArrowUpRight className="size-4" />
                    </span>
                </div>
                <CardContent className="flex flex-1 flex-col gap-4 px-5 pt-5 pb-3">
                    <div>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate font-semibold">
                                    {property.name}
                                </h2>
                                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                        {property.address ||
                                            resolveLocationName(
                                                property.province,
                                            ) ||
                                            '—'}
                                    </span>
                                </p>
                                {property.parent_property && (
                                    <p className="mt-1 text-xs font-medium text-primary">
                                        {t(
                                            'propertyWorkspace.relatedTo',
                                        ).replace(
                                            ':name',
                                            property.parent_property.name,
                                        )}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <Badge variant="secondary">
                                    {propertyTypeName(
                                        property.property_type,
                                        propertyTypes,
                                        locale,
                                        t,
                                    )}
                                </Badge>
                                <Badge variant="outline">
                                    {t(
                                        `propertyWorkspace.usage.${property.usage_type}`,
                                    )}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto grid grid-cols-3 divide-x rounded-lg border bg-muted/30 py-3 text-center text-xs rtl:divide-x-reverse">
                        <Stat
                            value={
                                behavior === 'commercial_unit'
                                    ? (property.external_floor ?? '—')
                                    : (property.floors_count ??
                                      property.declared_floors ??
                                      0)
                            }
                            label={t(
                                behavior === 'commercial_unit'
                                    ? 'propertyWorkspace.fields.externalFloor'
                                    : 'propertyWorkspace.floors',
                            )}
                        />
                        <Stat
                            value={
                                behavior === 'commercial_unit'
                                    ? (property.external_unit_number ?? '—')
                                    : (property.units_count ??
                                      property.declared_units ??
                                      0)
                            }
                            label={spacesLabel}
                        />
                        <Stat
                            value={
                                property.building_area_sqm
                                    ? formatNumber(property.building_area_sqm)
                                    : '—'
                            }
                            label={t('propertyWorkspace.building')}
                        />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

function PortfolioMetric({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Building2;
    label: string;
    value: number;
}) {
    return (
        <Card className="border border-primary/10 shadow-none">
            <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-muted p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="text-base text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function Stat({ value, label }: { value: string | number; label: string }) {
    return (
        <div>
            <div className="font-semibold">{value}</div>
            <div className="text-muted-foreground">{label}</div>
        </div>
    );
}

function Field({
    label,
    error,
    className = '',
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`grid min-w-0 gap-2 ${className}`}>
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function NumberField({
    label,
    name,
    form,
}: {
    label: string;
    name: NumericPropertyField;
    form: InertiaFormProps<PropertyForm>;
}) {
    return (
        <Field label={label} error={form.errors[name]}>
            <NumericInput
                min="0"
                step="any"
                value={form.data[name]}
                onValueChange={(value) => form.setData(name, value)}
                showControls={false}
            />
        </Field>
    );
}

function resolveLocationName(value: Property['province']) {
    return typeof value === 'string' ? value : value?.name;
}
