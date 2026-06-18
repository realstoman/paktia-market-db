import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Country } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

const MAX_VISIBLE_ITEMS = 3;

export const columns: ColumnDef<Country>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'currency_code',
        header: 'Country Code',
    },
    {
        accessorKey: 'currency_symbol',
        header: 'Currency Symbol',
    },
    {
        id: 'provinces',
        header: 'Provinces',
        cell: ({ row }) => {
            const provinces = row.original.provinces ?? [];
            const visible = provinces.slice(0, MAX_VISIBLE_ITEMS);
            const hidden = provinces.slice(MAX_VISIBLE_ITEMS);

            if (provinces.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        No provinces
                    </span>
                );
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {visible.map((province) => (
                        <Badge key={province.id} variant="secondary">
                            {province.name}
                        </Badge>
                    ))}
                    {hidden.length > 0 && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="cursor-help"
                                    >
                                        +{hidden.length} more
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex flex-wrap gap-1">
                                        {hidden.map((province) => (
                                            <Badge
                                                key={province.id}
                                                variant="secondary"
                                            >
                                                {province.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            );
        },
    },
    {
        id: 'properties',
        header: 'Properties',
        cell: ({ row }) => {
            const properties = row.original.properties ?? [];
            const visible = properties.slice(0, MAX_VISIBLE_ITEMS);
            const hidden = properties.slice(MAX_VISIBLE_ITEMS);

            if (properties.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        No properties
                    </span>
                );
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {visible.map((property) => (
                        <Badge key={property.id} variant="secondary">
                            {property.name}
                        </Badge>
                    ))}
                    {hidden.length > 0 && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="cursor-help"
                                    >
                                        +{hidden.length} more
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="flex flex-wrap gap-1">
                                        {hidden.map((property) => (
                                            <Badge
                                                key={property.id}
                                                variant="secondary"
                                            >
                                                {property.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
            const active = row.getValue('is_active');
            return active ? (
                <Badge className="flex items-center gap-1 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <BadgeCheck className="h-4 w-4 text-green-600" />
                    Active
                </Badge>
            ) : (
                <Badge className="flex items-center gap-1 bg-red-100 text-neutral-800 dark:bg-red-200">
                    <Ban className="h-4 w-4 text-red-600" />
                    Inactive
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return date.toLocaleDateString();
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <CellAction data={row.original} />,
    },
];
