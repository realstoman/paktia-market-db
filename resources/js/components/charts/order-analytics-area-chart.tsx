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
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { OrderAnalyticsChartProps } from '@/types/chart';
import { useMemo, useState } from 'react';
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
    completed: {
        label: 'Completed',
        color: 'var(--chart-green)',
    },
    cancelled: {
        label: 'Cancelled',
        color: 'var(--chart-red)',
    },
} satisfies ChartConfig;

export function OrderAnalyticsAreaChart({
    data,
    title = 'Order Analytics',
    description = 'Order status trends over time',
}: OrderAnalyticsChartProps) {
    const [timeRange, setTimeRange] = useState('7d');

    // Filter data based on time range
    const filteredData = useMemo(() => {
        if (!data.length) return [];

        // Get the latest date from the data
        const latestDate = new Date(data[data.length - 1].date);
        let daysToSubtract = 7; // Default to 7 days

        if (timeRange === '30d') {
            daysToSubtract = 30;
        } else if (timeRange === '90d') {
            daysToSubtract = 90;
        }

        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);

        return data.filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate;
        });
    }, [data, timeRange]);

    // Format date for X-axis display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card className="rounded-none border-none shadow-none dark:bg-brand-bg-dark">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle className="text-lg font-semibold">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                        {description}
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="w-[130px] rounded-lg sm:ml-auto"
                        aria-label="Select time range"
                    >
                        <SelectValue placeholder="Last 7 days" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="90d" className="rounded-lg">
                            Last 90 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[300px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            {/* Pending Gradient */}
                            <linearGradient
                                id="fillPending"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-pending)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-pending)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>

                            {/* Preparing Gradient */}
                            <linearGradient
                                id="fillPreparing"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-preparing)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-preparing)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>

                            {/* Completed Gradient */}
                            <linearGradient
                                id="fillCompleted"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-completed)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-completed)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>

                            {/* Cancelled Gradient */}
                            <linearGradient
                                id="fillCancelled"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-cancelled)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-cancelled)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                        />

                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={20}
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickFormatter={formatDate}
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
                                    labelFormatter={(value) => {
                                        return new Date(
                                            value,
                                        ).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                        });
                                    }}
                                    indicator="dot"
                                    formatter={(value, name) => [
                                        value,
                                        chartConfig[
                                            name as keyof typeof chartConfig
                                        ]?.label || name,
                                    ]}
                                />
                            }
                        />

                        {/* Pending Area */}
                        <Area
                            dataKey="pending"
                            type="monotone"
                            fill="url(#fillPending)"
                            stroke="var(--color-pending)"
                            strokeWidth={2}
                            stackId="orders"
                        />

                        {/* Preparing Area */}
                        <Area
                            dataKey="preparing"
                            type="monotone"
                            fill="url(#fillPreparing)"
                            stroke="var(--color-preparing)"
                            strokeWidth={2}
                            stackId="orders"
                        />

                        {/* Completed Area */}
                        <Area
                            dataKey="completed"
                            type="monotone"
                            fill="url(#fillCompleted)"
                            stroke="var(--color-completed)"
                            strokeWidth={2}
                            stackId="orders"
                        />

                        {/* Cancelled Area */}
                        <Area
                            dataKey="cancelled"
                            type="monotone"
                            fill="url(#fillCancelled)"
                            stroke="var(--color-cancelled)"
                            strokeWidth={2}
                            stackId="orders"
                        />

                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
