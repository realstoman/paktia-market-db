import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Country } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { columns } from './columns';

interface CountriesClientProps {
    data: Country[];
    isLoading?: boolean;
}

export const CountriesClient: React.FC<CountriesClientProps> = ({
    data,
    isLoading = false,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Countries: ${data.length}`}
                    description="Manage system countries"
                />
                <Button
                    onClick={() => router.visit('/countries/create')}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'country_code']}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search countries by name or country code..."
            />
        </div>
    );
};
