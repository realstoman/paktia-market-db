import InputError from '@/components/input-error';
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
import { Kitchen } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { ChefHat, Plus, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface KitchensClientProps {
    data: Kitchen[];
    kitchenTypes: { label: string; value: string }[];
    isLoading?: boolean;
}

export const KitchensClient: React.FC<KitchensClientProps> = ({
    data,
    kitchenTypes,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setType('');
        setCreateErrors({});
    };

    const handleCreateSubmit = () => {
        if (!name.trim() || !type || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/kitchens',
            {
                name: name.trim(),
                type,
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
        () => buildColumns(kitchenTypes),
        [kitchenTypes],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Kitchens: ${formatNumber(data.length)}`}
                    description="Manage kitchens"
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'type', 'branches']}
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
                        <DialogTitle className="flex items-center gap-1">
                            <ChefHat className="mr-2 h-5 w-5" />
                            Create Kitchen
                        </DialogTitle>
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
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kitchenTypes.map((kitchenType) => (
                                        <SelectItem
                                            key={kitchenType.value}
                                            value={kitchenType.value}
                                        >
                                            {kitchenType.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.type} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={!name.trim() || !type || isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Kitchen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
