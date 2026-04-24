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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Cuisine,
    Kitchen,
    KitchenCategory,
    KitchenType,
    Product,
} from '@/types';
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
    kitchenTypes: KitchenType[];
    cuisines: Cuisine[];
    kitchenCategories: KitchenCategory[];
    products: Product[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    kitchenTypes,
    cuisines,
    kitchenCategories,
    products,
}) => {
    const NO_KITCHEN_TYPE = '__none__';
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isProductsOpen, setIsProductsOpen] = useState(false);
    const [name, setName] = useState(data.name ?? '');
    const [kitchenTypeId, setKitchenTypeId] = useState(
        data.kitchen_type_id ? String(data.kitchen_type_id) : NO_KITCHEN_TYPE,
    );
    const [selectedCuisineIds, setSelectedCuisineIds] = useState<number[]>(
        (data.cuisines ?? []).map((cuisine) => cuisine.id),
    );
    const [selectedKitchenCategoryIds, setSelectedKitchenCategoryIds] =
        useState<number[]>(
            (data.kitchen_categories ?? []).map((category) => category.id),
        );
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
        setKitchenTypeId(
            data.kitchen_type_id
                ? String(data.kitchen_type_id)
                : NO_KITCHEN_TYPE,
        );
        setSelectedCuisineIds(
            (data.cuisines ?? []).map((cuisine) => cuisine.id),
        );
        setSelectedKitchenCategoryIds(
            (data.kitchen_categories ?? []).map((category) => category.id),
        );
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

    const toggleCuisine = (cuisineId: number) => {
        setSelectedCuisineIds((current) =>
            current.includes(cuisineId)
                ? current.filter((id) => id !== cuisineId)
                : [...current, cuisineId],
        );
    };

    const toggleKitchenCategory = (kitchenCategoryId: number) => {
        setSelectedKitchenCategoryIds((current) =>
            current.includes(kitchenCategoryId)
                ? current.filter((id) => id !== kitchenCategoryId)
                : [...current, kitchenCategoryId],
        );
    };

    const handleEditSubmit = () => {
        if (!name.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/kitchens/${data.id}`,
            {
                name: name.trim(),
                kitchen_type_id:
                    kitchenTypeId !== NO_KITCHEN_TYPE
                        ? Number(kitchenTypeId)
                        : null,
                cuisines: selectedCuisineIds,
                kitchen_categories: selectedKitchenCategoryIds,
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
                                <Label>Kitchen Type</Label>
                                <Select
                                    value={kitchenTypeId}
                                    onValueChange={setKitchenTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select kitchen type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_KITCHEN_TYPE}>
                                            No Kitchen Type
                                        </SelectItem>
                                        {kitchenTypes.map((kitchenType) => (
                                            <SelectItem
                                                key={kitchenType.id}
                                                value={String(kitchenType.id)}
                                            >
                                                {kitchenType.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editErrors.kitchen_type_id}
                                />
                            </div>
                        </div>
                        <div className="mt-4 grid gap-2">
                            <Label>Cuisines</Label>
                            <ScrollArea className="h-44 rounded-md border p-3">
                                <div className="space-y-2">
                                    {cuisines.map((cuisine) => (
                                        <label
                                            key={cuisine.id}
                                            className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedCuisineIds.includes(
                                                    cuisine.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleCuisine(cuisine.id)
                                                }
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {cuisine.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {cuisine.description || '—'}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </ScrollArea>
                            <InputError message={editErrors.cuisines} />
                        </div>
                        <div className="mt-4 grid gap-2">
                            <Label>Kitchen Categories</Label>
                            <ScrollArea className="h-44 rounded-md border p-3">
                                <div className="space-y-2">
                                    {kitchenCategories.map((category) => (
                                        <label
                                            key={category.id}
                                            className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedKitchenCategoryIds.includes(
                                                    category.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleKitchenCategory(
                                                        category.id,
                                                    )
                                                }
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {category.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {category.description ||
                                                        '—'}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </ScrollArea>
                            <InputError
                                message={editErrors.kitchen_categories}
                            />
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
                            disabled={!name.trim() || isSubmitting}
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
