import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthorization } from '@/lib/permissions';
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
import { Branch, BranchTable, Country, Kitchen, Province } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Building2, Edit, Plus, Save, Table2, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface BranchesClientProps {
    data: Branch[];
    branchTables: BranchTable[];
    countries: Country[];
    provinces: Province[];
    kitchens: Kitchen[];
    isLoading?: boolean;
}

export const BranchesClient: React.FC<BranchesClientProps> = ({
    data,
    branchTables,
    countries,
    provinces,
    kitchens,
    isLoading = false,
}) => {
    const { can } = useAuthorization();
    const canCreateBranch = can('branch.create');
    const canUpdateBranch = can('branch.update');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCountryFilter, setSelectedCountryFilter] = useState('');
    const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('');
    const [name, setName] = useState('');
    const [countryId, setCountryId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isManageTablesOpen, setIsManageTablesOpen] = useState(false);
    const [manageBranchId, setManageBranchId] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [tableTitle, setTableTitle] = useState('');
    const [tableDescription, setTableDescription] = useState('');
    const [tableErrors, setTableErrors] = useState<Record<string, string>>({});
    const [editingTable, setEditingTable] = useState<BranchTable | null>(null);
    const [editTableNumber, setEditTableNumber] = useState('');
    const [editTableTitle, setEditTableTitle] = useState('');
    const [editTableDescription, setEditTableDescription] = useState('');
    const [editTableErrors, setEditTableErrors] = useState<
        Record<string, string>
    >({});
    const [deleteTableTarget, setDeleteTableTarget] =
        useState<BranchTable | null>(null);
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
        () => buildColumns(countries, provinces, kitchens),
        [countries, provinces, kitchens],
    );
    const countryFilterOptions = useMemo(
        () => [
            {
                value: '',
                label: 'All countries',
            },
            ...countries.map((country) => ({
                value: String(country.id),
                label: country.name,
            })),
        ],
        [countries],
    );
    const provinceFilterOptions = useMemo(
        () => [
            {
                value: '',
                label: 'All cities',
            },
            ...provinces
                .filter((province) => {
                    if (!selectedCountryFilter) {
                        return true;
                    }

                    return (
                        String(province.country_id ?? '') ===
                        selectedCountryFilter
                    );
                })
                .map((province) => ({
                    value: String(province.id),
                    label: province.name,
                })),
        ],
        [provinces, selectedCountryFilter],
    );
    const createProvinceOptions = useMemo(
        () =>
            provinces.filter((province) => {
                if (!countryId) {
                    return true;
                }

                return String(province.country_id ?? '') === countryId;
            }),
        [provinces, countryId],
    );
    const filteredBranches = useMemo(
        () =>
            data.filter((branch) => {
                const matchesCountry = selectedCountryFilter
                    ? String(branch.country_id ?? '') === selectedCountryFilter
                    : true;
                const matchesProvince = selectedProvinceFilter
                    ? String(branch.province_id ?? '') ===
                      selectedProvinceFilter
                    : true;

                return matchesCountry && matchesProvince;
            }),
        [data, selectedCountryFilter, selectedProvinceFilter],
    );
    const filteredBranchTables = useMemo(
        () =>
            branchTables.filter(
                (table) =>
                    !manageBranchId ||
                    String(table.branch_id) === String(manageBranchId),
            ),
        [branchTables, manageBranchId],
    );

    const handleCreateTable = () => {
        if (
            !manageBranchId ||
            !tableNumber.trim() ||
            !tableTitle.trim() ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/branch-tables',
            {
                branch_id: Number(manageBranchId),
                table_number: tableNumber.trim(),
                title: tableTitle.trim(),
                description: tableDescription.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Table number created successfully.');
                    setTableNumber('');
                    setTableTitle('');
                    setTableDescription('');
                    setTableErrors({});
                },
                onError: (errors) => {
                    setTableErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const openEditTable = (table: BranchTable) => {
        setManageBranchId(String(table.branch_id));
        setEditingTable(table);
        setEditTableNumber(table.table_number);
        setEditTableTitle(table.title);
        setEditTableDescription(table.description ?? '');
        setEditTableErrors({});
    };

    const handleUpdateTable = () => {
        if (!editingTable || !manageBranchId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.put(
            `/branch-tables/${editingTable.id}`,
            {
                branch_id: Number(manageBranchId),
                table_number: editTableNumber.trim(),
                title: editTableTitle.trim(),
                description: editTableDescription.trim() || null,
                is_active: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Table number updated successfully.');
                    setEditingTable(null);
                },
                onError: (errors) => {
                    setEditTableErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteTable = (branchTable: BranchTable) => {
        if (isSubmitting) {
            return;
        }

        setDeleteTableTarget(branchTable);
    };

    const confirmDeleteTable = () => {
        if (!deleteTableTarget || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        router.delete(`/branch-tables/${deleteTableTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Table number deleted successfully.');
                setDeleteTableTarget(null);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Restaurant Branches: ${formatNumber(data.length)}`}
                    description="Manage restaurant branches"
                />
                <div className="flex items-center gap-2">
                    {canUpdateBranch ? (
                        <Button
                            variant="outline"
                            onClick={() => setIsManageTablesOpen(true)}
                            className="gap-2"
                        >
                            <Table2 className="h-4 w-4" />
                            Manage Tables
                        </Button>
                    ) : null}
                    {canCreateBranch ? (
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add New
                        </Button>
                    ) : null}
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'country', 'province', 'address']}
                columns={tableColumns}
                data={filteredBranches}
                isLoading={isLoading}
                searchPlaceholder="Search branches by name, country or province..."
                toolbar={
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <SearchableDropdown
                            value={selectedCountryFilter}
                            options={countryFilterOptions}
                            onValueChange={(value) => {
                                setSelectedCountryFilter(value);
                                setSelectedProvinceFilter('');
                            }}
                            placeholder="All countries"
                            searchPlaceholder="Search countries..."
                            emptyText="No countries found."
                            className="sm:w-[220px]"
                        />
                        <SearchableDropdown
                            value={selectedProvinceFilter}
                            options={provinceFilterOptions}
                            onValueChange={setSelectedProvinceFilter}
                            placeholder="All cities"
                            searchPlaceholder="Search cities..."
                            emptyText="No cities found."
                            className="sm:w-[220px]"
                        />
                    </div>
                }
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
                            <Building2 className="mr-2 h-5 w-5" />
                            Create Branch
                        </DialogTitle>
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
                                disabled={
                                    !!countryId &&
                                    createProvinceOptions.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                    {createProvinceOptions.map((province) => (
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
                            <X className="mr-2 h-5 w-5" />
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
                            <Save className="mr-2 h-5 w-5" />
                            Create Branch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isManageTablesOpen}
                onOpenChange={setIsManageTablesOpen}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Table2 className="h-5 w-5" />
                            Manage Branch Tables
                        </DialogTitle>
                        <DialogDescription>
                            Create and manage table numbers by branch.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Branch</Label>
                                <Select
                                    value={manageBranchId}
                                    onValueChange={setManageBranchId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.map((branch) => (
                                            <SelectItem
                                                key={branch.id}
                                                value={String(branch.id)}
                                            >
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={tableErrors.branch_id} />
                            </div>
                        </div>

                        <div className="grid gap-4 rounded-md border border-neutral-200 p-4 sm:grid-cols-2 dark:border-neutral-800">
                            <div className="grid gap-2">
                                <Label>Table Number</Label>
                                <Input
                                    value={tableNumber}
                                    onChange={(event) =>
                                        setTableNumber(event.target.value)
                                    }
                                />
                                <InputError
                                    message={tableErrors.table_number}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input
                                    value={tableTitle}
                                    onChange={(event) =>
                                        setTableTitle(event.target.value)
                                    }
                                />
                                <InputError message={tableErrors.title} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={tableDescription}
                                    onChange={(event) =>
                                        setTableDescription(event.target.value)
                                    }
                                />
                                <InputError message={tableErrors.description} />
                            </div>
                            <div className="sm:col-span-2">
                                <Button
                                    onClick={handleCreateTable}
                                    disabled={
                                        !manageBranchId ||
                                        !tableNumber.trim() ||
                                        !tableTitle.trim() ||
                                        isSubmitting
                                    }
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Table Number
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">
                                Existing Table Numbers
                            </h3>
                            <ScrollArea className="h-[280px] rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
                                <div className="space-y-2">
                                    {filteredBranchTables.length === 0 ? (
                                        <p className="p-2 text-sm text-muted-foreground">
                                            No table numbers available.
                                        </p>
                                    ) : (
                                        filteredBranchTables.map((table) => (
                                            <div
                                                key={table.id}
                                                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {table.table_number} -{' '}
                                                        {table.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {table.description ??
                                                            'No description'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEditTable(table)
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600"
                                                        onClick={() =>
                                                            handleDeleteTable(
                                                                table,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Trash
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(editingTable)}
                onOpenChange={(open) => !open && setEditingTable(null)}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Table Number</DialogTitle>
                        <DialogDescription>
                            Update the selected table details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Table Number</Label>
                            <Input
                                value={editTableNumber}
                                onChange={(event) =>
                                    setEditTableNumber(event.target.value)
                                }
                            />
                            <InputError
                                message={editTableErrors.table_number}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={editTableTitle}
                                onChange={(event) =>
                                    setEditTableTitle(event.target.value)
                                }
                            />
                            <InputError message={editTableErrors.title} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={editTableDescription}
                                onChange={(event) =>
                                    setEditTableDescription(event.target.value)
                                }
                            />
                            <InputError message={editTableErrors.description} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingTable(null)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateTable}
                            disabled={
                                !editTableNumber.trim() ||
                                !editTableTitle.trim() ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={deleteTableTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTableTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete table</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTableTarget
                                ? `This will permanently delete table ${deleteTableTarget.table_number}${deleteTableTarget.title ? ` (${deleteTableTarget.title})` : ''}.`
                                : 'This will permanently delete the selected table.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeleteTable}
                            disabled={isSubmitting}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
