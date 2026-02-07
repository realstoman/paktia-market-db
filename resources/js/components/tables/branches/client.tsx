import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Branch, Country, Province } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { buildColumns } from './columns';

interface BranchesClientProps {
    data: Branch[];
    countries: Country[];
    provinces: Province[];
    isLoading?: boolean;
}

export const BranchesClient: React.FC<BranchesClientProps> = ({
    data,
    countries,
    provinces,
    isLoading = false,
}) => {
    const tableColumns = useMemo(
        () => buildColumns(countries, provinces),
        [countries, provinces],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Restaurant Branches: ${data.length}`}
                    description="Manage restaurant branches"
                />
                <Button
                    onClick={() => router.visit('/branches/create')}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'country', 'province', 'address']}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search branches by name, country or province..."
            />
        </div>
    );
};
