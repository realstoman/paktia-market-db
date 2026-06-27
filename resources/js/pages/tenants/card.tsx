import { Code39Barcode } from '@/components/tenants/code39-barcode';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/localization';
import { Lease, SharedData, Tenant } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, Printer, UserRound } from 'lucide-react';

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

export default function TenantCard({ tenant, selectedLeaseId = null }: Props) {
    const { t, isRtl } = useLocalization();
    const { branding } = usePage<SharedData>().props;
    const selectedLease = selectedLeaseId
        ? (tenant.leases ?? []).find((lease) => lease.id === selectedLeaseId)
        : undefined;
    const leases = selectedLease ? [selectedLease] : currentLeases(tenant);
    const leaseLocation = (lease: Lease) => {
        const externalUnit =
            lease.property?.property_type === 'commercial_unit'
                ? lease.property.external_unit_number
                : null;

        return `${lease.property?.name ?? ''}${lease.unit ? ` - ${t(`tenants.lease.${lease.unit.unit_type}`)} ${lease.unit.unit_number}` : externalUnit ? ` - ${t('tenants.lease.shop')} ${externalUnit}` : ''}`;
    };
    const locations = leases.map(leaseLocation).filter(Boolean);
    const location = locations.length
        ? `${locations.slice(0, 2).join(' | ')}${locations.length > 2 ? ` +${locations.length - 2}` : ''}`
        : t('tenants.lease.noAssignment');

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
                .tenant-id-card { box-shadow: none !important; border-radius: 0 !important; }
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
            <div className="card-stage flex justify-center">
                <article className="tenant-id-card relative h-[54mm] w-[85.6mm] shrink-0 overflow-hidden rounded-[4mm] bg-white shadow-2xl">
                    <div className="absolute inset-x-0 top-0 h-[15mm] bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900" />
                    <div className="absolute -end-[13mm] -top-[13mm] h-[34mm] w-[34mm] rounded-full border-[5mm] border-emerald-400/20" />
                    <header className="relative flex h-[15mm] items-center gap-[2.5mm] px-[4mm] text-white">
                        <div className="flex h-[9mm] w-[9mm] items-center justify-center overflow-hidden rounded-[2mm] bg-white p-[1mm]">
                            {branding.logoUrl ? (
                                <img
                                    src={branding.logoUrl}
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <Building2 className="h-[6mm] w-[6mm] text-emerald-700" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[3.2mm] leading-tight font-bold">
                                {branding.name}
                            </p>
                            <p className="text-[2mm] text-emerald-200">
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
                            <div
                                className={`rounded-full px-[1.5mm] py-[0.5mm] text-center text-[1.8mm] font-bold ${tenant.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                            >
                                {t(
                                    tenant.is_active
                                        ? 'tenants.active'
                                        : 'tenants.inactive',
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
                                    {location}
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
            </div>
        </main>
    );
}
