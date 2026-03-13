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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
    const animationKey = useMemo(
        () =>
            formattedData
                .map(
                    (item) =>
                        `${item.date}-${item.pending}-${item.preparing}-${item.ready ?? 0}-${item.completed}-${item.cancelled}`,
                )
                .join('|'),
        [formattedData],
    );

    return (
        <Card className="rounded-none border-none bg-white pt-0 shadow-none dark:bg-brand-bg-dark">
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
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-nowrap">
                        <LegendItem
                            label="Pending"
                            color="var(--chart-neutral)"
                        />
                        <LegendItem
                            label="Preparing"
                            color="var(--chart-sky)"
                        />
                        <LegendItem label="Ready" color="var(--chart-ready)" />
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

            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="h-[300px] w-full"
                >
                    <AreaChart
                        key={animationKey}
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
                            stroke="#e9edf3"
                        />
                        <defs>
                            <linearGradient
                                id="fillPending"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-neutral)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-neutral)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillPreparing"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-sky)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-sky)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillReady"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-ready)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-ready)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillCompleted"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-green)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-green)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillCancelled"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-red)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-red)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                        </defs>

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

                        {/* Pending Area - Neutral */}
                        <Area
                            dataKey="pending"
                            type="monotone"
                            stroke="var(--chart-neutral)"
                            fill="url(#fillPending)"
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Preparing Area - Sky */}
                        <Area
                            dataKey="preparing"
                            type="monotone"
                            stroke="var(--chart-sky)"
                            fill="url(#fillPreparing)"
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Ready Area - Amber */}
                        <Area
                            dataKey="ready"
                            type="monotone"
                            stroke="var(--chart-ready)"
                            fill="url(#fillReady)"
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Completed Area - Green */}
                        <Area
                            dataKey="completed"
                            type="monotone"
                            stroke="var(--chart-green)"
                            fill="url(#fillCompleted)"
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Cancelled Area - Red */}
                        <Area
                            dataKey="cancelled"
                            type="monotone"
                            stroke="var(--chart-red)"
                            fill="url(#fillCancelled)"
                            strokeWidth={2}
                            isAnimationActive
                            animationDuration={700}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
