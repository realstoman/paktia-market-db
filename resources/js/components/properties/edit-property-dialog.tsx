import InputError from '@/components/input-error';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Button } from '@/components/ui/button';
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
import { useLocalization } from '@/lib/localization';
import { Country, Property, Province } from '@/types';
import { useForm } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    property: Property;
    countries: Country[];
    provinces: Province[];
    propertyOptions: Property[];
}

export function EditPropertyDialog({
    property,
    countries,
    provinces,
    propertyOptions,
}: Props) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const form = useForm({
        _method: 'put',
        name: property.name_translations?.fa ?? property.name ?? '',
        name_ps: property.name_translations?.ps ?? '',
        name_en: property.name_translations?.en ?? '',
        address: property.address_translations?.fa ?? property.address ?? '',
        address_ps: property.address_translations?.ps ?? '',
        address_en: property.address_translations?.en ?? '',
        description:
            property.description_translations?.fa ?? property.description ?? '',
        description_ps: property.description_translations?.ps ?? '',
        description_en: property.description_translations?.en ?? '',
        parent_property_id: property.parent_property_id
            ? String(property.parent_property_id)
            : '',
        property_type: property.property_type ?? 'market',
        usage_type: property.usage_type ?? 'commercial',
        country_id: property.country_id ? String(property.country_id) : '',
        province_id: property.province_id ? String(property.province_id) : '',
        distance_from_city_km: editableNumber(property.distance_from_city_km),
        land_area_sqm: editableNumber(property.land_area_sqm),
        building_area_sqm: editableNumber(property.building_area_sqm),
        declared_floors: property.declared_floors
            ? String(property.declared_floors)
            : '',
        declared_units: property.declared_units
            ? String(property.declared_units)
            : '',
        rooms_count: property.rooms_count ? String(property.rooms_count) : '',
        kitchens_count: property.kitchens_count
            ? String(property.kitchens_count)
            : '',
        halls_count: property.halls_count ? String(property.halls_count) : '',
        bathrooms_count: property.bathrooms_count
            ? String(property.bathrooms_count)
            : '',
        parking_spaces: property.parking_spaces
            ? String(property.parking_spaces)
            : '',
        year_built: property.year_built ? String(property.year_built) : '',
        notes: property.notes ?? '',
        image: null as File | null,
    });
    const provinceOptions = provinces.filter(
        (province) =>
            !form.data.country_id ||
            String(province.country_id) === form.data.country_id,
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/properties/${property.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-white text-slate-900 hover:bg-white/90">
                    <Pencil className="me-2 h-4 w-4" />
                    {t('propertyWorkspace.edit')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('propertyWorkspace.editTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('propertyWorkspace.editHelp')}
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={submit}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
                        <div className="sm:col-span-2 lg:col-span-3">
                            <p className="text-sm font-medium">
                                {t('propertyWorkspace.languages.fa')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('propertyWorkspace.dariRequired')}
                            </p>
                        </div>
                        <TextField
                            label={t('propertyWorkspace.fields.name')}
                            value={form.data.name}
                            set={(value) => form.setData('name', value)}
                            error={form.errors.name}
                            dir="rtl"
                        />
                        <TextField
                            label={t('propertyWorkspace.fields.address')}
                            value={form.data.address}
                            set={(value) => form.setData('address', value)}
                            dir="rtl"
                        />
                        <AreaField
                            label={t('propertyWorkspace.fields.description')}
                            value={form.data.description}
                            set={(value) => form.setData('description', value)}
                            dir="rtl"
                        />
                        {(['ps', 'en'] as const).map((locale) => (
                            <div className="contents" key={locale}>
                                <TextField
                                    label={`${t('propertyWorkspace.fields.name')} — ${t(`propertyWorkspace.languages.${locale}`)}`}
                                    value={form.data[`name_${locale}`]}
                                    set={(value) =>
                                        form.setData(`name_${locale}`, value)
                                    }
                                    dir={locale === 'ps' ? 'rtl' : 'ltr'}
                                />
                                <TextField
                                    label={`${t('propertyWorkspace.fields.address')} — ${t(`propertyWorkspace.languages.${locale}`)}`}
                                    value={form.data[`address_${locale}`]}
                                    set={(value) =>
                                        form.setData(`address_${locale}`, value)
                                    }
                                    dir={locale === 'ps' ? 'rtl' : 'ltr'}
                                />
                                <AreaField
                                    label={`${t('propertyWorkspace.fields.description')} — ${t(`propertyWorkspace.languages.${locale}`)}`}
                                    value={form.data[`description_${locale}`]}
                                    set={(value) =>
                                        form.setData(
                                            `description_${locale}`,
                                            value,
                                        )
                                    }
                                    dir={locale === 'ps' ? 'rtl' : 'ltr'}
                                />
                            </div>
                        ))}
                    </div>

                    <Field label={t('propertyWorkspace.fields.type')}>
                        <SearchableDropdown
                            value={form.data.property_type}
                            onValueChange={(value) =>
                                form.setData(
                                    'property_type',
                                    value as
                                        | 'market'
                                        | 'mall'
                                        | 'block'
                                        | 'house',
                                )
                            }
                            options={['market', 'mall', 'block', 'house'].map((value) => ({ value, label: t(`propertyWorkspace.types.${value}`) }))}
                            placeholder={t('propertyWorkspace.fields.type')}
                            searchPlaceholder={t('propertyWorkspace.searchOptions')}
                            emptyText={t('propertyWorkspace.noOptions')}
                        />
                    </Field>
                    <Field label={t('propertyWorkspace.fields.usage')}>
                        <SearchableDropdown
                            value={form.data.usage_type}
                            onValueChange={(value) =>
                                form.setData(
                                    'usage_type',
                                    value as
                                        | 'commercial'
                                        | 'residential'
                                        | 'mixed',
                                )
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
                    <Field label={t('propertyWorkspace.fields.country')}>
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
                    <Field label={t('propertyWorkspace.fields.province')}>
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
                    <Field label={t('propertyWorkspace.relatedLocation')}>
                        <SearchableDropdown
                            value={form.data.parent_property_id || 'none'}
                            onValueChange={(value) =>
                                form.setData(
                                    'parent_property_id',
                                    value === 'none' ? '' : value,
                                )
                            }
                            options={[
                                { value: 'none', label: t('propertyWorkspace.independent') },
                                ...propertyOptions.map((option) => ({ value: String(option.id), label: option.name })),
                            ]}
                            placeholder={t('propertyWorkspace.independent')}
                            searchPlaceholder={t('propertyWorkspace.searchOptions')}
                            emptyText={t('propertyWorkspace.noOptions')}
                        />
                    </Field>
                    <NumericField
                        label={t('propertyWorkspace.fields.distance')}
                        value={form.data.distance_from_city_km}
                        set={(value) =>
                            form.setData('distance_from_city_km', value)
                        }
                    />
                    <NumericField
                        label={t('propertyWorkspace.fields.landArea')}
                        value={form.data.land_area_sqm}
                        set={(value) => form.setData('land_area_sqm', value)}
                    />
                    <NumericField
                        label={t('propertyWorkspace.fields.buildingArea')}
                        value={form.data.building_area_sqm}
                        set={(value) =>
                            form.setData('building_area_sqm', value)
                        }
                    />
                    <NumericField
                        label={t('propertyWorkspace.fields.floors')}
                        value={form.data.declared_floors}
                        set={(value) => form.setData('declared_floors', value)}
                    />
                    <NumericField
                        label={t(
                            ['market', 'mall'].includes(form.data.property_type)
                                ? 'propertyWorkspace.fields.expectedShops'
                                : 'propertyWorkspace.fields.expectedApartments',
                        )}
                        value={form.data.declared_units}
                        set={(value) => form.setData('declared_units', value)}
                    />
                    <NumericField
                        label={t('propertyWorkspace.fields.parking')}
                        value={form.data.parking_spaces}
                        set={(value) => form.setData('parking_spaces', value)}
                    />
                    {form.data.property_type === 'house' && (
                        <>
                            <NumericField
                                label={t('propertyWorkspace.fields.rooms')}
                                value={form.data.rooms_count}
                                set={(value) =>
                                    form.setData('rooms_count', value)
                                }
                            />
                            <NumericField
                                label={t('propertyWorkspace.fields.kitchens')}
                                value={form.data.kitchens_count}
                                set={(value) =>
                                    form.setData('kitchens_count', value)
                                }
                            />
                            <NumericField
                                label={t('propertyWorkspace.fields.halls')}
                                value={form.data.halls_count}
                                set={(value) =>
                                    form.setData('halls_count', value)
                                }
                            />
                            <NumericField
                                label={t('propertyWorkspace.fields.bathrooms')}
                                value={form.data.bathrooms_count}
                                set={(value) =>
                                    form.setData('bathrooms_count', value)
                                }
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
                            {t('propertyWorkspace.save')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
function TextField({
    label,
    value,
    set,
    error,
    dir,
}: {
    label: string;
    value: string;
    set: (value: string) => void;
    error?: string;
    dir: 'rtl' | 'ltr';
}) {
    return (
        <Field label={label} error={error}>
            <Input
                dir={dir}
                value={value}
                onChange={(event) => set(event.target.value)}
            />
        </Field>
    );
}
function AreaField({
    label,
    value,
    set,
    dir,
}: {
    label: string;
    value: string;
    set: (value: string) => void;
    dir: 'rtl' | 'ltr';
}) {
    return (
        <Field label={label}>
            <Textarea
                dir={dir}
                value={value}
                onChange={(event) => set(event.target.value)}
            />
        </Field>
    );
}
function NumericField({
    label,
    value,
    set,
}: {
    label: string;
    value: string;
    set: (value: string) => void;
}) {
    return (
        <Field label={label}>
            <Input
                type="number"
                min="0"
                step="any"
                value={value}
                onChange={(event) => set(event.target.value)}
            />
        </Field>
    );
}

function editableNumber(value: string | number | null | undefined): string {
    return value === null || value === undefined || value === ''
        ? ''
        : String(Number(value));
}
