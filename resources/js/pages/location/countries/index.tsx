'use client';

import { CountriesClient } from '@/components/tables/countries/client';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import countries from '@/routes/countries';
import { BreadcrumbItem, Country } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Countries',
        href: countries.index().url,
    },
];

interface CountriesPageProps {
    countries: Country[];
}

export default function CountriesPage({ countries }: CountriesPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Countries" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <CountriesClient data={countries} />
                </div>
            </div>
        </AppLayout>
    );
}
