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
import branches from '@/routes/branches';
import { Branch, BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface BranchShowProps {
    branch: Branch;
}

export default function BranchShow({ branch }: BranchShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Branches',
            href: branches.index().url,
        },
        {
            title: branch.name,
            href: `/branches/${branch.id}`,
        },
    ];

    const kitchens = branch.kitchens ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Branch: ${branch.name}`} />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="space-y-6 p-6 text-gray-900">
                    <div>
                        <h2 className="text-xl font-semibold">Branch Profile</h2>
                        <p className="text-sm text-muted-foreground">
                            Branch information and kitchen overview.
                        </p>
                    </div>

                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Name
                                </TableCell>
                                <TableCell>{branch.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Status
                                </TableCell>
                                <TableCell>
                                    {branch.is_active ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            Disabled
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Country
                                </TableCell>
                                <TableCell>{branch.country ?? '—'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Province
                                </TableCell>
                                <TableCell>{branch.province ?? '—'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Address
                                </TableCell>
                                <TableCell>{branch.address ?? '—'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Description
                                </TableCell>
                                <TableCell>
                                    {branch.description ?? '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Kitchens
                                </TableCell>
                                <TableCell>
                                    {kitchens.length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No kitchens assigned
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {kitchens.map((kitchen) => (
                                                <Badge
                                                    key={`${kitchen.id}-${kitchen.name ?? 'kitchen'}`}
                                                    variant="secondary"
                                                >
                                                    {kitchen.name ??
                                                        `Kitchen #${kitchen.id}`}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Created
                                </TableCell>
                                <TableCell>
                                    {branch.created_at
                                        ? new Date(
                                              branch.created_at,
                                          ).toLocaleString()
                                        : '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Updated
                                </TableCell>
                                <TableCell>
                                    {branch.updated_at
                                        ? new Date(
                                              branch.updated_at,
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
