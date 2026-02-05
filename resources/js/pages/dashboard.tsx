import { Badge } from '@/components/ui/badge';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { illustrations } from '@/config/brand';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ChefHat, CookingPot, SquareX, Utensils } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>
                    <div className="col-span-2 flex h-100 justify-between overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="w-100 flex-1 px-8 pt-12">
                            <div className="pb-8">
                                <h1 className="text-3xl">
                                    Order Status Overview
                                </h1>
                                <p>
                                    Track real-time order progress across all
                                    stages
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-sm border border-sidebar-border/70 bg-neutral-50 p-1 dark:border-sidebar-border">
                                        <ChefHat />
                                    </div>
                                    <p className="text-lg">Pending Orders</p>
                                    <Badge variant={'default'}>12</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <CookingPot />
                                    Preparing Orders
                                </div>
                                <div className="flex gap-2">
                                    <Utensils />
                                    Completed Orders
                                </div>
                                <div className="flex gap-2">
                                    <SquareX />
                                    Cancelled Orders
                                </div>
                            </div>
                        </div>
                        <div className="bottom-0 flex flex-1 items-end justify-end bg-red-100">
                            <img
                                src={`${illustrations.babaChef}`}
                                width="280"
                                height="180"
                                alt="Logo"
                            />
                        </div>
                    </div>

                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
