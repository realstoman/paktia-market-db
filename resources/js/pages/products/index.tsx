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
import {
    Coffee,
    IceCreamCone,
    Layers3,
    Package,
    Tags,
    UtensilsCrossed,
    type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';

interface ProductsPageProps {
    products: Product[];
    categories: ProductCategory[];
    types: ProductType[];
    kitchens: Kitchen[];
    sizes: ProductSize[];
}

const getTypeTranslationKey = (typeName: string) => {
    const normalizedType = typeName.trim().toLowerCase();

    if (normalizedType.includes('food')) {
        return 'products.typeNames.food';
    }

    if (
        normalizedType.includes('dessert') ||
        normalizedType.includes('desert')
    ) {
        return 'products.typeNames.dessert';
    }

    if (
        normalizedType.includes('beverage') ||
        normalizedType.includes('bverage') ||
        normalizedType.includes('drink')
    ) {
        return 'products.typeNames.drinks';
    }

    if (normalizedType.includes('bundle')) {
        return 'products.typeNames.bundles';
    }

    return null;
};

const getTypeIcon = (typeName: string): LucideIcon => {
    const normalizedType = typeName.trim().toLowerCase();

    if (normalizedType.includes('food')) {
        return UtensilsCrossed;
    }

    if (
        normalizedType.includes('dessert') ||
        normalizedType.includes('desert')
    ) {
        return IceCreamCone;
    }

    if (
        normalizedType.includes('beverage') ||
        normalizedType.includes('bverage')
    ) {
        return Coffee;
    }

    return Package;
};

export default function ProductsPage({
    products,
    categories,
    types,
    kitchens,
    sizes,
}: ProductsPageProps) {
    const { t } = useLocalization();
    const totalProducts = products.length;
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

    const productsByType = useMemo(() => {
        const typeCountMap = new Map<string, number>();

        for (const type of types) {
            typeCountMap.set(type.name.trim().toLowerCase(), 0);
        }

        for (const product of products) {
            const normalizedType = (product.type ?? '').trim().toLowerCase();
            if (!normalizedType) {
                continue;
            }

            typeCountMap.set(
                normalizedType,
                (typeCountMap.get(normalizedType) ?? 0) + 1,
            );
        }

        return Array.from(typeCountMap.entries()).map(([name, count]) => ({
            name,
            count,
        }));
    }, [products, types]);

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

                    {productsByType.map((typeSummary) => {
                        const TypeIcon = getTypeIcon(typeSummary.name);
                        const typeTranslationKey = getTypeTranslationKey(
                            typeSummary.name,
                        );
                        const fallbackTitle = typeSummary.name
                            .split(' ')
                            .map(
                                (part) =>
                                    part.charAt(0).toUpperCase() +
                                    part.slice(1),
                            )
                            .join(' ');

                        return (
                            <SummaryMetricCard
                                key={typeSummary.name}
                                title={
                                    typeTranslationKey
                                        ? t(typeTranslationKey, fallbackTitle)
                                        : fallbackTitle
                                }
                                value={formatNumber(typeSummary.count)}
                                description={t(
                                    'products.mappedToTypeDescription',
                                    'Products mapped to this product type.',
                                )}
                                icon={TypeIcon}
                                variant="green"
                                className="md:col-span-4"
                            />
                        );
                    })}

                    <SummaryMetricCard
                        title={t(
                            'products.totalCategories',
                            'Total Categories',
                        )}
                        value={formatNumber(categories.length)}
                        description={t(
                            'products.totalCategoriesDescription',
                            'Categories available for organizing products.',
                        )}
                        icon={Tags}
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
