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
}

export function PieChartDonutText({
    total = 0,
    totalFixedItems = 0,
    totalUsableItems = 0,
    lowStockItems = 0,
    outOfStockItems = 0,
}: PieChartDonutTextProps) {
    const chartData = React.useMemo(
        () => [
            {
                segment: 'totalItems',
                label: 'Total Items',
                value: total,
                fill: 'var(--color-totalItems)',
            },
            {
                segment: 'totalFixedItems',
                label: 'Total Fixed Items',
                value: totalFixedItems,
                fill: 'var(--color-totalFixedItems)',
            },
            {
                segment: 'totalUsableItems',
                label: 'Total Usable Items',
                value: totalUsableItems,
                fill: 'var(--color-totalUsableItems)',
            },
            {
                segment: 'lowStockItems',
                label: 'Low Stock Items',
                value: lowStockItems,
                fill: 'var(--color-lowStockItems)',
            },
            {
                segment: 'outOfStockItems',
                label: 'Out of Stock Items',
                value: outOfStockItems,
                fill: 'var(--color-outOfStockItems)',
            },
        ],
        [
            lowStockItems,
            outOfStockItems,
            total,
            totalFixedItems,
            totalUsableItems,
        ],
    );

    const totalItems = typeof total === 'number' && total >= 0 ? total : 0;

    return (
        <div className="flex h-full flex-col">
            <div className="mb-3 text-center">
                <h3 className="text-base font-semibold text-foreground">
                    Inventory Status Overview
                </h3>
                <p className="text-sm text-muted-foreground">
                    Restaurant items
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
                            innerRadius={60}
                            strokeWidth={5}
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
                                                    {totalItems.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    Items
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
            <div className="mt-3 flex flex-col items-start gap-3 text-sm">
                <div className="flex items-start gap-2 leading-none font-medium text-foreground">
                    Inventory distribution overview{' '}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    5-color breakdown: items, fixed, usable, low stock, and out
                    of stock.
                </div>
            </div>
        </div>
    );
}
