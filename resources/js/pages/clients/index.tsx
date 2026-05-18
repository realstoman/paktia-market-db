'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { ClientsClient } from '@/components/tables/clients/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { dashboard } from '@/routes';
import { BreadcrumbItem, Client } from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { Globe, Smartphone, UserRoundSearch, Users } from 'lucide-react';

interface ClientsPageProps {
    clients: Client[];
}

export default function ClientsPage({ clients }: ClientsPageProps) {
    const { t } = useLocalization();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: dashboard().url,
        },
        {
            title: t('navigation.clients', 'Clients'),
            href: '/clients',
        },
    ];

    const activeClients = clients.filter((client) => client.is_active !== false);
    const mobileClients = clients.filter(
        (client) => (client.mobile_orders_count ?? 0) > 0,
    );
    const websiteClients = clients.filter(
        (client) => (client.website_orders_count ?? 0) > 0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('clients.title', 'Clients')} />
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryMetricCard
                        title={t('clients.cards.total.title', 'Total Clients')}
                        value={formatNumber(clients.length)}
                        description={t(
                            'clients.cards.total.description',
                            'All customer accounts synced from the website and mobile app.',
                        )}
                        icon={Users}
                        variant="indigo"
                    />
                    <SummaryMetricCard
                        title={t('clients.cards.active.title', 'Active Clients')}
                        value={formatNumber(activeClients.length)}
                        description={t(
                            'clients.cards.active.description',
                            'Customer accounts currently active for ordering and sign-in.',
                        )}
                        icon={UserRoundSearch}
                        variant="indigo"
                    />
                    <SummaryMetricCard
                        title={t(
                            'clients.cards.website.title',
                            'Website Ordering Clients',
                        )}
                        value={formatNumber(websiteClients.length)}
                        description={t(
                            'clients.cards.website.description',
                            'Clients who have placed at least one website order.',
                        )}
                        icon={Globe}
                        variant="indigo"
                    />
                    <SummaryMetricCard
                        title={t(
                            'clients.cards.mobile.title',
                            'Mobile Ordering Clients',
                        )}
                        value={formatNumber(mobileClients.length)}
                        description={t(
                            'clients.cards.mobile.description',
                            'Clients who have placed at least one mobile app order.',
                        )}
                        icon={Smartphone}
                        variant="indigo"
                    />
                </div>

                <div className="rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                    <div className="p-6 text-gray-900">
                        <ClientsClient data={clients} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
