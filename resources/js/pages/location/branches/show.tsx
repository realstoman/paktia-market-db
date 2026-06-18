import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, PropertyFloor } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Bath, BedDouble, Building2, ChefHat, DoorOpen, Layers3, MapPin, Plus, Ruler, Store, Trash2, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function PropertyShow({ branch }: { branch: Branch }) {
    const floors = branch.floors ?? [];
    const units = floors.flatMap((floor) => floor.units ?? []);
    const isMarket = ['market', 'mall'].includes(branch.property_type ?? 'market');
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Markets & Properties', href: '/branches' }, { title: branch.name, href: `/branches/${branch.id}` }];

    return <AppLayout breadcrumbs={breadcrumbs}>
        <Head title={branch.name} />
        <div className="space-y-6">
            <section className="relative min-h-64 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-700">
                {branch.image_url && <img src={branch.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />}
                <div className="relative flex min-h-64 flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-6 text-white md:p-8">
                    <div className="mb-3 flex gap-2"><Badge className="bg-white/90 text-slate-900">{labelType(branch.property_type)}</Badge><Badge variant="outline" className="border-white/50 text-white">{branch.usage_type}</Badge></div>
                    <h1 className="text-3xl font-bold">{branch.name}</h1><p className="mt-2 flex items-center gap-2 text-white/80"><MapPin className="h-4 w-4" />{branch.address || 'Address not specified'}</p>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric icon={Layers3} label="Configured floors" value={floors.length} hint={branch.declared_floors ? `${branch.declared_floors} planned` : undefined} />
                <Metric icon={isMarket ? Store : DoorOpen} label={isMarket ? 'Shops' : branch.property_type === 'block' ? 'Apartments' : 'Rooms'} value={branch.property_type === 'house' ? (branch.rooms_count ?? 0) : units.length} hint={branch.declared_units ? `${branch.declared_units} planned` : undefined} />
                <Metric icon={Ruler} label="Building area" value={branch.building_area_sqm ? `${branch.building_area_sqm} m²` : '—'} />
                <Metric icon={Users} label="Available spaces" value={units.filter((unit) => unit.occupancy_status === 'vacant').length} hint="Ready for future contracts" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
                <Card><CardHeader><CardTitle>Property profile</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Detail label="Country / Province" value={`${resolveName(branch.country)} / ${resolveName(branch.province)}`} /><Detail label="Land area" value={branch.land_area_sqm ? `${branch.land_area_sqm} m²` : '—'} /><Detail label="Distance from city" value={branch.distance_from_city_km ? `${branch.distance_from_city_km} km` : '—'} /><Detail label="Parking" value={branch.parking_spaces ?? '—'} />{branch.property_type === 'house' && <><Detail label="Rooms" value={branch.rooms_count ?? '—'} /><Detail label="Kitchens / halls" value={`${branch.kitchens_count ?? 0} / ${branch.halls_count ?? 0}`} /><Detail label="Bathrooms" value={branch.bathrooms_count ?? '—'} /></>}<div className="pt-2"><p className="font-medium">Description</p><p className="mt-1 text-muted-foreground">{branch.description || 'No description recorded.'}</p></div></CardContent></Card>
                <div className="space-y-4">
                    <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Floors & {isMarket ? 'shops' : 'apartments'}</h2><p className="text-sm text-muted-foreground">Basements use a negative floor number (for example, -1).</p></div>{branch.property_type !== 'house' && <AddFloor property={branch} />}</div>
                    {branch.property_type === 'house' ? <Card><CardContent className="py-10 text-center text-muted-foreground"><Building2 className="mx-auto mb-3 h-10 w-10" />House details are managed at property level. Its complete house can later be assigned to one rental contract.</CardContent></Card> : floors.length ? floors.map((floor) => <FloorCard key={floor.id} property={branch} floor={floor} isMarket={isMarket} />) : <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">No floors yet. Add the basement, ground floor, or upper floors to begin.</div>}
                </div>
            </div>
        </div>
    </AppLayout>;
}

function FloorCard({ property, floor, isMarket }: { property: Branch; floor: PropertyFloor; isMarket: boolean }) {
    return <Card><CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle>{floor.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Level {floor.level_number} · {floor.area_sqm ? `${floor.area_sqm} m²` : 'Area not recorded'} · {(floor.units ?? []).length} {isMarket ? 'shops' : 'apartments'}</p></div><div className="flex gap-1"><AddUnit property={property} floor={floor} isMarket={isMarket} /><Button size="icon" variant="ghost" aria-label="Delete floor" onClick={() => confirm('Delete this floor and all of its spaces?') && router.delete(`/branches/${property.id}/floors/${floor.id}`)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardHeader><CardContent>{floor.units?.length ? <div className="grid gap-3 md:grid-cols-2">{floor.units.map((unit) => <div key={unit.id} className="flex items-center justify-between rounded-lg border p-3"><div><div className="flex items-center gap-2 font-medium"><Store className="h-4 w-4" />{isMarket ? 'Shop' : 'Apartment'} {unit.unit_number}<Badge variant={unit.occupancy_status === 'vacant' ? 'success' : 'secondary'}>{unit.occupancy_status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{unit.area_sqm ? `${unit.area_sqm} m²` : 'No area'}{!isMarket && ` · ${unit.rooms_count ?? 0} rooms · ${unit.bathrooms_count ?? 0} bathrooms`}</p></div><Button size="icon" variant="ghost" onClick={() => confirm('Delete this space?') && router.delete(`/branches/${property.id}/floors/${floor.id}/units/${unit.id}`)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}</div> : <p className="rounded-lg bg-muted/50 py-8 text-center text-sm text-muted-foreground">No {isMarket ? 'shops' : 'apartments'} have been added.</p>}</CardContent></Card>;
}
function AddFloor({ property }: { property: Branch }) {
    const [open, setOpen] = useState(false); const form = useForm({ name: '', level_number: '0', area_sqm: '', planned_units: '', usage_type: property.usage_type ?? 'commercial', description: '' });
    const submit = (e: FormEvent) => { e.preventDefault(); form.post(`/branches/${property.id}/floors`, { onSuccess: () => { form.reset(); setOpen(false); } }); };
    return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="me-2 h-4 w-4" />Add floor</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add floor</DialogTitle><DialogDescription>Use -1, -2 and so on for basement levels.</DialogDescription></DialogHeader><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Field label="Floor name" error={form.errors.name}><Input placeholder="Ground floor" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} /></Field><Field label="Level number" error={form.errors.level_number}><Input type="number" value={form.data.level_number} onChange={(e) => form.setData('level_number', e.target.value)} /></Field><Field label="Area (m²)"><Input type="number" min="0" step="any" value={form.data.area_sqm} onChange={(e) => form.setData('area_sqm', e.target.value)} /></Field><Field label="Planned spaces"><Input type="number" min="0" value={form.data.planned_units} onChange={(e) => form.setData('planned_units', e.target.value)} /></Field><Field label="Description" className="sm:col-span-2"><Textarea value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} /></Field><Button className="sm:col-span-2" disabled={form.processing}>Add floor</Button></form></DialogContent></Dialog>;
}
function AddUnit({ property, floor, isMarket }: { property: Branch; floor: PropertyFloor; isMarket: boolean }) {
    const [open, setOpen] = useState(false); const form = useForm({ unit_number: '', area_sqm: '', width_m: '', length_m: '', rooms_count: '', kitchens_count: '', halls_count: '', bathrooms_count: '', occupancy_status: 'vacant', electricity_meter: '', water_meter: '', description: '' });
    const submit = (e: FormEvent) => { e.preventDefault(); form.post(`/branches/${property.id}/floors/${floor.id}/units`, { onSuccess: () => { form.reset(); setOpen(false); } }); };
    return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="me-1 h-4 w-4" />Add {isMarket ? 'shop' : 'apartment'}</Button></DialogTrigger><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Add {isMarket ? 'shop' : 'apartment'}</DialogTitle><DialogDescription>{floor.name} in {property.name}</DialogDescription></DialogHeader><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Field label={`${isMarket ? 'Shop' : 'Apartment'} number`} error={form.errors.unit_number}><Input value={form.data.unit_number} onChange={(e) => form.setData('unit_number', e.target.value)} /></Field><Field label="Area (m²)"><Input type="number" min="0" step="any" value={form.data.area_sqm} onChange={(e) => form.setData('area_sqm', e.target.value)} /></Field>{isMarket ? <><Field label="Width (m)"><Input type="number" min="0" step="any" value={form.data.width_m} onChange={(e) => form.setData('width_m', e.target.value)} /></Field><Field label="Length (m)"><Input type="number" min="0" step="any" value={form.data.length_m} onChange={(e) => form.setData('length_m', e.target.value)} /></Field></> : <><CountInput icon={BedDouble} label="Rooms" value={form.data.rooms_count} set={(v) => form.setData('rooms_count', v)} /><CountInput icon={ChefHat} label="Kitchens" value={form.data.kitchens_count} set={(v) => form.setData('kitchens_count', v)} /><CountInput icon={DoorOpen} label="Halls" value={form.data.halls_count} set={(v) => form.setData('halls_count', v)} /><CountInput icon={Bath} label="Bathrooms" value={form.data.bathrooms_count} set={(v) => form.setData('bathrooms_count', v)} /></>}<Field label="Electricity meter"><Input value={form.data.electricity_meter} onChange={(e) => form.setData('electricity_meter', e.target.value)} /></Field><Field label="Water meter"><Input value={form.data.water_meter} onChange={(e) => form.setData('water_meter', e.target.value)} /></Field><Button className="sm:col-span-2" disabled={form.processing}>Add {isMarket ? 'shop' : 'apartment'}</Button></form></DialogContent></Dialog>;
}
function Metric({ icon: Icon, label, value, hint }: { icon: typeof Store; label: string; value: string | number; hint?: string }) { return <Card><CardContent className="flex items-center gap-4 py-5"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div></CardContent></Card>; }
function Detail({ label, value }: { label: string; value: React.ReactNode }) { return <div className="flex justify-between gap-4 border-b pb-3"><span className="text-muted-foreground">{label}</span><span className="text-end font-medium">{value}</span></div>; }
function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: React.ReactNode }) { return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}<InputError message={error} /></div>; }
function CountInput({ icon: Icon, label, value, set }: { icon: typeof Store; label: string; value: string; set: (v: string) => void }) { return <Field label={label}><div className="relative"><Icon className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="ps-9" type="number" min="0" value={value} onChange={(e) => set(e.target.value)} /></div></Field>; }
function resolveName(value: Branch['country'] | Branch['province']) { return typeof value === 'string' ? value : value?.name ?? '—'; }
function labelType(type?: string) { return ({ market: 'Market', mall: 'Mall', block: 'Residential block', house: 'House' } as Record<string, string>)[type ?? 'market'] ?? 'Property'; }
