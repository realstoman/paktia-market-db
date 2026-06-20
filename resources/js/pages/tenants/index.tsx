import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
    BreadcrumbItem,
    Currency,
    Lease,
    Property,
    SharedData,
    Tenant,
} from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    ContactRound,
    IdCard,
    MapPin,
    Plus,
    ScanLine,
    Search,
    ShieldCheck,
    Store,
    UserRound,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface Props {
    tenants: Tenant[];
    properties: Property[];
    currencies: Currency[];
    initialPropertyId?: number | null;
}
interface FormData {
    tenant_type: string;
    full_name: string;
    father_name: string;
    business_name: string;
    phone: string;
    whatsapp: string;
    email: string;
    nid_number: string;
    license_number: string;
    address: string;
    notes: string;
    photo: File | null;
    documents: File[];
    property_id: string;
    property_unit_id: string;
    start_date: string;
    end_date: string;
    rent_amount: string;
    security_deposit: string;
    currency_id: string;
    payment_frequency: string;
    status: string;
    terms: string;
    lease_notes: string;
}

const today = () => new Date().toLocaleDateString('en-CA');
const emptyForm = (): FormData => ({
    tenant_type: 'individual',
    full_name: '',
    father_name: '',
    business_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    nid_number: '',
    license_number: '',
    address: '',
    notes: '',
    photo: null,
    documents: [],
    property_id: '',
    property_unit_id: '',
    start_date: today(),
    end_date: '',
    rent_amount: '',
    security_deposit: '',
    currency_id: '',
    payment_frequency: 'monthly',
    status: 'active',
    terms: '',
    lease_notes: '',
});
const currentLease = (tenant: Tenant): Lease | undefined =>
    (tenant.leases ?? []).find(
        (lease) =>
            lease.status === 'active' &&
            lease.start_date <= today() &&
            (!lease.end_date || lease.end_date >= today()),
    );
const initials = (name: string) =>
    name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
const spaceLabel = (
    lease: Lease | undefined,
    t: (key: string, fallback?: string) => string,
) => {
    if (!lease) return t('tenants.lease.noAssignment');
    const type = t(
        `tenants.lease.${lease.leased_space_type}`,
        lease.leased_space_type,
    );
    const unit = lease.unit ? ` ${lease.unit.unit_number}` : '';
    return `${lease.property?.name ?? ''} · ${type}${unit}`;
};

export default function TenantsIndex({
    tenants,
    properties,
    currencies,
    initialPropertyId,
}: Props) {
    const { t, isRtl } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('tenants.manage');
    const [search, setSearch] = useState('');
    const [scan, setScan] = useState('');
    const [open, setOpen] = useState(false);
    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return tenants;
        return tenants.filter((tenant) =>
            `${tenant.full_name} ${tenant.business_name ?? ''} ${tenant.phone} ${tenant.card_code}`
                .toLowerCase()
                .includes(query),
        );
    }, [search, tenants]);
    const activeLeases = tenants.filter((tenant) =>
        currentLease(tenant),
    ).length;
    const propertyCount = new Set(
        tenants.flatMap((tenant) =>
            (tenant.leases ?? []).map((lease) => lease.property_id),
        ),
    ).size;
    const openScannedProfile = () => {
        const match = tenants.find(
            (tenant) =>
                tenant.card_code.toLowerCase() === scan.trim().toLowerCase(),
        );
        if (match) router.visit(`/tenants/${match.id}`);
        else setSearch(scan);
    };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard'), href: '/dashboard' },
        { title: t('tenants.title'), href: '/tenants' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('tenants.title')} />
            <div
                className="mx-auto w-full max-w-[1600px] space-y-6"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl sm:p-8">
                    <div className="absolute -end-10 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                        <div className="max-w-2xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm">
                                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                                {t('tenants.identity')}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {t('tenants.title')}
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                                {t('tenants.subtitle')}
                            </p>
                        </div>
                        {canManage && (
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-11 rounded-xl bg-white px-5 text-slate-950 hover:bg-slate-100">
                                        <Plus className="me-2 h-4 w-4" />
                                        {t('tenants.register')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-5xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {t('tenants.register')}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {t('tenants.subtitle')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <TenantForm
                                        properties={properties}
                                        currencies={currencies}
                                        initialPropertyId={initialPropertyId}
                                        onDone={() => setOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        [ContactRound, t('tenants.total'), tenants.length],
                        [IdCard, t('tenants.assigned'), activeLeases],
                        [
                            Store,
                            t('tenants.businesses'),
                            tenants.filter((item) => item.business_name).length,
                        ],
                        [Building2, t('tenants.properties'), propertyCount],
                    ].map(([Icon, label, value], index) => (
                        <Card
                            key={index}
                            className="rounded-2xl border-border/60 shadow-sm"
                        >
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">
                                        {value as number}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {label as string}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-[1fr_1.35fr]">
                    <div>
                        <Label className="mb-2 flex items-center gap-2">
                            <ScanLine className="h-4 w-4 text-primary" />
                            {t('tenants.scan')}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                className="bg-white dark:bg-neutral-950"
                                value={scan}
                                onChange={(event) =>
                                    setScan(event.target.value)
                                }
                                onKeyDown={(event) =>
                                    event.key === 'Enter' &&
                                    openScannedProfile()
                                }
                                placeholder={t('tenants.scanPlaceholder')}
                                autoComplete="off"
                            />
                            <Button
                                variant="outline"
                                onClick={openScannedProfile}
                            >
                                <ScanLine className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {t('tenants.scanHelp')}
                        </p>
                    </div>
                    <div>
                        <Label className="mb-2 flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {t('common.search', 'Search')}
                        </Label>
                        <Input
                            className="bg-white dark:bg-neutral-950"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t('tenants.searchPlaceholder')}
                        />
                    </div>
                </section>

                {visible.length ? (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {visible.map((tenant) => {
                            const lease = currentLease(tenant);
                            return (
                                <Card
                                    key={tenant.id}
                                    className="group overflow-hidden rounded-2xl border-border/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-sky-500" />
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-14 w-14 rounded-2xl">
                                                <AvatarImage
                                                    src={
                                                        tenant.photo_url ??
                                                        undefined
                                                    }
                                                />
                                                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary">
                                                    {initials(tenant.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h2 className="truncate text-lg font-semibold">
                                                            {tenant.business_name ||
                                                                tenant.full_name}
                                                        </h2>
                                                        {tenant.business_name && (
                                                            <p className="truncate text-sm text-muted-foreground">
                                                                {
                                                                    tenant.full_name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            tenant.is_active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {t(
                                                            tenant.is_active
                                                                ? 'tenants.active'
                                                                : 'tenants.inactive',
                                                        )}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-5 space-y-2.5 rounded-xl bg-muted/45 p-3 text-sm">
                                            <p className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                                                <span className="truncate">
                                                    {spaceLabel(lease, t)}
                                                </span>
                                            </p>
                                            <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                                                <IdCard className="h-4 w-4" />
                                                {tenant.card_code}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                {tenant.phone}
                                            </span>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="rounded-lg"
                                            >
                                                <Link
                                                    href={`/tenants/${tenant.id}`}
                                                >
                                                    {t('tenants.viewProfile')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>
                ) : (
                    <div className="rounded-2xl border border-dashed bg-card py-16 text-center text-muted-foreground">
                        <UserRound className="mx-auto mb-3 h-10 w-10 opacity-40" />
                        {t('tenants.empty')}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function TenantForm({
    properties,
    currencies,
    initialPropertyId,
    onDone,
}: {
    properties: Property[];
    currencies: Currency[];
    initialPropertyId?: number | null;
    onDone: () => void;
}) {
    const { t } = useLocalization();
    const initial = emptyForm();
    initial.property_id = initialPropertyId ? String(initialPropertyId) : '';
    const { data, setData, post, processing, errors, reset } =
        useForm<FormData>(initial);
    const property = properties.find(
        (item) => String(item.id) === data.property_id,
    );
    const unitOptions =
        ['house', 'commercial_unit'].includes(
            property?.property_type ?? '',
        )
            ? [{ value: '', label: t('tenants.lease.wholeProperty') }]
            : [
                  ...(property?.property_type === 'block'
                      ? [{ value: '', label: t('tenants.lease.wholeProperty') }]
                      : []),
                  ...(property?.floors ?? []).flatMap((floor) =>
                      (floor.units ?? []).map((unit) => ({
                          value: String(unit.id),
                          label: `${floor.name} · ${t(`tenants.lease.${unit.unit_type}`)} ${unit.unit_number}`,
                      })),
                  ),
              ];
    const submit = (event: FormEvent) => {
        event.preventDefault();
        post('/tenants', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onDone();
            },
        });
    };
    const field = (key: keyof FormData, label: string, type = 'text') => (
        <div className="space-y-1.5">
            <Label htmlFor={`tenant-${key}`}>{label}</Label>
            <Input
                id={`tenant-${key}`}
                type={type}
                value={data[key] as string}
                onChange={(event) => setData(key, event.target.value as never)}
            />
            <InputError message={errors[key]} />
        </div>
    );

    return (
        <form onSubmit={submit} className="space-y-6">
            <section className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold">
                    <UserRound className="h-4 w-4 text-primary" />
                    {t('tenants.identity')}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label>{t('tenants.fields.tenantType')}</Label>
                        <SearchableDropdown
                            value={data.tenant_type}
                            onValueChange={(value) =>
                                setData('tenant_type', value)
                            }
                            placeholder={t('tenants.fields.select')}
                            options={[
                                {
                                    value: 'individual',
                                    label: t('tenants.individual'),
                                },
                                {
                                    value: 'company',
                                    label: t('tenants.company'),
                                },
                            ]}
                        />
                    </div>
                    {field('full_name', t('tenants.fields.fullName'))}
                    {field('father_name', t('tenants.fields.fatherName'))}
                    {field('business_name', t('tenants.fields.businessName'))}
                    {field('phone', t('tenants.fields.phone'))}
                    {field('whatsapp', t('tenants.fields.whatsapp'))}
                    {field('email', t('tenants.fields.email'), 'email')}
                    {field('nid_number', t('tenants.fields.nid'))}
                    {field('license_number', t('tenants.fields.license'))}
                    <div className="space-y-1.5">
                        <Label>{t('tenants.fields.photo')}</Label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setData(
                                    'photo',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <Label>{t('tenants.fields.address')}</Label>
                        <Input
                            value={data.address}
                            onChange={(event) =>
                                setData('address', event.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <Label>{t('tenants.fields.documents')}</Label>
                        <Input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            onChange={(event) =>
                                setData(
                                    'documents',
                                    Array.from(event.target.files ?? []),
                                )
                            }
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                        <Label>{t('tenants.fields.notes')}</Label>
                        <Textarea
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                        />
                    </div>
                </div>
            </section>
            <section className="space-y-4 rounded-2xl border bg-muted/25 p-4">
                <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                        <Building2 className="h-4 w-4 text-primary" />
                        {t('tenants.lease.title')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {t('tenants.lease.optional')}
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label>{t('tenants.lease.property')}</Label>
                        <SearchableDropdown
                            value={data.property_id}
                            onValueChange={(value) => {
                                setData('property_id', value);
                                setData('property_unit_id', '');
                            }}
                            placeholder={t('tenants.fields.select')}
                            options={properties.map((item) => ({
                                value: String(item.id),
                                label: item.name,
                            }))}
                        />
                        <InputError message={errors.property_id} />
                    </div>
                    {data.property_id && (
                        <div className="space-y-1.5">
                            <Label>{t('tenants.lease.space')}</Label>
                            <SearchableDropdown
                                value={data.property_unit_id}
                                onValueChange={(value) =>
                                    setData('property_unit_id', value)
                                }
                                placeholder={t('tenants.fields.select')}
                                options={unitOptions}
                            />
                            <InputError message={errors.property_unit_id} />
                        </div>
                    )}
                    {field('start_date', t('tenants.lease.startDate'), 'date')}
                    {field('end_date', t('tenants.lease.endDate'), 'date')}
                    <div className="space-y-1.5">
                        <Label>{t('tenants.lease.rent')}</Label>
                        <NumericInput
                            showControls={false}
                            min="0"
                            step="1"
                            value={data.rent_amount}
                            onValueChange={(value) =>
                                setData('rent_amount', value)
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('tenants.lease.deposit')}</Label>
                        <NumericInput
                            showControls={false}
                            min="0"
                            step="1"
                            value={data.security_deposit}
                            onValueChange={(value) =>
                                setData('security_deposit', value)
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('tenants.lease.currency')}</Label>
                        <SearchableDropdown
                            value={data.currency_id}
                            onValueChange={(value) =>
                                setData('currency_id', value)
                            }
                            placeholder={t('tenants.fields.select')}
                            options={currencies.map((currency) => ({
                                value: String(currency.id),
                                label: `${currency.code} · ${currency.symbol}`,
                            }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('tenants.lease.frequency')}</Label>
                        <SearchableDropdown
                            value={data.payment_frequency}
                            onValueChange={(value) =>
                                setData('payment_frequency', value)
                            }
                            placeholder={t('tenants.fields.select')}
                            options={['monthly', 'quarterly', 'yearly'].map(
                                (value) => ({
                                    value,
                                    label: t(`tenants.lease.${value}`),
                                }),
                            )}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('tenants.lease.status')}</Label>
                        <SearchableDropdown
                            value={data.status}
                            onValueChange={(value) => setData('status', value)}
                            placeholder={t('tenants.fields.select')}
                            options={['active', 'draft'].map((value) => ({
                                value,
                                label: t(`tenants.lease.${value}`),
                            }))}
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                        <Label>{t('tenants.lease.terms')}</Label>
                        <Textarea
                            value={data.terms}
                            onChange={(event) =>
                                setData('terms', event.target.value)
                            }
                        />
                    </div>
                </div>
            </section>
            <div className="flex justify-end">
                <Button disabled={processing} className="min-w-36 rounded-xl">
                    {t('tenants.register')}
                </Button>
            </div>
        </form>
    );
}
