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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Kitchen, Product } from '@/types';
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
    data: Kitchen;
    kitchenTypes: { label: string; value: string }[];
    products: Product[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    kitchenTypes,
    products,
}) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isProductsOpen, setIsProductsOpen] = useState(false);
    const [name, setName] = useState(data.name ?? '');
    const [type, setType] = useState(data.type ?? '');
    const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(
        new Set((data.products ?? []).map((product) => product.id)),
    );
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sortedProducts = useMemo(
        () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
        [products],
    );

    const resetEdit = () => {
        setName(data.name ?? '');
        setType(data.type ?? '');
        setSelectedProductIds(
            new Set((data.products ?? []).map((product) => product.id)),
        );
        setEditErrors({});
    };

    const openProductAssign = () => {
        setSelectedProductIds(
            new Set((data.products ?? []).map((product) => product.id)),
        );
        setIsProductsOpen(true);
    };

    const toggleProduct = (productId: number) => {
        setSelectedProductIds((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    };

    const handleEditSubmit = () => {
        if (!name.trim() || !type || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/kitchens/${data.id}`,
            {
                name: name.trim(),
                type,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kitchen updated successfully.');
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

        router.post(`/kitchens/${data.id}/toggle`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? 'Kitchen deactivated successfully.'
                        : 'Kitchen activated successfully.',
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

        router.delete(`/kitchens/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kitchen deleted successfully.');
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleAssignProducts = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/kitchens/${data.id}/products`,
            {
                products: Array.from(selectedProductIds),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kitchen products updated successfully.');
                    setIsProductsOpen(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
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
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => router.visit(`/kitchens/${data.id}`)}
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
                    <DropdownMenuItem onClick={openProductAssign}>
                        <CookingPot className="mr-2 h-4 w-4" />
                        Assign Products
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
                        <DialogTitle>Edit Kitchen</DialogTitle>
                        <DialogDescription>
                            Update kitchen details and branch assignment.
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor={`kitchen-name-${data.id}`}>
                                    Name
                                </Label>
                                <Input
                                    id={`kitchen-name-${data.id}`}
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.name} />
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
                                <InputError message={editErrors.type} />
                            </div>
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
                            disabled={!name.trim() || !type || isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isProductsOpen} onOpenChange={setIsProductsOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Assign Products</DialogTitle>
                        <DialogDescription>
                            Select products that belong to {data.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Selected</span>
                            <span>
                                {selectedProductIds.size} of {products.length}
                            </span>
                        </div>
                        <div className="max-h-72 space-y-2 overflow-auto rounded-md border p-3">
                            {sortedProducts.map((product) => (
                                <label
                                    key={product.id}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={selectedProductIds.has(
                                            product.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleProduct(product.id)
                                        }
                                    />
                                    <span>{product.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsProductsOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignProducts}
                            disabled={isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Products
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? 'Deactivate kitchen'
                                : 'Activate kitchen'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? 'This will mark the kitchen as inactive.'
                                : 'This will mark the kitchen as active.'}
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
                        <AlertDialogTitle>Delete kitchen</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the kitchen.
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
