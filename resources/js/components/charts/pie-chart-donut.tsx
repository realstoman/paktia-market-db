'use client';

import { TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    inventoryValue: {
        label: 'Inventory Value',
        color: 'var(--chart-4)',
    },
    amountOwedToVendors: {
        label: 'Amount Owed Vendors',
        color: 'var(--chart-5)',
    },
} satisfies ChartConfig;

interface PieChartDonutTextProps {
    total?: number;
    totalFixedItems?: number;
    totalUsableItems?: number;
    inventoryValue?: number;
    amountOwedToVendors?: number;
}

export function PieChartDonutText({
    total = 0,
    totalFixedItems = 0,
    totalUsableItems = 0,
    inventoryValue = 0,
    amountOwedToVendors = 0,
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
                segment: 'inventoryValue',
                label: 'Inventory Value',
                value: inventoryValue,
                fill: 'var(--color-inventoryValue)',
            },
            {
                segment: 'amountOwedToVendors',
                label: 'Amount Owed Vendors',
                value: amountOwedToVendors,
                fill: 'var(--color-amountOwedToVendors)',
            },
        ],
        [
            amountOwedToVendors,
            inventoryValue,
            total,
            totalFixedItems,
            totalUsableItems,
        ],
    );

    const totalItems = typeof total === 'number' && total >= 0 ? total : 0;

    return (
        <Card className="flex flex-col border-none bg-white shadow-none dark:bg-brand-bg-dark">
            <CardHeader className="items-center pb-0">
                <CardTitle>Inventory Status Overview</CardTitle>
                <CardDescription>Restaurant items</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
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
            </CardContent>
            <CardFooter className="flex-col items-start gap-3 pb-4 text-sm">
                <div className="flex items-start gap-2 leading-none font-medium">
                    Inventory distribution overview{' '}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    5-color breakdown: items, fixed, usable, value, and vendor
                    owed.
                </div>
            </CardFooter>
        </Card>
    );
}
