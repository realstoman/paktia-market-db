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
        label: 'Items',
    },
    usable: {
        label: 'Usable',
        color: 'var(--chart-1)',
    },
    fixed: {
        label: 'Fixed',
        color: 'var(--chart-2)',
    },
    other: {
        label: 'Other',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

interface PieDatum {
    key: 'usable' | 'fixed' | 'other';
    label: string;
    value: number;
}

interface PieChartDonutTextProps {
    data?: PieDatum[];
    total?: number;
    totalFixedItems?: number;
    totalUsableItems?: number;
    inventoryValue?: number;
    amountOwedToVendors?: number;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function PieChartDonutText({
    data = [],
    total = 0,
    totalFixedItems = 0,
    totalUsableItems = 0,
    inventoryValue = 0,
    amountOwedToVendors = 0,
}: PieChartDonutTextProps) {
    const chartData = React.useMemo(
        () =>
            data.map((item) => ({
                segment: item.key,
                value: item.value,
                fill: `var(--color-${item.key})`,
            })),
        [data],
    );

    const totalItems = React.useMemo(() => {
        if (typeof total === 'number' && total >= 0) {
            return total;
        }

        return chartData.reduce((acc, curr) => acc + curr.value, 0);
    }, [chartData, total]);

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
                            content={<ChartTooltipContent hideLabel />}
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
                    Showing usable, fixed, and other inventory items
                </div>
                <div className="grid w-full grid-cols-1 gap-2 pt-1 text-xs sm:grid-cols-2">
                    <div className="rounded-md border px-2 py-1.5">
                        <span className="text-muted-foreground">
                            Total Items:
                        </span>{' '}
                        <span className="font-semibold">
                            {totalItems.toLocaleString()}
                        </span>
                    </div>
                    <div className="rounded-md border px-2 py-1.5">
                        <span className="text-muted-foreground">
                            Fixed Items:
                        </span>{' '}
                        <span className="font-semibold">
                            {totalFixedItems.toLocaleString()}
                        </span>
                    </div>
                    <div className="rounded-md border px-2 py-1.5">
                        <span className="text-muted-foreground">
                            Usable Items:
                        </span>{' '}
                        <span className="font-semibold">
                            {totalUsableItems.toLocaleString()}
                        </span>
                    </div>
                    <div className="rounded-md border px-2 py-1.5">
                        <span className="text-muted-foreground">
                            Inventory Value:
                        </span>{' '}
                        <span className="font-semibold">
                            {formatCurrency(inventoryValue)} ؋
                        </span>
                    </div>
                    <div className="rounded-md border px-2 py-1.5 sm:col-span-2">
                        <span className="text-muted-foreground">
                            Owed to Vendors:
                        </span>{' '}
                        <span className="font-semibold text-red-600 dark:text-red-300">
                            {formatCurrency(amountOwedToVendors)} ؋
                        </span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
