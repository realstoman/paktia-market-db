'use client';

import { TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatNumber } from '@/utils/format';

export const description = 'A donut chart with text';

const chartConfig = {
    value: {
        label: 'Value',
    },
    totalItems: {
        label: 'Total Items',
        color: 'var(--chart-1)',
    },
    totalFixedItems: {
        label: 'Total Fixed Items',
        color: 'var(--chart-2)',
    },
    totalUsableItems: {
        label: 'Total Usable Items',
        color: 'var(--chart-3)',
    },
    lowStockItems: {
        label: 'Low Stock Items',
        color: 'var(--chart-4)',
    },
    outOfStockItems: {
        label: 'Out of Stock Items',
        color: 'var(--chart-5)',
    },
} satisfies ChartConfig;

interface PieChartDonutTextProps {
    total?: number;
    totalFixedItems?: number;
    totalUsableItems?: number;
    lowStockItems?: number;
    outOfStockItems?: number;
    labels?: {
        title?: string;
        description?: string;
        items?: string;
        summaryTitle?: string;
        summaryDescription?: string;
        totalItems?: string;
        totalFixedItems?: string;
        totalUsableItems?: string;
        lowStockItems?: string;
        outOfStockItems?: string;
    };
    isRtl?: boolean;
}

export function PieChartDonutText({
    total = 0,
    totalFixedItems = 0,
    totalUsableItems = 0,
    lowStockItems = 0,
    outOfStockItems = 0,
    labels,
    isRtl = false,
}: PieChartDonutTextProps) {
    const resolvedLabels = {
        title: labels?.title ?? 'Inventory Status Overview',
        description: labels?.description ?? 'Market items',
        items: labels?.items ?? 'Items',
        summaryTitle:
            labels?.summaryTitle ?? 'Inventory distribution overview',
        summaryDescription:
            labels?.summaryDescription ??
            'A quick breakdown of total items, fixed assets, usable stock, low stock, and out-of-stock items.',
        totalItems: labels?.totalItems ?? 'Total Items',
        totalFixedItems: labels?.totalFixedItems ?? 'Total Fixed Items',
        totalUsableItems: labels?.totalUsableItems ?? 'Total Usable Items',
        lowStockItems: labels?.lowStockItems ?? 'Low Stock Items',
        outOfStockItems: labels?.outOfStockItems ?? 'Out of Stock Items',
    };

    const chartData = React.useMemo(
        () => [
            {
                segment: 'totalItems',
                label: resolvedLabels.totalItems,
                value: total,
                fill: 'var(--color-totalItems)',
            },
            {
                segment: 'totalFixedItems',
                label: resolvedLabels.totalFixedItems,
                value: totalFixedItems,
                fill: 'var(--color-totalFixedItems)',
            },
            {
                segment: 'totalUsableItems',
                label: resolvedLabels.totalUsableItems,
                value: totalUsableItems,
                fill: 'var(--color-totalUsableItems)',
            },
            {
                segment: 'lowStockItems',
                label: resolvedLabels.lowStockItems,
                value: lowStockItems,
                fill: 'var(--color-lowStockItems)',
            },
            {
                segment: 'outOfStockItems',
                label: resolvedLabels.outOfStockItems,
                value: outOfStockItems,
                fill: 'var(--color-outOfStockItems)',
            },
        ],
        [
            lowStockItems,
            outOfStockItems,
            resolvedLabels.lowStockItems,
            resolvedLabels.outOfStockItems,
            resolvedLabels.totalFixedItems,
            total,
            totalFixedItems,
            totalUsableItems,
            resolvedLabels.totalItems,
            resolvedLabels.totalUsableItems,
        ],
    );

    const totalItems = typeof total === 'number' && total >= 0 ? total : 0;

    return (
        <div className={`flex h-full flex-col ${isRtl ? 'text-right' : ''}`}>
            <div className="mb-3 text-center">
                <h3 className="text-base font-semibold text-foreground">
                    {resolvedLabels.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {resolvedLabels.description}
                </p>
            </div>
            <div className="flex-1">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[225px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="segment"
                            innerRadius={62}
                            outerRadius={88}
                            strokeWidth={4}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (
                                        viewBox &&
                                        'cx' in viewBox &&
                                        'cy' in viewBox
                                    ) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {formatNumber(totalItems)}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    {resolvedLabels.items}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </div>
            <div className="mt-3 flex flex-col items-start gap-2.5 text-sm">
                <div className="flex items-start gap-2 leading-none font-medium text-foreground">
                    {resolvedLabels.summaryTitle}{' '}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-relaxed text-muted-foreground">
                    {resolvedLabels.summaryDescription}
                </div>
            </div>
        </div>
    );
}
