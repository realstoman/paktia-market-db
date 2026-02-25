'use client';

import { OrdersClient } from '@/components/tables/orders/client';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Order, Product } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Orders',
        href: '/orders',
    },
];

interface OrdersPageProps {
    orders: Order[];
    branches: Branch[];
    products: Product[];
}

export default function OrdersPage({
    orders,
    branches,
    products,
}: OrdersPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="p-6 text-gray-900">
                    <OrdersClient
                        data={orders}
                        branches={branches}
                        products={products}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
