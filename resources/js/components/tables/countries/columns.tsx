import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Country } from '@/types';
import { formatNumber } from '@/utils/format';
import { ColumnDef } from '@tanstack/react-table';
import { BadgeCheck, Ban } from 'lucide-react';
import { CellAction } from './cell-action';

const MAX_VISIBLE_ITEMS = 3;

type Translate = (key: string, fallback?: string) => string;

function RelatedBadges({
    items,
    emptyText,
    moreText,
}: {
    items: Array<{ id: number; name: string }>;
    emptyText: string;
    moreText: string;
}) {
    const visible = items.slice(0, MAX_VISIBLE_ITEMS);
    const hidden = items.slice(MAX_VISIBLE_ITEMS);

    if (items.length === 0) {
        return <span className="text-xs text-muted-foreground">{emptyText}</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {visible.map((item) => (
                <Badge key={item.id} variant="secondary">
                    {item.name}
                </Badge>
            ))}
            {hidden.length > 0 ? (
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                                {moreText.replace(
                                    ':count',
                                    formatNumber(hidden.length),
                                )}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex max-w-72 flex-wrap gap-1">
                                {hidden.map((item) => (
                                    <Badge key={item.id} variant="secondary">
                                        {item.name}
                                    </Badge>
                                ))}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : null}
        </div>
    );
}

export function createCountryColumns(
    t: Translate,
    locale: 'en' | 'fa' | 'ps',
): ColumnDef<Country>[] {
    const dateLocale = locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US';

    return [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label={t('countryManagement.table.selectAll')}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label={t('countryManagement.table.selectRow')}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: t('countryManagement.table.name'),
            cell: ({ row }) => (
                <div>
                    <p className="font-semibold">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.code}
                    </p>
                </div>
            ),
        },
        {
            id: 'currency',
            header: t('countryManagement.table.currency'),
            cell: ({ row }) => (
                <span dir="ltr" className="inline-flex gap-2">
                    <strong>{row.original.currency_code}</strong>
                    <span className="text-muted-foreground">
                        {row.original.currency_symbol || '—'}
                    </span>
                </span>
            ),
        },
        {
            id: 'provinces',
            header: t('countryManagement.table.provinces'),
            cell: ({ row }) => (
                <RelatedBadges
                    items={row.original.provinces ?? []}
                    emptyText={t('countryManagement.noProvinces')}
                    moreText={t('countryManagement.moreItems')}
                />
            ),
        },
        {
            id: 'properties',
            header: t('countryManagement.table.properties'),
            cell: ({ row }) => (
                <RelatedBadges
                    items={row.original.properties ?? []}
                    emptyText={t('countryManagement.noProperties')}
                    moreText={t('countryManagement.moreItems')}
                />
            ),
        },
        {
            accessorKey: 'is_active',
            header: t('countryManagement.table.status'),
            cell: ({ row }) =>
                row.original.is_active ? (
                    <Badge className="gap-1 bg-emerald-50 text-emerald-700">
                        <BadgeCheck className="size-4" />
                        {t('countryManagement.active')}
                    </Badge>
                ) : (
                    <Badge className="gap-1 bg-rose-50 text-rose-700">
                        <Ban className="size-4" />
                        {t('countryManagement.inactive')}
                    </Badge>
                ),
        },
        {
            accessorKey: 'created_at',
            header: t('countryManagement.table.createdAt'),
            cell: ({ row }) =>
                row.original.created_at
                    ? new Intl.DateTimeFormat(dateLocale).format(
                          new Date(row.original.created_at),
                      )
                    : '—',
        },
        {
            id: 'actions',
            header: t('countryManagement.table.actions'),
            cell: ({ row }) => <CellAction data={row.original} />,
        },
    ];
}
