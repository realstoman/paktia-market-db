import { Code39Barcode } from '@/components/tenants/code39-barcode';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/localization';
import { Lease, SharedData, Tenant } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    MessageCircle,
    Phone,
    Printer,
    UserRound,
} from 'lucide-react';

interface Props {
    tenant: Tenant;
    selectedLeaseId?: number | null;
}
const today = () => new Date().toLocaleDateString('en-CA');
const currentLeases = (tenant: Tenant): Lease[] =>
    (tenant.leases ?? []).filter(
        (lease) =>
            lease.status === 'active' &&
            lease.start_date <= today() &&
            (!lease.end_date || lease.end_date >= today()),
    );
const propertyBehavior = (property?: Lease['property']) =>
    property?.type_definition?.behavior ??
    property?.property_type_behavior ??
    (property?.property_type === 'mall' ? 'market' : property?.property_type);

export default function TenantCard({ tenant, selectedLeaseId = null }: Props) {
    const { t, isRtl, locale } = useLocalization();
    const { branding } = usePage<SharedData>().props;
    const selectedLease = selectedLeaseId
        ? (tenant.leases ?? []).find((lease) => lease.id === selectedLeaseId)
        : undefined;
    const lease =
        selectedLease ?? currentLeases(tenant)[0] ?? (tenant.leases ?? [])[0];
    const localizedPropertyName = (lease?: Lease) => {
        const translations = lease?.property?.name_translations;

        return (
            translations?.[locale as keyof typeof translations] ??
            lease?.property?.name ??
            ''
        );
    };
    const leaseSpaceValue = (lease?: Lease) => {
        if (!lease) {
            return t('tenants.lease.noAssignment');
        }

        const externalUnit =
            propertyBehavior(lease.property) === 'commercial_unit'
                ? lease.property?.external_unit_number
                : null;

        if (lease.unit) {
            return `${t(`tenants.lease.${lease.unit.unit_type}`)} ${lease.unit.unit_number}`;
        }

        if (externalUnit) {
            return `${t('tenants.lease.shop')} ${externalUnit}`;
        }

        return lease.leased_space_type
            ? t(`tenants.lease.${lease.leased_space_type}`)
            : t('tenants.lease.noAssignment');
    };
    const propertyName = localizedPropertyName(lease) || branding.name;
    const spaceValue = leaseSpaceValue(lease);
    const contactPhone =
        (
            branding as SharedData['branding'] & {
                contactPhone?: string | null;
                phone?: string | null;
            }
        ).contactPhone ||
        (
            branding as SharedData['branding'] & {
                contactPhone?: string | null;
                phone?: string | null;
            }
        ).phone ||
        '+93 700 000 000';

    return (
        <main
            className="min-h-screen bg-slate-100 p-4 sm:p-8"
            dir={isRtl ? 'rtl' : 'ltr'}
        >
            <Head title={`${t('tenants.card.title')} · ${tenant.card_code}`} />
            <style>{`
            @page { size: 85.6mm 54mm; margin: 0; }
            @media print {
                html, body { width: 85.6mm; height: 54mm; margin: 0 !important; padding: 0 !important; background: white !important; }
                .print-controls { display: none !important; }
                .card-stage { display: block !important; margin: 0 !important; padding: 0 !important; }
                .tenant-id-card { box-shadow: none !important; border-radius: 0 !important; break-after: page; page-break-after: always; }
                .tenant-id-card:last-child { break-after: auto; page-break-after: auto; }
            }
        `}</style>
            <div className="print-controls mx-auto mb-6 flex max-w-4xl items-center justify-between gap-3">
                <Button asChild variant="outline">
                    <Link href={`/tenants/${tenant.id}`}>
                        <ArrowLeft className="me-2 h-4 w-4" />
                        {t('tenants.card.back')}
                    </Link>
                </Button>
                <Button onClick={() => window.print()}>
                    <Printer className="me-2 h-4 w-4" />
                    {t('tenants.card.print')}
                </Button>
            </div>
            <div className="card-stage flex flex-col items-center gap-6">
                <article className="tenant-id-card relative h-[54mm] w-[85.6mm] shrink-0 overflow-hidden rounded-[4mm] bg-white shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-[15mm] bg-[#002452]" />
                    <header className="relative flex h-[15mm] items-center gap-[2.5mm] px-[4mm] text-white">
                        <div className="flex h-[9mm] w-[9mm] items-center justify-center overflow-hidden rounded-[2mm] bg-white p-[1mm]">
                            {branding.logoUrl ? (
                                <img
                                    src={branding.logoUrl}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <Building2 className="h-[6mm] w-[6mm] text-[#002452]" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[3.2mm] leading-tight font-bold">
                                {propertyName}
                            </p>
                            <p className="text-[2mm] text-[#d3a450]">
                                {t('tenants.card.title')}
                            </p>
                        </div>
                    </header>
                    <div className="relative grid h-[39mm] grid-cols-[19mm_1fr] gap-[3mm] p-[3.5mm]">
                        <div className="space-y-[2mm]">
                            <div className="flex h-[21mm] w-[19mm] items-center justify-center overflow-hidden rounded-[2mm] border border-slate-200 bg-slate-100">
                                {tenant.photo_url ? (
                                    <img
                                        src={tenant.photo_url}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-[9mm] w-[9mm] text-slate-400" />
                                )}
                            </div>
                            <div className="space-y-[0.8mm] text-[1.65mm] leading-tight text-slate-700">
                                <p className="flex min-w-0 items-center gap-[0.8mm]">
                                    <Phone className="h-[2.2mm] w-[2.2mm] shrink-0 text-[#002452]" />
                                    <span className="truncate" dir="ltr">
                                        {tenant.phone}
                                    </span>
                                </p>
                                {tenant.whatsapp && (
                                    <p className="flex min-w-0 items-center gap-[0.8mm]">
                                        <MessageCircle className="h-[2.2mm] w-[2.2mm] shrink-0 text-[#002452]" />
                                        <span className="truncate" dir="ltr">
                                            {tenant.whatsapp}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-[3.5mm] leading-tight font-extrabold text-slate-950">
                                {tenant.business_name || tenant.full_name}
                            </h1>
                            <div className="mt-[1mm] grid grid-cols-[17mm_1fr] gap-x-[1mm] text-[2mm] leading-[3.4mm]">
                                <span className="text-slate-500">
                                    {t('tenants.card.responsible')}
                                </span>
                                <strong className="truncate text-slate-800">
                                    {tenant.full_name}
                                </strong>
                                <span className="text-slate-500">
                                    {t('tenants.card.location')}
                                </span>
                                <strong className="truncate text-slate-800">
                                    {spaceValue}
                                </strong>
                                <span className="text-slate-500">
                                    {t('tenants.lease.property')}
                                </span>
                                <strong className="truncate text-slate-800">
                                    {propertyName}
                                </strong>
                            </div>
                            <div
                                className="mt-[1.8mm] rounded-[1mm] border border-slate-200 bg-white p-[1mm]"
                                dir="ltr"
                            >
                                <Code39Barcode
                                    value={tenant.card_code}
                                    className="h-[8mm]"
                                />
                                <p className="mt-[0.4mm] text-center font-mono text-[1.8mm] font-semibold tracking-[0.5mm] text-slate-800">
                                    {tenant.card_code}
                                </p>
                            </div>
                            <p className="mt-[0.7mm] text-center text-[1.6mm] text-slate-500">
                                {t('tenants.card.scanHelp')}
                            </p>
                        </div>
                    </div>
                </article>
                <article
                    className="tenant-id-card relative flex h-[54mm] w-[85.6mm] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[4mm] bg-white px-[8mm] text-center shadow-2xl"
                    dir="rtl"
                >
                    <div className="absolute inset-x-0 top-0 h-[3mm] bg-[#002452]" />
                    <div className="absolute inset-x-0 bottom-0 h-[3mm] bg-[#d3a450]" />
                    <div className="flex h-[19mm] w-[19mm] items-center justify-center overflow-hidden rounded-[4mm] border border-slate-200 bg-white p-[2mm] shadow-sm">
                        {branding.logoUrl ? (
                            <img
                                src={branding.logoUrl}
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <Building2 className="h-[12mm] w-[12mm] text-[#002452]" />
                        )}
                    </div>
                    <p className="mt-[4mm] text-[3mm] leading-[5mm] font-semibold text-[#002452]">
                        این کارت مربوط به مستأجر {propertyName} می‌باشد.
                    </p>
                    <p className="mt-[1.5mm] text-[2.45mm] leading-[4.2mm] text-slate-600">
                        اگر این کارت را پیدا کردید، لطفاً با ما به شماره زیر
                        تماس بگیرید.
                    </p>
                    <div className="mt-[3mm] inline-flex items-center gap-[1.5mm] rounded-full border border-[#002452]/15 bg-[#f8f9fd] px-[4mm] py-[1.6mm] text-[#002452]">
                        <Phone className="h-[3mm] w-[3mm]" />
                        <span
                            className="font-mono text-[3mm] font-bold"
                            dir="ltr"
                        >
                            {contactPhone}
                        </span>
                    </div>
                </article>
            </div>
        </main>
    );
}
