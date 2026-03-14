'use client';

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
import { formatPrice } from '@/utils/format';
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

export const description = 'Baba Bar Chart';

const chartConfig = {
    netProfit: {
        label: 'Net Profit',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

interface BarChartDefaultProps {
    data?: Array<{
        month: string;
        label: string;
        netProfit: number;
    }>;
}

export function BarChartDefault({ data = [] }: BarChartDefaultProps) {
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

    return (
        <Card className="flex h-full flex-col border-none bg-white shadow-none dark:bg-brand-bg-dark">
            <CardHeader>
                <CardTitle>Restaurant Net Profit</CardTitle>
                <CardDescription>Past 5 months</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
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
                                        'Net Profit',
                                    ]}
                                />
                            }
                        />
                        <Bar
                            dataKey="netProfit"
                            fill="var(--chart-1)"
                            radius={8}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 pb-4 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    {trendPercentage === null
                        ? 'No percentage comparison available'
                        : `${trendValue >= 0 ? 'Up' : 'Down'} by ${Math.abs(
                              trendPercentage,
                          ).toFixed(1)}% from last month`}{' '}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-relaxed text-muted-foreground">
                    Showing net profit by month for the last 5 months
                </div>
            </CardFooter>
        </Card>
    );
}
