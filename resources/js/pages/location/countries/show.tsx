'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { dashboard } from '@/routes';
import countries from '@/routes/countries';
import { BreadcrumbItem, Country } from '@/types';
import { formatDateTime } from '@/utils/format';
import { Head } from '@inertiajs/react';

interface CountryShowProps {
    country: Country;
}

export default function CountryShow({ country }: CountryShowProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('navigation.dashboard'), href: dashboard().url },
        {
            title: t('countryManagement.title'),
            href: countries.index().url,
        },
        { title: country.name, href: `/countries/${country.id}` },
    ];
    const provinces = country.provinces ?? [];
    const properties = country.properties ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={country.name} />
            <div className="space-y-6 rounded-2xl border bg-white p-5 sm:p-7">
                <div>
                    <h1 className="text-2xl font-semibold">{country.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('countryManagement.profileHelp')}
                    </p>
                </div>
                <Table>
                    <TableBody>
                        <DetailRow
                            label={t('countryManagement.fields.nameEn')}
                            value={country.name_en || '—'}
                        />
                        <DetailRow
                            label={t('countryManagement.fields.nameFa')}
                            value={country.name_translations?.fa || '—'}
                        />
                        <DetailRow
                            label={t('countryManagement.fields.namePs')}
                            value={country.name_translations?.ps || '—'}
                        />
                        <DetailRow
                            label={t('countryManagement.fields.countryCode')}
                            value={country.code}
                        />
                        <DetailRow
                            label={t('countryManagement.fields.currencyCode')}
                            value={country.currency_code}
                        />
                        <DetailRow
                            label={t(
                                'countryManagement.fields.currencySymbol',
                            )}
                            value={country.currency_symbol || '—'}
                        />
                        <DetailRow
                            label={t('countryManagement.table.status')}
                            value={
                                <Badge
                                    variant={
                                        country.is_active
                                            ? 'success'
                                            : 'destructive'
                                    }
                                >
                                    {t(
                                        country.is_active
                                            ? 'countryManagement.active'
                                            : 'countryManagement.inactive',
                                    )}
                                </Badge>
                            }
                        />
                        <DetailRow
                            label={t('countryManagement.table.provinces')}
                            value={
                                provinces.length ? (
                                    <div className="flex flex-wrap justify-end gap-1">
                                        {provinces.map((province) => (
                                            <Badge
                                                key={province.id}
                                                variant="secondary"
                                            >
                                                {province.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    t('countryManagement.noProvinces')
                                )
                            }
                        />
                        <DetailRow
                            label={t('countryManagement.table.properties')}
                            value={
                                properties.length ? (
                                    <div className="flex flex-wrap justify-end gap-1">
                                        {properties.map((property) => (
                                            <Badge
                                                key={property.id}
                                                variant="secondary"
                                            >
                                                {property.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    t('countryManagement.noProperties')
                                )
                            }
                        />
                        <DetailRow
                            label={t('countryManagement.table.createdAt')}
                            value={
                                country.created_at
                                    ? formatDateTime(country.created_at)
                                    : '—'
                            }
                        />
                        <DetailRow
                            label={t('countryManagement.updatedAt')}
                            value={
                                country.updated_at
                                    ? formatDateTime(country.updated_at)
                                    : '—'
                            }
                        />
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell className="text-end">{value}</TableCell>
        </TableRow>
    );
}
