import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { BreadcrumbItem, SharedData } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeDollarSign,
    Banknote,
    CalendarDays,
    ChartNoAxesCombined,
    CircleDollarSign,
    FileText,
    Landmark,
    ReceiptText,
    Save,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { FormEvent } from 'react';

interface BusinessConfig {
    slug: string;
    key: string;
    title: string;
    titleKey: string;
    descriptionKey: string;
    locationKey: string;
    defaultCurrency: string;
    accent: 'restaurant' | 'sarafi';
}

interface BusinessEntry {
    id: number;
    entry_date: string;
    currency_code: string;
    valuation: string | number | null;
    sales: string | number;
    income: string | number;
    expenses: string | number;
    net: number;
    notes?: string | null;
}

interface BusinessSummary {
    latestValuation: string | number | null;
    latestValuationDate: string | null;
    latestValuationCurrency: string;
    totalSales: number;
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    entryCount: number;
    monthSales: number;
    monthIncome: number;
    monthExpenses: number;
    monthNet: number;
}

interface Props {
    business: BusinessConfig;
    entries: BusinessEntry[];
    summary: BusinessSummary;
}

interface BusinessFormData {
    entry_date: string;
    currency_code: string;
    valuation: string;
    sales: string;
    income: string;
    expenses: string;
    notes: string;
}

const currencyOptions = ['AED', 'AFN', 'USD', 'EUR'].map((currency) => ({
    value: currency,
    label: currency,
}));

const localToday = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const money = (
    value: string | number | null | undefined,
    currencyCode: string,
): string => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return `${formatNumber(Number(value))} ${currencyCode}`;
};

export default function BusinessFinanceShow({
    business,
    entries,
    summary,
}: Props) {
    const { t, isRtl } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('finance.manage');
    const title = t(business.titleKey, business.title);
    const description = t(
        business.descriptionKey,
        'Record daily valuation, sales, income, and expenses for this group-owned business.',
    );
    const location = t(business.locationKey, business.title);
    const form = useForm<BusinessFormData>({
        entry_date: localToday(),
        currency_code: business.defaultCurrency,
        valuation: '',
        sales: '',
        income: '',
        expenses: '',
        notes: '',
    });
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
        { title: t('navigation.finance', 'Finance'), href: '/finance' },
        { title, href: `/finance/${business.slug}` },
    ];

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.post(`/finance/${business.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                form.setData({
                    entry_date: localToday(),
                    currency_code: form.data.currency_code,
                    valuation: '',
                    sales: '',
                    income: '',
                    expenses: '',
                    notes: '',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <div
                className="mx-auto w-full max-w-[1500px] space-y-5"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="overflow-hidden rounded-3xl border border-[#002452]/10 bg-[#f1f5f9] p-5 text-[#002452] shadow-none">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="border-[#002452]/15 bg-white text-[#002452]"
                                >
                                    <Landmark className="h-3.5 w-3.5" />
                                    {location}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-[#d3a450]/30 bg-white text-[#002452]"
                                >
                                    {business.defaultCurrency}
                                </Badge>
                            </div>
                            <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                                {title}
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#002452]/70">
                                {description}
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="w-fit border-[#002452]/20 bg-white text-[#002452] hover:bg-[#002452]/5 hover:text-[#002452]"
                        >
                            <Link href="/finance">
                                <ArrowLeft className="me-2 h-4 w-4" />
                                {t(
                                    'businessFinance.actions.backToFinance',
                                    'Back to Finance',
                                )}
                            </Link>
                        </Button>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        title={t(
                            'businessFinance.summary.latestValuation',
                            'Latest valuation',
                        )}
                        value={money(
                            summary.latestValuation,
                            summary.latestValuationCurrency,
                        )}
                        subtitle={
                            summary.latestValuationDate ??
                            t('businessFinance.common.notRecorded', 'Not recorded')
                        }
                        icon={<BadgeDollarSign className="h-5 w-5" />}
                    />
                    <MetricCard
                        title={t(
                            'businessFinance.summary.monthSales',
                            'This month sales',
                        )}
                        value={money(summary.monthSales, business.defaultCurrency)}
                        subtitle={t(
                            'businessFinance.summary.monthSalesHelp',
                            'Sales entered for the current month',
                        )}
                        icon={<TrendingUp className="h-5 w-5" />}
                    />
                    <MetricCard
                        title={t(
                            'businessFinance.summary.monthExpenses',
                            'This month expenses',
                        )}
                        value={money(
                            summary.monthExpenses,
                            business.defaultCurrency,
                        )}
                        subtitle={t(
                            'businessFinance.summary.monthExpensesHelp',
                            'Expenses entered for the current month',
                        )}
                        icon={<TrendingDown className="h-5 w-5" />}
                    />
                    <MetricCard
                        title={t(
                            'businessFinance.summary.totalNet',
                            'Total net',
                        )}
                        value={money(summary.netIncome, business.defaultCurrency)}
                        subtitle={t(
                            'businessFinance.summary.totalNetHelp',
                            'Total income minus expenses from all entries',
                        )}
                        icon={<ChartNoAxesCombined className="h-5 w-5" />}
                    />
                </section>

                <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
                    <Card className="border-primary/10 bg-white shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CircleDollarSign className="h-5 w-5 text-primary" />
                                {t(
                                    'businessFinance.form.title',
                                    'Daily finance entry',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'businessFinance.form.description',
                                    'Enter the daily valuation, sales, income, and expenses. Submitting the same date updates that date.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field
                                        label={t(
                                            'businessFinance.fields.date',
                                            'Date',
                                        )}
                                        error={form.errors.entry_date}
                                    >
                                        <Input
                                            type="date"
                                            className="bg-white"
                                            value={form.data.entry_date}
                                            onChange={(event) =>
                                                form.setData(
                                                    'entry_date',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                    <Field
                                        label={t(
                                            'businessFinance.fields.currency',
                                            'Currency',
                                        )}
                                        error={form.errors.currency_code}
                                    >
                                        <SearchableDropdown
                                            value={form.data.currency_code}
                                            onValueChange={(value) =>
                                                form.setData(
                                                    'currency_code',
                                                    value,
                                                )
                                            }
                                            options={currencyOptions}
                                            placeholder={t(
                                                'businessFinance.fields.selectCurrency',
                                                'Select currency',
                                            )}
                                        />
                                    </Field>
                                    <MoneyField
                                        label={t(
                                            'businessFinance.fields.valuation',
                                            'Business valuation',
                                        )}
                                        value={form.data.valuation}
                                        error={form.errors.valuation}
                                        onChange={(value) =>
                                            form.setData('valuation', value)
                                        }
                                    />
                                    <MoneyField
                                        label={t(
                                            'businessFinance.fields.sales',
                                            'Sales',
                                        )}
                                        value={form.data.sales}
                                        error={form.errors.sales}
                                        onChange={(value) =>
                                            form.setData('sales', value)
                                        }
                                    />
                                    <MoneyField
                                        label={t(
                                            'businessFinance.fields.income',
                                            'Income',
                                        )}
                                        value={form.data.income}
                                        error={form.errors.income}
                                        onChange={(value) =>
                                            form.setData('income', value)
                                        }
                                    />
                                    <MoneyField
                                        label={t(
                                            'businessFinance.fields.expenses',
                                            'Expenses',
                                        )}
                                        value={form.data.expenses}
                                        error={form.errors.expenses}
                                        onChange={(value) =>
                                            form.setData('expenses', value)
                                        }
                                    />
                                </div>
                                <Field
                                    label={t(
                                        'businessFinance.fields.notes',
                                        'Notes',
                                    )}
                                    error={form.errors.notes}
                                >
                                    <Textarea
                                        className="min-h-24 bg-white"
                                        value={form.data.notes}
                                        onChange={(event) =>
                                            form.setData(
                                                'notes',
                                                event.target.value,
                                            )
                                        }
                                        placeholder={t(
                                            'businessFinance.fields.notesPlaceholder',
                                            'Optional note about the day, source, correction, or finance detail…',
                                        )}
                                    />
                                </Field>
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={
                                            form.processing || !canManage
                                        }
                                        className="bg-[#002452] text-white hover:bg-[#002452]/90"
                                    >
                                        <Save className="me-2 h-4 w-4" />
                                        {t(
                                            'businessFinance.actions.saveEntry',
                                            'Save entry',
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 bg-white shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ReceiptText className="h-5 w-5 text-primary" />
                                {t(
                                    'businessFinance.entries.title',
                                    'Daily records',
                                )}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'businessFinance.entries.description',
                                    'Latest dated records for valuation, sales, income, and expenses.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-hidden rounded-2xl border border-slate-200/80">
                                <div className="max-h-[560px] overflow-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="sticky top-0 bg-[#f8f9fd] text-xs text-slate-500 uppercase">
                                            <tr>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.date',
                                                        'Date',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.valuation',
                                                        'Business valuation',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.sales',
                                                        'Sales',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.income',
                                                        'Income',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.expenses',
                                                        'Expenses',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.net',
                                                        'Net',
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'businessFinance.fields.notes',
                                                        'Notes',
                                                    )}
                                                </TableHead>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.length ? (
                                                entries.map((entry) => (
                                                    <tr
                                                        key={entry.id}
                                                        className="border-t border-slate-200/80"
                                                    >
                                                        <TableCell>
                                                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                                                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                                                {entry.entry_date}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell dir="ltr">
                                                            {money(
                                                                entry.valuation,
                                                                entry.currency_code,
                                                            )}
                                                        </TableCell>
                                                        <TableCell dir="ltr">
                                                            {money(
                                                                entry.sales,
                                                                entry.currency_code,
                                                            )}
                                                        </TableCell>
                                                        <TableCell dir="ltr">
                                                            {money(
                                                                entry.income,
                                                                entry.currency_code,
                                                            )}
                                                        </TableCell>
                                                        <TableCell dir="ltr">
                                                            {money(
                                                                entry.expenses,
                                                                entry.currency_code,
                                                            )}
                                                        </TableCell>
                                                        <TableCell dir="ltr">
                                                            {money(
                                                                entry.net,
                                                                entry.currency_code,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="max-w-52 truncate">
                                                            {entry.notes || '—'}
                                                        </TableCell>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                                                    >
                                                        <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
                                                        {t(
                                                            'businessFinance.entries.empty',
                                                            'No finance entries have been recorded yet.',
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

function MoneyField({
    label,
    value,
    error,
    onChange,
}: {
    label: string;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <Field label={label} error={error}>
            <NumericInput
                min="0"
                step="1"
                value={value}
                onValueChange={onChange}
                showControls={false}
                dir="ltr"
                className="bg-white"
            />
        </Field>
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

function MetricCard({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
}) {
    return (
        <Card className="border-primary/10 bg-white shadow-none">
            <CardContent className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf1f4] text-[#002452]">
                    {icon}
                </span>
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 truncate text-2xl font-semibold text-[#002452]">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function TableHead({ children }: { children: React.ReactNode }) {
    return (
        <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
            {children}
        </th>
    );
}

function TableCell({
    children,
    className = '',
    dir,
}: {
    children: React.ReactNode;
    className?: string;
    dir?: 'ltr' | 'rtl';
}) {
    return (
        <td className={`px-4 py-3 align-middle ${className}`} dir={dir}>
            {children}
        </td>
    );
}
