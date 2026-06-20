'use client';

import { CountriesClient } from '@/components/tables/countries/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { dashboard } from '@/routes';
import countries from '@/routes/countries';
import { BreadcrumbItem, Country } from '@/types';
import { Head } from '@inertiajs/react';

interface CountriesPageProps {
    countries: Country[];
}

export default function CountriesPage({
    countries: items,
}: CountriesPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('countryManagement.title'),
            href: countries.index().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('countryManagement.title')} />
            <div className="rounded-2xl border bg-white p-4 sm:p-6">
                <CountriesClient data={items} />
            </div>
        </AppLayout>
    );
}
