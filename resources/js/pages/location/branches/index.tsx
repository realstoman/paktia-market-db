'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { BranchesClient } from '@/components/tables/branches/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { dashboard } from '@/routes';
import branchRoutes from '@/routes/branches';
import { Branch, BreadcrumbItem, Country, Province } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { Building2, Globe2, MapPinned } from 'lucide-react';

interface BranchesPageProps {
    branches: Branch[];
    countries: Country[];
    provinces: Province[];
}

export default function BranchesPage({
    branches,
    countries,
    provinces,
}: BranchesPageProps) {
    const { t } = useLocalization();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: dashboard().url,
        },
        {
            title: t('navigation.branches', 'Branches'),
            href: branchRoutes.index().url,
        },
    ];
    const activeBranches = branches.filter((branch) => branch.is_active).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('branches.page.metaTitle', 'Branches')} />
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <SummaryMetricCard
                        title={t(
                            'branches.cards.total.title',
                            'Total Branches',
                        )}
                        value={formatNumber(branches.length)}
                        description={t(
                            'branches.cards.total.description',
                            'All branch records in the system.',
                        )}
                        icon={Building2}
                        variant="teal"
                    />
                    <SummaryMetricCard
                        title={t(
                            'branches.cards.active.title',
                            'Active Branches',
                        )}
                        value={formatNumber(activeBranches)}
                        description={t(
                            'branches.cards.active.description',
                            'Branches currently marked as active.',
                        )}
                        icon={MapPinned}
                        variant="teal"
                    />
                    <SummaryMetricCard
                        title={t('branches.cards.countries.title', 'Countries')}
                        value={formatNumber(countries.length)}
                        description={t(
                            'branches.cards.countries.description',
                            'Countries linked to branch operations.',
                        )}
                        icon={Globe2}
                        variant="teal"
                    />
                </div>
                <div className="dark:bg-brand-bg-dark rounded-lg bg-white p-8">
                    <div className="p-6 text-gray-900">
                        <BranchesClient
                            data={branches}
                            countries={countries}
                            provinces={provinces}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
