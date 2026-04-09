'use client';

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatPrice } from '@/utils/format';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

export const description = 'Baba Bar Chart';

const chartConfig = {
    netProfit: {
        label: 'Net Profit',
        color: '#102F33',
    },
} satisfies ChartConfig;

interface BarChartDefaultProps {
    data?: Array<{
        month: string;
        label: string;
        netProfit: number;
    }>;
    title?: string;
    description?: string;
    footerNote?: string;
    compact?: boolean;
    labels?: {
        netProfit?: string;
        noComparison?: string;
        trendUp?: string;
        trendDown?: string;
        fromLastMonth?: string;
    };
    isRtl?: boolean;
}

export function BarChartDefault({
    data = [],
    title = 'Restaurant Net Profit',
    description = 'Past 5 months',
    footerNote = 'Showing net profit by month for the last 5 months',
    compact = false,
    labels,
    isRtl = false,
}: BarChartDefaultProps) {
    const latestMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    const trendValue =
        latestMonth && previousMonth
            ? latestMonth.netProfit - previousMonth.netProfit
            : 0;
    const trendPercentage =
        latestMonth && previousMonth && previousMonth.netProfit !== 0
            ? (trendValue / Math.abs(previousMonth.netProfit)) * 100
            : null;
    const trendIsPositive = trendValue >= 0;

    const resolvedLabels = {
        netProfit: labels?.netProfit ?? 'Net Profit',
        noComparison:
            labels?.noComparison ?? 'No percentage comparison available',
        trendUp: labels?.trendUp ?? 'Up by',
        trendDown: labels?.trendDown ?? 'Down by',
        fromLastMonth: labels?.fromLastMonth ?? 'from last month',
    };

    return (
        <div className={`flex h-full flex-col ${isRtl ? 'text-right' : ''}`}>
            <div className={compact ? 'mb-2' : 'mb-3'}>
                <h3 className="text-base font-semibold text-foreground">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex-1">
                <ChartContainer
                    config={chartConfig}
                    className={compact ? 'h-[180px] w-full' : 'h-full w-full'}
                >
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} stroke="#edf1f5" />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={true}
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => [
                                        `${formatPrice(Number(value))} ؋ `,
                                        resolvedLabels.netProfit,
                                    ]}
                                />
                            }
                        />
                        <Bar
                            dataKey="netProfit"
                            fill="var(--chart-1)"
                            radius={[10, 10, 6, 6]}
                            maxBarSize={compact ? 30 : 40}
                        />
                    </BarChart>
                </ChartContainer>
            </div>
            <div className={compact ? 'mt-2 flex flex-col items-start gap-1.5 text-sm' : 'mt-3 flex flex-col items-start gap-2 text-sm'}>
                <div className="flex gap-2 leading-none font-medium text-foreground">
                    {trendPercentage === null
                        ? resolvedLabels.noComparison
                        : `${trendValue >= 0 ? resolvedLabels.trendUp : resolvedLabels.trendDown} ${Math.abs(
                              trendPercentage,
                          ).toFixed(1)}% ${resolvedLabels.fromLastMonth}`}{' '}
                    {trendPercentage === null ? (
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    ) : trendIsPositive ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                    )}
                </div>
                <div className="leading-relaxed text-muted-foreground">
                    {footerNote}
                </div>
            </div>
        </div>
    );
}
