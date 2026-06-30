import InputError from '@/components/input-error';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';
import { Lease, SharedData, Tenant } from '@/types';
import { formatCurrencySymbol, formatNumber } from '@/utils/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Download,
    FileCheck2,
    FileSignature,
    FileUp,
    Printer,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { FormEvent } from 'react';

interface ContractArticle {
    id: number;
    article_number: string;
    title: string;
    body: string;
    sort_order: number;
}

interface ContractTemplate {
    id: number;
    property_id?: number | null;
    name: string;
    contract_title: string;
    intro_text?: string | null;
    logo_url?: string | null;
    landlord_organization: string;
    representative_name: string;
    representative_position: string;
    representative_contact?: string | null;
    landlord_signature_label: string;
    tenant_signature_label: string;
    witness_signature_label: string;
    footer_text?: string | null;
    articles: ContractArticle[];
}

interface TemplateOption {
    id: number;
    name: string;
    property_id?: number | null;
}

interface SignedDocument {
    id: number;
    original_name: string;
    mime_type?: string | null;
    size_bytes?: number | null;
    signed_at?: string | null;
    created_at: string;
    template?: { id: number; name: string } | null;
}

interface Props {
    tenant: Tenant;
    lease: Lease;
    template: ContractTemplate;
    templates: TemplateOption[];
    signedDocuments: SignedDocument[];
}

const localToday = () => new Date().toLocaleDateString('en-CA');
const formatDate = (date?: string | null) => {
    if (!date) return '—';
    const value = new Date(`${date.slice(0, 10)}T00:00:00`);
    return Number.isNaN(value.getTime())
        ? date
        : new Intl.DateTimeFormat('fa-AF', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          }).format(value);
};

const paymentFrequency = (frequency: Lease['payment_frequency']) =>
    ({
        monthly: 'ماهانه',
        quarterly: 'سه‌ماهه',
        yearly: 'سالانه',
    })[frequency];

const propertySpace = (lease: Lease) => {
    if (lease.unit) {
        return `${lease.unit.unit_type === 'apartment' ? 'آپارتمان' : 'دکان'} شماره ${lease.unit.unit_number}${lease.floor ? `، ${lease.floor.name}` : ''}`;
    }
    if (
        lease.property?.property_type === 'commercial_unit' &&
        lease.property.external_unit_number
    ) {
        return `دکان / دفتر شماره ${lease.property.external_unit_number}`;
    }

    const labels: Record<string, string> = {
        shop: 'دکان',
        apartment: 'آپارتمان',
        house: 'خانه',
        block: 'تمام بلاک',
        property: 'تمام جایداد',
    };
    return labels[lease.leased_space_type] ?? 'جایداد';
};

const replacePlaceholders = (
    text: string | null | undefined,
    values: Record<string, string>,
) => {
    let output = text ?? '';
    Object.entries(values).forEach(([key, value]) => {
        output = output.split(key).join(value || '—');
    });
    return output;
};

export default function LeaseContractPage({
    tenant,
    lease,
    template,
    templates,
    signedDocuments,
}: Props) {
    const { t, isRtl } = useLocalization();
    const { branding, auth } = usePage<SharedData>().props;
    const canManage =
        auth.is_super_admin || auth.permissions.includes('tenants.manage');
    const space = propertySpace(lease);
    const dariPropertyName =
        lease.property?.name_translations?.fa || lease.property?.name || '—';
    const dariPropertyAddress =
        lease.property?.address_translations?.fa ||
        lease.property?.address ||
        '—';
    const currency = formatCurrencySymbol(lease.currency);
    const values: Record<string, string> = {
        ':tenant_name': tenant.full_name,
        ':business_name': tenant.business_name ?? tenant.full_name,
        ':property_name': dariPropertyName,
        ':space': space,
        ':start_date': formatDate(lease.start_date),
        ':end_date': formatDate(lease.end_date),
        ':rent_amount': lease.rent_amount
            ? formatNumber(lease.rent_amount)
            : '—',
        ':currency': currency,
        ':payment_frequency': paymentFrequency(lease.payment_frequency),
        ':contract_number': lease.contract_number,
        ':landlord_name': template.representative_name,
        ':landlord_position': template.representative_position,
        ':landlord_organization': template.landlord_organization,
    };
    const uploadForm = useForm<{
        contract_template_id: string;
        signed_at: string;
        document: File | null;
    }>({
        contract_template_id: String(template.id),
        signed_at: localToday(),
        document: null,
    });
    const uploadSigned = (event: FormEvent) => {
        event.preventDefault();
        uploadForm.post(
            `/tenants/${tenant.id}/leases/${lease.id}/contract-documents`,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => uploadForm.reset('document'),
            },
        );
    };

    return (
        <main
            className="min-h-screen bg-[#f8f9fd] px-4 py-6 sm:px-8"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <Head
                title={`${t('leaseContract.pageTitle')} · ${lease.contract_number}`}
            />
            <style>{`
                @page { size: A4; margin: 11mm 13mm; }
                @media print {
                    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                    .contract-screen-controls { display: none !important; }
                    .contract-stage { display: block !important; padding: 0 !important; }
                    .contract-paper { width: auto !important; min-height: auto !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; }
                    .contract-article, .contract-signatures, .contract-facts { break-inside: avoid; }
                }
            `}</style>

            <div className="contract-screen-controls mx-auto mb-6 max-w-[1500px] space-y-4">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                    <Button
                        asChild
                        variant="outline"
                        className="w-fit bg-white"
                    >
                        <Link href={`/tenants/${tenant.id}`}>
                            <ArrowLeft className="me-2 size-4" />
                            {t('leaseContract.back')}
                        </Link>
                    </Button>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="min-w-64">
                            <SearchableDropdown
                                value={String(template.id)}
                                onValueChange={(value) =>
                                    router.get(
                                        `/tenants/${tenant.id}/leases/${lease.id}/contract`,
                                        { template_id: value },
                                        { preserveScroll: true },
                                    )
                                }
                                placeholder={t('leaseContract.chooseTemplate')}
                                options={templates.map((item) => ({
                                    value: String(item.id),
                                    label: item.name,
                                }))}
                            />
                        </div>
                        <Button onClick={() => window.print()} className="h-10">
                            <Printer className="me-2 size-4" />
                            {t('leaseContract.print')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="contract-stage mx-auto grid max-w-[1500px] items-start gap-6 xl:grid-cols-[minmax(0,210mm)_1fr] xl:justify-center">
                <article
                    className="contract-paper min-h-[297mm] w-full max-w-[210mm] justify-self-center border bg-white px-[13mm] py-[11mm] text-[13px] leading-7 text-slate-950 shadow-sm"
                    dir="rtl"
                >
                    <header className="border-b-2 border-[#002452] pb-5 text-center">
                        <div className="mx-auto mb-3 flex h-20 w-24 items-center justify-center">
                            <img
                                src={template.logo_url || branding.logoUrl}
                                alt={template.landlord_organization}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                        <p className="text-sm font-bold text-[#002452]">
                            بسم الله الرحمن الرحیم
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-[#002452]">
                            {template.contract_title}
                        </h1>
                        <p className="mt-1 font-medium">
                            {template.landlord_organization}
                        </p>
                    </header>

                    <section className="contract-facts mt-5 grid grid-cols-2 overflow-hidden rounded-lg border text-xs sm:grid-cols-4">
                        <ContractFact
                            label="شماره قرارداد"
                            value={lease.contract_number}
                        />
                        <ContractFact
                            label="تاریخ ترتیب"
                            value={formatDate(localToday())}
                        />
                        <ContractFact
                            label="تاریخ آغاز"
                            value={formatDate(lease.start_date)}
                        />
                        <ContractFact
                            label="تاریخ ختم"
                            value={formatDate(lease.end_date)}
                        />
                    </section>

                    <section className="mt-5 space-y-3">
                        <h2 className="font-bold text-[#002452]">
                            مشخصات طرفین قرارداد
                        </h2>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-2 rounded-lg border bg-slate-50 p-4 text-xs">
                            <Detail
                                label="جانب اول (مالک)"
                                value={template.landlord_organization}
                            />
                            <Detail
                                label="نماینده"
                                value={template.representative_name}
                            />
                            <Detail
                                label="سمت"
                                value={template.representative_position}
                            />
                            <Detail
                                label="شماره تماس"
                                value={template.representative_contact}
                            />
                            <Detail
                                label="جانب دوم (مستأجر)"
                                value={tenant.full_name}
                            />
                            <Detail
                                label="نام پدر"
                                value={tenant.father_name}
                            />
                            <Detail
                                label="نام تجارت"
                                value={tenant.business_name}
                            />
                            <Detail label="شماره تماس" value={tenant.phone} />
                            <Detail
                                label="شماره تذکره"
                                value={tenant.nid_number}
                            />
                            <Detail
                                label="شماره جواز"
                                value={tenant.license_number}
                            />
                        </div>
                    </section>

                    <section className="mt-5">
                        <h2 className="font-bold text-[#002452]">
                            مشخصات جایداد و کرایه
                        </h2>
                        <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-2 rounded-lg border p-4 text-xs">
                            <Detail
                                label="مارکیت / جایداد"
                                value={dariPropertyName}
                            />
                            <Detail label="محل واگذارشده" value={space} />
                            <Detail label="آدرس" value={dariPropertyAddress} />
                            <Detail
                                label="مبلغ کرایه"
                                value={`${values[':rent_amount']} ${currency}`}
                            />
                            <Detail
                                label="شیوه پرداخت"
                                value={paymentFrequency(
                                    lease.payment_frequency,
                                )}
                            />
                            <Detail
                                label="تضمین"
                                value={
                                    lease.security_deposit
                                        ? `${formatNumber(lease.security_deposit)} ${currency}`
                                        : '—'
                                }
                            />
                        </div>
                    </section>

                    {template.intro_text && (
                        <p className="mt-5 text-justify leading-8">
                            {replacePlaceholders(template.intro_text, values)}
                        </p>
                    )}

                    <section className="mt-5 space-y-4">
                        {template.articles.map((article) => (
                            <div key={article.id} className="contract-article">
                                <h2 className="font-bold text-[#002452]">
                                    {article.article_number}: {article.title}
                                </h2>
                                <p className="mt-1 text-justify leading-8 whitespace-pre-line">
                                    {replacePlaceholders(article.body, values)}
                                </p>
                            </div>
                        ))}
                    </section>

                    {lease.terms && (
                        <section className="contract-article mt-5">
                            <h2 className="font-bold text-[#002452]">
                                شرایط اختصاصی قرارداد
                            </h2>
                            <p className="mt-1 text-justify leading-8 whitespace-pre-line">
                                {lease.terms}
                            </p>
                        </section>
                    )}

                    {template.footer_text && (
                        <p className="mt-6 rounded-lg border-r-4 border-[#d3a450] bg-slate-50 p-3 text-justify">
                            {replacePlaceholders(template.footer_text, values)}
                        </p>
                    )}

                    <section className="contract-signatures mt-14 grid grid-cols-3 gap-8 text-center text-xs">
                        {[
                            template.landlord_signature_label,
                            template.tenant_signature_label,
                            template.witness_signature_label,
                        ].map((label) => (
                            <div key={label}>
                                <div className="h-16" />
                                <div className="border-t border-slate-700 pt-2 font-bold">
                                    {label}
                                </div>
                            </div>
                        ))}
                    </section>
                </article>

                <aside className="contract-screen-controls space-y-4 xl:sticky xl:top-6">
                    <Card className="rounded-2xl border bg-white shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileCheck2 className="size-5 text-primary" />
                                {t('leaseContract.signedDocuments')}
                            </CardTitle>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {t('leaseContract.signedHelp')}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {canManage && (
                                <form
                                    onSubmit={uploadSigned}
                                    className="space-y-4 rounded-xl border bg-[#f8f9fd] p-4"
                                >
                                    <div className="space-y-1.5">
                                        <Label>
                                            {t('leaseContract.signedAt')}
                                        </Label>
                                        <Input
                                            type="date"
                                            value={uploadForm.data.signed_at}
                                            onChange={(event) =>
                                                uploadForm.setData(
                                                    'signed_at',
                                                    event.target.value,
                                                )
                                            }
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>
                                            {t('leaseContract.document')}
                                        </Label>
                                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white p-4 hover:border-primary/50">
                                            <FileUp className="size-5 shrink-0 text-primary" />
                                            <span className="min-w-0 flex-1 truncate text-sm">
                                                {uploadForm.data.document
                                                    ?.name ??
                                                    t('leaseContract.document')}
                                            </span>
                                            <Input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                className="hidden"
                                                onChange={(event) =>
                                                    uploadForm.setData(
                                                        'document',
                                                        event.target
                                                            .files?.[0] ?? null,
                                                    )
                                                }
                                            />
                                        </label>
                                        <InputError
                                            message={uploadForm.errors.document}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            uploadForm.processing ||
                                            !uploadForm.data.document
                                        }
                                    >
                                        <FileUp className="me-2 size-4" />
                                        {t('leaseContract.upload')}
                                    </Button>
                                </form>
                            )}

                            <div className="space-y-2">
                                {signedDocuments.length ? (
                                    signedDocuments.map((document) => (
                                        <div
                                            key={document.id}
                                            className="flex items-center gap-3 rounded-xl border p-3"
                                        >
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                                                <ShieldCheck className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {document.original_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(
                                                        document.signed_at,
                                                    )}
                                                    {document.template
                                                        ? ` · ${document.template.name}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon-sm"
                                            >
                                                <a
                                                    href={`/tenants/${tenant.id}/leases/${lease.id}/contract-documents/${document.id}`}
                                                    aria-label={t(
                                                        'leaseContract.download',
                                                    )}
                                                >
                                                    <Download className="size-4" />
                                                </a>
                                            </Button>
                                            {canManage && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:text-destructive"
                                                    aria-label={t(
                                                        'leaseContract.delete',
                                                    )}
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                t(
                                                                    'leaseContract.deleteConfirm',
                                                                ),
                                                            )
                                                        ) {
                                                            router.delete(
                                                                `/tenants/${tenant.id}/leases/${lease.id}/contract-documents/${document.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                                        <FileSignature className="mx-auto mb-2 size-8 opacity-35" />
                                        {t('leaseContract.emptySigned')}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border bg-white shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <Building2 className="size-5 text-primary" />
                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    {dariPropertyName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {space} · {lease.contract_number}
                                </p>
                            </div>
                            <Badge variant="outline" className="ms-auto">
                                <CalendarDays className="me-1 size-3" />
                                {formatDate(lease.start_date)}
                            </Badge>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </main>
    );
}

function ContractFact({
    label,
    value,
}: {
    label: string;
    value?: string | null;
}) {
    return (
        <div className="border-e p-2.5 text-center last:border-e-0">
            <p className="text-slate-500">{label}</p>
            <p className="mt-0.5 font-bold">{value || '—'}</p>
        </div>
    );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
    return (
        <p>
            <span className="text-slate-500">{label}: </span>
            <strong>{value || '—'}</strong>
        </p>
    );
}
