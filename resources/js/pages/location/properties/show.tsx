import InputError from '@/components/input-error';
import { EditPropertyDialog } from '@/components/properties/edit-property-dialog';
import { NumericInput } from '@/components/shared/numeric-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    PropertyFloor,
    Province,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Bath,
    BedDouble,
    BriefcaseBusiness,
    Building2,
    ChefHat,
    DoorOpen,
    HandCoins,
    Layers3,
    MapPin,
    Plus,
    ReceiptText,
    Ruler,
    Store,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

interface PropertyShowProps {
    property: Property;
    countries: Country[];
    provinces: Province[];
    propertyOptions: Property[];
}

export default function PropertyShow({
    property,
    countries,
    provinces,
    propertyOptions,
}: PropertyShowProps) {
    const { t } = useLocalization();
    const floors = property.floors ?? [];
    const units = floors.flatMap((floor) => floor.units ?? []);
    const isMarket = ['market', 'mall'].includes(
        property.property_type ?? 'market',
    );
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('propertyWorkspace.title'), href: '/properties' },
        { title: property.name, href: `/properties/${property.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={property.name} />
            <div className="space-y-6">
                <section className="relative min-h-64 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-700">
                    {property.image_url && (
                        <img
                            src={property.image_url}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-45"
                        />
                    )}
                    <div className="relative flex min-h-64 flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-6 text-white md:p-8">
                        <div className="mb-3 flex gap-2">
                            <Badge className="bg-white/90 text-slate-900">
                                {t(
                                    `propertyWorkspace.types.${property.property_type ?? 'market'}`,
                                )}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-white/50 text-white"
                            >
                                {t(
                                    `propertyWorkspace.usage.${property.usage_type}`,
                                )}
                            </Badge>
                        </div>
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    {property.name}
                                </h1>
                                <p className="mt-2 flex items-center gap-2 text-white/80">
                                    <MapPin className="h-4 w-4" />
                                    {property.address || '—'}
                                </p>
                            </div>
                            <EditPropertyDialog
                                property={property}
                                countries={countries}
                                provinces={provinces}
                                propertyOptions={propertyOptions}
                            />
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        icon={Layers3}
                        label={t('propertyWorkspace.configuredFloors')}
                        value={floors.length}
                        hint={
                            property.declared_floors
                                ? t('propertyWorkspace.planned').replace(
                                      ':count',
                                      String(property.declared_floors),
                                  )
                                : undefined
                        }
                    />
                    <Metric
                        icon={isMarket ? Store : DoorOpen}
                        label={
                            isMarket
                                ? t('propertyWorkspace.shops')
                                : property.property_type === 'block'
                                  ? t('propertyWorkspace.apartments')
                                  : t('propertyWorkspace.rooms')
                        }
                        value={
                            property.property_type === 'house'
                                ? (property.rooms_count ?? 0)
                                : units.length
                        }
                        hint={
                            property.declared_units
                                ? t('propertyWorkspace.planned').replace(
                                      ':count',
                                      String(property.declared_units),
                                  )
                                : undefined
                        }
                    />
                    <Metric
                        icon={Ruler}
                        label={t('propertyWorkspace.fields.buildingArea')}
                        value={
                            property.building_area_sqm
                                ? `${formatNumber(property.building_area_sqm)} m²`
                                : '—'
                        }
                    />
                    <Metric
                        icon={Users}
                        label={t('propertyWorkspace.availableSpaces')}
                        value={
                            units.filter(
                                (unit) => unit.occupancy_status === 'vacant',
                            ).length
                        }
                        hint={t('propertyWorkspace.contractsReady')}
                    />
                </div>

                <Card>
                    <CardContent className="grid gap-3 py-5 sm:grid-cols-2 xl:grid-cols-4">
                        <WorkspaceCapability
                            icon={BriefcaseBusiness}
                            title={t('propertyWorkspace.employees')}
                            description={t('propertyWorkspace.employeesHelp')}
                        />
                        <WorkspaceCapability
                            icon={ReceiptText}
                            title={t('propertyWorkspace.expenses')}
                            description={t('propertyWorkspace.expensesHelp')}
                        />
                        <WorkspaceCapability
                            icon={Users}
                            title={t('propertyWorkspace.shareholders')}
                            description={t(
                                'propertyWorkspace.shareholdersHelp',
                            )}
                            planned
                        />
                        <WorkspaceCapability
                            icon={HandCoins}
                            title={t('propertyWorkspace.rentContracts')}
                            description={t(
                                'propertyWorkspace.rentContractsHelp',
                            )}
                            href={'/tenants?property_id=' + property.id}
                        />
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {t('propertyWorkspace.profile')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {property.parent_property && (
                                    <Detail
                                        label={t(
                                            'propertyWorkspace.relatedLocation',
                                        )}
                                        value={property.parent_property.name}
                                    />
                                )}
                                <Detail
                                    label={t(
                                        'propertyWorkspace.countryProvince',
                                    )}
                                    value={`${resolveName(property.country)} / ${resolveName(property.province)}`}
                                />
                                <Detail
                                    label={t('propertyWorkspace.landArea')}
                                    value={
                                        property.land_area_sqm
                                            ? `${formatNumber(property.land_area_sqm)} m²`
                                            : '—'
                                    }
                                />
                                <Detail
                                    label={t('propertyWorkspace.distance')}
                                    value={
                                        property.distance_from_city_km
                                            ? `${formatNumber(property.distance_from_city_km)} km`
                                            : '—'
                                    }
                                />
                                <Detail
                                    label={t('propertyWorkspace.parking')}
                                    value={property.parking_spaces ?? '—'}
                                />
                                {property.property_type === 'house' && (
                                    <>
                                        <Detail
                                            label={t('propertyWorkspace.rooms')}
                                            value={property.rooms_count ?? '—'}
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.kitchensHalls',
                                            )}
                                            value={`${property.kitchens_count ?? 0} / ${property.halls_count ?? 0}`}
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.bathrooms',
                                            )}
                                            value={
                                                property.bathrooms_count ?? '—'
                                            }
                                        />
                                    </>
                                )}
                                <div className="pt-2">
                                    <p className="font-medium">
                                        {t('propertyWorkspace.description')}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                        {property.description ||
                                            t(
                                                'propertyWorkspace.noDescription',
                                            )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        {property.related_locations?.length ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t(
                                            'propertyWorkspace.relatedLocations',
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {property.related_locations.map(
                                        (location) => (
                                            <a
                                                key={location.id}
                                                href={`/properties/${location.id}`}
                                                className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {location.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {resolveName(
                                                            location.province,
                                                        )}
                                                        ,{' '}
                                                        {resolveName(
                                                            location.country,
                                                        )}
                                                    </p>
                                                </div>
                                                <MapPin className="h-4 w-4 text-primary" />
                                            </a>
                                        ),
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {t(
                                        'propertyWorkspace.floorsAndSpaces',
                                    ).replace(
                                        ':spaces',
                                        isMarket
                                            ? t('propertyWorkspace.shops')
                                            : t('propertyWorkspace.apartments'),
                                    )}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('propertyWorkspace.basementHelp')}
                                </p>
                            </div>
                            {property.property_type !== 'house' && (
                                <AddFloor property={property} />
                            )}
                        </div>
                        {property.property_type === 'house' ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground">
                                    <Building2 className="mx-auto mb-3 h-10 w-10" />
                                    {t('propertyWorkspace.houseHelp')}
                                </CardContent>
                            </Card>
                        ) : floors.length ? (
                            floors.map((floor) => (
                                <FloorCard
                                    key={floor.id}
                                    property={property}
                                    floor={floor}
                                    isMarket={isMarket}
                                />
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                                {t('propertyWorkspace.noFloors')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function FloorCard({
    property,
    floor,
    isMarket,
}: {
    property: Property;
    floor: PropertyFloor;
    isMarket: boolean;
}) {
    const { t } = useLocalization();
    const spaceLabel = isMarket
        ? t('propertyWorkspace.shops')
        : t('propertyWorkspace.apartments');
    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                    <CardTitle>{floor.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {floor.level_number} ·{' '}
                        {floor.area_sqm
                            ? `${formatNumber(floor.area_sqm)} m²`
                            : '—'}{' '}
                        · {(floor.units ?? []).length} {spaceLabel}
                    </p>
                </div>
                <div className="flex gap-1">
                    <AddUnit
                        property={property}
                        floor={floor}
                        isMarket={isMarket}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t('propertyWorkspace.deleteFloor')}
                        onClick={() =>
                            confirm(t('propertyWorkspace.deleteFloor')) &&
                            router.delete(
                                `/properties/${property.id}/floors/${floor.id}`,
                            )
                        }
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {floor.units?.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {floor.units.map((unit) => (
                            <div
                                key={unit.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div>
                                    <div className="flex items-center gap-2 font-medium">
                                        <Store className="h-4 w-4" />
                                        {isMarket
                                            ? t('propertyWorkspace.shops')
                                            : t(
                                                  'propertyWorkspace.apartments',
                                              )}{' '}
                                        {unit.unit_number}
                                        <Badge
                                            variant={
                                                unit.occupancy_status ===
                                                'vacant'
                                                    ? 'success'
                                                    : 'secondary'
                                            }
                                        >
                                            {unit.occupancy_status}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {unit.area_sqm
                                            ? `${formatNumber(unit.area_sqm)} m²`
                                            : '—'}
                                        {!isMarket &&
                                            ` · ${unit.rooms_count ?? 0} ${t('propertyWorkspace.rooms')} · ${unit.bathrooms_count ?? 0} ${t('propertyWorkspace.bathrooms')}`}
                                    </p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() =>
                                        confirm(
                                            t('propertyWorkspace.deleteSpace'),
                                        ) &&
                                        router.delete(
                                            `/properties/${property.id}/floors/${floor.id}/units/${unit.id}`,
                                        )
                                    }
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-lg bg-muted/50 py-8 text-center text-sm text-muted-foreground">
                        {t('propertyWorkspace.noSpaces').replace(
                            ':spaces',
                            spaceLabel,
                        )}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
function AddFloor({ property }: { property: Property }) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        level_number: '0',
        area_sqm: '',
        planned_units: '',
        usage_type: property.usage_type ?? 'commercial',
        description: '',
    });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(`/properties/${property.id}/floors`, {
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="me-2 h-4 w-4" />
                    {t('propertyWorkspace.addFloor')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('propertyWorkspace.addFloor')}</DialogTitle>
                    <DialogDescription>
                        {t('propertyWorkspace.basementHelp')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label={t('propertyWorkspace.fields.floorName')}
                        error={form.errors.name}
                    >
                        <Input
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label={t('propertyWorkspace.fields.levelNumber')}
                        error={form.errors.level_number}
                    >
                        <NumericInput
                            value={form.data.level_number}
                            onValueChange={(value) =>
                                form.setData('level_number', value)
                            }
                            showControls={false}
                        />
                    </Field>
                    <Field label={t('propertyWorkspace.fields.area')}>
                        <NumericInput
                            min="0"
                            step="any"
                            value={form.data.area_sqm}
                            onValueChange={(value) =>
                                form.setData('area_sqm', value)
                            }
                            showControls={false}
                        />
                    </Field>
                    <Field label={t('propertyWorkspace.fields.plannedSpaces')}>
                        <NumericInput
                            min="0"
                            value={form.data.planned_units}
                            onValueChange={(value) =>
                                form.setData('planned_units', value)
                            }
                            showControls={false}
                        />
                    </Field>
                    <Field
                        label={t('propertyWorkspace.fields.description')}
                        className="sm:col-span-2"
                    >
                        <Textarea
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                        />
                    </Field>
                    <Button
                        className="sm:col-span-2"
                        disabled={form.processing}
                    >
                        {t('propertyWorkspace.addFloor')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
function AddUnit({
    property,
    floor,
    isMarket,
}: {
    property: Property;
    floor: PropertyFloor;
    isMarket: boolean;
}) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const form = useForm({
        unit_number: '',
        area_sqm: '',
        width_m: '',
        length_m: '',
        rooms_count: '',
        kitchens_count: '',
        halls_count: '',
        bathrooms_count: '',
        occupancy_status: 'vacant',
        electricity_meter: '',
        water_meter: '',
        description: '',
    });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(`/properties/${property.id}/floors/${floor.id}/units`, {
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };
    const addLabel = isMarket
        ? t('propertyWorkspace.addShop')
        : t('propertyWorkspace.addApartment');
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Plus className="me-1 h-4 w-4" />
                    {addLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{addLabel}</DialogTitle>
                    <DialogDescription>
                        {floor.name} · {property.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label={t(
                            isMarket
                                ? 'propertyWorkspace.fields.shopNumber'
                                : 'propertyWorkspace.fields.apartmentNumber',
                        )}
                        error={form.errors.unit_number}
                    >
                        <Input
                            value={form.data.unit_number}
                            onChange={(e) =>
                                form.setData('unit_number', e.target.value)
                            }
                        />
                    </Field>
                    <Field label={t('propertyWorkspace.fields.area')}>
                        <NumericInput
                            min="0"
                            step="any"
                            value={form.data.area_sqm}
                            onValueChange={(value) =>
                                form.setData('area_sqm', value)
                            }
                            showControls={false}
                        />
                    </Field>
                    {isMarket ? (
                        <>
                            <Field label={t('propertyWorkspace.fields.width')}>
                                <NumericInput
                                    min="0"
                                    step="any"
                                    value={form.data.width_m}
                                    onValueChange={(value) =>
                                        form.setData('width_m', value)
                                    }
                                    showControls={false}
                                />
                            </Field>
                            <Field label={t('propertyWorkspace.fields.length')}>
                                <NumericInput
                                    min="0"
                                    step="any"
                                    value={form.data.length_m}
                                    onValueChange={(value) =>
                                        form.setData('length_m', value)
                                    }
                                    showControls={false}
                                />
                            </Field>
                        </>
                    ) : (
                        <>
                            <CountInput
                                icon={BedDouble}
                                label={t('propertyWorkspace.fields.rooms')}
                                value={form.data.rooms_count}
                                set={(v) => form.setData('rooms_count', v)}
                            />
                            <CountInput
                                icon={ChefHat}
                                label={t('propertyWorkspace.fields.kitchens')}
                                value={form.data.kitchens_count}
                                set={(v) => form.setData('kitchens_count', v)}
                            />
                            <CountInput
                                icon={DoorOpen}
                                label={t('propertyWorkspace.fields.halls')}
                                value={form.data.halls_count}
                                set={(v) => form.setData('halls_count', v)}
                            />
                            <CountInput
                                icon={Bath}
                                label={t('propertyWorkspace.fields.bathrooms')}
                                value={form.data.bathrooms_count}
                                set={(v) => form.setData('bathrooms_count', v)}
                            />
                        </>
                    )}
                    <Field
                        label={t('propertyWorkspace.fields.electricityMeter')}
                    >
                        <Input
                            value={form.data.electricity_meter}
                            onChange={(e) =>
                                form.setData(
                                    'electricity_meter',
                                    e.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field label={t('propertyWorkspace.fields.waterMeter')}>
                        <Input
                            value={form.data.water_meter}
                            onChange={(e) =>
                                form.setData('water_meter', e.target.value)
                            }
                        />
                    </Field>
                    <Button
                        className="sm:col-span-2"
                        disabled={form.processing}
                    >
                        {addLabel}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
function Metric({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: typeof Store;
    label: string;
    value: string | number;
    hint?: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 py-5">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {hint && (
                        <p className="text-xs text-muted-foreground">{hint}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
function WorkspaceCapability({
    icon: Icon,
    title,
    description,
    planned = false,
    href,
}: {
    icon: typeof Store;
    title: string;
    description: string;
    planned?: boolean;
    href?: string;
}) {
    const { t } = useLocalization();
    const content = (
        <div className="flex h-full gap-3 rounded-xl border bg-muted/20 p-4 transition hover:border-primary/30 hover:bg-primary/5">
            <div className="h-fit rounded-lg bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{title}</p>
                    {planned && (
                        <Badge variant="secondary">
                            {t('propertyWorkspace.plannedLabel')}
                        </Badge>
                    )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            </div>
        </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}
function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b pb-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-end font-medium">{value}</span>
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
function CountInput({
    icon: Icon,
    label,
    value,
    set,
}: {
    icon: typeof Store;
    label: string;
    value: string;
    set: (v: string) => void;
}) {
    return (
        <Field label={label}>
            <div className="relative">
                <Icon className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <NumericInput
                    className="ps-9"
                    min="0"
                    value={value}
                    onValueChange={set}
                    showControls={false}
                />
            </div>
        </Field>
    );
}
function resolveName(value: Property['country'] | Property['province']) {
    return typeof value === 'string' ? value : (value?.name ?? '—');
}
