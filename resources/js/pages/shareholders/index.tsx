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
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    BreadcrumbItem,
    Country,
    Currency,
    Property,
    PropertyShareholding,
    SharedData,
    Shareholder,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    Download,
    FileText,
    Handshake,
    IdCard,
    MoreHorizontal,
    Pencil,
    Phone,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Upload,
    UsersRound,
} from 'lucide-react';
import { FormEvent, ReactNode, useMemo, useState } from 'react';

interface Props {
    shareholders: Shareholder[];
    countries: Country[];
    properties: Property[];
    currencies: Currency[];
}

interface ShareholderFormData {
    full_name: string;
    father_name: string;
    grandfather_name: string;
    gender: string;
    date_of_birth: string;
    country_of_birth_id: string;
    citizenship_country_id: string;
    nid_type: string;
    nid_number: string;
    phone: string;
    whatsapp: string;
    email: string;
    occupation: string;
    address: string;
    notes: string;
    photo: File | null;
    documents: File[];
    shareholdings: OwnershipFormData[];
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

const emptyShareholder = (): ShareholderFormData => ({
    full_name: '',
    father_name: '',
    grandfather_name: '',
    gender: '',
    date_of_birth: '',
    country_of_birth_id: '',
    citizenship_country_id: '',
    nid_type: 'electronic',
    nid_number: '',
    phone: '',
    whatsapp: '',
    email: '',
    occupation: '',
    address: '',
    notes: '',
    photo: null,
    documents: [],
    shareholdings: [],
});

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

export default function ShareholdersPage({
    shareholders,
    countries,
    properties,
    currencies,
}: Props) {
    const { t } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('shareholders.manage');
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState<Shareholder | null>(null);
    const [managing, setManaging] = useState<Shareholder | null>(null);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return shareholders;
        return shareholders.filter((shareholder) =>
            `${shareholder.full_name} ${shareholder.nid_number} ${shareholder.phone ?? ''}`
                .toLowerCase()
                .includes(query),
        );
    }, [search, shareholders]);

    const representedProperties = new Set(
        shareholders.flatMap((shareholder) =>
            (shareholder.shareholdings ?? [])
                .filter(isCurrent)
                .map((holding) => holding.property_id),
        ),
    ).size;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard', 'Dashboard'), href: '/dashboard' },
        {
            title: t('shareholders.title', 'Shareholders'),
            href: '/shareholders',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('shareholders.title', 'Shareholders')} />
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            {t('shareholders.identity', 'Identity & contact')}
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('shareholders.title', 'Shareholders')}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            {t('shareholders.subtitle')}
                        </p>
                    </div>
                    {canManage && (
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="me-2 h-4 w-4" />
                                    {t('shareholders.register')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        {t('shareholders.register')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t('shareholders.subtitle')}
                                    </DialogDescription>
                                </DialogHeader>
                                <ShareholderForm
                                    countries={countries}
                                    properties={properties}
                                    currencies={currencies}
                                    onSuccess={() => setCreateOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Stat
                        icon={<UsersRound className="h-5 w-5" />}
                        label={t('shareholders.total')}
                        value={shareholders.length}
                    />
                    <Stat
                        icon={<Handshake className="h-5 w-5" />}
                        label={t('shareholders.assigned')}
                        value={
                            shareholders.filter((s) =>
                                (s.shareholdings ?? []).some(isCurrent),
                            ).length
                        }
                    />
                    <Stat
                        icon={<Building2 className="h-5 w-5" />}
                        label={t('shareholders.properties')}
                        value={representedProperties}
                    />
                </div>

                <div className="relative max-w-xl">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('shareholders.searchPlaceholder')}
                        className="bg-white ps-10 dark:bg-neutral-900"
                    />
                </div>

                {visible.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-16 text-center text-sm text-muted-foreground">
                            {t('shareholders.noResults')}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {visible.map((shareholder) => (
                            <ShareholderCard
                                key={shareholder.id}
                                shareholder={shareholder}
                                canManage={canManage}
                                onEdit={() => setEditing(shareholder)}
                                onManage={() => setManaging(shareholder)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <Dialog open onOpenChange={(open) => !open && setEditing(null)}>
                    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{t('shareholders.edit')}</DialogTitle>
                        </DialogHeader>
                        <ShareholderForm
                            shareholder={editing}
                            countries={countries}
                            properties={properties}
                            currencies={currencies}
                            onSuccess={() => setEditing(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}
            {managing && (
                <OwnershipDialog
                    shareholder={
                        shareholders.find(
                            (shareholder) => shareholder.id === managing.id,
                        ) ?? managing
                    }
                    properties={properties}
                    currencies={currencies}
                    canManage={canManage}
                    onClose={() => setManaging(null)}
                />
            )}
        </AppLayout>
    );
}

function Stat({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    return (
        <Card className="shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-semibold">
                        {formatNumber(value)}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function ShareholderCard({
    shareholder,
    canManage,
    onEdit,
    onManage,
}: {
    shareholder: Shareholder;
    canManage: boolean;
    onEdit: () => void;
    onManage: () => void;
}) {
    const { t } = useLocalization();
    const current = (shareholder.shareholdings ?? []).filter(isCurrent);
    const initials = shareholder.full_name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('');

    return (
        <Card className="overflow-hidden shadow-none transition-colors hover:border-primary/30">
            <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage
                                src={shareholder.photo_url ?? undefined}
                            />
                            <AvatarFallback className="font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h2 className="truncate font-semibold">
                                {shareholder.full_name}
                            </h2>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge
                                    variant={
                                        shareholder.is_active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {t(
                                        shareholder.is_active
                                            ? 'shareholders.active'
                                            : 'shareholders.inactive',
                                    )}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {t(
                                        `shareholders.nidTypes.${shareholder.nid_type}`,
                                        shareholder.nid_type,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                    {canManage && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onEdit}
                            title={t('shareholders.edit')}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <IdCard className="h-4 w-4" />
                        <span dir="ltr">{shareholder.nid_number}</span>
                    </div>
                    {shareholder.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{shareholder.phone}</span>
                        </div>
                    )}
                    {shareholder.citizenship_country?.name && (
                        <div className="flex items-center gap-2">
                            <MoreHorizontal className="h-4 w-4" />
                            {shareholder.citizenship_country.name}
                        </div>
                    )}
                </div>
                <Separator />
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {t('shareholders.ownership')}
                        </p>
                        <Badge variant="outline">
                            {formatNumber(current.length)}
                        </Badge>
                    </div>
                    {current.length ? (
                        current.slice(0, 2).map((holding) => (
                            <div
                                key={holding.id}
                                className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm"
                            >
                                <span className="truncate">
                                    {holding.property?.name}
                                </span>
                                <span className="ms-3 font-semibold" dir="ltr">
                                    {cleanPercentage(holding.percentage)}%
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="py-2 text-xs text-muted-foreground">
                            {t('shareholders.noOwnership')}
                        </p>
                    )}
                </div>
                <Button variant="outline" className="w-full" onClick={onManage}>
                    <Handshake className="me-2 h-4 w-4" />
                    {t('shareholders.manage')}
                </Button>
            </CardContent>
        </Card>
    );
}

function ShareholderForm({
    shareholder,
    countries,
    properties,
    currencies,
    onSuccess,
}: {
    shareholder?: Shareholder;
    countries: Country[];
    properties: Property[];
    currencies: Currency[];
    onSuccess: () => void;
}) {
    const { t } = useLocalization();
    const form = useForm<ShareholderFormData>(
        shareholder
            ? {
                  ...emptyShareholder(),
                  full_name: shareholder.full_name,
                  father_name: shareholder.father_name ?? '',
                  grandfather_name: shareholder.grandfather_name ?? '',
                  gender: shareholder.gender ?? '',
                  date_of_birth: shareholder.date_of_birth ?? '',
                  country_of_birth_id: String(
                      shareholder.country_of_birth_id ?? '',
                  ),
                  citizenship_country_id: String(
                      shareholder.citizenship_country_id ?? '',
                  ),
                  nid_type: shareholder.nid_type,
                  nid_number: shareholder.nid_number,
                  phone: shareholder.phone ?? '',
                  whatsapp: shareholder.whatsapp ?? '',
                  email: shareholder.email ?? '',
                  occupation: shareholder.occupation ?? '',
                  address: shareholder.address ?? '',
                  notes: shareholder.notes ?? '',
              }
            : emptyShareholder(),
    );
    const options = (values: Record<string, string>) =>
        Object.entries(values).map(([value, label]) => ({ value, label }));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (shareholder) {
            form.transform((data) => ({
                ...data,
                _method: 'put',
                documents: [],
                property_id: '',
            }));
            form.post(`/shareholders/${shareholder.id}`, {
                forceFormData: true,
                onSuccess,
            });
        } else {
            form.post('/shareholders', { forceFormData: true, onSuccess });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                    label={t('shareholders.fields.fullName')}
                    error={form.errors.full_name}
                    required
                >
                    <Input
                        value={form.data.full_name}
                        onChange={(e) =>
                            form.setData('full_name', e.target.value)
                        }
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.fatherName')}
                    error={form.errors.father_name}
                >
                    <Input
                        value={form.data.father_name}
                        onChange={(e) =>
                            form.setData('father_name', e.target.value)
                        }
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.grandfatherName')}
                    error={form.errors.grandfather_name}
                >
                    <Input
                        value={form.data.grandfather_name}
                        onChange={(e) =>
                            form.setData('grandfather_name', e.target.value)
                        }
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.gender')}
                    error={form.errors.gender}
                >
                    <SearchableDropdown
                        value={form.data.gender}
                        onValueChange={(value) => form.setData('gender', value)}
                        options={options({
                            male: t('shareholders.genders.male'),
                            female: t('shareholders.genders.female'),
                            other: t('shareholders.genders.other'),
                        })}
                        placeholder={t('shareholders.select')}
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.dateOfBirth')}
                    error={form.errors.date_of_birth}
                >
                    <Input
                        type="date"
                        value={form.data.date_of_birth}
                        onChange={(e) =>
                            form.setData('date_of_birth', e.target.value)
                        }
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.birthCountry')}
                    error={form.errors.country_of_birth_id}
                >
                    <SearchableDropdown
                        value={form.data.country_of_birth_id}
                        onValueChange={(value) =>
                            form.setData('country_of_birth_id', value)
                        }
                        options={countries.map((c) => ({
                            value: String(c.id),
                            label: c.name,
                        }))}
                        placeholder={t('shareholders.select')}
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.citizenship')}
                    error={form.errors.citizenship_country_id}
                >
                    <SearchableDropdown
                        value={form.data.citizenship_country_id}
                        onValueChange={(value) =>
                            form.setData('citizenship_country_id', value)
                        }
                        options={countries.map((c) => ({
                            value: String(c.id),
                            label: c.name,
                        }))}
                        placeholder={t('shareholders.select')}
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.nidType')}
                    error={form.errors.nid_type}
                    required
                >
                    <SearchableDropdown
                        value={form.data.nid_type}
                        onValueChange={(value) =>
                            form.setData('nid_type', value)
                        }
                        options={options({
                            electronic: t('shareholders.nidTypes.electronic'),
                            paper: t('shareholders.nidTypes.paper'),
                            passport: t('shareholders.nidTypes.passport'),
                            other: t('shareholders.nidTypes.other'),
                        })}
                        placeholder={t('shareholders.select')}
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.nidNumber')}
                    error={form.errors.nid_number}
                    required
                >
                    <Input
                        value={form.data.nid_number}
                        onChange={(e) =>
                            form.setData('nid_number', e.target.value)
                        }
                        dir="ltr"
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.phone')}
                    error={form.errors.phone}
                >
                    <Input
                        value={form.data.phone}
                        onChange={(e) => form.setData('phone', e.target.value)}
                        dir="ltr"
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.whatsapp')}
                    error={form.errors.whatsapp}
                >
                    <Input
                        value={form.data.whatsapp}
                        onChange={(e) =>
                            form.setData('whatsapp', e.target.value)
                        }
                        dir="ltr"
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.email')}
                    error={form.errors.email}
                >
                    <Input
                        type="email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                        dir="ltr"
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.occupation')}
                    error={form.errors.occupation}
                >
                    <Input
                        value={form.data.occupation}
                        onChange={(e) =>
                            form.setData('occupation', e.target.value)
                        }
                    />
                </Field>
                <Field
                    label={t('shareholders.fields.photo')}
                    error={form.errors.photo}
                >
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            form.setData('photo', e.target.files?.[0] ?? null)
                        }
                    />
                </Field>
                {!shareholder && (
                    <Field
                        label={t('shareholders.documents')}
                        error={form.errors.documents}
                    >
                        <Input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={(e) =>
                                form.setData(
                                    'documents',
                                    Array.from(e.target.files ?? []),
                                )
                            }
                        />
                    </Field>
                )}
                <div className="sm:col-span-2 lg:col-span-3">
                    <Field
                        label={t('shareholders.fields.address')}
                        error={form.errors.address}
                    >
                        <Textarea
                            value={form.data.address}
                            onChange={(e) =>
                                form.setData('address', e.target.value)
                            }
                        />
                    </Field>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                    <Field
                        label={t('shareholders.fields.notes')}
                        error={form.errors.notes}
                    >
                        <Textarea
                            value={form.data.notes}
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                        />
                    </Field>
                </div>
            </section>

            {!shareholder && (
                <>
                    <Separator />
                    <section>
                        <h3 className="font-semibold">
                            {t('shareholders.addOwnership')}{' '}
                            <span className="text-sm font-normal text-muted-foreground">
                                ({t('shareholders.optional')})
                            </span>
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('shareholders.ownershipHelp')}
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    </section>
                </>
            )}
            <div className="flex justify-end">
                <Button type="submit" disabled={form.processing}>
                    {shareholder
                        ? t('shareholders.saveChanges')
                        : t('shareholders.save')}
                </Button>
            </div>
        </form>
    );
}

function OwnershipDialog({
    shareholder,
    properties,
    currencies,
    canManage,
    onClose,
}: {
    shareholder: Shareholder;
    properties: Property[];
    currencies: Currency[];
    canManage: boolean;
    onClose: () => void;
}) {
    const { t } = useLocalization();
    const form = useForm<OwnershipFormData>(emptyOwnership());
    const docsForm = useForm<{ documents: File[] }>({ documents: [] });
    const holdings = shareholder.shareholdings ?? [];

    const assign = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/shareholders/${shareholder.id}/shareholdings`, {
            onSuccess: () => form.reset(),
        });
    };
    const upload = (event: FormEvent) => {
        event.preventDefault();
        docsForm.post(`/shareholders/${shareholder.id}/documents`, {
            forceFormData: true,
            onSuccess: () => docsForm.reset(),
        });
    };
    const closeHolding = (holding: PropertyShareholding) =>
        router.post(
            `/shareholders/${shareholder.id}/shareholdings/${holding.id}/close`,
            { effective_to: localToday() },
        );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{shareholder.full_name}</DialogTitle>
                    <DialogDescription>
                        {t('shareholders.ownershipHelp')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <section className="space-y-4">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <Handshake className="h-4 w-4" />
                            {t('shareholders.ownership')}
                        </h3>
                        {holdings.length ? (
                            holdings.map((holding) => (
                                <div
                                    key={holding.id}
                                    className="rounded-xl border p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="font-medium">
                                                {holding.property?.name}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                <CalendarDays className="me-1 inline h-3.5 w-3.5" />
                                                {holding.effective_from} —{' '}
                                                {holding.effective_to ?? '∞'}
                                            </p>
                                        </div>
                                        <div className="text-end">
                                            <p
                                                className="text-xl font-semibold"
                                                dir="ltr"
                                            >
                                                {cleanPercentage(
                                                    holding.percentage,
                                                )}
                                                %
                                            </p>
                                            <Badge
                                                variant={
                                                    isCurrent(holding)
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {t(
                                                    isCurrent(holding)
                                                        ? 'shareholders.current'
                                                        : 'shareholders.historical',
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                    {holding.capital_contribution && (
                                        <p className="mt-3 text-sm text-muted-foreground">
                                            {t('shareholders.fields.capital')}:{' '}
                                            <span dir="ltr">
                                                {formatNumber(
                                                    holding.capital_contribution,
                                                )}{' '}
                                                {holding.currency?.code ?? ''}
                                            </span>
                                        </p>
                                    )}
                                    {canManage && isCurrent(holding) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() =>
                                                closeHolding(holding)
                                            }
                                        >
                                            {t('shareholders.closeToday')}
                                        </Button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                {t('shareholders.noOwnership')}
                            </div>
                        )}

                        {canManage && (
                            <form
                                onSubmit={assign}
                                className="rounded-xl border bg-muted/20 p-4"
                            >
                                <h4 className="mb-4 font-medium">
                                    {t('shareholders.addOwnership')}
                                </h4>
                                <div className="grid gap-4 sm:grid-cols-2">
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
                                <Button
                                    className="mt-4"
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {t('shareholders.addOwnership')}
                                </Button>
                            </form>
                        )}
                    </section>
                    <section className="space-y-4">
                        <div>
                            <h3 className="flex items-center gap-2 font-semibold">
                                <FileText className="h-4 w-4" />
                                {t('shareholders.documents')}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t('shareholders.documentsHelp')}
                            </p>
                        </div>
                        {(shareholder.documents ?? []).length ? (
                            shareholder.documents?.map((document) => (
                                <div
                                    key={document.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border p-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {document.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {document.mime_type}
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            asChild
                                        >
                                            <a
                                                href={`/shareholders/${shareholder.id}/documents/${document.id}`}
                                                title={t(
                                                    'shareholders.download',
                                                )}
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    router.delete(
                                                        `/shareholders/${shareholder.id}/documents/${document.id}`,
                                                    )
                                                }
                                                title={t('shareholders.remove')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">
                                {t('shareholders.noDocuments')}
                            </p>
                        )}
                        {canManage && (
                            <form onSubmit={upload} className="space-y-3">
                                <Input
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,image/*"
                                    onChange={(e) =>
                                        docsForm.setData(
                                            'documents',
                                            Array.from(e.target.files ?? []),
                                        )
                                    }
                                />
                                <InputError
                                    message={docsForm.errors.documents}
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={
                                        !docsForm.data.documents.length ||
                                        docsForm.processing
                                    }
                                >
                                    <Upload className="me-2 h-4 w-4" />
                                    {t('shareholders.upload')}
                                </Button>
                            </form>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
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
                    options={properties.map((p) => ({
                        value: String(p.id),
                        label: p.name,
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
                    options={currencies.map((c) => ({
                        value: String(c.id),
                        label: `${c.code} — ${c.symbol}`,
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
                    onChange={(e) => setData('effective_from', e.target.value)}
                />
            </Field>
            <Field
                label={t('shareholders.fields.effectiveTo')}
                error={errors.effective_to}
            >
                <Input
                    type="date"
                    value={data.effective_to}
                    onChange={(e) => setData('effective_to', e.target.value)}
                />
            </Field>
            <div className="sm:col-span-2">
                <Field
                    label={t('shareholders.fields.assignmentNotes')}
                    error={errors.assignment_notes}
                >
                    <Textarea
                        value={data.assignment_notes}
                        onChange={(e) =>
                            setData('assignment_notes', e.target.value)
                        }
                    />
                </Field>
            </div>
        </>
    );
}

function Field({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>
                {label}
                {required && <span className="ms-1 text-destructive">*</span>}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
