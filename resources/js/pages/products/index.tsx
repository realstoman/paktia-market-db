'use client';

import { ProductsClient } from '@/components/tables/products/client';
import AppLayout from '@/layouts/app-layout';
import { Product, ProductCategory, ProductSize, BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

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
    sizes: ProductSize[];
}

export default function ProductsPage({
    products,
    categories,
    sizes,
}: ProductsPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <ProductsClient
                        data={products}
                        categories={categories}
                        sizes={sizes}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
