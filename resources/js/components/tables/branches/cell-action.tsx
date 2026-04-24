import InputError from '@/components/input-error';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Branch, Country, Kitchen, Province } from '@/types';
import { router } from '@inertiajs/react';
import {
    CookingPot,
    Edit,
    Eye,
    MapPin,
    MapPinOff,
    MoreHorizontal,
    Save,
    Trash,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Branch;
    countries: Country[];
    provinces: Province[];
    kitchens: Kitchen[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    countries,
    provinces,
    kitchens,
}) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDisableOpen, setIsDisableOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isKitchenOpen, setIsKitchenOpen] = useState(false);
    const [name, setName] = useState(data.name);
    const [countryId, setCountryId] = useState(
        data.country_id ? String(data.country_id) : '',
    );
    const [provinceId, setProvinceId] = useState(
        data.province_id ? String(data.province_id) : '',
    );
    const [address, setAddress] = useState(data.address ?? '');
    const [description, setDescription] = useState(data.description ?? '');
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedKitchenIds, setSelectedKitchenIds] = useState<Set<number>>(
        new Set(data.kitchens?.map((kitchen) => kitchen.id)),
    );

    const sortedKitchens = useMemo(
        () =>
            [...kitchens].sort((a, b) =>
                (a.name ?? '').localeCompare(b.name ?? ''),
            ),
        [kitchens],
    );
    const editProvinceOptions = useMemo(
        () =>
            provinces.filter((province) => {
                if (!countryId) {
                    return true;
                }

                return String(province.country_id ?? '') === countryId;
            }),
        [provinces, countryId],
    );

    const resetEdit = () => {
        setName(data.name);
        setCountryId(data.country_id ? String(data.country_id) : '');
        setProvinceId(data.province_id ? String(data.province_id) : '');
        setAddress(data.address ?? '');
        setDescription(data.description ?? '');
        setEditErrors({});
    };

    const openKitchenAssign = () => {
        setSelectedKitchenIds(
            new Set(data.kitchens?.map((kitchen) => kitchen.id)),
        );
        setIsKitchenOpen(true);
    };

    const toggleKitchen = (kitchenId: number) => {
        setSelectedKitchenIds((prev) => {
            const next = new Set(prev);
            if (next.has(kitchenId)) {
                next.delete(kitchenId);
            } else {
                next.add(kitchenId);
            }
            return next;
        });
    };

    const handleAssignKitchens = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/branches/${data.id}/kitchens`,
            {
                kitchens: Array.from(selectedKitchenIds),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Branch kitchens updated successfully.');
                    setIsKitchenOpen(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleEditSubmit = () => {
        if (!name.trim() || !countryId || !provinceId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/branches/${data.id}`,
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
                    toast.success('Branch updated successfully.');
                    setIsEditOpen(false);
                },
                onError: (errors) => {
                    setEditErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDisable = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/branches/${data.id}/disable`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? 'Branch disabled successfully.'
                        : 'Branch activated successfully.',
                );
                setIsDisableOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/branches/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Branch deleted successfully.');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" preserveRtlAlign>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => router.visit(`/branches/${data.id}`)}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            resetEdit();
                            setIsEditOpen(true);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openKitchenAssign}>
                        <CookingPot className="mr-2 h-4 w-4" />
                        Assign Kitchens
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDisableOpen(true)}>
                        {data.is_active ? (
                            <MapPinOff className="mr-2 h-4 w-4" />
                        ) : (
                            <MapPin className="mr-2 h-4 w-4" />
                        )}
                        {data.is_active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>
                        <DialogDescription>
                            Update the branch information and location.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`branch-name-${data.id}`}>
                                Name
                            </Label>
                            <Input
                                id={`branch-name-${data.id}`}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
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
                            <InputError message={editErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Province</Label>
                            <Select
                                value={provinceId}
                                onValueChange={setProvinceId}
                                disabled={
                                    !!countryId &&
                                    editProvinceOptions.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                                <SelectContent>
                                    {editProvinceOptions.map((province) => (
                                        <SelectItem
                                            key={province.id}
                                            value={String(province.id)}
                                        >
                                            {province.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.province_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`branch-address-${data.id}`}>
                                Address
                            </Label>
                            <Input
                                id={`branch-address-${data.id}`}
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />
                            <InputError message={editErrors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`branch-description-${data.id}`}>
                                Description
                            </Label>
                            <Textarea
                                id={`branch-description-${data.id}`}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                            <InputError message={editErrors.description} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={
                                !name.trim() ||
                                !countryId ||
                                !provinceId ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isKitchenOpen} onOpenChange={setIsKitchenOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Kitchens</DialogTitle>
                        <DialogDescription>
                            Select kitchens available for {data.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Selected</span>
                            <span>
                                {selectedKitchenIds.size} of {kitchens.length}
                            </span>
                        </div>
                        <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-3">
                            {sortedKitchens.map((kitchen) => (
                                <label
                                    key={kitchen.id}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={selectedKitchenIds.has(
                                            kitchen.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleKitchen(kitchen.id)
                                        }
                                    />
                                    <span>
                                        {kitchen.name ??
                                            `Kitchen #${kitchen.id}`}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsKitchenOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignKitchens}
                            disabled={isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Kitchens
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? 'Deactivate branch'
                                : 'Activate branch'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? 'This will mark the branch as inactive.'
                                : 'This will mark the branch as active.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleDisable}
                            disabled={isSubmitting}
                        >
                            <MapPinOff className="mr-2 h-5 w-5" />
                            {data.is_active ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete branch</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the branch and related
                            data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            <Trash2 className="mr-2 h-5 w-5" />
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
