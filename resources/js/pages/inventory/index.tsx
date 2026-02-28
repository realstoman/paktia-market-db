'use client';

import { InventoryClient } from '@/components/tables/inventory/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, InventoryItem } from '@/types';
import { formatAfn, formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import {
    Boxes,
    CircleDollarSign,
    PackageCheck,
    PackageMinus,
    PackageX,
    Warehouse,
} from 'lucide-react';
import { useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

interface InventoryPageProps {
    inventoryItems: InventoryItem[];
    branches: Branch[];
}

export default function InventoryPage({
    inventoryItems,
    branches,
}: InventoryPageProps) {
    const LOW_STOCK_THRESHOLD = 10;

    const stats = useMemo(() => {
        const totalItems = inventoryItems.length;
        let totalValue = 0;
        let totalFixedItems = 0;
        let totalUsableItems = 0;
        let lowStockItems = 0;
        let outOfStockItems = 0;

        for (const item of inventoryItems) {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;

            totalValue += quantity * unitPrice;

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
        };
    }, [inventoryItems]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />
            <div className="space-y-4 p-8">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <Card className="gap-3 border-neutral-200 bg-white pt-4 pb-0 shadow-none md:col-span-4 md:row-span-2 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-base">
                                Total Inventory Value
                            </CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold tracking-tight">
                                {formatAfn(stats.totalValue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Current value from quantity x single price
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-3 md:col-span-8 md:grid-cols-12">
                        <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-6 dark:border-neutral-800 dark:bg-neutral-900">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                                <CardTitle className="text-sm">Total Items</CardTitle>
                                <Boxes className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {formatNumber(stats.totalItems)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-6 dark:border-neutral-800 dark:bg-neutral-900">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                                <CardTitle className="text-sm">
                                    Total Usable Items
                                </CardTitle>
                                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold tracking-tight">
                                    {formatNumber(stats.totalUsableItems)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-sm">
                                Total Fixed Items
                            </CardTitle>
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatNumber(stats.totalFixedItems)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-sm">Low Stock Items</CardTitle>
                            <PackageMinus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatNumber(stats.lowStockItems)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Quantity ≤ {LOW_STOCK_THRESHOLD}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-sm">
                                Out of Stock Items
                            </CardTitle>
                            <PackageX className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatNumber(stats.outOfStockItems)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="rounded-lg bg-white dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <InventoryClient data={inventoryItems} branches={branches} />
                </div>
                </div>
            </div>
        </AppLayout>
    );
}
