'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import kitchens from '@/routes/kitchens';
import { BreadcrumbItem, Kitchen } from '@/types';
import { Head } from '@inertiajs/react';

interface KitchenShowProps {
    kitchen: Kitchen;
}

export default function KitchenShow({ kitchen }: KitchenShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Kitchens',
            href: kitchens.index().url,
        },
        {
            title: kitchen.name ?? 'Kitchen',
            href: `/kitchens/${kitchen.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Kitchen: ${kitchen.name ?? 'Kitchen'}`} />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="space-y-6 p-6 text-gray-900">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Kitchen Profile
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Kitchen details and location.
                        </p>
                    </div>

                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Name
                                </TableCell>
                                <TableCell>{kitchen.name ?? '—'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Kitchen Type
                                </TableCell>
                                <TableCell>
                                    {kitchen.kitchen_type ??
                                        kitchen.type ??
                                        '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Cuisines
                                </TableCell>
                                <TableCell>
                                    {(kitchen.cuisines ?? []).length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No cuisines assigned
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {(kitchen.cuisines ?? []).map(
                                                (cuisine) => (
                                                    <Badge
                                                        key={cuisine.id}
                                                        variant="secondary"
                                                    >
                                                        {cuisine.name}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Kitchen Categories
                                </TableCell>
                                <TableCell>
                                    {(kitchen.kitchen_categories ?? [])
                                        .length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No kitchen categories assigned
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {(
                                                kitchen.kitchen_categories ?? []
                                            ).map((category) => (
                                                <Badge
                                                    key={category.id}
                                                    variant="secondary"
                                                >
                                                    {category.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Status
                                </TableCell>
                                <TableCell>
                                    {kitchen.is_active ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            Inactive
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Branches
                                </TableCell>
                                <TableCell>
                                    {(kitchen.branches ?? []).length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            Unassigned
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {(kitchen.branches ?? []).map(
                                                (branch) => (
                                                    <Badge
                                                        key={branch.id}
                                                        variant="secondary"
                                                    >
                                                        {branch.name}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Created
                                </TableCell>
                                <TableCell>
                                    {kitchen.created_at
                                        ? new Date(
                                              kitchen.created_at,
                                          ).toLocaleString()
                                        : '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Updated
                                </TableCell>
                                <TableCell>
                                    {kitchen.updated_at
                                        ? new Date(
                                              kitchen.updated_at,
                                          ).toLocaleString()
                                        : '—'}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
