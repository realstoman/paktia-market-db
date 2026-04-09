/**
 * Types fo all charts
 */

// Orders line charts multiple items
export interface OrderAnalyticsChartProps {
    data: OrderDayData[];
    title?: string;
    description?: string;
    labels?: Partial<Record<'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled', string>>;
    locale?: string;
    isRtl?: boolean;
}

export interface OrderDayData {
    date: string;
    day: string;
    pending: number;
    preparing: number;
    ready?: number;
    completed: number;
    cancelled: number;
}
