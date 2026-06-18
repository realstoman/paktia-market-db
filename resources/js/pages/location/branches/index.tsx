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
import { Branch, BreadcrumbItem, Country, Province } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, Home, Layers3, MapPin, Plus, Search, Store } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface Props { branches: Branch[]; countries: Country[]; provinces: Province[] }

const typeMeta = {
    market: { label: 'Market', icon: Store }, mall: { label: 'Mall', icon: Building2 },
    block: { label: 'Residential block', icon: Layers3 }, house: { label: 'House', icon: Home },
} as const;

export default function PropertiesPage({ branches, countries, provinces }: Props) {
    const { t } = useLocalization();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all');
    const form = useForm({
        name: '', property_type: 'market', usage_type: 'commercial', country_id: '', province_id: '',
        address: '', description: '', distance_from_city_km: '', land_area_sqm: '', building_area_sqm: '',
        declared_floors: '', declared_units: '', rooms_count: '', kitchens_count: '', halls_count: '',
        bathrooms_count: '', parking_spaces: '', year_built: '', notes: '', image: null as File | null,
    });
    const provinceOptions = provinces.filter((p) => !form.data.country_id || String(p.country_id) === form.data.country_id);
    const visible = useMemo(() => branches.filter((property) => {
        const haystack = `${property.name} ${property.address ?? ''} ${property.province ?? ''}`.toLowerCase();
        return (type === 'all' || property.property_type === type) && haystack.includes(search.toLowerCase());
    }), [branches, search, type]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/branches', { forceFormData: true, onSuccess: () => { form.reset(); setOpen(false); } });
    };
    const breadcrumbs: BreadcrumbItem[] = [{ title: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' }, { title: 'Markets & Properties', href: '/branches' }];

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
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row">
                <div className="relative flex-1"><Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="ps-9" placeholder="Search by name, address or province…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <Select value={type} onValueChange={setType}><SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All property types</SelectItem>{Object.entries(typeMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select>
            </div>
            {visible.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="rounded-xl border border-dashed py-20 text-center text-muted-foreground">No properties match this view.</div>}
        </div>
    </AppLayout>;
}

function PropertyCard({ property }: { property: Branch }) {
    const meta = typeMeta[(property.property_type as keyof typeof typeMeta) ?? 'market'] ?? typeMeta.market;
    const Icon = meta.icon;
    return <Link href={`/branches/${property.id}`} className="group"><Card className="h-full overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="relative h-44 overflow-hidden bg-muted">{property.image_url ? <img src={property.image_url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950 to-teal-700"><Icon className="h-16 w-16 text-white/70" /></div>}<Badge className="absolute start-3 top-3 bg-background/90 text-foreground backdrop-blur">{meta.label}</Badge></div><CardContent className="space-y-3 p-5"><div><h2 className="text-lg font-semibold">{property.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{property.address || property.province || 'Location not specified'}</p></div><div className="grid grid-cols-3 divide-x rounded-lg bg-muted/60 py-3 text-center text-xs"><Stat value={property.floors_count ?? property.declared_floors ?? 0} label="Floors" /><Stat value={property.units_count ?? property.declared_units ?? 0} label={['market','mall'].includes(property.property_type ?? '') ? 'Shops' : property.property_type === 'block' ? 'Apartments' : 'Rooms'} /><Stat value={property.building_area_sqm ? `${property.building_area_sqm} m²` : '—'} label="Building" /></div></CardContent></Card></Link>;
}
function Stat({ value, label }: { value: string | number; label: string }) { return <div><div className="font-semibold">{value}</div><div className="text-muted-foreground">{label}</div></div>; }
function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: React.ReactNode }) { return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}<InputError message={error} /></div>; }
function NumberField({ label, name, form }: { label: string; name: keyof typeof form.data; form: ReturnType<typeof useForm> }) { return <Field label={label} error={form.errors[name]}><Input type="number" min="0" step="any" value={(form.data[name] as string) ?? ''} onChange={(e) => form.setData(name, e.target.value)} /></Field>; }
