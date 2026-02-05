import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Role } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { columns } from './columns';

interface RolesClientProps {
    data: Role[];
    isLoading?: boolean;
}

export const RolesClient: React.FC<RolesClientProps> = ({
    data,
    isLoading = false,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Roles: ${data.length}`}
                    description="Manage system roles"
                />
                <Button
                    onClick={() => router.visit('/roles/create')}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name']}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search roles by name..."
            />
        </div>
    );
};
