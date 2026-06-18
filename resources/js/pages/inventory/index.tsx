'use client';

import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { InventoryClient } from '@/components/tables/inventory/client';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';
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
    PackageCheck,
    PackageMinus,
    PackageX,
    ScanLine,
    Warehouse,
    type LucideIcon,
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
            <div className="mx-auto w-full max-w-[1680px] space-y-6 pb-8">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#102f33] p-6 text-white shadow-xl shadow-[#102f33]/10 sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(58,181,157,0.28),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(242,162,12,0.16),transparent_34%)]" />
                    <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:32px_32px]" />
                    <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                        <div className="max-w-3xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.16em] text-emerald-100 uppercase backdrop-blur">
                                <ScanLine className="h-4 w-4" />
                                {t(
                                    'inventory.page.controlCenter',
                                    'Inventory control center',
                                )}
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {t(
                                    'inventory.page.heroTitle',
                                    'Stock clarity across every property',
                                )}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                                {t(
                                    'inventory.page.heroDescription',
                                    'Monitor value, availability, usage, and vendor exposure from one operational workspace.',
                                )}
                            </p>
                        </div>
                        <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur lg:max-w-sm">
                            <p className="mb-2 px-1 text-xs font-medium text-white/60">
                                {t(
                                    'inventory.page.portfolioScope',
                                    'Portfolio scope',
                                )}
                            </p>
                            <SearchableDropdown
                                value={selectedPropertyId}
                                onValueChange={setSelectedPropertyId}
                                placeholder={t(
                                    'inventory.page.propertyStatsPlaceholder',
                                    'Select property for stats',
                                )}
                                searchPlaceholder={t(
                                    'inventory.filters.searchProperties',
                                    'Search properties...',
                                )}
                                emptyText={t(
                                    'inventory.filters.noProperties',
                                    'No properties found.',
                                )}
                                className="h-11 border-white/20 bg-white text-slate-900 hover:bg-white"
                                options={[
                                    {
                                        value: PROPERTY_FILTER_ALL,
                                        label: t(
                                            'inventory.page.allProperties',
                                            'All Properties',
                                        ),
                                    },
                                    ...propertyOptions,
                                ]}
                            />
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <InventoryMetric
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
                        tone="emerald"
                        featured
                    />
                    <InventoryMetric
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
                        tone="blue"
                    />
                    <InventoryMetric
                        title={t(
                            'inventory.page.stats.totalUsable',
                            'Usable Items',
                        )}
                        value={formatNumber(stats.totalUsableItems)}
                        description={t(
                            'inventory.page.stats.totalUsableDescription',
                            'Items available for active operations.',
                        )}
                        icon={PackageCheck}
                        tone="violet"
                    />
                    <InventoryMetric
                        title={t(
                            'inventory.page.stats.totalOwed',
                            'Amount Owed to Vendors',
                        )}
                        value={formatAfn(stats.totalOwed)}
                        description={t(
                            'inventory.page.vendorOwed.viewDetails',
                            'View details',
                        )}
                        icon={Banknote}
                        tone="rose"
                        onClick={() => setIsVendorOwedModalOpen(true)}
                    />
                    <InventoryMetric
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
                        tone="slate"
                    />
                    <InventoryMetric
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
                        tone="amber"
                    />
                    <InventoryMetric
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
                        tone="rose"
                    />
                </section>

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
