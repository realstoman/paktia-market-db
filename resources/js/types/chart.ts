/**
 * Types fo all charts
 */

// Orders line charts multiple items
export interface OrderAnalyticsChartProps {
    data: OrderDayData[];
    title?: string;
    description?: string;
}

export interface OrderDayData {
    date: string;
    day: string;
    pending: number;
    preparing: number;
    completed: number;
    cancelled: number;
}
