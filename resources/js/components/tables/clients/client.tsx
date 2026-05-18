import Heading from '@/components/shared/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { useLocalization } from '@/lib/localization';
import { Client } from '@/types';
import { formatNumber } from '@/utils/format';
import { useMemo, useState } from 'react';
import { buildColumns } from './columns';

interface ClientsClientProps {
    data: Client[];
    isLoading?: boolean;
}

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export const ClientsClient: React.FC<ClientsClientProps> = ({
    data,
    isLoading = false,
}) => {
    const { t } = useLocalization();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const columns = useMemo(
        () => buildColumns(t, setSelectedClient),
        [t],
    );

    return (
        <div className="space-y-4">
            <Heading
                title={`${t('clients.headingTitle', 'Clients:')} ${formatNumber(data.length)}`}
                description={t(
                    'clients.headingDescription',
                    'View customer accounts synced from the website and mobile app, along with their order activity.',
                )}
            />
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchKey={[
                    'name',
                    'email',
                    'phone',
                    'provider',
                    'firebase_uid',
                ]}
                searchPlaceholder={t(
                    'clients.searchPlaceholder',
                    'Search clients by name, email, phone, or provider...',
                )}
            />

            <Dialog
                open={selectedClient !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedClient(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('clients.details.title', 'Client Details')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'clients.details.description',
                                'Review the synced customer profile and online ordering activity.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedClient ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.name', 'Name')}
                                </p>
                                <p className="font-medium">
                                    {selectedClient.name || '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.provider', 'Provider')}
                                </p>
                                <div>
                                    <Badge variant="outline" className="capitalize">
                                        {(selectedClient.provider || 'unknown').replace(
                                            /_/g,
                                            ' ',
                                        )}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.email', 'Email')}
                                </p>
                                <p className="font-medium">
                                    {selectedClient.email || '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.phone', 'Phone')}
                                </p>
                                <p className="font-medium">
                                    {selectedClient.phone || '-'}
                                </p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.details.firebaseUid', 'Firebase UID')}
                                </p>
                                <p className="break-all font-medium">
                                    {selectedClient.firebase_uid}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.totalOrders', 'Orders')}
                                </p>
                                <p className="font-medium">
                                    {formatNumber(selectedClient.orders_count ?? 0)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.websiteOrders', 'Website')}
                                </p>
                                <p className="font-medium">
                                    {formatNumber(
                                        selectedClient.website_orders_count ?? 0,
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.mobileOrders', 'Mobile')}
                                </p>
                                <p className="font-medium">
                                    {formatNumber(
                                        selectedClient.mobile_orders_count ?? 0,
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.status', 'Status')}
                                </p>
                                <div>
                                    {selectedClient.is_active === false ? (
                                        <Badge variant="destructive">
                                            {t(
                                                'clients.status.inactive',
                                                'Inactive',
                                            )}
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            {t('clients.status.active', 'Active')}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.table.lastOrder', 'Last Order')}
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(selectedClient.last_order_at)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t('clients.details.lastLogin', 'Last Login')}
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(selectedClient.last_login_at)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'clients.details.createdAt',
                                        'Registered At',
                                    )}
                                </p>
                                <p className="font-medium">
                                    {formatDateTime(selectedClient.created_at)}
                                </p>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedClient(null)}
                        >
                            {t('common.close', 'Close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
