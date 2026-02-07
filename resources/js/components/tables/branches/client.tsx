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
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { Branch, Country, Province } from '@/types';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [countryId, setCountryId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setCountryId('');
        setProvinceId('');
        setAddress('');
        setDescription('');
        setCreateErrors({});
    };

    const handleCreateSubmit = () => {
        if (!name.trim() || !countryId || !provinceId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/branches',
            {
                name: name.trim(),
                country_id: Number(countryId),
                province_id: Number(provinceId),
                address: address.trim() || null,
                description: description.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Branch created successfully.');
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
                    onClick={() => setIsCreateOpen(true)}
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
                        <DialogTitle>Create Branch</DialogTitle>
                        <DialogDescription>
                            Add a new branch and assign its location.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="branch-name">Name</Label>
                            <Input
                                id="branch-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={createErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Country</Label>
                            <Select
                                value={countryId}
                                onValueChange={(value) => {
                                    setCountryId(value);
                                    if (value !== countryId) {
                                        setProvinceId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country.id}
                                            value={String(country.id)}
                                        >
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Province</Label>
                            <Select
                                value={provinceId}
                                onValueChange={setProvinceId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((province) => (
                                        <SelectItem
                                            key={province.id}
                                            value={String(province.id)}
                                        >
                                            {province.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createErrors.province_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="branch-address">Address</Label>
                            <Input
                                id="branch-address"
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />
                            <InputError message={createErrors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="branch-description">
                                Description
                            </Label>
                            <Textarea
                                id="branch-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                            <InputError message={createErrors.description} />
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
                                !name.trim() ||
                                !countryId ||
                                !provinceId ||
                                isSubmitting
                            }
                        >
                            Create Branch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
