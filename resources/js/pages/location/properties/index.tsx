import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Property, BreadcrumbItem, Country, Province } from '@/types';
import { Head, Link, useForm, type InertiaFormProps } from '@inertiajs/react';
import { Building2, CheckCircle2, DoorOpen, Home, Layers3, MapPin, Plus, Search, Store } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface Props { properties: Property[]; propertyOptions: Property[]; countries: Country[]; provinces: Province[] }

const typeMeta = {
    market: { label: 'Market', icon: Store }, mall: { label: 'Mall', icon: Building2 },
    block: { label: 'Residential block', icon: Layers3 }, house: { label: 'House', icon: Home },
} as const;

interface PropertyForm {
    name: string; parent_property_id: string; property_type: string; usage_type: string;
    country_id: string; province_id: string; address: string; description: string;
    distance_from_city_km: string; land_area_sqm: string; building_area_sqm: string;
    declared_floors: string; declared_units: string; rooms_count: string;
    kitchens_count: string; halls_count: string; bathrooms_count: string;
    parking_spaces: string; year_built: string; notes: string; image: File | null;
}

type NumericPropertyField = 'distance_from_city_km' | 'land_area_sqm' | 'building_area_sqm' | 'declared_floors' | 'declared_units' | 'rooms_count' | 'kitchens_count' | 'halls_count' | 'bathrooms_count' | 'parking_spaces';

export default function PropertiesPage({ properties, propertyOptions, countries, provinces }: Props) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const form = useForm<PropertyForm>({
        name: '', parent_property_id: '', property_type: 'market', usage_type: 'commercial', country_id: '', province_id: '',
        address: '', description: '', distance_from_city_km: '', land_area_sqm: '', building_area_sqm: '',
        declared_floors: '', declared_units: '', rooms_count: '', kitchens_count: '', halls_count: '',
        bathrooms_count: '', parking_spaces: '', year_built: '', notes: '', image: null as File | null,
    });
    const provinceOptions = provinces.filter((p) => !form.data.country_id || String(p.country_id) === form.data.country_id);
    const visible = useMemo(() => properties.filter((property) => {
        const haystack = `${property.name} ${property.address ?? ''} ${property.province ?? ''}`.toLowerCase();
        return (type === 'all' || property.property_type === type) && haystack.includes(search.toLowerCase());
    }), [properties, search, type]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/properties', { forceFormData: true, onSuccess: () => { form.reset(); setOpen(false); } });
    };
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' }, { title: 'Markets & Properties', href: '/properties' }];

    return <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Markets & Properties" />
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div><h1 className="text-2xl font-bold">Markets & Properties</h1><p className="text-sm text-muted-foreground">Manage markets, malls, residential blocks, houses, floors and rentable spaces.</p></div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button><Plus className="me-2 h-4 w-4" />Register property</Button></DialogTrigger>
                    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader><DialogTitle>Register market or property</DialogTitle><DialogDescription>Start with the property profile. Floors and rentable spaces are added from its detail page.</DialogDescription></DialogHeader>
                        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Name" error={form.errors.name}><Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></Field>
                            <Field label="Property type" error={form.errors.property_type}><Select value={form.data.property_type} onValueChange={(v) => form.setData('property_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select></Field>
                            <Field label="Use"><Select value={form.data.usage_type} onValueChange={(v) => form.setData('usage_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="residential">Residential</SelectItem><SelectItem value="mixed">Mixed use</SelectItem></SelectContent></Select></Field>
                            <Field label="Country" error={form.errors.country_id}><Select value={form.data.country_id} onValueChange={(v) => { form.setData('country_id', v); form.setData('province_id', ''); }}><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger><SelectContent>{countries.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></Field>
                            <Field label="Province" error={form.errors.province_id}><Select value={form.data.province_id} onValueChange={(v) => form.setData('province_id', v)}><SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger><SelectContent>{provinceOptions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent></Select></Field>
                            <Field label="Photo" error={form.errors.image}><Input type="file" accept="image/*" onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} /></Field>
                            <Field label="Related property location" className="sm:col-span-2 lg:col-span-3" error={form.errors.parent_property_id}><Select value={form.data.parent_property_id || 'none'} onValueChange={(value) => form.setData('parent_property_id', value === 'none' ? '' : value)}><SelectTrigger><SelectValue placeholder="Independent property" /></SelectTrigger><SelectContent><SelectItem value="none">Independent property</SelectItem>{propertyOptions.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} · {typeMeta[item.property_type ?? 'market']?.label ?? 'Property'}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Choose the original market or property when this is another location in a different province or country.</p></Field>
                            <Field label="Address" className="sm:col-span-2 lg:col-span-3" error={form.errors.address}><Input value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} /></Field>
                            <NumberField label="Distance from city (km)" name="distance_from_city_km" form={form} />
                            <NumberField label="Land area (m²)" name="land_area_sqm" form={form} />
                            <NumberField label="Building area (m²)" name="building_area_sqm" form={form} />
                            <NumberField label="Number of floors" name="declared_floors" form={form} />
                            <NumberField label={['market','mall'].includes(form.data.property_type) ? 'Expected shops' : 'Expected apartments'} name="declared_units" form={form} />
                            <NumberField label="Parking spaces" name="parking_spaces" form={form} />
                            {form.data.property_type === 'house' && <><NumberField label="Rooms" name="rooms_count" form={form} /><NumberField label="Kitchens" name="kitchens_count" form={form} /><NumberField label="Halls" name="halls_count" form={form} /><NumberField label="Bathrooms" name="bathrooms_count" form={form} /></>}
                            <Field label="Description" className="sm:col-span-2 lg:col-span-3"><Textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} /></Field>
                            <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={form.processing}>Register property</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <PortfolioMetric icon={Building2} label="Total properties" value={properties.length} />
                <PortfolioMetric icon={Store} label="Markets & malls" value={properties.filter((item) => ['market', 'mall'].includes(item.property_type ?? '')).length} />
                <PortfolioMetric icon={Home} label="Houses & blocks" value={properties.filter((item) => ['house', 'block'].includes(item.property_type ?? '')).length} />
                <PortfolioMetric icon={DoorOpen} label="Configured spaces" value={properties.reduce((total, item) => total + (item.units_count ?? 0), 0)} />
            </div>
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row">
                <div className="relative flex-1"><Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="ps-9" placeholder="Search by name, address or province…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <Select value={type} onValueChange={setType}><SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All property types</SelectItem>{Object.entries(typeMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select>
            </div>
            {visible.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">No properties match this view.</div>}
        </div>
    </AppLayout>;
}

function PropertyCard({ property }: { property: Property }) {
    const meta = typeMeta[(property.property_type as keyof typeof typeMeta) ?? 'market'] ?? typeMeta.market;
    const Icon = meta.icon;
    return <Link href={`/properties/${property.id}`} className="group"><Card className="h-full overflow-hidden p-0 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"><div className="relative h-48 overflow-hidden bg-muted">{property.image_url ? <img src={property.image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-700"><Icon className="h-16 w-16 text-white/70" /></div>}<div className="absolute inset-x-0 top-0 flex justify-between p-3"><Badge className="bg-background/90 text-foreground backdrop-blur">{meta.label}</Badge><Badge variant="outline" className="border-white/40 bg-black/20 text-white backdrop-blur"><CheckCircle2 className="me-1 h-3 w-3" />{property.is_active ? 'Active' : 'Inactive'}</Badge></div></div><CardContent className="space-y-4 p-5"><div><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-semibold">{property.name}</h2><Badge variant="secondary">{property.usage_type}</Badge></div>{property.parent_property && <p className="mt-1 text-xs font-medium text-primary">Related to {property.parent_property.name}</p>}<p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{property.address || resolveLocationName(property.province) || 'Location not specified'}</p></div><div className="grid grid-cols-3 divide-x rounded-xl bg-muted/60 py-3 text-center text-xs"><Stat value={property.floors_count ?? property.declared_floors ?? 0} label="Floors" /><Stat value={property.units_count ?? property.declared_units ?? 0} label={['market','mall'].includes(property.property_type ?? '') ? 'Shops' : property.property_type === 'block' ? 'Apartments' : 'Rooms'} /><Stat value={property.building_area_sqm ? `${property.building_area_sqm} m²` : '—'} label="Building" /></div><div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>Employees, expenses & reports ready</span><span className="font-medium text-primary">Open workspace →</span></div></CardContent></Card></Link>;
}
function PortfolioMetric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-4 py-5"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>; }
function Stat({ value, label }: { value: string | number; label: string }) { return <div><div className="font-semibold">{value}</div><div className="text-muted-foreground">{label}</div></div>; }
function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: React.ReactNode }) { return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}<InputError message={error} /></div>; }
function NumberField({ label, name, form }: { label: string; name: NumericPropertyField; form: InertiaFormProps<PropertyForm> }) { return <Field label={label} error={form.errors[name]}><Input type="number" min="0" step="any" value={form.data[name]} onChange={(e) => form.setData(name, e.target.value)} /></Field>; }
function resolveLocationName(value: Property['province']) { return typeof value === 'string' ? value : value?.name; }
