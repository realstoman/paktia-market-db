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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    BreadcrumbItem,
    Currency,
    Property,
    PropertyShareholding,
    SharedData,
    Shareholder,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Building2,
    CalendarDays,
    Download,
    FileText,
    Handshake,
    IdCard,
    Mail,
    Map as MapIcon,
    Phone,
    Plus,
    ShieldCheck,
    Trash2,
    Upload,
    UserRound,
    WalletCards,
} from 'lucide-react';
import { FormEvent } from 'react';

interface Props {
    shareholder: Shareholder;
    properties: Property[];
    currencies: Currency[];
}

interface OwnershipFormData {
    property_id: string;
    percentage: string;
    capital_contribution: string;
    currency_id: string;
    effective_from: string;
    effective_to: string;
    assignment_notes: string;
}

const localToday = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const emptyOwnership = (): OwnershipFormData => ({
    property_id: '',
    percentage: '',
    capital_contribution: '',
    currency_id: '',
    effective_from: localToday(),
    effective_to: '',
    assignment_notes: '',
});

const isCurrent = (holding: PropertyShareholding) =>
    holding.effective_from <= localToday() &&
    (!holding.effective_to || holding.effective_to >= localToday());

const cleanPercentage = (value: string | number) =>
    Number.parseFloat(String(value)).toLocaleString('en-US', {
        maximumFractionDigits: 4,
    });

const initials = (name: string) =>
    name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

export default function ShareholderProfile({
    shareholder,
    properties,
    currencies,
}: Props) {
    const { t, isRtl } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('shareholders.manage');
    const currentHoldings = (shareholder.shareholdings ?? []).filter(isCurrent);
    const totalCurrentShare = currentHoldings.reduce(
        (total, holding) => total + Number.parseFloat(String(holding.percentage)),
        0,
    );
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard'), href: '/dashboard' },
        { title: t('shareholders.title'), href: '/shareholders' },
        {
            title: shareholder.full_name,
            href: `/shareholders/${shareholder.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={shareholder.full_name} />
            <div
                className="mx-auto w-full max-w-[1500px] space-y-6 **:data-[slot=card]:shadow-none"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="overflow-hidden rounded-3xl border border-[#002452]/10 bg-[#f1f5f9] p-6 text-[#002452] shadow-none sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex items-center gap-5">
                            <Avatar className="h-24 w-24 rounded-3xl border-4 border-white shadow-none">
                                <AvatarImage
                                    src={shareholder.photo_url ?? undefined}
                                    className="h-full w-full object-cover object-center"
                                />
                                <AvatarFallback className="rounded-3xl bg-white text-2xl text-[#002452]">
                                    {initials(shareholder.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="mb-2 flex flex-wrap gap-2">
                                    <Badge
                                        variant="outline"
                                        className="border-[#002452]/15 bg-white/70 text-[#002452]"
                                    >
                                        {t(
                                            shareholder.is_active
                                                ? 'shareholders.active'
                                                : 'shareholders.inactive',
                                        )}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="border-[#002452]/15 bg-[#002452]/5 text-[#002452]"
                                    >
                                        {t(
                                            `shareholders.nidTypes.${shareholder.nid_type}`,
                                            shareholder.nid_type,
                                        )}
                                    </Badge>
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight">
                                    {shareholder.full_name}
                                </h1>
                                <p className="mt-1 text-[#002452]/70">
                                    {shareholder.occupation ||
                                        t('shareholders.profile.ownerProfile')}
                                </p>
                                <p className="mt-2 flex items-center gap-2 font-mono text-sm text-[#002452]/70">
                                    <IdCard className="h-4 w-4" />
                                    {shareholder.nid_number}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                asChild
                                variant="outline"
                                className="border-[#002452]/20 bg-white text-[#002452] hover:bg-[#002452]/5 hover:text-[#002452]"
                            >
                                <Link href="/shareholders">
                                    <ArrowLeft className="me-2 h-4 w-4" />
                                    {t('shareholders.profile.back')}
                                </Link>
                            </Button>
                            {canManage && (
                                <Button
                                    asChild
                                    className="bg-[#002452] text-white hover:bg-[#002452]/90"
                                >
                                    <a href="#shareholder-ownership-form">
                                        <Plus className="me-2 h-4 w-4" />
                                        {t('shareholders.addPropertyShare')}
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1fr_1.35fr_0.9fr]">
                    <Card className="rounded-2xl border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <UserRound className="h-5 w-5 text-primary" />
                                {t('shareholders.profile.overview')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <Info
                                icon={Phone}
                                label={t('shareholders.fields.phone')}
                                value={shareholder.phone}
                            />
                            <Info
                                icon={Phone}
                                label={t('shareholders.fields.whatsapp')}
                                value={shareholder.whatsapp}
                            />
                            <Info
                                icon={Mail}
                                label={t('shareholders.fields.email')}
                                value={shareholder.email}
                            />
                            <Info
                                icon={MapIcon}
                                label={t('shareholders.fields.citizenship')}
                                value={shareholder.citizenship_country?.name}
                            />
                            <Info
                                icon={MapIcon}
                                label={t('shareholders.fields.birthCountry')}
                                value={shareholder.country_of_birth?.name}
                            />
                            <Info
                                icon={MapIcon}
                                label={t('shareholders.fields.address')}
                                value={shareholder.address}
                            />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between gap-2 text-lg">
                                <span className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    {t('shareholders.profile.currentOwnership')}
                                </span>
                                <Badge variant="outline" dir="ltr">
                                    {cleanPercentage(totalCurrentShare)}%
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {currentHoldings.length ? (
                                currentHoldings.map((holding) => (
                                    <OwnershipCard
                                        key={holding.id}
                                        holding={holding}
                                        canManage={canManage}
                                        shareholder={shareholder}
                                    />
                                ))
                            ) : (
                                <EmptyState
                                    icon={Building2}
                                    text={t('shareholders.noOwnership')}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card
                        id="shareholder-takeouts"
                        className="scroll-mt-24 rounded-2xl border-primary/10"
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <WalletCards className="h-5 w-5 text-primary" />
                                {t('shareholders.profile.takeouts')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {t('shareholders.profile.takeoutsHelp')}
                            </p>
                            <div className="mt-5 rounded-xl bg-muted/60 p-4">
                                <p className="text-xs text-muted-foreground">
                                    {t('shareholders.profile.totalTakeouts')}
                                </p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {formatNumber(0)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
                    <Card className="rounded-2xl border-primary/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                {t('shareholders.profile.ownershipHistory')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(shareholder.shareholdings ?? []).length ? (
                                (shareholder.shareholdings ?? []).map(
                                    (holding) => (
                                        <OwnershipCard
                                            key={holding.id}
                                            holding={holding}
                                            canManage={canManage}
                                            shareholder={shareholder}
                                        />
                                    ),
                                )
                            ) : (
                                <EmptyState
                                    icon={Handshake}
                                    text={t('shareholders.noOwnership')}
                                />
                            )}
                        </CardContent>
                    </Card>
                    <Documents
                        shareholder={shareholder}
                        canManage={canManage}
                    />
                </section>

                {canManage && (
                    <OwnershipForm
                        shareholder={shareholder}
                        properties={properties}
                        currencies={currencies}
                    />
                )}
            </div>
        </AppLayout>
    );
}

function OwnershipCard({
    holding,
    canManage,
    shareholder,
}: {
    holding: PropertyShareholding;
    canManage: boolean;
    shareholder: Shareholder;
}) {
    const { t } = useLocalization();

    return (
        <div className="rounded-xl border border-primary/10 bg-white p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                    <p className="truncate font-medium">
                        {holding.property?.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        <CalendarDays className="me-1 inline h-3.5 w-3.5" />
                        {holding.effective_from} — {holding.effective_to ?? '∞'}
                    </p>
                    {holding.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            {holding.notes}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <div className="text-end">
                        <p className="text-xl font-semibold" dir="ltr">
                            {cleanPercentage(holding.percentage)}%
                        </p>
                        <Badge
                            variant={isCurrent(holding) ? 'default' : 'secondary'}
                        >
                            {t(
                                isCurrent(holding)
                                    ? 'shareholders.current'
                                    : 'shareholders.historical',
                            )}
                        </Badge>
                    </div>
                    {canManage && isCurrent(holding) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/15 bg-white text-primary hover:bg-primary/5 hover:text-primary"
                            onClick={() =>
                                router.post(
                                    `/shareholders/${shareholder.id}/shareholdings/${holding.id}/close`,
                                    { effective_to: localToday() },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            {t('shareholders.closeToday')}
                        </Button>
                    )}
                </div>
            </div>
            {holding.capital_contribution && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Metric
                        label={t('shareholders.fields.capital')}
                        value={`${formatNumber(holding.capital_contribution)} ${holding.currency?.code ?? ''}`}
                    />
                    <Metric
                        label={t('shareholders.fields.currency')}
                        value={
                            holding.currency
                                ? `${holding.currency.code} — ${holding.currency.symbol}`
                                : '—'
                        }
                    />
                </div>
            )}
        </div>
    );
}

function Documents({
    shareholder,
    canManage,
}: {
    shareholder: Shareholder;
    canManage: boolean;
}) {
    const { t, isRtl } = useLocalization();
    const form = useForm<{ documents: File[] }>({ documents: [] });
    const documentsInputId = `shareholder-profile-documents-${shareholder.id}`;

    const upload = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/shareholders/${shareholder.id}/documents`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <Card className="rounded-2xl border-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    {t('shareholders.documents')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                    {t('shareholders.documentsHelp')}
                </p>
                <div className="space-y-2">
                    {(shareholder.documents ?? []).length ? (
                        shareholder.documents?.map((document) => (
                            <div
                                key={document.id}
                                className="flex items-center justify-between gap-2 rounded-xl border border-primary/10 bg-white p-3"
                            >
                                <span className="min-w-0 truncate text-sm">
                                    {document.original_name}
                                </span>
                                <div className="flex">
                                    <Button asChild variant="ghost" size="icon">
                                        <a
                                            href={`/shareholders/${shareholder.id}/documents/${document.id}`}
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
                                                        'shareholders.deleteDocumentConfirm',
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
                                                            'shareholders.deleteDocumentTitle',
                                                        )}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t(
                                                            'shareholders.deleteDocumentDescription',
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
                                                                `/shareholders/${shareholder.id}/documents/${document.id}`,
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {t(
                                                            'shareholders.deleteDocumentConfirm',
                                                        )}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                            {t('shareholders.noDocuments')}
                        </p>
                    )}
                </div>
                {canManage && (
                    <form onSubmit={upload} className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-dashed border-[#002452]/20 bg-white p-4">
                            <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <p className="min-w-0 truncate text-sm font-medium text-[#002452]">
                                    {form.data.documents.length
                                        ? form.data.documents
                                              .map((file) => file.name)
                                              .join(', ')
                                        : t('shareholders.documents')}
                                </p>
                                <label
                                    htmlFor={documentsInputId}
                                    className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-lg border border-[#002452]/20 bg-white px-3 text-sm font-medium text-[#002452] transition-colors hover:bg-[#002452]/5"
                                >
                                    <Upload className="me-2 size-4" />
                                    {t('shareholders.upload')}
                                </label>
                            </div>
                            <Input
                                id={documentsInputId}
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                className="sr-only"
                                onChange={(event) =>
                                    form.setData(
                                        'documents',
                                        Array.from(event.target.files ?? []),
                                    )
                                }
                            />
                        </div>
                        <InputError message={form.errors.documents} />
                        <Button
                            size="sm"
                            disabled={
                                form.processing || !form.data.documents.length
                            }
                        >
                            <Upload className="me-2 h-4 w-4" />
                            {t('shareholders.upload')}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function OwnershipForm({
    shareholder,
    properties,
    currencies,
}: {
    shareholder: Shareholder;
    properties: Property[];
    currencies: Currency[];
}) {
    const { t } = useLocalization();
    const form = useForm<OwnershipFormData>(emptyOwnership());

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/shareholders/${shareholder.id}/shareholdings`, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <Card
            id="shareholder-ownership-form"
            className="scroll-mt-24 rounded-2xl border-primary/10"
        >
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Handshake className="h-5 w-5 text-primary" />
                    {t('shareholders.addPropertyShare')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-5 text-sm text-muted-foreground">
                    {t('shareholders.multipleOwnershipHelp')}
                </p>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <OwnershipFields
                            data={form.data}
                            errors={form.errors}
                            setData={(field, value) =>
                                form.setData(field, value)
                            }
                            properties={properties}
                            currencies={currencies}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            <Plus className="me-2 h-4 w-4" />
                            {t('shareholders.addPropertyShare')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function OwnershipFields({
    data,
    errors,
    setData,
    properties,
    currencies,
}: {
    data: OwnershipFormData;
    errors: Partial<Record<keyof OwnershipFormData, string>>;
    setData: (field: keyof OwnershipFormData, value: string) => void;
    properties: Property[];
    currencies: Currency[];
}) {
    const { t } = useLocalization();

    return (
        <>
            <Field
                label={t('shareholders.fields.property')}
                error={errors.property_id}
            >
                <SearchableDropdown
                    value={data.property_id}
                    onValueChange={(value) => setData('property_id', value)}
                    options={properties.map((property) => ({
                        value: String(property.id),
                        label: property.name,
                    }))}
                    placeholder={t('shareholders.select')}
                />
            </Field>
            <Field
                label={t('shareholders.fields.percentage')}
                error={errors.percentage}
            >
                <NumericInput
                    min="0.0001"
                    max="100"
                    step="0.0001"
                    value={data.percentage}
                    onValueChange={(value) => setData('percentage', value)}
                    showControls={false}
                    dir="ltr"
                />
            </Field>
            <Field
                label={t('shareholders.fields.capital')}
                error={errors.capital_contribution}
            >
                <NumericInput
                    min="0"
                    step="1"
                    value={data.capital_contribution}
                    onValueChange={(value) =>
                        setData('capital_contribution', value)
                    }
                    showControls={false}
                    dir="ltr"
                />
            </Field>
            <Field
                label={t('shareholders.fields.currency')}
                error={errors.currency_id}
            >
                <SearchableDropdown
                    value={data.currency_id}
                    onValueChange={(value) => setData('currency_id', value)}
                    options={currencies.map((currency) => ({
                        value: String(currency.id),
                        label: `${currency.code} — ${currency.symbol}`,
                    }))}
                    placeholder={t('shareholders.select')}
                />
            </Field>
            <Field
                label={t('shareholders.fields.effectiveFrom')}
                error={errors.effective_from}
            >
                <Input
                    type="date"
                    value={data.effective_from}
                    onChange={(event) =>
                        setData('effective_from', event.target.value)
                    }
                    className="bg-white"
                />
            </Field>
            <Field
                label={t('shareholders.fields.effectiveTo')}
                error={errors.effective_to}
            >
                <Input
                    type="date"
                    value={data.effective_to}
                    onChange={(event) =>
                        setData('effective_to', event.target.value)
                    }
                    className="bg-white"
                />
            </Field>
            <div className="md:col-span-3">
                <Field
                    label={t('shareholders.fields.assignmentNotes')}
                    error={errors.assignment_notes}
                >
                    <Textarea
                        value={data.assignment_notes}
                        onChange={(event) =>
                            setData('assignment_notes', event.target.value)
                        }
                        className="min-h-24 bg-white"
                    />
                </Field>
            </div>
        </>
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
                <p className="mt-0.5 font-medium break-words">{value || '—'}</p>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-[#f8f9fd] p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}

function EmptyState({
    icon: Icon,
    text,
}: {
    icon: typeof Building2;
    text: string;
}) {
    return (
        <div className="py-10 text-center text-muted-foreground">
            <Icon className="mx-auto mb-3 h-9 w-9 opacity-40" />
            {text}
        </div>
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
        <div className="min-w-0 space-y-2">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
