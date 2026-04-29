'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { BranchesClient } from '@/components/tables/branches/client';
import { useLocalization } from '@/lib/localization';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import branchRoutes from '@/routes/branches';
import {
    Branch,
    BranchTable,
    BreadcrumbItem,
    Country,
    Kitchen,
    Province,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { Building2, ChefHat, Globe2, MapPinned } from 'lucide-react';

interface BranchesPageProps {
    branches: Branch[];
    branchTables: BranchTable[];
    countries: Country[];
    provinces: Province[];
    kitchens: Kitchen[];
}

export default function BranchesPage({
    branches,
    branchTables,
    countries,
    provinces,
    kitchens,
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
    const assignedKitchens = branches.reduce(
        (count, branch) => count + (branch.kitchens?.length ?? 0),
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('branches.page.metaTitle', 'Branches')} />
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryMetricCard
                        title={t('branches.cards.total.title', 'Total Branches')}
                        value={formatNumber(branches.length)}
                        description={t(
                            'branches.cards.total.description',
                            'All branch records in the system.',
                        )}
                        icon={Building2}
                        variant="teal"
                    />
                    <SummaryMetricCard
                        title={t('branches.cards.active.title', 'Active Branches')}
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
                    <SummaryMetricCard
                        title={t(
                            'branches.cards.kitchens.title',
                            'Assigned Kitchens',
                        )}
                        value={formatNumber(assignedKitchens)}
                        description={t(
                            'branches.cards.kitchens.description',
                            'Kitchen assignments across all branches.',
                        )}
                        icon={ChefHat}
                        variant="teal"
                    />
                </div>
                <div className="rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                    <div className="p-6 text-gray-900">
                        <BranchesClient
                            data={branches}
                            branchTables={branchTables}
                            countries={countries}
                            provinces={provinces}
                            kitchens={kitchens}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
