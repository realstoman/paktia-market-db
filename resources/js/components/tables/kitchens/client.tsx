import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import InputError from '@/components/input-error';
import { Branch, Kitchen } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface KitchensClientProps {
    data: Kitchen[];
    branches: Branch[];
    isLoading?: boolean;
}

export const KitchensClient: React.FC<KitchensClientProps> = ({
    data,
    branches,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [branchId, setBranchId] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setType('');
        setBranchId('');
        setCreateErrors({});
    };

    const handleCreateSubmit = () => {
        if (!name.trim() || !branchId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/kitchens',
            {
                name: name.trim(),
                branch_id: Number(branchId),
                type: type.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kitchen created successfully.');
                    setIsCreateOpen(false);
                    resetForm();
                },
                onError: (errors) => {
                    setCreateErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const tableColumns = useMemo(
        () => buildColumns(branches),
        [branches],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Kitchens: ${data.length}`}
                    description="Manage kitchens"
                />
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'branch', 'country', 'province']}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search kitchens by name or location..."
            />

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create Kitchen</DialogTitle>
                        <DialogDescription>
                            Add a new kitchen and assign it to a branch.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="kitchen-name">Name</Label>
                            <Input
                                id="kitchen-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={createErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.branch_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="kitchen-type">Type</Label>
                            <Input
                                id="kitchen-type"
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                            />
                            <InputError message={createErrors.type} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={
                                !name.trim() || !branchId || isSubmitting
                            }
                        >
                            Create Kitchen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
