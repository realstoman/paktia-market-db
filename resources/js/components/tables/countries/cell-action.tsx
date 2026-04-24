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
import { Country } from '@/types';
import { router } from '@inertiajs/react';
import {
    Edit,
    Eye,
    MapPin,
    MapPinned,
    MapPinOff,
    MoreHorizontal,
    Save,
    Trash,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Country;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isProvinceOpen, setIsProvinceOpen] = useState(false);
    const [isEditProvinceOpen, setIsEditProvinceOpen] = useState(false);
    const [editName, setEditName] = useState(data.name);
    const [editCode, setEditCode] = useState(data.code);
    const [editCurrencyCode, setEditCurrencyCode] = useState(
        data.currency_code,
    );
    const [editCurrencySymbol, setEditCurrencySymbol] = useState(
        data.currency_symbol ?? '',
    );
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [provinceName, setProvinceName] = useState('');
    const [provinceErrors, setProvinceErrors] = useState<
        Record<string, string>
    >({});
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
        null,
    );
    const [deleteProvinceTarget, setDeleteProvinceTarget] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onView = () => {
        router.visit(`/countries/${data.id}`);
    };

    const resetEdit = () => {
        setEditName(data.name);
        setEditCode(data.code);
        setEditCurrencyCode(data.currency_code);
        setEditCurrencySymbol(data.currency_symbol ?? '');
        setEditErrors({});
    };

    const openEditProvince = (provinceId: number, name: string) => {
        setSelectedProvinceId(provinceId);
        setProvinceName(name);
        setProvinceErrors({});
        setIsEditProvinceOpen(true);
    };

    const handleEditCountry = () => {
        if (!editName.trim() || !editCode.trim() || !editCurrencyCode.trim()) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/countries/${data.id}`,
            {
                name: editName.trim(),
                code: editCode.trim().toUpperCase(),
                currency_code: editCurrencyCode.trim().toUpperCase(),
                currency_symbol: editCurrencySymbol.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Country updated successfully.');
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

    const handleToggle = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/countries/${data.id}/disable`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? 'Country deactivated successfully.'
                        : 'Country activated successfully.',
                );
                setIsToggleOpen(false);
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

        router.delete(`/countries/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Country deleted successfully.');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEditProvince = () => {
        if (!selectedProvinceId || !provinceName.trim()) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/provinces/${selectedProvinceId}`,
            {
                name: provinceName.trim(),
                country_id: data.id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Province updated successfully.');
                    setIsEditProvinceOpen(false);
                },
                onError: (errors) => {
                    setProvinceErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteProvince = (provinceId: number, provinceName: string) => {
        if (isSubmitting) {
            return;
        }

        setDeleteProvinceTarget({ id: provinceId, name: provinceName });
    };

    const confirmDeleteProvince = () => {
        if (!deleteProvinceTarget || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/provinces/${deleteProvinceTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Province deleted successfully.');
                setDeleteProvinceTarget(null);
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
                    <DropdownMenuItem onClick={onView}>
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
                    <DropdownMenuItem onClick={() => setIsProvinceOpen(true)}>
                        <MapPinned className="mr-2 h-4 w-4" />
                        Manage Provinces
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsToggleOpen(true)}>
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
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Country</DialogTitle>
                        <DialogDescription>
                            Update the country information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`country-name-${data.id}`}>
                                Name
                            </Label>
                            <Input
                                id={`country-name-${data.id}`}
                                value={editName}
                                onChange={(event) =>
                                    setEditName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`country-code-${data.id}`}>
                                Code
                            </Label>
                            <Input
                                id={`country-code-${data.id}`}
                                value={editCode}
                                onChange={(event) =>
                                    setEditCode(event.target.value)
                                }
                                maxLength={2}
                            />
                            <InputError message={editErrors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`currency-code-${data.id}`}>
                                Currency code
                            </Label>
                            <Input
                                id={`currency-code-${data.id}`}
                                value={editCurrencyCode}
                                onChange={(event) =>
                                    setEditCurrencyCode(event.target.value)
                                }
                                maxLength={3}
                            />
                            <InputError message={editErrors.currency_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`currency-symbol-${data.id}`}>
                                Currency symbol
                            </Label>
                            <Input
                                id={`currency-symbol-${data.id}`}
                                value={editCurrencySymbol}
                                onChange={(event) =>
                                    setEditCurrencySymbol(event.target.value)
                                }
                            />
                            <InputError message={editErrors.currency_symbol} />
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
                            onClick={handleEditCountry}
                            disabled={
                                !editName.trim() ||
                                !editCode.trim() ||
                                !editCurrencyCode.trim() ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isProvinceOpen} onOpenChange={setIsProvinceOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Manage Provinces</DialogTitle>
                        <DialogDescription>
                            Edit or remove provinces for {data.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        {(data.provinces ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No provinces available.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {(data.provinces ?? []).map((province) => (
                                    <div
                                        key={province.id}
                                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                    >
                                        <span>{province.name}</span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openEditProvince(
                                                        province.id,
                                                        province.name,
                                                    )
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    handleDeleteProvince(
                                                        province.id,
                                                        province.name,
                                                    )
                                                }
                                                disabled={isSubmitting}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isEditProvinceOpen}
                onOpenChange={setIsEditProvinceOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Province</DialogTitle>
                        <DialogDescription>
                            Update the province name.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor={`province-name-${data.id}`}>
                            Province name
                        </Label>
                        <Input
                            id={`province-name-${data.id}`}
                            value={provinceName}
                            onChange={(event) =>
                                setProvinceName(event.target.value)
                            }
                        />
                        <InputError message={provinceErrors.name} />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditProvinceOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditProvince}
                            disabled={!provinceName.trim() || isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Province
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? 'Deactivate country'
                                : 'Activate country'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? 'This will mark the country as inactive.'
                                : 'This will mark the country as active.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleToggle}
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
                        <AlertDialogTitle>Delete country</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the country and its
                            related data.
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
            <AlertDialog
                open={deleteProvinceTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteProvinceTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete province</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteProvinceTarget
                                ? `This will permanently delete ${deleteProvinceTarget.name}.`
                                : 'This will permanently delete the selected province.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeleteProvince}
                            disabled={isSubmitting}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
