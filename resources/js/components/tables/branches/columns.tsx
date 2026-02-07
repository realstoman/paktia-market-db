import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Branch, Country, Province } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

const MAX_VISIBLE_KITCHENS = 3;

export const buildColumns = (
    countries: Country[],
    provinces: Province[],
): ColumnDef<Branch>[] => [
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
        accessorKey: 'country',
        header: 'Country',
    },
    {
        accessorKey: 'province',
        header: 'Province',
    },
    {
        id: 'kitchens',
        header: 'Kitchens',
        cell: ({ row }) => {
            const kitchens = row.original.kitchens ?? [];
            const visible = kitchens.slice(0, MAX_VISIBLE_KITCHENS);
            const hidden = kitchens.slice(MAX_VISIBLE_KITCHENS);

            if (kitchens.length === 0) {
                return (
                    <span className="text-xs text-muted-foreground">
                        No kitchens
                    </span>
                );
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {visible.map((kitchen) => (
                        <Badge
                            key={`${kitchen.id}-${kitchen.name ?? 'kitchen'}`}
                            variant="secondary"
                        >
                            {kitchen.name ?? `Kitchen #${kitchen.id}`}
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
                                        {hidden.map((kitchen) => (
                                            <Badge
                                                key={`${kitchen.id}-${kitchen.name ?? 'kitchen'}`}
                                                variant="secondary"
                                            >
                                                {kitchen.name ??
                                                    `Kitchen #${kitchen.id}`}
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
        accessorKey: 'address',
        header: 'Address',
    },
    {
        accessorKey: 'description',
        header: 'Description',
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
        cell: ({ row }) => (
            <CellAction
                data={row.original}
                countries={countries}
                provinces={provinces}
            />
        ),
    },
];
