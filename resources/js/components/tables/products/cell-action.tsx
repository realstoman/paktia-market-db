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
import { Product, ProductCategory } from '@/types';
import { router } from '@inertiajs/react';
import { Edit, MoreHorizontal, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Product;
    categories: ProductCategory[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    categories,
}) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [name, setName] = useState(data.name);
    const [categoryId, setCategoryId] = useState(
        data.product_category_id ? String(data.product_category_id) : '',
    );
    const [type, setType] = useState(data.type ?? 'food');
    const [basePrice, setBasePrice] = useState(
        data.base_price !== undefined && data.base_price !== null
            ? String(data.base_price)
            : '',
    );
    const [description, setDescription] = useState(data.description ?? '');
    const [isActive, setIsActive] = useState(!!data.is_active);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetEdit = () => {
        setName(data.name);
        setCategoryId(
            data.product_category_id ? String(data.product_category_id) : '',
        );
        setType(data.type ?? 'food');
        setBasePrice(
            data.base_price !== undefined && data.base_price !== null
                ? String(data.base_price)
                : '',
        );
        setDescription(data.description ?? '');
        setIsActive(!!data.is_active);
        setEditErrors({});
    };

    const handleEditSubmit = () => {
        if (!name.trim() || !categoryId || !basePrice || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/products/${data.id}`,
            {
                name: name.trim(),
                product_category_id: Number(categoryId),
                type,
                base_price: Number(basePrice),
                description: description.trim() || null,
                is_active: isActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Product updated successfully.');
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

    const handleDelete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/products/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product deleted successfully.');
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
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => {
                            resetEdit();
                            setIsEditOpen(true);
                        }}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Update product details and pricing.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`product-name-${data.id}`}>
                                Name
                            </Label>
                            <Input
                                id={`product-name-${data.id}`}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select
                                value={categoryId}
                                onValueChange={setCategoryId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={editErrors.product_category_id}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="beverage">
                                        Beverage
                                    </SelectItem>
                                    <SelectItem value="dessert">
                                        Dessert
                                    </SelectItem>
                                    <SelectItem value="bundle">
                                        Bundle
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`product-price-${data.id}`}>
                                Base Price
                            </Label>
                            <Input
                                id={`product-price-${data.id}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={basePrice}
                                onChange={(event) =>
                                    setBasePrice(event.target.value)
                                }
                            />
                            <InputError message={editErrors.base_price} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`product-description-${data.id}`}>
                                Description
                            </Label>
                            <Textarea
                                id={`product-description-${data.id}`}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                            <InputError message={editErrors.description} />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                            <Checkbox
                                checked={isActive}
                                onCheckedChange={(checked) =>
                                    setIsActive(!!checked)
                                }
                            />
                            <span className="text-sm text-muted-foreground">
                                Active product
                            </span>
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
                                !categoryId ||
                                !basePrice ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete product
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the product and its
                            images.
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
