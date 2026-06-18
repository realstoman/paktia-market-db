import InputError from '@/components/input-error';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { BreadcrumbItem, Country, Property, Province } from '@/types';
import { Head, Link, useForm, type InertiaFormProps } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    DoorOpen,
    Home,
    Layers3,
    MapPin,
    Plus,
    Search,
    Store,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface Props {
    properties: Property[];
    propertyOptions: Property[];
    countries: Country[];
    provinces: Province[];
}

interface PropertyForm {
    name: string;
    name_ps: string;
    name_en: string;
    parent_property_id: string;
    property_type: string;
    usage_type: string;
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

const typeIcons = {
    market: Store,
    mall: Building2,
    block: Layers3,
    house: Home,
} as const;

const emptyForm: PropertyForm = {
    name: '',
    name_ps: '',
    name_en: '',
    parent_property_id: '',
    property_type: 'market',
    usage_type: 'commercial',
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
};

export default function PropertiesPage({
    properties,
    propertyOptions,
    countries,
    provinces,
}: Props) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const form = useForm<PropertyForm>(emptyForm);
    const provinceOptions = provinces.filter(
        (province) =>
            !form.data.country_id ||
            String(province.country_id) === form.data.country_id,
    );
    const visible = useMemo(
        () =>
            properties.filter((property) => {
                const haystack =
                    `${property.name} ${property.address ?? ''} ${resolveLocationName(property.province) ?? ''}`.toLowerCase();
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
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('propertyWorkspace.title'), href: '/properties' },
    ];

    const typeLabel = (value?: string) =>
        t(`propertyWorkspace.types.${value ?? 'market'}`, value ?? 'Property');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('propertyWorkspace.title')} />
            <div className="space-y-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('propertyWorkspace.title')}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('propertyWorkspace.subtitle')}
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="me-2 h-4 w-4" />
                                {t('propertyWorkspace.register')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
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
                                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                <LocalizedFields form={form} />

                                <Field
                                    label={t('propertyWorkspace.fields.type')}
                                    error={form.errors.property_type}
                                >
                                    <SearchableDropdown
                                        value={form.data.property_type}
                                        onValueChange={(value) =>
                                            form.setData('property_type', value)
                                        }
                                        options={Object.keys(typeIcons).map((value) => ({ value, label: typeLabel(value) }))}
                                        placeholder={t('propertyWorkspace.fields.type')}
                                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                                        emptyText={t('propertyWorkspace.noOptions')}
                                    />
                                </Field>
                                <Field
                                    label={t('propertyWorkspace.fields.usage')}
                                >
                                    <SearchableDropdown
                                        value={form.data.usage_type}
                                        onValueChange={(value) =>
                                            form.setData('usage_type', value)
                                        }
                                        options={['commercial', 'residential', 'mixed'].map((value) => ({ value, label: t(`propertyWorkspace.usage.${value}`) }))}
                                        placeholder={t('propertyWorkspace.fields.usage')}
                                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                                        emptyText={t('propertyWorkspace.noOptions')}
                                    />
                                </Field>
                                <Field
                                    label={t('propertyWorkspace.fields.photo')}
                                    error={form.errors.image}
                                >
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) =>
                                            form.setData(
                                                'image',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label={t(
                                        'propertyWorkspace.fields.country',
                                    )}
                                    error={form.errors.country_id}
                                >
                                    <SearchableDropdown
                                        value={form.data.country_id}
                                        onValueChange={(value) => {
                                            form.setData('country_id', value);
                                            form.setData('province_id', '');
                                        }}
                                        options={countries.map((country) => ({ value: String(country.id), label: country.name }))}
                                        placeholder={t('propertyWorkspace.selectCountry')}
                                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                                        emptyText={t('propertyWorkspace.noOptions')}
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
                                            form.setData('province_id', value)
                                        }
                                        options={provinceOptions.map((province) => ({ value: String(province.id), label: province.name }))}
                                        placeholder={t('propertyWorkspace.selectProvince')}
                                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                                        emptyText={t('propertyWorkspace.noOptions')}
                                    />
                                </Field>
                                <Field
                                    label={t(
                                        'propertyWorkspace.relatedLocation',
                                    )}
                                    className="sm:col-span-2 lg:col-span-3"
                                    error={form.errors.parent_property_id}
                                >
                                    <SearchableDropdown
                                        value={
                                            form.data.parent_property_id ||
                                            'none'
                                        }
                                        onValueChange={(value) =>
                                            form.setData(
                                                'parent_property_id',
                                                value === 'none' ? '' : value,
                                            )
                                        }
                                        options={[
                                            { value: 'none', label: t('propertyWorkspace.independent') },
                                            ...propertyOptions.map((property) => ({ value: String(property.id), label: `${property.name} · ${typeLabel(property.property_type)}` })),
                                        ]}
                                        placeholder={t('propertyWorkspace.independent')}
                                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                                        emptyText={t('propertyWorkspace.noOptions')}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('propertyWorkspace.relatedHelp')}
                                    </p>
                                </Field>

                                <NumberField
                                    label={t(
                                        'propertyWorkspace.fields.distance',
                                    )}
                                    name="distance_from_city_km"
                                    form={form}
                                />
                                <NumberField
                                    label={t(
                                        'propertyWorkspace.fields.landArea',
                                    )}
                                    name="land_area_sqm"
                                    form={form}
                                />
                                <NumberField
                                    label={t(
                                        'propertyWorkspace.fields.buildingArea',
                                    )}
                                    name="building_area_sqm"
                                    form={form}
                                />
                                <NumberField
                                    label={t('propertyWorkspace.fields.floors')}
                                    name="declared_floors"
                                    form={form}
                                />
                                <NumberField
                                    label={t(
                                        ['market', 'mall'].includes(
                                            form.data.property_type,
                                        )
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
                                {form.data.property_type === 'house' && (
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
                                                'propertyWorkspace.fields.halls',
                                            )}
                                            name="halls_count"
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
                                <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-2 lg:col-span-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setOpen(false)}
                                    >
                                        {t('propertyWorkspace.cancel')}
                                    </Button>
                                    <Button disabled={form.processing}>
                                        {t('propertyWorkspace.create')}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

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
                                ['market', 'mall'].includes(
                                    item.property_type ?? '',
                                ),
                            ).length
                        }
                    />
                    <PortfolioMetric
                        icon={Home}
                        label={t('propertyWorkspace.homes')}
                        value={
                            properties.filter((item) =>
                                ['house', 'block'].includes(
                                    item.property_type ?? '',
                                ),
                            ).length
                        }
                    />
                    <PortfolioMetric
                        icon={DoorOpen}
                        label={t('propertyWorkspace.spaces')}
                        value={properties.reduce(
                            (total, item) => total + (item.units_count ?? 0),
                            0,
                        )}
                    />
                </div>

                <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="ps-9"
                            placeholder={t('propertyWorkspace.search')}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <SearchableDropdown
                        value={type}
                        onValueChange={setType}
                        options={[
                            { value: 'all', label: t('propertyWorkspace.allTypes') },
                            ...Object.keys(typeIcons).map((value) => ({ value, label: typeLabel(value) })),
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

function LocalizedFields({ form }: { form: InertiaFormProps<PropertyForm> }) {
    const { t } = useLocalization();

    return (
        <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium">
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

function PropertyCard({ property }: { property: Property }) {
    const { t } = useLocalization();
    const type = (property.property_type ?? 'market') as keyof typeof typeIcons;
    const Icon = typeIcons[type] ?? Store;
    const spacesLabel = ['market', 'mall'].includes(type)
        ? t('propertyWorkspace.shops')
        : type === 'block'
          ? t('propertyWorkspace.apartments')
          : t('propertyWorkspace.rooms');

    return (
        <Link href={`/properties/${property.id}`} className="group">
            <Card className="h-full overflow-hidden p-0 transition hover:border-primary/30 hover:shadow-md">
                <div className="relative h-40 overflow-hidden bg-muted">
                    {property.image_url ? (
                        <img
                            src={property.image_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <Icon className="h-12 w-12 text-slate-400" />
                        </div>
                    )}
                    <div className="absolute inset-x-0 top-0 flex justify-between p-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur">
                            {t(`propertyWorkspace.types.${type}`)}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="border-white/50 bg-background/80 text-foreground backdrop-blur"
                        >
                            <CheckCircle2 className="me-1 h-3 w-3" />
                            {t(
                                property.is_active
                                    ? 'propertyWorkspace.active'
                                    : 'propertyWorkspace.inactive',
                            )}
                        </Badge>
                    </div>
                </div>
                <CardContent className="space-y-4 p-5">
                    <div>
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="font-semibold">{property.name}</h2>
                            <Badge variant="secondary">
                                {t(
                                    `propertyWorkspace.usage.${property.usage_type}`,
                                )}
                            </Badge>
                        </div>
                        {property.parent_property && (
                            <p className="mt-1 text-xs font-medium text-primary">
                                {t('propertyWorkspace.relatedTo').replace(
                                    ':name',
                                    property.parent_property.name,
                                )}
                            </p>
                        )}
                        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {property.address ||
                                resolveLocationName(property.province) ||
                                '—'}
                        </p>
                    </div>
                    <div className="grid grid-cols-3 divide-x rounded-lg border bg-muted/30 py-3 text-center text-xs rtl:divide-x-reverse">
                        <Stat
                            value={
                                property.floors_count ??
                                property.declared_floors ??
                                0
                            }
                            label={t('propertyWorkspace.floors')}
                        />
                        <Stat
                            value={
                                property.units_count ??
                                property.declared_units ??
                                0
                            }
                            label={spacesLabel}
                        />
                        <Stat
                            value={
                                property.building_area_sqm
                                    ? `${property.building_area_sqm} m²`
                                    : '—'
                            }
                            label={t('propertyWorkspace.building')}
                        />
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span>{t('propertyWorkspace.ready')}</span>
                        <span className="font-medium text-primary">
                            {t('propertyWorkspace.openWorkspace')} →
                        </span>
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
        <Card>
            <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-muted p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xl font-semibold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
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
        <div className={`grid gap-2 ${className}`}>
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
            <Input
                type="number"
                min="0"
                step="any"
                value={form.data[name]}
                onChange={(event) => form.setData(name, event.target.value)}
            />
        </Field>
    );
}

function resolveLocationName(value: Property['province']) {
    return typeof value === 'string' ? value : value?.name;
}
