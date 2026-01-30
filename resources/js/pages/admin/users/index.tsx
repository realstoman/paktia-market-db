import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { router } from '@inertiajs/react';
import { columns } from './columns';

interface Role {
    name: string;
}

interface User {
    name: string;
    email: string;
    roles: Role[];
}

type UsersIndexProps = {
    users: User[];
    canCreate: boolean;
};

export default function UsersIndex({ users, canCreate }: UsersIndexProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <h1 className="text-xl font-semibold">Users</h1>

                {canCreate && (
                    <Button onClick={() => router.visit('/users/create')}>
                        Create User
                    </Button>
                )}
            </div>

            <DataTable columns={columns} data={users} />
        </div>
    );
}
