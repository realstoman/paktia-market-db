'use client';

import { SummaryMetricCard } from '@/components/shared/summary-metric-card';
import { ProductsClient } from '@/components/tables/products/client';
import AppLayout from '@/layouts/app-layout';
import { useLocalization } from '@/lib/localization';
import {
    BreadcrumbItem,
    Kitchen,
    Product,
    ProductCategory,
    ProductSize,
    ProductType,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { Head } from '@inertiajs/react';
import { ChefHat, Layers3, Package, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

interface ProductsPageProps {
    products: Product[];
    categories: ProductCategory[];
    types: ProductType[];
    kitchens: Kitchen[];
    sizes: ProductSize[];
}

const getKitchenIcon = (_kitchenName: string): LucideIcon => ChefHat;

export default function ProductsPage({
    products,
    categories,
    types,
    kitchens,
    sizes,
}: ProductsPageProps) {
    const { t } = useLocalization();
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('navigation.dashboard', 'Dashboard'),
            href: '/dashboard',
        },
        {
            title: t('products.breadcrumb', 'Products'),
            href: '/products',
        },
    ];

    const productsByKitchen = useMemo(() => {
        const kitchenCountMap = new Map<number, number>();

        for (const kitchen of kitchens) {
            kitchenCountMap.set(kitchen.id, 0);
        }

        for (const product of products) {
            if (!product.kitchen_id) {
                continue;
            }

            kitchenCountMap.set(
                product.kitchen_id,
                (kitchenCountMap.get(product.kitchen_id) ?? 0) + 1,
            );
        }

        return kitchens.map((kitchen) => ({
            id: kitchen.id,
            name: kitchen.name,
            count: kitchenCountMap.get(kitchen.id) ?? 0,
        }));
    }, [kitchens, products]);

    const unassignedProductsCount = useMemo(
        () => products.filter((product) => !product.kitchen_id).length,
        [products],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('products.title', 'Products')} />
            <div className="space-y-4 pt-3 pb-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <SummaryMetricCard
                        title={t('products.totalProducts', 'Total Products')}
                        value={formatNumber(totalProducts)}
                        description={t(
                            'products.totalProductsDescription',
                            'All products currently available in the system.',
                        )}
                        icon={Layers3}
                        variant="green"
                        className="md:col-span-4"
                    />

                    <SummaryMetricCard
                        title={t('products.totalCategories', 'Total Categories')}
                        value={formatNumber(totalCategories)}
                        description={t(
                            'products.totalCategoriesDescription',
                            'Categories currently organizing your products.',
                        )}
                        icon={Package}
                        variant="green"
                        className="md:col-span-4"
                    />

                    {productsByKitchen.map((kitchenSummary) => {
                        const KitchenIcon = getKitchenIcon(
                            kitchenSummary.name,
                        );

                        return (
                            <SummaryMetricCard
                                key={kitchenSummary.id}
                                title={kitchenSummary.name}
                                value={formatNumber(kitchenSummary.count)}
                                description={t(
                                    'products.mappedToKitchenDescription',
                                    'Products mapped to this kitchen.',
                                )}
                                icon={KitchenIcon}
                                variant="green"
                                className="md:col-span-4"
                            />
                        );
                    })}

                    <SummaryMetricCard
                        title={t('products.unassignedProducts', 'Unassigned')}
                        value={formatNumber(unassignedProductsCount)}
                        description={t(
                            'products.unassignedProductsDescription',
                            'Products not assigned to any kitchen yet.',
                        )}
                        icon={Package}
                        variant="green"
                        className="md:col-span-4"
                    />
                </div>

                <div className="rounded-lg bg-white p-6 text-gray-900 dark:bg-brand-bg-dark">
                    <ProductsClient
                        data={products}
                        categories={categories}
                        types={types}
                        kitchens={kitchens}
                        sizes={sizes}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
