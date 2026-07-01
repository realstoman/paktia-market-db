import { QrCode } from '@/components/tenants/qr-code';
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
    const frontLogo = branding.tenantCardFrontLogoUrl || branding.logoUrl;
    const backLogo = branding.tenantCardBackLogoUrl || branding.logoUrl;
    const cardMessage = (
        branding.tenantCardMessage ||
        'این کارت مربوط به مستأجر :property می‌باشد. اگر این کارت را پیدا کردید، لطفاً با ما به شماره زیر تماس بگیرید.'
    ).replace(':property', propertyName);
    const contactPhone = branding.tenantCardPhone || '+93 700 000 000';

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
                <article className="tenant-id-card relative h-[54mm] w-[85.6mm] shrink-0 overflow-hidden rounded-[4mm] border border-slate-200 bg-white shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-[1.2mm] bg-[#002452]" />
                    <div className="absolute top-[4mm] left-[4mm] flex h-[8mm] w-[8mm] items-center justify-center overflow-hidden rounded-[1.8mm] bg-[#002452] p-[1.2mm]">
                        {frontLogo ? (
                            <img
                                src={frontLogo}
                                className="max-h-full max-w-full object-contain brightness-0 invert"
                            />
                        ) : (
                            <Building2 className="h-[5mm] w-[5mm] text-white" />
                        )}
                    </div>
                    <div className="grid h-full grid-cols-[25mm_1fr] gap-[4mm] px-[4mm] pt-[8mm] pb-[3.5mm]">
                        <div className="space-y-[2mm] pt-[5mm]">
                            <div className="flex h-[25mm] w-[22mm] items-center justify-center overflow-hidden rounded-[2.2mm] border border-slate-200 bg-slate-100">
                                {tenant.photo_url ? (
                                    <img
                                        src={tenant.photo_url}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-[9mm] w-[9mm] text-slate-400" />
                                )}
                            </div>
                            <div className="space-y-[1mm] text-[1.75mm] leading-tight text-slate-700">
                                <p className="flex min-w-0 items-center gap-[0.8mm]">
                                    <Phone className="h-[2.2mm] w-[2.2mm] shrink-0 text-[#002452]" />
                                    <span className="truncate pr-1" dir="ltr">
                                        {tenant.phone}
                                    </span>
                                </p>
                                {tenant.whatsapp && (
                                    <p className="flex min-w-0 items-center gap-[0.8mm]">
                                        <MessageCircle className="h-[2.2mm] w-[2.2mm] shrink-0 text-[#002452]" />
                                        <span
                                            className="truncate pr-1"
                                            dir="ltr"
                                        >
                                            {tenant.whatsapp}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[2mm] font-semibold tracking-[0.35mm] text-[#d3a450] uppercase">
                                {t('tenants.card.title')}
                            </p>
                            <h1 className="mt-[1mm] truncate text-[4.1mm] leading-tight font-extrabold text-slate-950">
                                {tenant.business_name || tenant.full_name}
                            </h1>
                            <div className="mt-[2mm] grid grid-cols-[18mm_1fr] gap-x-[1.5mm] text-[2.05mm] leading-[3.7mm]">
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
                                className="mt-[1.6mm] flex items-center justify-between gap-[2mm] rounded-[1.4mm] bg-slate-50/80 p-[0.8mm]"
                                dir="ltr"
                            >
                                <QrCode
                                    value={tenant.card_code}
                                    className="h-[15mm] w-[15mm] shrink-0"
                                />
                                <div className="min-w-0 text-right">
                                    <p className="text-[1.55mm] font-semibold text-slate-500">
                                        {t('tenants.card.code')}
                                    </p>
                                    <p className="mt-[0.5mm] max-w-[23mm] truncate font-mono text-[1.85mm] font-bold tracking-[0.3mm] text-slate-900">
                                        {tenant.card_code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
                <article
                    className="tenant-id-card relative flex h-[54mm] w-[85.6mm] shrink-0 flex-col justify-center overflow-hidden rounded-[4mm] bg-[#002452] px-[8mm] text-center text-white shadow-2xl"
                    dir="rtl"
                >
                    <div className="pointer-events-none absolute inset-0 opacity-25">
                        <div className="absolute -top-[12mm] -left-[10mm] h-[60mm] w-[60mm] rotate-45 rounded-[14mm] border border-white/60" />
                        <div className="absolute -top-[7mm] -left-[5mm] h-[50mm] w-[50mm] rotate-45 rounded-[12mm] border border-white/50" />
                        <div className="absolute -top-[2mm] left-0 h-[40mm] w-[40mm] rotate-45 rounded-[10mm] border border-white/40" />
                        <div className="absolute -right-[16mm] -bottom-[14mm] h-[58mm] w-[58mm] rotate-45 rounded-[14mm] border border-[#d3a450]/70" />
                        <div className="absolute -right-[10mm] -bottom-[8mm] h-[46mm] w-[46mm] rotate-45 rounded-[12mm] border border-[#d3a450]/50" />
                    </div>
                    <div className="absolute top-[4mm] right-[4mm] flex h-[9mm] w-[9mm] items-center justify-center overflow-hidden rounded-[2mm] bg-white/95 p-[1.2mm] shadow-sm">
                        {backLogo ? (
                            <img
                                src={backLogo}
                                className="max-h-full max-w-full object-contain"
                            />
                        ) : (
                            <Building2 className="h-[5.5mm] w-[5.5mm] text-[#002452]" />
                        )}
                    </div>
                    <div className="relative mx-auto max-w-[62mm]">
                        <p className="mt-4 text-[2.75mm] leading-[5mm] font-semibold text-white">
                            {cardMessage}
                        </p>
                        <div className="mt-[4mm] inline-flex items-center gap-[1.5mm] rounded-full border border-white/20 bg-white/10 px-[4mm] py-[1.6mm] text-white backdrop-blur">
                            <span
                                className="font-mono text-[3mm] font-bold"
                                dir="ltr"
                            >
                                {contactPhone}
                            </span>
                            <Phone className="h-[3mm] w-[3mm]" />
                        </div>
                    </div>
                </article>
            </div>
        </main>
    );
}
