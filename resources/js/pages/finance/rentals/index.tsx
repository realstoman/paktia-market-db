import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { Lease, Property, SharedData } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    CalendarRange,
    FileCheck2,
    Plus,
    ReceiptText,
    RotateCcw,
    WalletCards,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

interface RentPayment {
    id: number;
    receipt_number: string;
    period_start: string;
    period_end?: string | null;
    payment_date: string;
    amount: string | number;
    payment_method: string;
    reference?: string | null;
    notes?: string | null;
    status: 'received' | 'void';
    tenant?: { id: number; full_name: string; business_name?: string | null };
    property?: Property;
    lease?: { id: number; contract_number: string };
    currency?: { id: number; code: string; symbol?: string | null };
    creator?: { id: number; name: string };
}

interface Paginator {
    data: RentPayment[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface Props {
    filters: { propertyId: number | null; startDate: string; endDate: string };
    summary: {
        expected: number;
        received: number;
        outstanding: number;
        activeLeases: number;
        signedContracts: number;
        unsignedContracts: number;
    };
    properties: Property[];
    leases: Lease[];
    payments: Paginator;
}

const today = () => new Date().toLocaleDateString('en-CA');

export default function RentalsFinancePage({
    filters,
    summary,
    properties,
    leases,
    payments,
}: Props) {
    const { t, isRtl, locale } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('finance.manage');
    const [createOpen, setCreateOpen] = useState(false);
    const [voiding, setVoiding] = useState<RentPayment | null>(null);
    const [propertyId, setPropertyId] = useState(
        filters.propertyId ? String(filters.propertyId) : '',
    );
    const [startDate, setStartDate] = useState(filters.startDate);
    const [endDate, setEndDate] = useState(filters.endDate);
    const propertyLabel = (property: Property) =>
        property.name_translations?.[
            locale as keyof NonNullable<Property['name_translations']>
        ] || property.name;
    const applyFilters = () =>
        router.get(
            '/finance/rentals',
            {
                property_id: propertyId || undefined,
                start_date: startDate,
                end_date: endDate,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <AppLayout>
            <Head title={t('rentals.pageTitle')} />
            <div
                className="mx-auto w-full max-w-[1600px] space-y-5"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="rounded-3xl border bg-white p-6 shadow-none sm:p-8">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                        <div>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="-ms-3 mb-3"
                            >
                                <Link href="/finance">
                                    <ArrowLeft className="me-2 size-4" />
                                    {t('rentals.back')}
                                </Link>
                            </Button>
                            <h1 className="text-3xl font-semibold tracking-tight text-[#002452]">
                                {t('rentals.pageTitle')}
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                {t('rentals.subtitle')}
                            </p>
                        </div>
                        {canManage && (
                            <Button
                                className="h-11"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="me-2 size-4" />
                                {t('rentals.recordPayment')}
                            </Button>
                        )}
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        icon={CalendarRange}
                        label={t('rentals.summary.expected')}
                        value={formatNumber(summary.expected)}
                    />
                    <Metric
                        icon={Banknote}
                        label={t('rentals.summary.received')}
                        value={formatNumber(summary.received)}
                        tone="positive"
                    />
                    <Metric
                        icon={WalletCards}
                        label={t('rentals.summary.outstanding')}
                        value={formatNumber(summary.outstanding)}
                        tone={summary.outstanding > 0 ? 'warning' : 'positive'}
                    />
                    <Metric
                        icon={FileCheck2}
                        label={t('rentals.summary.activeLeases')}
                        value={formatNumber(summary.activeLeases)}
                        detail={t('rentals.summary.contractCoverage')
                            .replace(
                                ':signed',
                                formatNumber(summary.signedContracts),
                            )
                            .replace(
                                ':unsigned',
                                formatNumber(summary.unsignedContracts),
                            )}
                    />
                </section>

                <Card className="rounded-2xl border bg-white shadow-none">
                    <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
                        <div className="space-y-1.5">
                            <Label>{t('rentals.fields.property')}</Label>
                            <SearchableDropdown
                                value={propertyId}
                                onValueChange={setPropertyId}
                                placeholder={t('rentals.allProperties')}
                                options={[
                                    {
                                        value: '',
                                        label: t('rentals.allProperties'),
                                    },
                                    ...properties.map((property) => ({
                                        value: String(property.id),
                                        label: propertyLabel(property),
                                    })),
                                ]}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('rentals.fields.startDate')}</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    setStartDate(event.target.value)
                                }
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('rentals.fields.endDate')}</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(event) =>
                                    setEndDate(event.target.value)
                                }
                                className="bg-white"
                            />
                        </div>
                        <Button onClick={applyFilters}>
                            {t('rentals.apply')}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-2xl border bg-white shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ReceiptText className="size-5 text-primary" />
                            {t('rentals.paymentHistory')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#edf1f4]">
                                    <TableRow>
                                        {[
                                            'receipt',
                                            'date',
                                            'tenant',
                                            'property',
                                            'period',
                                            'method',
                                            'amount',
                                            'status',
                                            'actions',
                                        ].map((key) => (
                                            <TableHead
                                                key={key}
                                                className="text-start"
                                            >
                                                {t(`rentals.table.${key}`)}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.data.length ? (
                                        payments.data.map((payment) => (
                                            <TableRow
                                                key={payment.id}
                                                className={
                                                    payment.status === 'void'
                                                        ? 'opacity-55'
                                                        : ''
                                                }
                                            >
                                                <TableCell className="font-mono text-xs">
                                                    {payment.receipt_number}
                                                </TableCell>
                                                <TableCell>
                                                    {payment.payment_date}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-medium">
                                                        {payment.tenant
                                                            ?.business_name ||
                                                            payment.tenant
                                                                ?.full_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {
                                                            payment.lease
                                                                ?.contract_number
                                                        }
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    {payment.property
                                                        ? propertyLabel(
                                                              payment.property,
                                                          )
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {payment.period_start} —{' '}
                                                    {payment.period_end || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {t(
                                                        `paymentMethods.${payment.payment_method}`,
                                                        payment.payment_method,
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatNumber(
                                                        payment.amount,
                                                    )}{' '}
                                                    {payment.currency?.code}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            payment.status ===
                                                            'received'
                                                                ? 'success'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {t(
                                                            `rentals.status.${payment.status}`,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {canManage &&
                                                    payment.status ===
                                                        'received' ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                setVoiding(
                                                                    payment,
                                                                )
                                                            }
                                                        >
                                                            <RotateCcw className="me-2 size-4" />
                                                            {t('rentals.void')}
                                                        </Button>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={9}
                                                className="h-32 text-center text-muted-foreground"
                                            >
                                                {t('rentals.empty')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {payments.last_page > 1 && (
                            <div className="flex items-center justify-between border-t bg-[#f8f9fd] p-4 text-sm">
                                <span>
                                    {payments.from}–{payments.to} /{' '}
                                    {payments.total}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={payments.current_page === 1}
                                        onClick={() =>
                                            router.get(
                                                '/finance/rentals',
                                                {
                                                    property_id:
                                                        propertyId || undefined,
                                                    start_date: startDate,
                                                    end_date: endDate,
                                                    page:
                                                        payments.current_page -
                                                        1,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        {t('common.previous', 'Previous')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            payments.current_page ===
                                            payments.last_page
                                        }
                                        onClick={() =>
                                            router.get(
                                                '/finance/rentals',
                                                {
                                                    property_id:
                                                        propertyId || undefined,
                                                    start_date: startDate,
                                                    end_date: endDate,
                                                    page:
                                                        payments.current_page +
                                                        1,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        {t('common.next', 'Next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent
                    className="rounded-2xl sm:max-w-2xl"
                    dir={isRtl ? 'rtl' : 'ltr'}
                >
                    <DialogHeader
                        className={isRtl ? 'text-right sm:text-right' : ''}
                    >
                        <DialogTitle>{t('rentals.recordPayment')}</DialogTitle>
                        <DialogDescription>
                            {t('rentals.recordHelp')}
                        </DialogDescription>
                    </DialogHeader>
                    <PaymentForm
                        leases={leases}
                        locale={locale}
                        onDone={() => setCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(voiding)}
                onOpenChange={(open) => !open && setVoiding(null)}
            >
                <DialogContent
                    className="rounded-2xl sm:max-w-lg"
                    dir={isRtl ? 'rtl' : 'ltr'}
                >
                    <DialogHeader
                        className={isRtl ? 'text-right sm:text-right' : ''}
                    >
                        <DialogTitle>{t('rentals.voidTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('rentals.voidHelp')}
                        </DialogDescription>
                    </DialogHeader>
                    {voiding && (
                        <VoidForm
                            payment={voiding}
                            onDone={() => setVoiding(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function PaymentForm({
    leases,
    locale,
    onDone,
}: {
    leases: Lease[];
    locale: string;
    onDone: () => void;
}) {
    const { t } = useLocalization();
    const form = useForm({
        lease_id: '',
        period_start: today(),
        period_end: '',
        payment_date: today(),
        amount: '',
        payment_method: 'cash',
        reference: '',
        notes: '',
    });
    const selected = leases.find(
        (lease) => String(lease.id) === form.data.lease_id,
    );
    const leaseOptions = useMemo(
        () =>
            leases.map((lease) => ({
                value: String(lease.id),
                label: `${lease.tenant?.business_name || lease.tenant?.full_name} · ${lease.property?.name_translations?.[locale as keyof NonNullable<Property['name_translations']>] || lease.property?.name} · ${lease.contract_number}`,
            })),
        [leases, locale],
    );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/finance/rentals', {
            preserveScroll: true,
            onSuccess: onDone,
        });
    };
    return (
        <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
                <Label>{t('rentals.fields.lease')}</Label>
                <SearchableDropdown
                    value={form.data.lease_id}
                    onValueChange={(value) => {
                        form.setData('lease_id', value);
                        const lease = leases.find(
                            (item) => String(item.id) === value,
                        );
                        if (lease?.rent_amount)
                            form.setData('amount', String(lease.rent_amount));
                    }}
                    placeholder={t('rentals.selectLease')}
                    options={leaseOptions}
                />
                <InputError message={form.errors.lease_id} />
            </div>
            {selected && (
                <div className="rounded-xl border bg-[#f8f9fd] p-3 text-sm">
                    <strong>{selected.property?.name}</strong> ·{' '}
                    {selected.contract_number} ·{' '}
                    {formatNumber(selected.rent_amount ?? 0)}{' '}
                    {selected.currency?.code}
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <FormDate
                    label={t('rentals.fields.periodStart')}
                    value={form.data.period_start}
                    set={(value) => form.setData('period_start', value)}
                    error={form.errors.period_start}
                />
                <FormDate
                    label={t('rentals.fields.periodEnd')}
                    value={form.data.period_end}
                    set={(value) => form.setData('period_end', value)}
                    error={form.errors.period_end}
                />
                <FormDate
                    label={t('rentals.fields.paymentDate')}
                    value={form.data.payment_date}
                    set={(value) => form.setData('payment_date', value)}
                    error={form.errors.payment_date}
                />
                <div className="space-y-1.5">
                    <Label>{t('rentals.fields.amount')}</Label>
                    <NumericInput
                        value={form.data.amount}
                        onValueChange={(value) => form.setData('amount', value)}
                        min="1"
                        step="1"
                        showControls={false}
                        className="bg-white"
                    />
                    <InputError message={form.errors.amount} />
                </div>
                <div className="space-y-1.5">
                    <Label>{t('rentals.fields.method')}</Label>
                    <SearchableDropdown
                        value={form.data.payment_method}
                        onValueChange={(value) =>
                            form.setData('payment_method', value)
                        }
                        placeholder={t('rentals.fields.method')}
                        options={[
                            'cash',
                            'bank_transfer',
                            'credit_card',
                            'other',
                        ].map((value) => ({
                            value,
                            label: t(`paymentMethods.${value}`, value),
                        }))}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>{t('rentals.fields.reference')}</Label>
                    <Input
                        value={form.data.reference}
                        onChange={(event) =>
                            form.setData('reference', event.target.value)
                        }
                        className="bg-white"
                    />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t('rentals.fields.notes')}</Label>
                    <Textarea
                        value={form.data.notes}
                        onChange={(event) =>
                            form.setData('notes', event.target.value)
                        }
                        className="bg-white"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onDone}>
                    {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={form.processing}>
                    <ReceiptText className="me-2 size-4" />
                    {t('rentals.save')}
                </Button>
            </div>
        </form>
    );
}

function FormDate({
    label,
    value,
    set,
    error,
}: {
    label: string;
    value: string;
    set: (value: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <Input
                type="date"
                value={value}
                onChange={(event) => set(event.target.value)}
                className="bg-white"
            />
            <InputError message={error} />
        </div>
    );
}

function VoidForm({
    payment,
    onDone,
}: {
    payment: RentPayment;
    onDone: () => void;
}) {
    const { t } = useLocalization();
    const form = useForm({ void_reason: '' });
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                form.post(`/finance/rentals/${payment.id}/void`, {
                    preserveScroll: true,
                    onSuccess: onDone,
                });
            }}
            className="space-y-4"
        >
            <div className="rounded-xl bg-muted p-3 text-sm">
                {payment.receipt_number} · {formatNumber(payment.amount)}{' '}
                {payment.currency?.code}
            </div>
            <div className="space-y-1.5">
                <Label>{t('rentals.voidReason')}</Label>
                <Textarea
                    value={form.data.void_reason}
                    onChange={(event) =>
                        form.setData('void_reason', event.target.value)
                    }
                />
                <InputError message={form.errors.void_reason} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onDone}>
                    {t('common.cancel')}
                </Button>
                <Button
                    type="submit"
                    variant="destructive"
                    disabled={form.processing}
                >
                    {t('rentals.confirmVoid')}
                </Button>
            </div>
        </form>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
    detail,
    tone = 'default',
}: {
    icon: typeof Banknote;
    label: string;
    value: string;
    detail?: string;
    tone?: 'default' | 'positive' | 'warning';
}) {
    return (
        <Card className="rounded-2xl border bg-white shadow-none">
            <CardContent className="flex items-start justify-between p-5">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-2xl font-semibold">{value}</p>
                    {detail && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {detail}
                        </p>
                    )}
                </div>
                <div
                    className={`rounded-xl p-3 ${tone === 'positive' ? 'bg-emerald-50 text-emerald-700' : tone === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-[#edf1f4] text-[#002452]'}`}
                >
                    <Icon className="size-5" />
                </div>
            </CardContent>
        </Card>
    );
}
