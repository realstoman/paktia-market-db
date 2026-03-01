'use client';

import { ProductsClient } from '@/components/tables/products/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
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
    UtensilsCrossed,
    type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Products',
        href: '/products',
    },
];

interface ProductsPageProps {
    products: Product[];
    categories: ProductCategory[];
    types: ProductType[];
    kitchens: Kitchen[];
    sizes: ProductSize[];
}

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
    const totalProducts = products.length;

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
            <Head title="Products" />
            <div className="space-y-4 pt-3 pb-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                    <Card className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                            <CardTitle className="text-sm">
                                Total Products
                            </CardTitle>
                            <Layers3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold tracking-tight">
                                {formatNumber(totalProducts)}
                            </p>
                        </CardContent>
                    </Card>

                    {productsByType.map((typeSummary) => {
                        const TypeIcon = getTypeIcon(typeSummary.name);

                        return (
                            <Card
                                key={typeSummary.name}
                                className="gap-3 border-neutral-200 bg-white py-4 shadow-none md:col-span-4 dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
                                    <CardTitle className="text-sm capitalize">
                                        {typeSummary.name}
                                    </CardTitle>
                                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold tracking-tight">
                                        {formatNumber(typeSummary.count)}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
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
