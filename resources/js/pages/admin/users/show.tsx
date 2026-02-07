'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import users from '@/routes/users';
import { Branch, BreadcrumbItem, Country, Province, Role, User } from '@/types';
import { Head } from '@inertiajs/react';

interface UserShowProps {
    user: User & {
        roles?: Role[];
        country?: Country | null;
        province?: Province | null;
        branch?: Branch | null;
    };
}

export default function UserShow({ user }: UserShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Users',
            href: users.index().url,
        },
        {
            title: user.name,
            href: `/users/${user.id}`,
        },
    ];

    const roles = user.roles ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User: ${user.name}`} />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="space-y-6 p-6 text-gray-900">
                    <div>
                        <h2 className="text-xl font-semibold text-secondary-foreground">
                            User Profile
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Profile details and account status.
                        </p>
                    </div>

                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Name
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.name}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Email
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.email}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Status
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.is_active ? (
                                        <Badge variant="success">Active</Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            Blocked
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Roles
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {roles.length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No roles assigned
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {roles.map((role) => (
                                                <Badge
                                                    key={role.id}
                                                    variant="secondary"
                                                >
                                                    {role.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Country
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.country?.name ?? '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Province
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.province?.name ?? '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Branch
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.branch?.name ?? '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Created
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.created_at
                                        ? new Date(
                                              user.created_at,
                                          ).toLocaleString()
                                        : '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-secondary-foreground">
                                    Updated
                                </TableCell>
                                <TableCell className="text-secondary-foreground/90">
                                    {user.updated_at
                                        ? new Date(
                                              user.updated_at,
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
