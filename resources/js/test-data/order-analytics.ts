import { OrderDayData } from '@/types/chart';

export const mockOrderAnalyticsData: OrderDayData[] = [
    {
        date: '2026-01-30',
        day: 'Mon',
        pending: 12,
        preparing: 8,
        completed: 45,
        cancelled: 2,
    },
    {
        date: '2026-02-01',
        day: 'Tue',
        pending: 15,
        preparing: 10,
        completed: 52,
        cancelled: 1,
    },
    {
        date: '2026-02-02',
        day: 'Wed',
        pending: 18,
        preparing: 12,
        completed: 48,
        cancelled: 3,
    },
    {
        date: '2026-02-03',
        day: 'Thu',
        pending: 10,
        preparing: 9,
        completed: 55,
        cancelled: 0,
    },
    {
        date: '2026-02-04',
        day: 'Fri',
        pending: 25,
        preparing: 18,
        completed: 68,
        cancelled: 2,
    },
    {
        date: '2026-02-05',
        day: 'Sat',
        pending: 30,
        preparing: 22,
        completed: 72,
        cancelled: 4,
    },
    {
        date: '2026-02-06',
        day: 'Sun',
        pending: 14,
        preparing: 16,
        completed: 35,
        cancelled: 1,
    },
];

// Alternative with more realistic restaurant data (peak on weekends)
export const mockRestaurantOrderData: OrderDayData[] = [
    {
        date: '2024-02-01',
        day: 'Mon',
        pending: 8,
        preparing: 6,
        completed: 32,
        cancelled: 1,
    },
    {
        date: '2024-02-02',
        day: 'Tue',
        pending: 10,
        preparing: 8,
        completed: 38,
        cancelled: 2,
    },
    {
        date: '2024-02-03',
        day: 'Wed',
        pending: 12,
        preparing: 9,
        completed: 42,
        cancelled: 1,
    },
    {
        date: '2024-02-04',
        day: 'Thu',
        pending: 14,
        preparing: 11,
        completed: 48,
        cancelled: 0,
    },
    {
        date: '2024-02-05',
        day: 'Fri',
        pending: 22,
        preparing: 18,
        completed: 65,
        cancelled: 3,
    },
    {
        date: '2024-02-06',
        day: 'Sat',
        pending: 28,
        preparing: 25,
        completed: 82,
        cancelled: 4,
    },
    {
        date: '2024-02-07', // Today (Sunday - typically slower)
        day: 'Sun',
        pending: 6,
        preparing: 5,
        completed: 28,
        cancelled: 1,
    },
];

// Data showing a trend (business improving)
export const mockTrendingOrderData: OrderDayData[] = [
    {
        date: '2024-02-01',
        day: 'Mon',
        pending: 5,
        preparing: 4,
        completed: 25,
        cancelled: 1,
    },
    {
        date: '2024-02-02',
        day: 'Tue',
        pending: 6,
        preparing: 5,
        completed: 28,
        cancelled: 0,
    },
    {
        date: '2024-02-03',
        day: 'Wed',
        pending: 8,
        preparing: 6,
        completed: 32,
        cancelled: 1,
    },
    {
        date: '2024-02-04',
        day: 'Thu',
        pending: 10,
        preparing: 8,
        completed: 38,
        cancelled: 1,
    },
    {
        date: '2024-02-05',
        day: 'Fri',
        pending: 15,
        preparing: 12,
        completed: 45,
        cancelled: 2,
    },
    {
        date: '2024-02-06',
        day: 'Sat',
        pending: 20,
        preparing: 15,
        completed: 52,
        cancelled: 3,
    },
    {
        date: '2024-02-07', // Today - peak
        day: 'Sun',
        pending: 25,
        preparing: 20,
        completed: 60,
        cancelled: 2,
    },
];

// Edge case: Very busy day
export const mockPeakDayData: OrderDayData[] = [
    {
        date: '2026-01-30',
        day: 'Sat',
        pending: 33,
        preparing: 78,
        completed: 290,
        cancelled: 2,
    },
    {
        date: '2026-02-01',
        day: 'Sun',
        pending: 18,
        preparing: 15,
        completed: 55,
        cancelled: 1,
    },
    {
        date: '2024-02-02',
        day: 'Mon',
        pending: 77,
        preparing: 120,
        completed: 199,
        cancelled: 3,
    },
    {
        date: '2026-02-03',
        day: 'Tue',
        pending: 180,
        preparing: 99,
        completed: 187,
        cancelled: 2,
    },
    {
        date: '2026-02-04',
        day: 'Wed',
        pending: 55,
        preparing: 98,
        completed: 201,
        cancelled: 5,
    },
    {
        date: '2026-02-05',
        day: 'Thu',
        pending: 100,
        preparing: 180,
        completed: 230,
        cancelled: 2,
    },
    {
        date: '2026-02-06',
        day: 'Fri',
        pending: 137,
        preparing: 462,
        completed: 344,
        cancelled: 2,
    },
];

// Utility function to generate dynamic test data
export function generateMockOrderData(days: number = 7): OrderDayData[] {
    const data: OrderDayData[] = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        const dayIndex = date.getDay();
        const dayName = daysOfWeek[dayIndex];

        // Base values that vary by day of week
        const baseCompleted = dayIndex === 0 || dayIndex === 6 ? 70 : 40; // Higher on weekends
        const basePending = dayIndex === 0 || dayIndex === 6 ? 25 : 12;
        const basePreparing = dayIndex === 0 || dayIndex === 6 ? 20 : 10;
        const baseCancelled = Math.floor(Math.random() * 5); // 0-4

        // Add some randomness
        const pending = Math.max(
            0,
            basePending + Math.floor(Math.random() * 10) - 5,
        );
        const preparing = Math.max(
            0,
            basePreparing + Math.floor(Math.random() * 8) - 4,
        );
        const completed = Math.max(
            0,
            baseCompleted + Math.floor(Math.random() * 20) - 10,
        );
        const cancelled = Math.max(
            0,
            baseCancelled + Math.floor(Math.random() * 3) - 1,
        );

        data.push({
            date: date.toISOString().split('T')[0],
            day: dayName,
            pending,
            preparing,
            completed,
            cancelled,
        });
    }

    return data;
}
