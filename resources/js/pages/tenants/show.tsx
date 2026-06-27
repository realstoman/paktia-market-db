import InputError from '@/components/input-error';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Currency,
    Lease,
    Property,
    SharedData,
    Tenant,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    CalendarDays,
    Download,
    FileSignature,
    FileText,
    IdCard,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Printer,
    ShieldBan,
    ShieldCheck,
    Trash2,
    Upload,
    UserRound,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface Props {
    tenant: Tenant;
    properties: Property[];
    currencies: Currency[];
    openEdit?: boolean;
}
interface LeaseForm {
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
interface ProfileForm {
    _method: string;
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
}
const today = () => new Date().toLocaleDateString('en-CA');
const currentLease = (tenant: Tenant) =>
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

export default function TenantProfile({
    tenant,
    properties,
    currencies,
    openEdit = false,
}: Props) {
    const { t, isRtl } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('tenants.manage');
    const lease = currentLease(tenant);
    const hasBusiness = Boolean(tenant.business_name?.trim());
    const displayName = tenant.business_name?.trim() || tenant.full_name;
    const [assignmentOpen, setAssignmentOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(openEdit);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard'), href: '/dashboard' },
        { title: t('tenants.title'), href: '/tenants' },
        {
            title: displayName,
            href: `/tenants/${tenant.id}`,
        },
    ];
    const location = (item: Lease) => {
        const externalUnit =
            item.property?.property_type === 'commercial_unit'
                ? item.property.external_unit_number
                : null;

        return `${item.property?.name ?? ''}${item.floor ? ` - ${item.floor.name}` : ''}${item.unit ? ` - ${t(`tenants.lease.${item.unit.unit_type}`)} ${item.unit.unit_number}` : externalUnit ? ` - ${t('tenants.lease.shop')} ${externalUnit}` : ''}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={displayName} />
            <div
                className="mx-auto w-full max-w-375 space-y-4"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="overflow-hidden rounded-3xl border border-[#002452]/10 bg-[#f1f5f9] p-6 text-[#002452] shadow-none sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-center gap-5">
                            <Avatar className="h-24 w-24 rounded-3xl border-4 border-white shadow-none">
                                <AvatarImage
                                    src={tenant.photo_url ?? undefined}
                                    className="h-full w-full object-cover object-center"
                                />
                                <AvatarFallback className="rounded-3xl bg-white text-2xl text-[#002452]">
                                    {initials(tenant.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="mb-2 flex flex-wrap gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-[#002452]/15 bg-[#002452]/5 text-[#002452]"
                                    >
                                        {t(
                                            tenant.is_active
                                                ? 'tenants.active'
                                                : 'tenants.inactive',
                                        )}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="border-[#002452]/15 bg-white/70 text-[#002452]"
                                    >
                                        {t(`tenants.${tenant.tenant_type}`)}
                                    </Badge>
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    {hasBusiness
                                        ? tenant.business_name
                                        : tenant.full_name}
                                </h1>
                                {hasBusiness && (
                                    <p className="mt-1 text-[#002452]/70">
                                        {tenant.full_name}
                                    </p>
                                )}
                                <p className="mt-2 flex items-center gap-2 font-mono text-sm text-[#002452]/70">
                                    <IdCard className="h-4 w-4" />
                                    {tenant.card_code}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {canManage && (
                                <>
                                    <Dialog
                                        open={editOpen}
                                        onOpenChange={setEditOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="border-[#002452]/20 bg-white text-[#002452] hover:bg-[#002452]/5 hover:text-[#002452]"
                                            >
                                                <Pencil className="me-2 h-4 w-4" />
                                                {t('tenants.editProfile')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[92vh] overflow-x-hidden overflow-y-auto sm:max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {t('tenants.editProfile')}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {t('tenants.subtitle')}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <EditProfileForm
                                                tenant={tenant}
                                                onDone={() =>
                                                    setEditOpen(false)
                                                }
                                            />
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog
                                        open={assignmentOpen}
                                        onOpenChange={setAssignmentOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button className="bg-[#002452] text-white hover:bg-[#002452]/90">
                                                <Plus className="me-2 h-4 w-4" />
                                                {t('tenants.lease.add')}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {t('tenants.lease.add')}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {t(
                                                        'tenants.lease.availableOnly',
                                                    )}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <AssignmentForm
                                                tenant={tenant}
                                                properties={properties}
                                                currencies={currencies}
                                                onDone={() =>
                                                    setAssignmentOpen(false)
                                                }
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </>
                            )}
                            <Button
                                asChild
                                className="bg-[#002452] text-white hover:bg-[#002452]/90"
                            >
                                <Link href={`/tenants/${tenant.id}/card`}>
                                    <Printer className="me-2 h-4 w-4" />
                                    {t('tenants.profile.printCard')}
                                </Link>
                            </Button>
                            {lease && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-[#002452]/20 bg-transparent text-[#002452] hover:bg-[#002452]/5 hover:text-[#002452]"
                                >
                                    <Link
                                        href={`/tenants/${tenant.id}/leases/${lease.id}/contract`}
                                    >
                                        <FileSignature className="me-2 h-4 w-4" />
                                        {t('leaseContract.tableAction')}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr_0.9fr]">
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UserRound className="h-5 w-5 text-primary" />
                                {t('tenants.profile.overview')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <Info
                                icon={Phone}
                                label={t('tenants.fields.phone')}
                                value={tenant.phone}
                            />
                            <Info
                                icon={Phone}
                                label={t('tenants.fields.whatsapp')}
                                value={tenant.whatsapp}
                            />
                            <Info
                                icon={Mail}
                                label={t('tenants.fields.email')}
                                value={tenant.email}
                            />
                            <Info
                                icon={IdCard}
                                label={t('tenants.fields.nid')}
                                value={tenant.nid_number}
                            />
                            <Info
                                icon={ShieldCheck}
                                label={t('tenants.fields.license')}
                                value={tenant.license_number}
                            />
                            <Info
                                icon={MapPin}
                                label={t('tenants.fields.address')}
                                value={tenant.address}
                            />
                        </CardContent>
                    </Card>
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-2 text-lg">
                                <span className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    {t('tenants.lease.current')}
                                </span>
                                {lease && (
                                    <Badge>
                                        {t(`tenants.lease.${lease.status}`)}
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {lease ? (
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-xl font-semibold">
                                            {location(lease)}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t(
                                                `tenants.lease.${lease.leased_space_type}`,
                                            )}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Metric
                                            label={t('tenants.lease.rent')}
                                            value={
                                                lease.rent_amount
                                                    ? `${formatNumber(lease.rent_amount)} ${lease.currency?.symbol ?? lease.currency?.code ?? ''}`
                                                    : '—'
                                            }
                                        />
                                        <Metric
                                            label={t('tenants.lease.deposit')}
                                            value={
                                                lease.security_deposit
                                                    ? `${formatNumber(lease.security_deposit)} ${lease.currency?.symbol ?? ''}`
                                                    : '—'
                                            }
                                        />
                                        <Metric
                                            label={t('tenants.lease.startDate')}
                                            value={lease.start_date}
                                        />
                                        <Metric
                                            label={t(
                                                'tenants.lease.contractNumber',
                                            )}
                                            value={lease.contract_number}
                                            mono
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    <Building2 className="mx-auto mb-3 h-9 w-9 opacity-40" />
                                    {t('tenants.lease.noAssignment')}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card
                        id="tenant-finance"
                        className="scroll-mt-24 rounded-2xl"
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Banknote className="h-5 w-5 text-primary" />
                                {t('tenants.profile.finance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {t('tenants.profile.financeHelp')}
                            </p>
                            {lease && (
                                <div className="mt-5 rounded-xl bg-muted/60 p-4">
                                    <p className="text-xs text-muted-foreground">
                                        {t('tenants.lease.rent')}
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {lease.rent_amount
                                            ? formatNumber(lease.rent_amount)
                                            : '—'}{' '}
                                        <span className="text-sm font-normal">
                                            {lease.currency?.code}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                {t('tenants.lease.history')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(tenant.leases ?? []).length ? (
                                (tenant.leases ?? []).map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {location(item)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.start_date} —{' '}
                                                {item.end_date || '∞'} ·{' '}
                                                {item.contract_number}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                            >
                                                <Link
                                                    href={`/tenants/${tenant.id}/leases/${item.id}/contract`}
                                                >
                                                    <FileSignature className="me-2 size-4" />
                                                    {t(
                                                        'leaseContract.tableAction',
                                                    )}
                                                </Link>
                                            </Button>
                                            <span className="font-medium">
                                                {item.rent_amount
                                                    ? formatNumber(
                                                          item.rent_amount,
                                                      )
                                                    : '—'}{' '}
                                                {item.currency?.code}
                                            </span>
                                            <Badge variant="outline">
                                                {t(
                                                    `tenants.lease.${item.status}`,
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-muted-foreground">
                                    {t('tenants.lease.noAssignment')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Documents tenant={tenant} canManage={canManage} />
                </section>
                {canManage && (
                    <div className="flex justify-end">
                        <Button
                            variant="outline"
                            className="bg-white"
                            onClick={() =>
                                router.post(`/tenants/${tenant.id}/toggle`)
                            }
                        >
                            {tenant.is_active ? (
                                <ShieldBan className="me-2 size-4" />
                            ) : (
                                <ShieldCheck className="me-2 size-4" />
                            )}
                            {t(
                                tenant.is_active
                                    ? 'tenants.profile.deactivate'
                                    : 'tenants.profile.activate',
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function Info({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Phone;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-medium wrap-break-word">
                    {value || '—'}
                </p>
            </div>
        </div>
    );
}

function Metric({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-xl bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={`mt-1 font-semibold ${mono ? 'font-mono text-xs' : ''}`}
            >
                {value}
            </p>
        </div>
    );
}

function Documents({
    tenant,
    canManage,
}: {
    tenant: Tenant;
    canManage: boolean;
}) {
    const { t, isRtl } = useLocalization();
    const form = useForm<{ documents: File[] }>({ documents: [] });
    const upload = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/tenants/${tenant.id}/documents`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };
    return (
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    {t('tenants.profile.documents')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    {t('tenants.profile.privateHelp')}
                </p>
                <div className="space-y-2">
                    {(tenant.documents ?? []).map((document) => (
                        <div
                            key={document.id}
                            className="flex items-center justify-between gap-2 rounded-xl border p-3"
                        >
                            <span className="min-w-0 truncate text-sm">
                                {document.original_name}
                            </span>
                            <div className="flex">
                                <Button asChild variant="ghost" size="icon">
                                    <a
                                        href={`/tenants/${tenant.id}/documents/${document.id}`}
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                                {canManage && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t(
                                                    'tenants.profile.deleteDocumentConfirm',
                                                )}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent
                                            dir={isRtl ? 'rtl' : 'ltr'}
                                        >
                                            <AlertDialogHeader
                                                className={
                                                    isRtl
                                                        ? 'text-right sm:text-right'
                                                        : ''
                                                }
                                            >
                                                <AlertDialogTitle>
                                                    {t(
                                                        'tenants.profile.deleteDocumentTitle',
                                                    )}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t(
                                                        'tenants.profile.deleteDocumentDescription',
                                                    ).replace(
                                                        ':name',
                                                        document.original_name,
                                                    )}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    {t('common.cancel')}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    variant="destructive"
                                                    onClick={() =>
                                                        router.delete(
                                                            `/tenants/${tenant.id}/documents/${document.id}`,
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    {t(
                                                        'tenants.profile.deleteDocumentConfirm',
                                                    )}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {canManage && (
                    <form onSubmit={upload} className="mt-4 space-y-2">
                        <Input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            onChange={(event) =>
                                form.setData(
                                    'documents',
                                    Array.from(event.target.files ?? []),
                                )
                            }
                        />
                        <Button
                            size="sm"
                            disabled={
                                form.processing || !form.data.documents.length
                            }
                        >
                            <Upload className="me-2 h-4 w-4" />
                            {t('tenants.profile.upload')}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function AssignmentForm({
    tenant,
    properties,
    currencies,
    onDone,
}: {
    tenant: Tenant;
    properties: Property[];
    currencies: Currency[];
    onDone: () => void;
}) {
    const { t } = useLocalization();
    const form = useForm<LeaseForm>({
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
    const property = properties.find(
        (item) => String(item.id) === form.data.property_id,
    );
    const units = ['house', 'commercial_unit'].includes(
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
                      label: `${floor.name} - ${t(`tenants.lease.${unit.unit_type}`)} ${unit.unit_number}`,
                  })),
              ),
          ];
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/tenants/${tenant.id}/leases`, {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };
    return (
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Drop
                label={t('tenants.lease.property')}
                value={form.data.property_id}
                set={(value) => {
                    form.setData('property_id', value);
                    form.setData('property_unit_id', '');
                }}
                options={properties.map((item) => ({
                    value: String(item.id),
                    label: item.name,
                }))}
                error={form.errors.property_id}
                t={t}
            />
            {form.data.property_id && (
                <Drop
                    label={t('tenants.lease.space')}
                    value={form.data.property_unit_id}
                    set={(value) => form.setData('property_unit_id', value)}
                    options={units}
                    error={form.errors.property_unit_id}
                    t={t}
                />
            )}
            <Field
                label={t('tenants.lease.startDate')}
                type="date"
                value={form.data.start_date}
                set={(value) => form.setData('start_date', value)}
            />
            <Field
                label={t('tenants.lease.endDate')}
                type="date"
                value={form.data.end_date}
                set={(value) => form.setData('end_date', value)}
            />
            <NumberField
                label={t('tenants.lease.rent')}
                value={form.data.rent_amount}
                set={(value) => form.setData('rent_amount', value)}
            />
            <NumberField
                label={t('tenants.lease.deposit')}
                value={form.data.security_deposit}
                set={(value) => form.setData('security_deposit', value)}
            />
            <Drop
                label={t('tenants.lease.currency')}
                value={form.data.currency_id}
                set={(value) => form.setData('currency_id', value)}
                options={currencies.map((item) => ({
                    value: String(item.id),
                    label: `${item.code} · ${item.symbol}`,
                }))}
                t={t}
            />
            <Drop
                label={t('tenants.lease.frequency')}
                value={form.data.payment_frequency}
                set={(value) => form.setData('payment_frequency', value)}
                options={['monthly', 'quarterly', 'yearly'].map((value) => ({
                    value,
                    label: t(`tenants.lease.${value}`),
                }))}
                t={t}
            />
            <Drop
                label={t('tenants.lease.status')}
                value={form.data.status}
                set={(value) => form.setData('status', value)}
                options={['active', 'draft'].map((value) => ({
                    value,
                    label: t(`tenants.lease.${value}`),
                }))}
                t={t}
            />
            <div className="space-y-1.5 md:col-span-2">
                <Label>{t('tenants.lease.terms')}</Label>
                <Textarea
                    value={form.data.terms}
                    onChange={(event) =>
                        form.setData('terms', event.target.value)
                    }
                />
            </div>
            <div className="flex justify-end md:col-span-2">
                <Button disabled={form.processing}>
                    {t('tenants.lease.add')}
                </Button>
            </div>
        </form>
    );
}

function EditProfileForm({
    tenant,
    onDone,
}: {
    tenant: Tenant;
    onDone: () => void;
}) {
    const { t } = useLocalization();
    const form = useForm<ProfileForm>({
        _method: 'put',
        tenant_type: tenant.tenant_type,
        full_name: tenant.full_name,
        father_name: tenant.father_name ?? '',
        business_name: tenant.business_name ?? '',
        phone: tenant.phone,
        whatsapp: tenant.whatsapp ?? '',
        email: tenant.email ?? '',
        nid_number: tenant.nid_number ?? '',
        license_number: tenant.license_number ?? '',
        address: tenant.address ?? '',
        notes: tenant.notes ?? '',
        photo: null,
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        tenant.photo_url ?? null,
    );

    useEffect(
        () => () => {
            if (photoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        },
        [photoPreview],
    );

    const selectPhoto = (photo: File | null) => {
        form.setData('photo', photo);
        setPhotoPreview(
            photo ? URL.createObjectURL(photo) : (tenant.photo_url ?? null),
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/tenants/${tenant.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    };
    return (
        <form onSubmit={submit} className="min-w-0 space-y-5">
            <div className="grid min-w-0 gap-4 md:grid-cols-3">
                <Drop
                    label={t('tenants.fields.tenantType')}
                    value={form.data.tenant_type}
                    set={(value) => {
                        form.setData('tenant_type', value);
                        if (value === 'individual') {
                            form.setData('business_name', '');
                            form.setData('license_number', '');
                        }
                    }}
                    options={[
                        {
                            value: 'individual',
                            label: t('tenants.individual'),
                        },
                        { value: 'company', label: t('tenants.company') },
                    ]}
                    t={t}
                />
                <Field
                    label={t('tenants.fields.fullName')}
                    value={form.data.full_name}
                    set={(value) => form.setData('full_name', value)}
                />
                <Field
                    label={t('tenants.fields.fatherName')}
                    value={form.data.father_name}
                    set={(value) => form.setData('father_name', value)}
                />
                {form.data.tenant_type === 'company' && (
                    <Field
                        label={t('tenants.fields.businessName')}
                        value={form.data.business_name}
                        set={(value) => form.setData('business_name', value)}
                    />
                )}
                <Field
                    label={t('tenants.fields.phone')}
                    value={form.data.phone}
                    set={(value) => form.setData('phone', value)}
                />
                <Field
                    label={t('tenants.fields.whatsapp')}
                    value={form.data.whatsapp}
                    set={(value) => form.setData('whatsapp', value)}
                />
                <Field
                    label={t('tenants.fields.email')}
                    type="email"
                    value={form.data.email}
                    set={(value) => form.setData('email', value)}
                />
                <Field
                    label={t('tenants.fields.nid')}
                    value={form.data.nid_number}
                    set={(value) => form.setData('nid_number', value)}
                />
                {form.data.tenant_type === 'company' && (
                    <Field
                        label={t('tenants.fields.license')}
                        value={form.data.license_number}
                        set={(value) => form.setData('license_number', value)}
                    />
                )}
            </div>

            <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`tenant-photo-${tenant.id}`}>
                    {t('tenants.fields.photo')}
                </Label>
                <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-dashed border-[#002452]/20 bg-white p-4 sm:flex-row sm:items-center">
                    <Avatar className="h-20 w-20 rounded-2xl border border-[#002452]/10">
                        <AvatarImage
                            src={photoPreview ?? undefined}
                            className="h-full w-full object-cover object-center"
                        />
                        <AvatarFallback className="rounded-2xl bg-[#f1f5f9] text-xl text-[#002452]">
                            {initials(tenant.full_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#002452]">
                            {form.data.photo?.name ?? t('tenants.fields.photo')}
                        </p>
                        <label
                            htmlFor={`tenant-photo-${tenant.id}`}
                            className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#002452]/20 bg-white px-3 text-sm font-medium text-[#002452] transition-colors hover:bg-[#002452]/5"
                        >
                            <Upload className="me-2 size-4" />
                            {t('tenants.profile.upload')}
                        </label>
                        <Input
                            id={`tenant-photo-${tenant.id}`}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) =>
                                selectPhoto(event.target.files?.[0] ?? null)
                            }
                        />
                    </div>
                </div>
                <InputError message={form.errors.photo} />
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                    <Label>{t('tenants.fields.address')}</Label>
                    <Textarea
                        className="min-h-24 bg-white"
                        value={form.data.address}
                        onChange={(event) =>
                            form.setData('address', event.target.value)
                        }
                    />
                </div>
                <div className="min-w-0 space-y-1.5">
                    <Label>{t('tenants.fields.notes')}</Label>
                    <Textarea
                        className="min-h-24 bg-white"
                        value={form.data.notes}
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button disabled={form.processing}>{t('common.save')}</Button>
            </div>
        </form>
    );
}

function Field({
    label,
    value,
    set,
    type = 'text',
}: {
    label: string;
    value: string;
    set: (value: string) => void;
    type?: string;
}) {
    return (
        <div className="min-w-0 space-y-1.5">
            <Label>{label}</Label>
            <Input
                className="bg-white"
                type={type}
                value={value}
                onChange={(event) => set(event.target.value)}
            />
        </div>
    );
}
function NumberField({
    label,
    value,
    set,
}: {
    label: string;
    value: string;
    set: (value: string) => void;
}) {
    return (
        <div className="min-w-0 space-y-1.5">
            <Label>{label}</Label>
            <NumericInput
                showControls={false}
                min="0"
                step="1"
                value={value}
                onValueChange={set}
            />
        </div>
    );
}
function Drop({
    label,
    value,
    set,
    options,
    error,
    t,
}: {
    label: string;
    value: string;
    set: (value: string) => void;
    options: { value: string; label: string }[];
    error?: string;
    t: (key: string, fallback?: string) => string;
}) {
    return (
        <div className="min-w-0 space-y-1.5">
            <Label>{label}</Label>
            <SearchableDropdown
                value={value}
                onValueChange={set}
                options={options}
                placeholder={t('tenants.fields.select')}
            />
            <InputError message={error} />
        </div>
    );
}
