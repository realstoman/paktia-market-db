'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { InventoryClient } from '@/components/tables/inventory/client';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    Property,
    BreadcrumbItem,
    Currency,
    InventoryCategory,
    InventoryItem,
    InventoryType,
    Unit,
    Vendor,
    SharedData,
} from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head, usePage } from '@inertiajs/react';
import {
    Banknote,
    Boxes,
    PackageMinus,
    PackageX,
    Warehouse,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface InventoryPageProps {
    inventoryItems: InventoryItem[];
    properties: Property[];
    vendors: Vendor[];
    currencies: Currency[];
    units: Unit[];
    categories: InventoryCategory[];
    inventoryTypes: InventoryType[];
}

export default function InventoryPage({
    inventoryItems,
    properties,
    vendors,
    currencies,
    units,
    categories,
    inventoryTypes,
}: InventoryPageProps) {
    const { t, locale } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const breadcrumbs: BreadcrumbItem[] =
        auth.is_super_admin || !auth.roles.includes('inventory')
            ? [
                  {
                      title: t('navigation.dashboard', 'Dashboard'),
                      href: '/dashboard',
                  },
                  {
                      title: t('navigation.inventory', 'Inventory'),
                      href: '/inventory',
                  },
              ]
            : [
                  {
                      title: t('navigation.inventory', 'Inventory'),
                      href: '/inventory',
                  },
              ];
    const PROPERTY_FILTER_ALL = '__all__';
    const LOW_STOCK_THRESHOLD = 10;
    const [selectedPropertyId, setSelectedPropertyId] = useState(PROPERTY_FILTER_ALL);
    const [isVendorOwedModalOpen, setIsVendorOwedModalOpen] = useState(false);
    const propertyOptions = useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(
        propertyOptions,
        selectedPropertyId,
        setSelectedPropertyId,
        [PROPERTY_FILTER_ALL],
    );

    const statsItems = useMemo(() => {
        if (selectedPropertyId === PROPERTY_FILTER_ALL) {
            return inventoryItems;
        }

        return inventoryItems.filter(
            (item) => String(item.property_id) === selectedPropertyId,
        );
    }, [inventoryItems, selectedPropertyId]);

    const stats = useMemo(() => {
        const totalItems = statsItems.length;
        let totalValue = 0;
        let totalFixedItems = 0;
        let totalUsableItems = 0;
        let lowStockItems = 0;
        let outOfStockItems = 0;
        let totalOwed = 0;

        for (const item of statsItems) {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const paidAmount = Number(item.paid_amount) || 0;
            const total = quantity * unitPrice;

            totalValue += total;
            totalOwed += Math.max(0, total - paidAmount);

            if ((item.type ?? '').toLowerCase().trim() === 'fixed') {
                totalFixedItems += 1;
            }

            if (item.is_usable) {
                totalUsableItems += 1;
            }

            if (quantity <= 0) {
                outOfStockItems += 1;
            } else if (quantity <= LOW_STOCK_THRESHOLD) {
                lowStockItems += 1;
            }
        }

        return {
            totalItems,
            totalValue,
            totalFixedItems,
            totalUsableItems,
            lowStockItems,
            outOfStockItems,
            totalOwed,
        };
    }, [statsItems]);

    const vendorOwedRows = useMemo(() => {
        const vendorMap = new Map<
            number,
            {
                vendorName: string;
                owedAmount: number;
                lastPaidAt: number | null;
            }
        >();

        for (const item of statsItems) {
            if (!item.vendor_id) continue;

            const total =
                (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
            const paid = Number(item.paid_amount) || 0;
            const owed = Math.max(0, total - paid);

            const vendorName =
                item.vendor?.name ??
                vendors.find((vendor) => vendor.id === item.vendor_id)?.name ??
                t('inventory.common.vendorNumber', 'Vendor #:id').replace(
                    ':id',
                    String(item.vendor_id),
                );

            const existing = vendorMap.get(item.vendor_id) ?? {
                vendorName,
                owedAmount: 0,
                lastPaidAt: null,
            };

            existing.owedAmount += owed;

            if (paid > 0 && item.updated_at) {
                const paidAt = new Date(item.updated_at).getTime();
                if (!Number.isNaN(paidAt)) {
                    existing.lastPaidAt = Math.max(
                        existing.lastPaidAt ?? 0,
                        paidAt,
                    );
                }
            }

            vendorMap.set(item.vendor_id, existing);
        }

        return Array.from(vendorMap.values())
            .filter((entry) => entry.owedAmount > 0)
            .sort((a, b) => b.owedAmount - a.owedAmount);
    }, [statsItems, t, vendors]);

    const formatPaidDate = (timestamp: number | null) => {
        if (!timestamp) {
            return t(
                'inventory.page.vendorOwed.noPayment',
                'No payment recorded',
            );
        }

        return new Intl.DateTimeFormat(
            locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US',
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            },
        ).format(new Date(timestamp));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('inventory.page.title', 'Inventory')} />
            <div className="space-y-4 pt-3 pb-8">
                <div className="flex justify-end">
                    <div className="w-full max-w-xs bg-white dark:bg-neutral-900">
                        <Select
                            value={selectedPropertyId}
                            onValueChange={setSelectedPropertyId}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue
                                    placeholder={t(
                                        'inventory.page.propertyStatsPlaceholder',
                                        'Select property for stats',
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={PROPERTY_FILTER_ALL}>
                                    {t(
                                        'inventory.page.allProperties',
                                        'All Properties',
                                    )}
                                </SelectItem>
                                {properties.map((property) => (
                                    <SelectItem
                                        key={property.id}
                                        value={String(property.id)}
                                    >
                                        {property.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <SummaryMetricCard
                        title={t(
                            'inventory.page.stats.totalValue',
                            'Total Inventory Value',
                        )}
                        value={formatAfn(stats.totalValue)}
                        description={t(
                            'inventory.page.stats.totalValueDescription',
                            'Current value from quantity x single price.',
                        )}
                        icon={Banknote}
                        variant="teal"
                        className="md:col-span-4 md:row-span-2"
                    />

                    <div className="grid grid-cols-1 gap-3 md:col-span-8 md:grid-cols-12">
                        <SummaryMetricCard
                            title={t(
                                'inventory.page.stats.totalItems',
                                'Total Items',
                            )}
                            value={formatNumber(stats.totalItems)}
                            description={t(
                                'inventory.page.stats.totalItemsDescription',
                                'Inventory records currently tracked.',
                            )}
                            icon={Boxes}
                            variant="teal"
                            className="md:col-span-6"
                        />

                        <Card className="gap-3 border-red-200 bg-red-50 py-4 shadow-none md:col-span-6 dark:border-red-900/50 dark:bg-red-950/20">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                                <CardTitle className="text-sm">
                                    {t(
                                        'inventory.page.stats.totalOwed',
                                        'Amount Owed to Vendors',
                                    )}
                                </CardTitle>
                                <Banknote className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between gap-3">
                                    <p className="text-2xl font-semibold tracking-tight text-red-700 dark:text-red-300">
                                        {formatAfn(stats.totalOwed)}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsVendorOwedModalOpen(true)
                                        }
                                        className="text-xs font-medium text-red-700 underline underline-offset-4 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                                    >
                                        {t(
                                            'inventory.page.vendorOwed.viewDetails',
                                            'View details',
                                        )}
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:col-span-8 md:grid-cols-12">
                        <SummaryMetricCard
                            title={t(
                                'inventory.page.stats.totalFixed',
                                'Total Fixed Items',
                            )}
                            value={formatNumber(stats.totalFixedItems)}
                            description={t(
                                'inventory.page.stats.totalFixedDescription',
                                'Equipment and long-term stock items.',
                            )}
                            icon={Warehouse}
                            variant="teal"
                            className="md:col-span-4"
                        />

                        <SummaryMetricCard
                            title={t(
                                'inventory.page.stats.lowStock',
                                'Low Stock Items',
                            )}
                            value={formatNumber(stats.lowStockItems)}
                            description={t(
                                'inventory.page.stats.lowStockDescription',
                                'Quantity ≤ :count.',
                            ).replace(':count', String(LOW_STOCK_THRESHOLD))}
                            icon={PackageMinus}
                            variant="teal"
                            className="md:col-span-4"
                        />

                        <SummaryMetricCard
                            title={t(
                                'inventory.page.stats.outOfStock',
                                'Out of Stock Items',
                            )}
                            value={formatNumber(stats.outOfStockItems)}
                            description={t(
                                'inventory.page.stats.outOfStockDescription',
                                'Items that currently have zero quantity.',
                            )}
                            icon={PackageX}
                            variant="teal"
                            className="md:col-span-4"
                        />
                    </div>
                </div>

                <Dialog
                    open={isVendorOwedModalOpen}
                    onOpenChange={setIsVendorOwedModalOpen}
                >
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>
                                {t(
                                    'inventory.page.vendorOwed.title',
                                    'Amount Owed to Vendors',
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    'inventory.page.vendorOwed.description',
                                    'Outstanding payable amounts grouped by vendor and last payment date.',
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-left">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">
                                            {t(
                                                'inventory.page.vendorOwed.vendor',
                                                'Vendor',
                                            )}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            {t(
                                                'inventory.page.vendorOwed.amount',
                                                'Amount Owed',
                                            )}
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            {t(
                                                'inventory.page.vendorOwed.lastPaid',
                                                'Last Paid',
                                            )}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vendorOwedRows.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-3 py-6 text-center text-muted-foreground"
                                            >
                                                {t(
                                                    'inventory.page.vendorOwed.empty',
                                                    'No outstanding vendor balance.',
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        vendorOwedRows.map((row) => (
                                            <tr
                                                key={row.vendorName}
                                                className="border-t"
                                            >
                                                <td className="px-3 py-2">
                                                    {row.vendorName}
                                                </td>
                                                <td className="px-3 py-2 font-medium text-red-700 dark:text-red-300">
                                                    {formatAfn(row.owedAmount)}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {formatPaidDate(
                                                        row.lastPaidAt,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="rounded-lg bg-white dark:bg-brand-bg-dark">
                    <div className="p-6 text-gray-900">
                        <InventoryClient
                            data={inventoryItems}
                            properties={properties}
                            vendors={vendors}
                            currencies={currencies}
                            units={units}
                            categories={categories}
                            inventoryTypes={inventoryTypes}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
