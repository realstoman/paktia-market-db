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
                    title={`Users (${data.length})`}
                    description="Manage your users"
                />
                <Button
                    onClick={() => router.visit('/users/create')}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator />
            <DataTable
                searchKey={['name', 'email']}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search users by name or email..."
            />
        </div>
    );
};
