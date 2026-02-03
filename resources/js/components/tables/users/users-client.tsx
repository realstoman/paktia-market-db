import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { User } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { columns } from './columns';

interface UsersClientProps {
    data: User[];
    isLoading?: boolean;
}

export const UsersClient: React.FC<UsersClientProps> = ({
    data,
    isLoading = false,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Users: ${data.length}`}
                    description="Manage system users"
                />
                <Button
                    onClick={() => router.visit('/users/create')}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'name',
                    'email',
                    'branch',
                    'province',
                    'country',
                    'is_active',
                ]}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search users by name or email..."
            />
        </div>
    );
};
