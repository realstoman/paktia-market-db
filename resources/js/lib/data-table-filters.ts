import { FilterFn } from '@tanstack/react-table';

/** Text search (case-insensitive) */
export const textFilter: FilterFn<any> = (row, columnId, value) => {
    if (!value) return true;
    const rowValue = row.getValue<string>(columnId);
    return rowValue?.toLowerCase().includes(String(value).toLowerCase());
};

/** Exact match or multi-select */
export const selectFilter: FilterFn<any> = (row, columnId, values) => {
    if (!values || values.length === 0) return true;
    return values.includes(row.getValue(columnId));
};

/** Number range */
export const rangeFilter: FilterFn<any> = (row, columnId, range) => {
    if (!range || range.length !== 2) return true;
    const value = row.getValue<number>(columnId);
    return value >= range[0] && value <= range[1];
};

/** Date or date range (timestamps) */
export const dateFilter: FilterFn<any> = (row, columnId, filterValue) => {
    const value = row.getValue<number>(columnId);
    if (!value) return false;

    // Single date
    if (typeof filterValue === 'number') {
        return value === filterValue;
    }

    // Date range
    if (Array.isArray(filterValue)) {
        const [from, to] = filterValue;
        if (from && value < from) return false;
        if (to && value > to) return false;
        return true;
    }

    return true;
};
