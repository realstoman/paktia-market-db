import InputError from '@/components/input-error';
import { EditPropertyDialog } from '@/components/properties/edit-property-dialog';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
    PropertyDocument,
    PropertyFloor,
    PropertyImage,
    PropertyType,
    PropertyUnit,
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
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    DoorOpen,
    FileText,
    Image as ImageIcon,
    Layers3,
    MapPin,
    Pencil,
    Plus,
    ReceiptText,
    Ruler,
    Search,
    Store,
    Star,
    Trash2,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

interface PropertyShowProps {
    property: Property;
    countries: Country[];
    provinces: Province[];
    propertyOptions: Property[];
    propertyTypes: PropertyType[];
}

export default function PropertyShow({
    property,
    countries,
    provinces,
    propertyOptions,
    propertyTypes,
}: PropertyShowProps) {
    const { t } = useLocalization();
    const floors = property.floors ?? [];
    const units = floors.flatMap((floor) => floor.units ?? []);
    const behavior =
        property.type_definition?.behavior ??
        property.property_type_behavior ??
        (property.property_type === 'mall' ? 'market' : property.property_type);
    const isMarket = behavior === 'market';
    const isCommercialUnit = behavior === 'commercial_unit';
    const propertyTypeLabel =
        property.type_definition?.name ??
        t(`propertyWorkspace.types.${property.property_type ?? 'market'}`);
    const coverImageUrl = property.image_url ?? property.images?.[0]?.url;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('propertyWorkspace.title'), href: '/properties' },
        { title: property.name, href: `/properties/${property.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={property.name} />
            <div className="[**:data-[slot=card]:border-slate-200/80 mx-auto w-full max-w-[1600px] space-y-5 **:data-[slot=card]:rounded-2xl **:data-[slot=card]:bg-white **:data-[slot=card]:shadow-none">
                <section className="relative min-h-64 overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-r from-emerald-950 to-teal-700 shadow-none">
                    {coverImageUrl && (
                        <img
                            src={coverImageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-45"
                        />
                    )}
                    <div className="relative flex min-h-64 flex-col justify-end bg-linear-to-t from-black/80 to-transparent p-6 text-white md:p-8">
                        <div className="mb-3 flex gap-2">
                            <Badge className="bg-white/90 text-slate-900">
                                {propertyTypeLabel}
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
                            <div className="flex flex-wrap items-center gap-2">
                                <BannerAction
                                    href={`/employees?property_id=${property.id}`}
                                    icon={BriefcaseBusiness}
                                    label={t('propertyWorkspace.employees')}
                                />
                                <BannerAction
                                    href={`/finance/expenses?property_id=${property.id}`}
                                    icon={ReceiptText}
                                    label={t('propertyWorkspace.expenses')}
                                />
                                <BannerAction
                                    href={`/shareholders?property_id=${property.id}`}
                                    icon={Users}
                                    label={t('propertyWorkspace.shareholders')}
                                />
                                {!isCommercialUnit && (
                                    <BannerAction
                                        href={`/tenants?property_id=${property.id}`}
                                        icon={DoorOpen}
                                        label={t(
                                            'propertyWorkspace.rentContracts',
                                        )}
                                    />
                                )}
                                <EditPropertyDialog
                                    property={property}
                                    countries={countries}
                                    provinces={provinces}
                                    propertyOptions={propertyOptions}
                                    propertyTypes={propertyTypes}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        icon={Layers3}
                        label={t(
                            isCommercialUnit
                                ? 'propertyWorkspace.fields.externalFloor'
                                : 'propertyWorkspace.configuredFloors',
                        )}
                        value={
                            isCommercialUnit
                                ? (property.external_floor ?? '—')
                                : floors.length
                        }
                        hint={
                            !isCommercialUnit && property.declared_floors
                                ? t('propertyWorkspace.planned').replace(
                                      ':count',
                                      String(property.declared_floors),
                                  )
                                : undefined
                        }
                    />
                    <Metric
                        icon={isMarket || isCommercialUnit ? Store : DoorOpen}
                        label={
                            isCommercialUnit
                                ? t(
                                      'propertyWorkspace.fields.externalUnitNumber',
                                  )
                                : behavior === 'house'
                                  ? t('propertyWorkspace.rooms')
                                  : t('propertyWorkspace.shopsAndApartments')
                        }
                        value={
                            isCommercialUnit
                                ? (property.external_unit_number ?? '—')
                                : behavior === 'house'
                                  ? (property.rooms_count ?? 0)
                                  : units.length
                        }
                        hint={
                            !isCommercialUnit && property.declared_units
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
                            isCommercialUnit
                                ? property.operating_mode === 'vacant'
                                    ? 1
                                    : 0
                                : units.filter(
                                      (unit) =>
                                          unit.occupancy_status === 'vacant',
                                  ).length
                        }
                        hint={
                            isCommercialUnit
                                ? t(
                                      `propertyWorkspace.operatingMode.${property.operating_mode ?? 'owner_occupied'}`,
                                  )
                                : t('propertyWorkspace.contractsReady')
                        }
                    />
                </div>

                <div
                    className={
                        isCommercialUnit
                            ? 'grid gap-6 lg:grid-cols-3'
                            : 'grid gap-6 xl:grid-cols-[1fr_2fr]'
                    }
                >
                    <div
                        className={isCommercialUnit ? 'contents' : 'space-y-6'}
                    >
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
                                {isCommercialUnit && (
                                    <>
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.hostMarketName',
                                            )}
                                            value={
                                                property.host_market_name ?? '—'
                                            }
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.externalUnitNumber',
                                            )}
                                            value={
                                                property.external_unit_number ??
                                                '—'
                                            }
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.externalFloor',
                                            )}
                                            value={
                                                property.external_floor ?? '—'
                                            }
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.ownershipType',
                                            )}
                                            value={t(
                                                `propertyWorkspace.ownership.${property.ownership_type ?? 'owned'}`,
                                            )}
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.operatingMode',
                                            )}
                                            value={t(
                                                `propertyWorkspace.operatingMode.${property.operating_mode ?? 'owner_occupied'}`,
                                            )}
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.titleDeedNumber',
                                            )}
                                            value={
                                                property.title_deed_number ??
                                                '—'
                                            }
                                        />
                                        <Detail
                                            label={t(
                                                'propertyWorkspace.fields.businessActivities',
                                            )}
                                            value={
                                                property.business_activities
                                                    ?.map((activity) =>
                                                        t(
                                                            `propertyWorkspace.businessActivities.${activity}`,
                                                        ),
                                                    )
                                                    .join('، ') || '—'
                                            }
                                        />
                                    </>
                                )}
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
                                {['house', 'commercial_unit'].includes(
                                    behavior ?? '',
                                ) && (
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
                        {!isCommercialUnit &&
                        property.related_locations?.length ? (
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
                        <PropertyDocuments
                            property={property}
                            documents={property.documents ?? []}
                        />
                        <PropertyImageGallery
                            property={property}
                            images={property.images ?? []}
                        />
                    </div>
                    {!isCommercialUnit && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {t(
                                            'propertyWorkspace.floorsAndSpaces',
                                        ).replace(
                                            ':spaces',
                                            t(
                                                'propertyWorkspace.shopsAndApartments',
                                            ),
                                        )}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'propertyWorkspace.basementHelp',
                                        )}
                                    </p>
                                </div>
                                {!['house', 'commercial_unit'].includes(
                                    behavior ?? '',
                                ) && <AddFloor property={property} />}
                            </div>
                            {behavior === 'house' ? (
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
                                    />
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                                    {t('propertyWorkspace.noFloors')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function PropertyDocuments({
    property,
    documents,
}: {
    property: Property;
    documents: PropertyDocument[];
}) {
    const { t } = useLocalization();
    const form = useForm<{
        document_type: string;
        documents: File[];
    }>({
        document_type: 'title_deed',
        documents: [],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/properties/${property.id}/documents`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset('documents'),
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    {t('propertyWorkspace.documents.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    {t('propertyWorkspace.documents.help')}
                </p>
                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-xl border bg-muted/20 p-3"
                >
                    <SearchableDropdown
                        value={form.data.document_type}
                        onValueChange={(value) =>
                            form.setData('document_type', value)
                        }
                        options={[
                            'title_deed',
                            'purchase_contract',
                            'ownership',
                            'other',
                        ].map((value) => ({
                            value,
                            label: t(
                                `propertyWorkspace.documents.types.${value}`,
                            ),
                        }))}
                        placeholder={t('propertyWorkspace.documents.type')}
                        searchPlaceholder={t('propertyWorkspace.searchOptions')}
                        emptyText={t('propertyWorkspace.noOptions')}
                    />
                    <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        className="bg-white dark:bg-neutral-900"
                        onChange={(event) =>
                            form.setData(
                                'documents',
                                Array.from(event.target.files ?? []),
                            )
                        }
                    />
                    <InputError message={form.errors.documents} />
                    <Button
                        type="submit"
                        disabled={
                            form.processing || !form.data.documents.length
                        }
                        className="w-fit gap-2"
                    >
                        <Upload className="size-4" />
                        {t('propertyWorkspace.documents.upload')}
                    </Button>
                </form>
                <div className="space-y-2">
                    {documents.length ? (
                        documents.map((document) => (
                            <div
                                key={document.id}
                                className="flex items-center gap-3 rounded-xl border p-3"
                            >
                                <FileText className="size-5 shrink-0 text-primary" />
                                <a
                                    href={`/properties/${property.id}/documents/${document.id}`}
                                    className="min-w-0 flex-1"
                                >
                                    <p className="truncate text-sm font-medium hover:underline">
                                        {document.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            `propertyWorkspace.documents.types.${document.document_type}`,
                                        )}
                                        {document.size_bytes
                                            ? ` · ${formatNumber(Math.ceil(document.size_bytes / 1024))} KB`
                                            : ''}
                                    </p>
                                </a>
                                <DeleteConfirmation
                                    title={t(
                                        'propertyWorkspace.documents.delete',
                                    )}
                                    description={t(
                                        'propertyWorkspace.documents.deleteConfirm',
                                    )}
                                    confirmLabel={t(
                                        'propertyWorkspace.documents.delete',
                                    )}
                                    onConfirm={() =>
                                        router.delete(
                                            `/properties/${property.id}/documents/${document.id}`,
                                            { preserveScroll: true },
                                        )
                                    }
                                />
                            </div>
                        ))
                    ) : (
                        <p className="py-3 text-center text-sm text-muted-foreground">
                            {t('propertyWorkspace.documents.empty')}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function PropertyImageGallery({
    property,
    images,
}: {
    property: Property;
    images: PropertyImage[];
}) {
    const { t, isRtl } = useLocalization();
    const [activeIndex, setActiveIndex] = useState(() =>
        Math.max(
            0,
            images.findIndex((image) => image.path === property.image_path),
        ),
    );
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const form = useForm<{ images: File[] }>({ images: [] });
    const activeImage = images[activeIndex] ?? images[0];
    const activeIsCover =
        !!activeImage && activeImage.path === property.image_path;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/properties/${property.id}/images`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset('images'),
        });
    };

    const move = (direction: 'previous' | 'next') => {
        if (!images.length) return;
        setActiveIndex((current) => {
            if (direction === 'previous') {
                return current === 0 ? images.length - 1 : current - 1;
            }

            return current === images.length - 1 ? 0 : current + 1;
        });
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="size-5" />
                        {t('propertyWorkspace.images.title', 'Property images')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t(
                            'propertyWorkspace.images.help',
                            'Upload up to 10 gallery images from any angle. Cards and covers keep a fixed size and crop automatically.',
                        )}
                    </p>
                    <form
                        onSubmit={submit}
                        className="grid gap-3 rounded-xl border bg-muted/20 p-3"
                    >
                        <Input
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            className="bg-white dark:bg-neutral-900"
                            onChange={(event) =>
                                form.setData(
                                    'images',
                                    Array.from(event.target.files ?? []).slice(
                                        0,
                                        10,
                                    ),
                                )
                            }
                        />
                        <InputError message={form.errors.images} />
                        <Button
                            type="submit"
                            disabled={
                                form.processing || !form.data.images.length
                            }
                            className="w-fit gap-2"
                        >
                            <Upload className="size-4" />
                            {t(
                                'propertyWorkspace.images.upload',
                                'Upload images',
                            )}
                        </Button>
                    </form>

                    {activeImage ? (
                        <div className="space-y-3">
                            <button
                                type="button"
                                className="group relative aspect-video w-full overflow-hidden rounded-2xl border bg-slate-100 text-start"
                                onClick={() => setLightboxOpen(true)}
                            >
                                <img
                                    src={activeImage.url}
                                    alt={activeImage.original_name ?? ''}
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                                    {t(
                                        'propertyWorkspace.images.openLarge',
                                        'Open large view',
                                    )}
                                </span>
                            </button>
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {activeImage.original_name ??
                                            t(
                                                'propertyWorkspace.images.image',
                                                'Property image',
                                            )}
                                    </p>
                                    {activeIsCover && (
                                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
                                            <CheckCircle2 className="size-3.5" />
                                            {t(
                                                'propertyWorkspace.images.cover',
                                                'Current cover',
                                            )}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            activeIsCover
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        disabled={activeIsCover}
                                        onClick={() =>
                                            router.patch(
                                                `/properties/${property.id}/images/${activeImage.id}/cover`,
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Star className="size-4" />
                                        {t(
                                            'propertyWorkspace.images.setCover',
                                            'Set as cover',
                                        )}
                                    </Button>
                                    <DeleteConfirmation
                                        title={t(
                                            'propertyWorkspace.images.deleteTitle',
                                            'Delete image?',
                                        )}
                                        description={t(
                                            'propertyWorkspace.images.deleteDescription',
                                            'This image will be removed from the property gallery.',
                                        )}
                                        confirmLabel={t(
                                            'propertyWorkspace.images.confirmDelete',
                                            'Delete image',
                                        )}
                                        onConfirm={() =>
                                            router.delete(
                                                `/properties/${property.id}/images/${activeImage.id}`,
                                                { preserveScroll: true },
                                            )
                                        }
                                        compact
                                    />
                                </div>
                            </div>
                            {images.length > 1 && (
                                <div className="max-w-[calc(4*4.5rem+3*0.5rem)] overflow-x-auto pb-1">
                                    <div className="flex w-max gap-2">
                                    {images.map((image, index) => (
                                        <button
                                            key={image.id}
                                            type="button"
                                            onClick={() =>
                                                setActiveIndex(index)
                                            }
                                            className={`h-14 w-18 shrink-0 overflow-hidden rounded-xl border ${
                                                index === activeIndex
                                                    ? 'border-primary ring-2 ring-primary/20'
                                                    : 'border-slate-200'
                                            } relative`}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.original_name ?? ''}
                                                className="h-full w-full object-cover"
                                            />
                                            {image.path ===
                                                property.image_path && (
                                                <span className="absolute top-1 left-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                                                    <CheckCircle2 className="size-3" />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                            <ImageIcon className="mx-auto mb-2 size-8 opacity-50" />
                            {t(
                                'propertyWorkspace.images.empty',
                                'No property images have been uploaded.',
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent
                    dir={isRtl ? 'rtl' : 'ltr'}
                    className="max-w-6xl border-none bg-transparent p-0 shadow-none"
                >
                    <DialogTitle className="sr-only">
                        {t('propertyWorkspace.images.title', 'Property images')}
                    </DialogTitle>
                    {activeImage && (
                        <div className="relative overflow-hidden rounded-3xl bg-black">
                            <img
                                src={activeImage.url}
                                alt={activeImage.original_name ?? ''}
                                className="max-h-[82vh] w-full object-contain"
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="absolute top-4 right-4 rounded-full bg-white/90"
                                onClick={() => setLightboxOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                            {images.length > 1 && (
                                <>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-white/90"
                                        onClick={() => move('previous')}
                                    >
                                        <ChevronLeft className="size-5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="secondary"
                                        className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-white/90"
                                        onClick={() => move('next')}
                                    >
                                        <ChevronRight className="size-5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function FloorCard({
    property,
    floor,
}: {
    property: Property;
    floor: PropertyFloor;
}) {
    const { t } = useLocalization();
    const [spaceSearch, setSpaceSearch] = useState('');
    const shopCount = (floor.units ?? []).filter(
        (unit) => unit.unit_type === 'shop',
    ).length;
    const apartmentCount = (floor.units ?? []).filter(
        (unit) => unit.unit_type === 'apartment',
    ).length;
    const floorUsage = floor.usage_type ?? property.usage_type ?? 'mixed';
    const spacesSummary =
        floorUsage === 'commercial'
            ? `${shopCount} ${t('propertyWorkspace.shops')}`
            : floorUsage === 'residential'
              ? `${apartmentCount} ${t('propertyWorkspace.apartments')}`
              : [
                    `${shopCount} ${t('propertyWorkspace.shops')}`,
                    `${apartmentCount} ${t('propertyWorkspace.apartments')}`,
                ].join(' / ');
    const normalizedSearch = spaceSearch.trim().toLowerCase();
    const visibleUnits = (floor.units ?? []).filter((unit) =>
        `${unit.unit_number} ${unit.description ?? ''} ${unit.electricity_meter ?? ''} ${unit.water_meter ?? ''}`
            .toLowerCase()
            .includes(normalizedSearch),
    );
    const spaceGridClass =
        floorUsage === 'residential'
            ? 'property-space-scroll property-space-scroll--residential'
            : 'property-space-scroll';
    return (
        <Card>
            <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row">
                <div>
                    <CardTitle>{floor.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {floor.area_sqm
                            ? `${formatNumber(floor.area_sqm)} m²`
                            : '—'}
                        · {spacesSummary}
                    </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <AddUnit property={property} floor={floor} />
                    <EditFloor property={property} floor={floor} />
                    <DeleteConfirmation
                        title={t('propertyWorkspace.deleteFloorTitle')}
                        description={t('propertyWorkspace.deleteFloor')}
                        confirmLabel={t('propertyWorkspace.confirmDeleteFloor')}
                        onConfirm={() =>
                            router.delete(
                                `/properties/${property.id}/floors/${floor.id}`,
                                { preserveScroll: true },
                            )
                        }
                    />
                </div>
            </CardHeader>
            <CardContent>
                {floor.units?.length ? (
                    <div className="space-y-3">
                        <div className="relative max-w-sm">
                            <Search className="absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={spaceSearch}
                                onChange={(event) =>
                                    setSpaceSearch(event.target.value)
                                }
                                placeholder={t(
                                    'propertyWorkspace.searchSpaces',
                                )}
                                className="h-9 bg-white ps-9"
                            />
                        </div>
                        {visibleUnits.length ? (
                            <div className={spaceGridClass}>
                                {visibleUnits.map((unit) => (
                                    <div
                                        key={unit.id}
                                        className="flex h-32 flex-col justify-between gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 font-medium">
                                                {unit.unit_type === 'shop' ? (
                                                    <Store className="h-4 w-4" />
                                                ) : (
                                                    <Building2 className="h-4 w-4" />
                                                )}
                                                {unit.unit_type === 'shop'
                                                    ? t('propertyWorkspace.shop')
                                                    : t(
                                                          'propertyWorkspace.apartment',
                                                      )}{' '}
                                                {unit.unit_number}
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {unit.area_sqm
                                                    ? `${formatNumber(unit.area_sqm)} m²`
                                                    : '—'}
                                                {unit.unit_type ===
                                                    'apartment' &&
                                                    ` · ${unit.rooms_count ?? 0} ${t('propertyWorkspace.rooms')} · ${unit.bathrooms_count ?? 0} ${t('propertyWorkspace.bathrooms')}`}
                                            </p>
                                            {unit.description && (
                                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                                    {unit.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center justify-between gap-2 border-t pt-2">
                                            <Badge
                                                variant={
                                                    unit.occupancy_status ===
                                                    'vacant'
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                            >
                                                {t(
                                                    `propertyWorkspace.occupancy.${unit.occupancy_status}`,
                                                    unit.occupancy_status,
                                                )}
                                            </Badge>
                                            <div className="flex gap-1.5">
                                                <EditUnit
                                                    property={property}
                                                    floor={floor}
                                                    unit={unit}
                                                />
                                                <DeleteConfirmation
                                                    title={t(
                                                        'propertyWorkspace.deleteSpaceTitle',
                                                    )}
                                                    description={t(
                                                        'propertyWorkspace.deleteSpace',
                                                    )}
                                                    confirmLabel={t(
                                                        'propertyWorkspace.confirmDeleteSpace',
                                                    )}
                                                    onConfirm={() =>
                                                        router.delete(
                                                            `/properties/${property.id}/floors/${floor.id}/units/${unit.id}`,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    compact
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                                {t('propertyWorkspace.noMatchingSpaces')}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="rounded-lg bg-muted/50 py-8 text-center text-sm text-muted-foreground">
                        {t('propertyWorkspace.noSpaces').replace(
                            ':spaces',
                            t('propertyWorkspace.shopsAndApartments'),
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
            <DialogContent className="bg-[#f8f9fd] [&_input]:bg-white [&_textarea]:bg-white">
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
}: {
    property: Property;
    floor: PropertyFloor;
}) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const form = useForm({
        unit_type:
            floor.usage_type === 'residential' ? 'apartment' : 'shop',
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
    const isShop = form.data.unit_type === 'shop';
    const addLabel = t('propertyWorkspace.addSpace');
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 px-2.5 text-xs">
                    <Plus className="me-1 h-4 w-4" />
                    {addLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#f8f9fd] sm:max-w-2xl [&_input]:bg-white [&_textarea]:bg-white">
                <DialogHeader>
                    <DialogTitle>{addLabel}</DialogTitle>
                    <DialogDescription>
                        {floor.name} · {property.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('propertyWorkspace.fields.unitType')}>
                        <SearchableDropdown
                            value={form.data.unit_type}
                            onValueChange={(value) =>
                                form.setData(
                                    'unit_type',
                                    value as PropertyUnit['unit_type'],
                                )
                            }
                            placeholder={t(
                                'propertyWorkspace.fields.unitType',
                            )}
                            options={[
                                {
                                    value: 'shop',
                                    label: t('propertyWorkspace.shop'),
                                },
                                {
                                    value: 'apartment',
                                    label: t('propertyWorkspace.apartment'),
                                },
                            ]}
                            searchPlaceholder={t(
                                'propertyWorkspace.searchOptions',
                            )}
                            emptyText={t('propertyWorkspace.noOptions')}
                        />
                    </Field>
                    <Field
                        label={t(
                            isShop
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
                    {isShop ? (
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

function EditFloor({
    property,
    floor,
}: {
    property: Property;
    floor: PropertyFloor;
}) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: floor.name,
        level_number: String(floor.level_number),
        area_sqm: String(floor.area_sqm ?? ''),
        planned_units: String(floor.planned_units ?? ''),
        usage_type: floor.usage_type ?? property.usage_type ?? 'commercial',
        description: floor.description ?? '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(`/properties/${property.id}/floors/${floor.id}`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8 border-primary/15 bg-primary/8 text-primary hover:bg-primary/15 hover:text-primary"
                    aria-label={t('propertyWorkspace.editFloor')}
                >
                    <Pencil className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#f8f9fd] sm:max-w-xl [&_input]:bg-white [&_textarea]:bg-white">
                <DialogHeader>
                    <DialogTitle>
                        {t('propertyWorkspace.editFloor')}
                    </DialogTitle>
                    <DialogDescription>{floor.name}</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label={t('propertyWorkspace.fields.floorName')}
                        error={form.errors.name}
                    >
                        <Input
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
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
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                        />
                    </Field>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {t('propertyWorkspace.saveChanges')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUnit({
    property,
    floor,
    unit,
}: {
    property: Property;
    floor: PropertyFloor;
    unit: PropertyUnit;
}) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const form = useForm({
        unit_type: unit.unit_type,
        unit_number: unit.unit_number,
        area_sqm: String(unit.area_sqm ?? ''),
        width_m: String(unit.width_m ?? ''),
        length_m: String(unit.length_m ?? ''),
        rooms_count: String(unit.rooms_count ?? ''),
        kitchens_count: String(unit.kitchens_count ?? ''),
        halls_count: String(unit.halls_count ?? ''),
        bathrooms_count: String(unit.bathrooms_count ?? ''),
        occupancy_status: unit.occupancy_status,
        electricity_meter: unit.electricity_meter ?? '',
        water_meter: unit.water_meter ?? '',
        description: unit.description ?? '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(
            `/properties/${property.id}/floors/${floor.id}/units/${unit.id}`,
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
            },
        );
    };
    const isShop = form.data.unit_type === 'shop';
    const editLabel = t('propertyWorkspace.editSpace');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-7 border-primary/15 bg-primary/8 text-primary hover:bg-primary/15 hover:text-primary"
                    aria-label={editLabel}
                >
                    <Pencil className="size-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto bg-[#f8f9fd] sm:max-w-2xl [&_input]:bg-white [&_textarea]:bg-white">
                <DialogHeader>
                    <DialogTitle>{editLabel}</DialogTitle>
                    <DialogDescription>
                        {floor.name} · {property.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('propertyWorkspace.fields.unitType')}>
                        <SearchableDropdown
                            value={form.data.unit_type}
                            onValueChange={(value) =>
                                form.setData(
                                    'unit_type',
                                    value as PropertyUnit['unit_type'],
                                )
                            }
                            placeholder={t(
                                'propertyWorkspace.fields.unitType',
                            )}
                            options={[
                                {
                                    value: 'shop',
                                    label: t('propertyWorkspace.shop'),
                                },
                                {
                                    value: 'apartment',
                                    label: t('propertyWorkspace.apartment'),
                                },
                            ]}
                            searchPlaceholder={t(
                                'propertyWorkspace.searchOptions',
                            )}
                            emptyText={t('propertyWorkspace.noOptions')}
                        />
                    </Field>
                    <Field
                        label={t(
                            isShop
                                ? 'propertyWorkspace.fields.shopNumber'
                                : 'propertyWorkspace.fields.apartmentNumber',
                        )}
                        error={form.errors.unit_number}
                    >
                        <Input
                            value={form.data.unit_number}
                            onChange={(event) =>
                                form.setData('unit_number', event.target.value)
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
                    {isShop ? (
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
                                set={(value) =>
                                    form.setData('rooms_count', value)
                                }
                            />
                            <CountInput
                                icon={ChefHat}
                                label={t('propertyWorkspace.fields.kitchens')}
                                value={form.data.kitchens_count}
                                set={(value) =>
                                    form.setData('kitchens_count', value)
                                }
                            />
                            <CountInput
                                icon={DoorOpen}
                                label={t('propertyWorkspace.fields.halls')}
                                value={form.data.halls_count}
                                set={(value) =>
                                    form.setData('halls_count', value)
                                }
                            />
                            <CountInput
                                icon={Bath}
                                label={t('propertyWorkspace.fields.bathrooms')}
                                value={form.data.bathrooms_count}
                                set={(value) =>
                                    form.setData('bathrooms_count', value)
                                }
                            />
                        </>
                    )}
                    <Field
                        label={t('propertyWorkspace.fields.occupancyStatus')}
                    >
                        <SearchableDropdown
                            value={form.data.occupancy_status}
                            onValueChange={(value) =>
                                form.setData(
                                    'occupancy_status',
                                    value as PropertyUnit['occupancy_status'],
                                )
                            }
                            placeholder={t(
                                'propertyWorkspace.fields.occupancyStatus',
                            )}
                            options={[
                                'vacant',
                                'occupied',
                                'reserved',
                                'maintenance',
                            ].map((value) => ({
                                value,
                                label: t(
                                    `propertyWorkspace.occupancy.${value}`,
                                ),
                            }))}
                        />
                    </Field>
                    <Field
                        label={t('propertyWorkspace.fields.electricityMeter')}
                    >
                        <Input
                            value={form.data.electricity_meter}
                            onChange={(event) =>
                                form.setData(
                                    'electricity_meter',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field label={t('propertyWorkspace.fields.waterMeter')}>
                        <Input
                            value={form.data.water_meter}
                            onChange={(event) =>
                                form.setData('water_meter', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label={t('propertyWorkspace.fields.description')}
                        className="sm:col-span-2"
                    >
                        <Textarea
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                        />
                    </Field>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {t('propertyWorkspace.saveChanges')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteConfirmation({
    title,
    description,
    confirmLabel,
    onConfirm,
    compact = false,
}: {
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    compact?: boolean;
}) {
    const { t, isRtl } = useLocalization();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className={
                        compact
                            ? 'size-7 border-destructive/15 bg-destructive/8 text-destructive hover:bg-destructive/15 hover:text-destructive'
                            : 'size-8 border-destructive/15 bg-destructive/8 text-destructive hover:bg-destructive/15 hover:text-destructive'
                    }
                    aria-label={confirmLabel}
                >
                    <Trash2 className={compact ? 'size-3' : 'size-3.5'} />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                <AlertDialogHeader
                    className={isRtl ? 'text-right sm:text-right' : ''}
                >
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
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

function BannerAction({
    href,
    icon: Icon,
    label,
}: {
    icon: typeof Store;
    href: string;
    label: string;
}) {
    return (
        <Button
            asChild
            variant="secondary"
            className="bg-white/90 text-slate-900 hover:bg-white"
        >
            <Link href={href}>
                <Icon className="me-2 size-4" />
                {label}
            </Link>
        </Button>
    );
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
                <Icon className="absolute inset-s-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
