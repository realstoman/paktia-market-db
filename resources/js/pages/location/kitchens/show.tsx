'use client';

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import kitchens from '@/routes/kitchens';
import { BreadcrumbItem, Kitchen } from '@/types';
import { Head } from '@inertiajs/react';

interface KitchenShowProps {
    kitchen: Kitchen & {
        branch?: {
            name?: string;
            country?: { name?: string };
            province?: { name?: string };
        };
    };
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
                        <h2 className="text-xl font-semibold">Kitchen Profile</h2>
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
                                    Type
                                </TableCell>
                                <TableCell>{kitchen.type ?? '—'}</TableCell>
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
                                    Branch
                                </TableCell>
                                <TableCell>
                                    {kitchen.branch?.name ?? kitchen.branch ?? '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Country
                                </TableCell>
                                <TableCell>
                                    {kitchen.branch?.country?.name ??
                                        kitchen.country ??
                                        '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Province
                                </TableCell>
                                <TableCell>
                                    {kitchen.branch?.province?.name ??
                                        kitchen.province ??
                                        '—'}
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
