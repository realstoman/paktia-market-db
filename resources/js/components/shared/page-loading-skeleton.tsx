import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';

function SummaryCardsSkeleton({
    count = 4,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4',
                className,
            )}
        >
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-xl border border-neutral-200/70 bg-white/80 p-5 shadow-none dark:border-neutral-800 dark:bg-neutral-900/80"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                    <Skeleton className="mt-4 h-3 w-4/5" />
                </div>
            ))}
        </div>
    );
}

function TableBlockSkeleton({
    hasToolbar = true,
    rowCount = 8,
}: {
    hasToolbar?: boolean;
    rowCount?: number;
}) {
    return (
        <div className="space-y-4 rounded-xl border border-neutral-200/70 bg-white/90 p-5 dark:border-neutral-800 dark:bg-neutral-950/80">
            {hasToolbar ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Skeleton className="h-10 w-full max-w-[250px]" />
                    <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-md border border-neutral-200/60 dark:border-neutral-800">
                <div className="border-b border-neutral-200/60 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/80">
                    <div className="grid grid-cols-4 gap-4 lg:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-4 w-20" />
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-neutral-200/60 dark:divide-neutral-800">
                    {Array.from({ length: rowCount }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid grid-cols-4 gap-4 px-4 py-4 lg:grid-cols-6"
                        >
                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                <Skeleton
                                    key={cellIndex}
                                    className={cn(
                                        'h-4',
                                        cellIndex === 0
                                            ? 'w-28'
                                            : cellIndex === 5
                                              ? 'w-16'
                                              : 'w-20',
                                    )}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function DashboardColumnSkeleton() {
    return (
        <div className="rounded-xl border border-neutral-200/70 bg-white/85 p-5 dark:border-neutral-800 dark:bg-neutral-950/80">
            <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <Skeleton className="h-11 w-11 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                        </div>
                    ))}
                </div>
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        </div>
    );
}

export function DashboardPageSkeleton() {
    return (
        <div className="space-y-3 py-2">
            <div className="grid auto-rows-min grid-cols-1 items-stretch gap-3 md:grid-cols-4">
                <div className="col-span-1">
                    <DashboardColumnSkeleton />
                </div>
                <div className="col-span-2">
                    <div className="rounded-xl border border-neutral-200/70 bg-white/85 p-5 dark:border-neutral-800 dark:bg-neutral-950/80">
                        <div className="space-y-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-3">
                                    <Skeleton className="h-5 w-44" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <Skeleton className="h-10 w-28" />
                            </div>
                            <Skeleton className="h-56 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
                <div className="col-span-1">
                    <DashboardColumnSkeleton />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                <div className="xl:col-span-4">
                    <div className="rounded-xl border border-neutral-200/70 bg-white/85 p-5 dark:border-neutral-800 dark:bg-neutral-950/80">
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-36" />
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="xl:col-span-8">
                    <TableBlockSkeleton hasToolbar={false} rowCount={7} />
                </div>
            </div>
        </div>
    );
}

export function GenericPageSkeleton() {
    return (
        <div className="space-y-4 py-2">
            <SummaryCardsSkeleton />
            <TableBlockSkeleton />
        </div>
    );
}

export function MinimalPageSkeleton() {
    return (
        <div className="space-y-4 py-2">
            <div className="rounded-xl border border-neutral-200/70 bg-white/85 p-5 dark:border-neutral-800 dark:bg-neutral-950/80">
                <div className="space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
            <TableBlockSkeleton />
        </div>
    );
}

export function PageLoadingSkeleton() {
    const { component } = usePage();

    if (component === 'dashboard') {
        return <DashboardPageSkeleton />;
    }

    if (
        component.endsWith('/index') ||
        component.includes('/branches') ||
        component.includes('/users') ||
        component.includes('/roles') ||
        component.includes('/orders') ||
        component.includes('/products') ||
        component.includes('/inventory')
    ) {
        return <GenericPageSkeleton />;
    }

    return <MinimalPageSkeleton />;
}
