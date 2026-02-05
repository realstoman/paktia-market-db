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

export const description = 'Baba Data Bar Chart';

const chartData = [
    { month: 'Jan', sales: 465000 },
    { month: 'February', sales: 270000 },
    { month: 'March', sales: 195000 },
    { month: 'April', sales: 500000 },
    { month: 'May', sales: 120000 },
];

const chartConfig = {
    sales: {
        label: 'sales',
        color: 'var(--chart-6)',
    },
} satisfies ChartConfig;

export function BarChartDefault() {
    return (
        <Card className="border border-sidebar-border/70 dark:border-sidebar-border">
            <CardHeader>
                <CardTitle>Restaurant Revenue</CardTitle>
                <CardDescription>January - May 2026</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <Bar
                            dataKey="sales"
                            fill="var(--color-desktop)"
                            radius={8}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending up by 5.2% this month{' '}
                    <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing total visitors for the last 6 months
                </div>
            </CardFooter>
        </Card>
    );
}
