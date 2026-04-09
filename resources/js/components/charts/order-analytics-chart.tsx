'use client';

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
        color: '#64748b',
    },
    preparing: {
        label: 'Preparing',
        color: '#cc924b',
    },
    ready: {
        label: 'Ready',
        color: '#5b7c80',
    },
    completed: {
        label: 'Completed',
        color: '#1f8f67',
    },
    cancelled: {
        label: 'Cancelled',
        color: '#d06161',
    },
} satisfies ChartConfig;

const LegendItem = ({ label, color }: { label: string; color: string }) => (
    <div className="flex items-center gap-2.5">
        <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
);

export function OrderAnalyticsChart({
    data,
    title = 'Order Analytics',
    description = 'Last 7 days order stats',
    labels,
    locale = 'en-US',
    isRtl = false,
}: OrderAnalyticsChartProps) {
    const formattedData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            formattedDay: new Intl.DateTimeFormat(locale, {
                weekday: 'short',
            }).format(new Date(`${item.date}T00:00:00`)),
        }));
    }, [data, locale]);
    const resolvedLabels = {
        pending: labels?.pending ?? 'Pending',
        preparing: labels?.preparing ?? 'Preparing',
        ready: labels?.ready ?? 'Ready',
        completed: labels?.completed ?? 'Completed',
        cancelled: labels?.cancelled ?? 'Cancelled',
    };
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
        <div className="flex h-full flex-1 flex-col">
            <div
                className={`mb-3 flex flex-row items-start justify-between gap-4 ${isRtl ? 'text-right' : ''}`}
            >
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:flex-nowrap">
                        <LegendItem label={resolvedLabels.pending} color="var(--chart-pending)" />
                        <LegendItem label={resolvedLabels.preparing} color="var(--chart-preparing)" />
                        <LegendItem label={resolvedLabels.ready} color="var(--chart-ready)" />
                        <LegendItem label={resolvedLabels.completed} color="var(--chart-completed)" />
                        <LegendItem label={resolvedLabels.cancelled} color="var(--chart-cancelled)" />
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <ChartContainer
                    config={chartConfig}
                    className="h-full min-h-[300px] w-full"
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
                            stroke="#edf1f5"
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
                                    stopColor="var(--chart-pending)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-pending)"
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
                                    stopColor="var(--chart-preparing)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-preparing)"
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
                                    stopColor="var(--chart-completed)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-completed)"
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
                                    stopColor="var(--chart-cancelled)"
                                    stopOpacity={0.42}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-cancelled)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="formattedDay"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            tickFormatter={(value) => value}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#737373', fontSize: 12 }}
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
                                            resolvedLabels[
                                                name as keyof typeof resolvedLabels
                                            ] || name,
                                    ]}
                                />
                            }
                        />

                        {/* Pending Area - Neutral */}
                        <Area
                            dataKey="pending"
                            type="monotone"
                            stroke="var(--chart-pending)"
                            fill="url(#fillPending)"
                            strokeWidth={1.75}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Preparing Area - Sky */}
                        <Area
                            dataKey="preparing"
                            type="monotone"
                            stroke="var(--chart-preparing)"
                            fill="url(#fillPreparing)"
                            strokeWidth={1.75}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Ready Area - Amber */}
                        <Area
                            dataKey="ready"
                            type="monotone"
                            stroke="var(--chart-ready)"
                            fill="url(#fillReady)"
                            strokeWidth={1.75}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Completed Area - Green */}
                        <Area
                            dataKey="completed"
                            type="monotone"
                            stroke="var(--chart-completed)"
                            fill="url(#fillCompleted)"
                            strokeWidth={1.75}
                            isAnimationActive
                            animationDuration={700}
                        />

                        {/* Cancelled Area - Red */}
                        <Area
                            dataKey="cancelled"
                            type="monotone"
                            stroke="var(--chart-cancelled)"
                            fill="url(#fillCancelled)"
                            strokeWidth={1.75}
                            isAnimationActive
                            animationDuration={700}
                        />
                    </AreaChart>
                </ChartContainer>
            </div>
        </div>
    );
}
