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
import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

export const description = 'Baba Bar Chart';

const chartData = [
    { month: 'Jan', sales: 465000 },
    { month: 'February', sales: 270000 },
    { month: 'March', sales: 195000 },
    { month: 'April', sales: 500000 },
    { month: 'May', sales: 700000 },
];

const chartConfig = {
    sales: {
        label: 'Sales:',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

export function BarChartDefault() {
    return (
        <Card className="flex h-full flex-col border-none bg-white shadow-none dark:bg-brand-bg-dark">
            <CardHeader>
                <CardTitle>Restaurant Revenue</CardTitle>
                <CardDescription>January - May 2026</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
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
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="sales" fill="var(--chart-1)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 pb-4 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending up by 5.2% this month{' '}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-relaxed text-muted-foreground">
                    Showing restaurant total sales revenue for the last 6 months
                </div>
            </CardFooter>
        </Card>
    );
}
