'use client';

import { Button } from '@/components/ui/button';

export function DebugDataTable({ table }: { table: any }) {
    return (
        <div className="mb-4 space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Debug Info</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="mb-2 text-sm font-medium">
                        Column Filters:
                    </h4>
                    <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                        {JSON.stringify(
                            table.getState().columnFilters,
                            null,
                            2,
                        )}
                    </pre>
                </div>

                <div>
                    <h4 className="mb-2 text-sm font-medium">Table Info:</h4>
                    <div className="space-y-1 text-sm">
                        <div>Total rows: {table.getRowModel().rows.length}</div>
                        <div>
                            Filtered rows:{' '}
                            {table.getFilteredRowModel().rows.length}
                        </div>
                        <div>
                            Page: {table.getState().pagination.pageIndex + 1}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={() => {
                        const nameCol = table.getColumn('name');
                        if (nameCol) {
                            nameCol.setFilterValue('Test');
                        }
                    }}
                    size="sm"
                    variant="outline"
                >
                    Set Name Filter
                </Button>

                <Button
                    onClick={() => table.resetColumnFilters()}
                    size="sm"
                    variant="outline"
                >
                    Reset All Filters
                </Button>
            </div>
        </div>
    );
}
