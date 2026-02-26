'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { OrderAnalyticsChartProps } from '@/types/chart';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const chartConfig = {
    pending: {
        label: 'Pending',
        color: 'var(--chart-neutral)',
    },
    preparing: {
        label: 'Preparing',
        color: 'var(--chart-sky)',
    },
    ready: {
        label: 'Ready',
        color: 'var(--chart-ready)',
    },
    completed: {
        label: 'Completed',
        color: 'var(--chart-green)',
    },
    cancelled: {
        label: 'Cancelled',
        color: 'var(--chart-red)',
    },
} satisfies ChartConfig;

const LegendItem = ({ label, color }: { label: string; color: string }) => (
    <div className="flex items-center gap-2">
        <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
        />
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
);

export function OrderAnalyticsChart({
    data,
    title = 'Order Analytics',
    description = 'Last 7 days order stats',
}: OrderAnalyticsChartProps) {
    const formattedData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            formattedDay: item.day,
        }));
    }, [data]);

    return (
        <Card className="rounded-none border-none bg-white shadow-none dark:bg-brand-bg-dark">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        {description}
                    </CardDescription>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <LegendItem
                            label="Pending"
                            color="var(--chart-neutral)"
                        />
                        <LegendItem
                            label="Preparing"
                            color="var(--chart-sky)"
                        />
                        <LegendItem
                            label="Ready"
                            color="var(--chart-ready)"
                        />
                        <LegendItem
                            label="Completed"
                            color="var(--chart-green)"
                        />
                        <LegendItem
                            label="Cancelled"
                            color="var(--chart-red)"
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full"
                >
                    <LineChart
                        accessibilityLayer
                        data={formattedData}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                        }}
                    >
                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                        />

                        <XAxis
                            dataKey="formattedDay"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickFormatter={(value) => value}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#666', fontSize: 12 }}
                            width={30}
                        />

                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    labelKey="formattedDay"
                                    hideLabel
                                    formatter={(value, name) => [
                                        value,
                                        chartConfig[
                                            name as keyof typeof chartConfig
                                        ]?.label || name,
                                    ]}
                                />
                            }
                        />

                        {/* Pending Line - Neutral */}
                        <Line
                            dataKey="pending"
                            type="monotone"
                            stroke="var(--chart-neutral)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />

                        {/* Preparing Line - Sky */}
                        <Line
                            dataKey="preparing"
                            type="monotone"
                            stroke="var(--chart-sky)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />

                        {/* Ready Line - Amber */}
                        <Line
                            dataKey="ready"
                            type="monotone"
                            stroke="var(--chart-ready)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />

                        {/* Completed Line - Green */}
                        <Line
                            dataKey="completed"
                            type="monotone"
                            stroke="var(--chart-green)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />

                        {/* Cancelled Line - Red */}
                        <Line
                            dataKey="cancelled"
                            type="monotone"
                            stroke="var(--chart-red)"
                            strokeWidth={2}
                            dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
