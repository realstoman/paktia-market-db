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
import countries from '@/routes/countries';
import { BreadcrumbItem, Country } from '@/types';
import { Head } from '@inertiajs/react';

interface CountryShowProps {
    country: Country;
}

export default function CountryShow({ country }: CountryShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Countries',
            href: countries.index().url,
        },
        {
            title: country.name,
            href: `/countries/${country.id}`,
        },
    ];

    const provinces = country.provinces ?? [];
    const branches = country.branches ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Country: ${country.name}`} />
            <div className="space-y-4 rounded-lg bg-white p-8 dark:bg-brand-bg-dark">
                <div className="space-y-6 p-6 text-gray-900">
                    <div>
                        <h2 className="text-xl font-semibold">Country Profile</h2>
                        <p className="text-sm text-muted-foreground">
                            Country details and related entities.
                        </p>
                    </div>

                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Name
                                </TableCell>
                                <TableCell>{country.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Code
                                </TableCell>
                                <TableCell>{country.code}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Currency code
                                </TableCell>
                                <TableCell>{country.currency_code}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Currency symbol
                                </TableCell>
                                <TableCell>
                                    {country.currency_symbol ?? '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Status
                                </TableCell>
                                <TableCell>
                                    {country.is_active ? (
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
                                    Provinces
                                </TableCell>
                                <TableCell>
                                    {provinces.length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No provinces
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {provinces.map((province) => (
                                                <Badge
                                                    key={province.id}
                                                    variant="secondary"
                                                >
                                                    {province.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Branches
                                </TableCell>
                                <TableCell>
                                    {branches.length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No branches
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {branches.map((branch) => (
                                                <Badge
                                                    key={branch.id}
                                                    variant="secondary"
                                                >
                                                    {branch.name}
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
                                    {country.created_at
                                        ? new Date(
                                              country.created_at,
                                          ).toLocaleString()
                                        : '—'}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">
                                    Updated
                                </TableCell>
                                <TableCell>
                                    {country.updated_at
                                        ? new Date(
                                              country.updated_at,
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
