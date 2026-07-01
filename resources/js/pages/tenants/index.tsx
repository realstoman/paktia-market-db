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
} from '@/components/ui/alert-dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    ChevronLeft,
    ChevronRight,
    ContactRound,
    Eye,
    FileSignature,
    IdCard,
    MoreHorizontal,
    Pencil,
    Plus,
    Printer,
    ScanLine,
    Search,
    ShieldCheck,
    Upload,
    UserRound,
} from 'lucide-react';
import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react';

interface TenantPaginator {
    data: Tenant[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface Props {
    tenants: TenantPaginator;
    summary: {
        total: number;
        assigned: number;
        persons: number;
        businesses: number;
        properties: number;
    };
    filters: {
        search?: string;
        property_id?: number | null;
        tenant_kind?: 'business' | 'person' | null;
    };
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
    initial_rent_months: string;
    initial_rent_payment_date: string;
    initial_rent_payment_method: string;
}

const today = () => new Date().toLocaleDateString('en-CA');
const MAX_TENANT_DOCUMENTS = 5;
const MAX_TENANT_DOCUMENT_BYTES = 2 * 1024 * 1024;
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
    initial_rent_months: '',
    initial_rent_payment_date: today(),
    initial_rent_payment_method: 'cash',
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
const shopNumber = (lease?: Lease) => {
    if (!lease) return null;

    return (
        lease.unit?.unit_number ??
        (propertyBehavior(lease.property) === 'commercial_unit'
            ? (lease.property?.external_unit_number ?? null)
            : null)
    );
};
const propertyBehavior = (property?: Property | null) =>
    property?.type_definition?.behavior ??
    property?.property_type_behavior ??
    (property?.property_type === 'mall' ? 'market' : property?.property_type);
const currencySymbol = (currency?: Currency | null) => {
    const code = currency?.code?.toUpperCase();

    if (code === 'AFN') return '؋';
    if (code === 'USD') return '$';

    return currency?.symbol || currency?.code || '';
};

function buildPageNumbers(currentPage: number, lastPage: number) {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage]);

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        if (page > 1 && page < lastPage) pages.add(page);
    }

    if (currentPage <= 3) [2, 3, 4].forEach((page) => pages.add(page));
    if (currentPage >= lastPage - 2) {
        [lastPage - 1, lastPage - 2, lastPage - 3].forEach((page) =>
            pages.add(page),
        );
    }

    return [...pages]
        .filter((page) => page >= 1 && page <= lastPage)
        .sort((left, right) => left - right);
}

export default function TenantsIndex({
    tenants,
    summary,
    filters,
    properties,
    currencies,
    initialPropertyId,
}: Props) {
    const { t, isRtl, locale } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('tenants.manage');
    const [search, setSearch] = useState(filters.search ?? '');
    const [propertyFilter, setPropertyFilter] = useState(
        filters.property_id ? String(filters.property_id) : 'all',
    );
    const [tenantKindFilter, setTenantKindFilter] = useState<string>(
        filters.tenant_kind ?? 'all',
    );
    const [scan, setScan] = useState('');
    const [open, setOpen] = useState(false);
    const pageNumbers = useMemo(
        () => buildPageNumbers(tenants.current_page, tenants.last_page),
        [tenants.current_page, tenants.last_page],
    );
    const propertyLabel = (property: Property) =>
        property.name_translations?.[
            locale as keyof NonNullable<Property['name_translations']>
        ] || property.name;
    const selectedPropertyId =
        propertyFilter === 'all' ? undefined : propertyFilter;
    const selectedTenantKind =
        tenantKindFilter === 'all' ? undefined : tenantKindFilter;

    useEffect(() => {
        if (
            search.trim() === (filters.search ?? '') &&
            (selectedPropertyId ?? null) ===
                (filters.property_id ? String(filters.property_id) : null) &&
            (selectedTenantKind ?? null) === (filters.tenant_kind ?? null)
        ) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                '/tenants',
                {
                    search: search.trim() || undefined,
                    property_id: selectedPropertyId,
                    tenant_kind: selectedTenantKind,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: ['tenants', 'summary', 'filters'],
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [
        filters.property_id,
        filters.search,
        filters.tenant_kind,
        search,
        selectedPropertyId,
        selectedTenantKind,
    ]);

    const goToPage = (page: number) => {
        router.get(
            '/tenants',
            {
                page,
                search: search.trim() || undefined,
                property_id: selectedPropertyId,
                tenant_kind: selectedTenantKind,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['tenants', 'summary', 'filters'],
            },
        );
    };
    const openScannedProfile = () => {
        const normalizedScan = scan.trim();

        if (!normalizedScan) {
            return;
        }

        const match = tenants.data.find(
            (tenant) =>
                tenant.card_code.toLowerCase() ===
                normalizedScan.toLowerCase(),
        );
        if (match) {
            router.visit(`/tenants/${match.id}`);
            return;
        }

        router.get('/tenants', { scan: normalizedScan });
    };
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard'), href: '/dashboard' },
        { title: t('tenants.title'), href: '/tenants' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('tenants.title')} />
            <div
                className="mx-auto w-full max-w-[1600px] space-y-4 **:data-[slot=card]:shadow-none"
                dir={isRtl ? 'rtl' : 'ltr'}
            >
                <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('tenants.title')}
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            {t('tenants.subtitle')}
                        </p>
                    </div>
                    {canManage && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="me-2 h-4 w-4" />
                                    {t('tenants.register')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[92vh] overflow-x-hidden overflow-y-auto rounded-2xl bg-[#f8f9fd] sm:max-w-5xl [&_input]:bg-white [&_textarea]:bg-white">
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
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                    {(
                        [
                            [
                                ContactRound,
                                t('tenants.total'),
                                summary.businesses,
                            ],
                            [IdCard, t('tenants.persons'), summary.persons],
                            [
                                Building2,
                                t('tenants.rentedProperties'),
                                summary.properties,
                            ],
                        ] as [typeof ContactRound, string, number][]
                    ).map(([Icon, label, value], index) => (
                        <Card
                            key={index}
                            className="border border-primary/10 shadow-none"
                        >
                            <CardContent className="flex items-center gap-3 py-4">
                                <div className="rounded-lg bg-muted p-2.5 text-primary">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold">
                                        {value as number}
                                    </p>
                                    <p className="text-base text-muted-foreground">
                                        {label as string}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid gap-3 rounded-xl border border-primary/10 bg-card p-3 shadow-none lg:grid-cols-[1fr_1.35fr]">
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
                    <div className="min-w-0">
                        <Label className="mb-2 flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            {t('common.search', 'Search')}
                        </Label>
                        <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_220px_190px]">
                            <Input
                                className="bg-white dark:bg-neutral-950"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder={t('tenants.searchPlaceholder')}
                            />
                            <SearchableDropdown
                                value={propertyFilter}
                                onValueChange={setPropertyFilter}
                                placeholder={t('tenants.filters.property')}
                                searchPlaceholder={t(
                                    'tenants.filters.searchProperties',
                                )}
                                emptyText={t(
                                    'tenants.filters.noPropertiesFound',
                                )}
                                options={[
                                    {
                                        value: 'all',
                                        label: t(
                                            'tenants.filters.allProperties',
                                        ),
                                    },
                                    ...properties.map((property) => ({
                                        value: String(property.id),
                                        label: propertyLabel(property),
                                    })),
                                ]}
                            />
                            <SearchableDropdown
                                value={tenantKindFilter}
                                onValueChange={setTenantKindFilter}
                                placeholder={t('tenants.filters.renterType')}
                                searchPlaceholder={t(
                                    'tenants.filters.searchRenterTypes',
                                )}
                                emptyText={t(
                                    'tenants.filters.noRenterTypesFound',
                                )}
                                options={[
                                    {
                                        value: 'all',
                                        label: t('tenants.filters.allRenters'),
                                    },
                                    {
                                        value: 'business',
                                        label: t('tenants.filters.business'),
                                    },
                                    {
                                        value: 'person',
                                        label: t('tenants.filters.person'),
                                    },
                                ]}
                            />
                        </div>
                    </div>
                </section>

                {tenants.data.length ? (
                    <section className="overflow-hidden rounded-xl border bg-card shadow-none">
                        <Table>
                            <TableHeader className="bg-[#edf1f4]">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="min-w-64 px-4 text-start">
                                        {t('tenants.table.owner')}
                                    </TableHead>
                                    <TableHead className="min-w-48 text-start">
                                        {t('tenants.table.business')}
                                    </TableHead>
                                    <TableHead className="min-w-32 text-start">
                                        {t('tenants.table.space')}
                                    </TableHead>
                                    <TableHead className="min-w-48 text-start">
                                        {t('tenants.table.property')}
                                    </TableHead>
                                    <TableHead className="min-w-44 text-start">
                                        {t('tenants.table.finance')}
                                    </TableHead>
                                    <TableHead className="text-start">
                                        {t('tenants.table.status')}
                                    </TableHead>
                                    <TableHead className="w-16 px-4 text-end">
                                        {t('tenants.table.actions')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.data.map((tenant) => {
                                    const lease = currentLease(tenant);
                                    const number = shopNumber(lease);
                                    const spaceType =
                                        lease?.unit?.unit_type ??
                                        lease?.leased_space_type;

                                    return (
                                        <TableRow
                                            key={tenant.id}
                                            tabIndex={0}
                                            role="link"
                                            className="cursor-pointer"
                                            onClick={() =>
                                                router.visit(
                                                    `/tenants/${tenant.id}`,
                                                )
                                            }
                                            onKeyDown={(event) => {
                                                if (
                                                    event.key === 'Enter' ||
                                                    event.key === ' '
                                                ) {
                                                    event.preventDefault();
                                                    router.visit(
                                                        `/tenants/${tenant.id}`,
                                                    );
                                                }
                                            }}
                                        >
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-11 shrink-0 rounded-xl border bg-white">
                                                        <AvatarImage
                                                            src={
                                                                tenant.photo_url ??
                                                                undefined
                                                            }
                                                            className="object-cover"
                                                        />
                                                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                                                            {initials(
                                                                tenant.full_name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold">
                                                            {tenant.full_name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {tenant.phone}
                                                        </p>
                                                        {lease?.contract_number ? (
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {t(
                                                                    'tenants.table.contractNumber',
                                                                )}
                                                                :{' '}
                                                                {
                                                                    lease.contract_number
                                                                }
                                                            </p>
                                                        ) : (
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {
                                                                    tenant.card_code
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-56">
                                                    <p className="truncate font-medium">
                                                        {tenant.business_name ||
                                                            t(
                                                                'tenants.table.noBusiness',
                                                            )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t(
                                                            `tenants.${tenant.tenant_type}`,
                                                        )}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {number ? (
                                                    <Badge variant="outline">
                                                        {t(
                                                            spaceType ===
                                                                'apartment'
                                                                ? 'tenants.lease.apartment'
                                                                : 'tenants.lease.shop',
                                                        )}{' '}
                                                        {number}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-60">
                                                    <p className="truncate font-medium">
                                                        {lease?.property
                                                            ? propertyLabel(
                                                                  lease.property,
                                                              )
                                                            : t(
                                                                  'tenants.table.unassigned',
                                                              )}
                                                    </p>
                                                    {lease?.floor && (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {lease.floor.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {lease ? (
                                                    <div>
                                                        <p className="font-semibold">
                                                            {lease.rent_amount
                                                                ? formatNumber(
                                                                      lease.rent_amount,
                                                                  )
                                                                : '—'}{' '}
                                                            <span className="text-xs font-normal text-muted-foreground">
                                                                {currencySymbol(
                                                                    lease.currency,
                                                                )}
                                                            </span>
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {t(
                                                                `tenants.lease.${lease.payment_frequency}`,
                                                            )}{' '}
                                                            ·{' '}
                                                            {t(
                                                                `tenants.lease.${lease.status}`,
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        {t(
                                                            'tenants.lease.noAssignment',
                                                        )}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
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
                                            </TableCell>
                                            <TableCell
                                                className="px-4 text-end"
                                                onClick={(event) =>
                                                    event.stopPropagation()
                                                }
                                                onKeyDown={(event) =>
                                                    event.stopPropagation()
                                                }
                                            >
                                                <TenantRowActions
                                                    tenant={tenant}
                                                    lease={lease}
                                                    canManage={canManage}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <div className="flex flex-col gap-3 border-t bg-[#f8f9fd] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                {t('tenants.pagination.summary')
                                    .replace(':from', String(tenants.from ?? 0))
                                    .replace(':to', String(tenants.to ?? 0))
                                    .replace(':total', String(tenants.total))}
                            </p>
                            {tenants.last_page > 1 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={tenants.current_page <= 1}
                                        onClick={() =>
                                            goToPage(tenants.current_page - 1)
                                        }
                                        aria-label={t('common.previousPage')}
                                    >
                                        {isRtl ? (
                                            <ChevronRight className="size-4" />
                                        ) : (
                                            <ChevronLeft className="size-4" />
                                        )}
                                    </Button>
                                    {pageNumbers.map((page, index) => {
                                        const previous = pageNumbers[index - 1];
                                        const showGap =
                                            previous !== undefined &&
                                            page - previous > 1;

                                        return (
                                            <Fragment key={page}>
                                                {showGap && (
                                                    <span className="px-1 text-muted-foreground">
                                                        …
                                                    </span>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant={
                                                        page ===
                                                        tenants.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    className="min-w-9"
                                                    onClick={() =>
                                                        goToPage(page)
                                                    }
                                                    aria-current={
                                                        page ===
                                                        tenants.current_page
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            </Fragment>
                                        );
                                    })}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            tenants.current_page >=
                                            tenants.last_page
                                        }
                                        onClick={() =>
                                            goToPage(tenants.current_page + 1)
                                        }
                                        aria-label={t('common.nextPage')}
                                    >
                                        {isRtl ? (
                                            <ChevronLeft className="size-4" />
                                        ) : (
                                            <ChevronRight className="size-4" />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
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

function TenantRowActions({
    tenant,
    lease,
    canManage,
}: {
    tenant: Tenant;
    lease?: Lease;
    canManage: boolean;
}) {
    const { t, isRtl } = useLocalization();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    const changeStatus = () => {
        router.post(
            `/tenants/${tenant.id}/toggle`,
            {},
            {
                preserveScroll: true,
                onStart: () => setIsChangingStatus(true),
                onFinish: () => {
                    setIsChangingStatus(false);
                    setConfirmOpen(false);
                },
            },
        );
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('tenants.table.actions')}
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                    <DropdownMenuLabel>
                        {t('tenants.table.actions')}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={`/tenants/${tenant.id}`}>
                            <Eye />
                            {t('tenants.actions.view')}
                        </Link>
                    </DropdownMenuItem>
                    {canManage && (
                        <DropdownMenuItem asChild>
                            <Link href={`/tenants/${tenant.id}?edit=1`}>
                                <Pencil />
                                {t('tenants.actions.edit')}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href={`/tenants/${tenant.id}#tenant-finance`}>
                            <Banknote />
                            {t('tenants.actions.financialStatus')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link
                            href={`/tenants/${tenant.id}/card`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Printer />
                            {t('tenants.actions.printCard')}
                        </Link>
                    </DropdownMenuItem>
                    {lease && (
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/tenants/${tenant.id}/leases/${lease.id}/contract`}
                            >
                                <FileSignature />
                                {t('leaseContract.tableAction')}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {canManage && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => setConfirmOpen(true)}
                            >
                                <ShieldCheck />
                                {t('tenants.statusAction')}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader
                        className={isRtl ? 'text-right sm:text-right' : ''}
                    >
                        <AlertDialogTitle>
                            {t('tenants.statusConfirm.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                tenant.is_active
                                    ? 'tenants.statusConfirm.deactivateDescription'
                                    : 'tenants.statusConfirm.activateDescription',
                            ).replace(
                                ':name',
                                tenant.business_name || tenant.full_name,
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isChangingStatus}>
                            {t('tenants.statusConfirm.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={
                                tenant.is_active ? 'destructive' : 'default'
                            }
                            disabled={isChangingStatus}
                            onClick={changeStatus}
                        >
                            {t(
                                tenant.is_active
                                    ? 'tenants.statusConfirm.confirmDeactivate'
                                    : 'tenants.statusConfirm.confirmActivate',
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [documentError, setDocumentError] = useState<string | null>(null);

    useEffect(
        () => () => {
            if (photoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(photoPreview);
            }
        },
        [photoPreview],
    );

    const selectPhoto = (photo: File | null) => {
        setData('photo', photo);
        setPhotoPreview(photo ? URL.createObjectURL(photo) : null);
    };
    const selectDocuments = (files: FileList | null) => {
        const selectedFiles = Array.from(files ?? []);
        const totalBytes = selectedFiles.reduce(
            (total, file) => total + file.size,
            0,
        );

        if (selectedFiles.length > MAX_TENANT_DOCUMENTS) {
            setDocumentError(
                t('tenants.fields.documentsMaxFiles').replace(
                    ':count',
                    String(MAX_TENANT_DOCUMENTS),
                ),
            );
            setData('documents', []);
            return;
        }

        if (totalBytes > MAX_TENANT_DOCUMENT_BYTES) {
            setDocumentError(t('tenants.fields.documentsMaxSize'));
            setData('documents', []);
            return;
        }

        setDocumentError(null);
        setData('documents', selectedFiles);
    };
    const property = properties.find(
        (item) => String(item.id) === data.property_id,
    );
    const behavior = propertyBehavior(property);
    const unitOptions = ['house', 'commercial_unit'].includes(behavior ?? '')
        ? [{ value: '', label: t('tenants.lease.wholeProperty') }]
        : [
              ...(behavior === 'block'
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
        post('/tenants', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPhotoPreview(null);
                setDocumentError(null);
                onDone();
            },
        });
    };
    const field = (key: keyof FormData, label: string, type = 'text') => (
        <div className="min-w-0 space-y-1.5">
            <Label htmlFor={`tenant-${key}`}>{label}</Label>
            <Input
                id={`tenant-${key}`}
                type={type}
                className="bg-white"
                value={data[key] as string}
                onChange={(event) => setData(key, event.target.value as never)}
            />
            <InputError message={errors[key]} />
        </div>
    );

    return (
        <form onSubmit={submit} className="min-w-0 space-y-6">
            <section className="space-y-4">
                <h3 className="flex items-center gap-2 font-semibold">
                    <UserRound className="h-4 w-4 text-primary" />
                    {t('tenants.identity')}
                </h3>
                <div className="grid min-w-0 gap-4 md:grid-cols-4">
                    <div className="min-w-0 space-y-1.5">
                        <Label>{t('tenants.fields.tenantType')}</Label>
                        <SearchableDropdown
                            value={data.tenant_type}
                            onValueChange={(value) => {
                                setData('tenant_type', value);
                                if (value === 'individual') {
                                    setData('business_name', '');
                                    setData('license_number', '');
                                }
                            }}
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
                    {data.tenant_type === 'company' &&
                        field(
                            'business_name',
                            t('tenants.fields.businessName'),
                        )}
                    {field('phone', t('tenants.fields.phone'))}
                    {field('whatsapp', t('tenants.fields.whatsapp'))}
                    {field('email', t('tenants.fields.email'), 'email')}
                    {field('nid_number', t('tenants.fields.nid'))}
                    {data.tenant_type === 'company' &&
                        field('license_number', t('tenants.fields.license'))}
                </div>

                <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="tenant-create-photo">
                        {t('tenants.fields.photo')}
                    </Label>
                    <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-dashed border-[#002452]/20 bg-white p-4 sm:flex-row sm:items-center">
                        <Avatar className="h-20 w-20 rounded-2xl border border-[#002452]/10">
                            <AvatarImage
                                src={photoPreview ?? undefined}
                                className="h-full w-full object-cover object-center"
                            />
                            <AvatarFallback className="rounded-2xl bg-[#f1f5f9] text-xl text-[#002452]">
                                {initials(data.full_name || '?')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#002452]">
                                {data.photo?.name ?? t('tenants.fields.photo')}
                            </p>
                            <label
                                htmlFor="tenant-create-photo"
                                className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#002452]/20 bg-white px-3 text-sm font-medium text-[#002452] transition-colors hover:bg-[#002452]/5"
                            >
                                <Upload className="me-2 size-4" />
                                {t('tenants.profile.upload')}
                            </label>
                            <Input
                                id="tenant-create-photo"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) =>
                                    selectPhoto(event.target.files?.[0] ?? null)
                                }
                            />
                        </div>
                    </div>
                    <InputError message={errors.photo} />
                </div>

                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                        <Label>{t('tenants.fields.address')}</Label>
                        <Textarea
                            className="min-h-24 bg-white"
                            value={data.address}
                            onChange={(event) =>
                                setData('address', event.target.value)
                            }
                        />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                        <Label>{t('tenants.fields.notes')}</Label>
                        <Textarea
                            className="min-h-24 bg-white"
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                        />
                    </div>
                </div>

                <div className="min-w-0 space-y-1.5">
                    <Label htmlFor="tenant-create-documents">
                        {t('tenants.fields.documents')}
                    </Label>
                    <div className="min-w-0 rounded-2xl border border-dashed border-[#002452]/20 bg-white p-4">
                        {data.documents.length ? (
                            <div className="space-y-1">
                                {data.documents.map((document) => (
                                    <p
                                        key={`${document.name}-${document.size}`}
                                        className="truncate text-sm font-medium text-[#002452]"
                                    >
                                        {document.name}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="truncate text-sm font-medium text-[#002452]">
                                {t('tenants.fields.documents')}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('tenants.fields.documentsHelp')}
                        </p>
                        <label
                            htmlFor="tenant-create-documents"
                            className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-lg border border-[#002452]/20 bg-white px-3 text-sm font-medium text-[#002452] transition-colors hover:bg-[#002452]/5"
                        >
                            <Upload className="me-2 size-4" />
                            {t('tenants.profile.upload')}
                        </label>
                        <Input
                            id="tenant-create-documents"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            className="sr-only"
                            onChange={(event) =>
                                selectDocuments(event.target.files)
                            }
                        />
                    </div>
                    <InputError message={documentError ?? errors.documents} />
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
                <div className="grid min-w-0 gap-4 md:grid-cols-4">
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
                                label: currencySymbol(currency),
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
                    <div className="space-y-1.5">
                        <Label>
                            {t(
                                'tenants.lease.initialRentMonths',
                                'Prepaid rent months',
                            )}
                        </Label>
                        <NumericInput
                            showControls={false}
                            min="0"
                            max="24"
                            step="1"
                            value={data.initial_rent_months}
                            onValueChange={(value) =>
                                setData('initial_rent_months', value)
                            }
                        />
                        <InputError message={errors.initial_rent_months} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>
                            {t(
                                'tenants.lease.initialRentPaymentDate',
                                'Initial rent payment date',
                            )}
                        </Label>
                        <Input
                            type="date"
                            value={data.initial_rent_payment_date}
                            onChange={(event) =>
                                setData(
                                    'initial_rent_payment_date',
                                    event.target.value,
                                )
                            }
                            className="bg-white"
                        />
                        <InputError
                            message={errors.initial_rent_payment_date}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>
                            {t(
                                'tenants.lease.initialRentPaymentMethod',
                                'Initial rent payment method',
                            )}
                        </Label>
                        <SearchableDropdown
                            value={data.initial_rent_payment_method}
                            onValueChange={(value) =>
                                setData('initial_rent_payment_method', value)
                            }
                            placeholder={t('tenants.fields.select')}
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
                        <InputError
                            message={errors.initial_rent_payment_method}
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
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
