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
import { Product, ProductCategory, ProductImage, ProductType } from '@/types';
import { router } from '@inertiajs/react';
import { Edit, ImagePlus, MoreHorizontal, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PendingImage {
    id: string;
    file: File;
    preview: string;
}

interface CellActionProps {
    data: Product;
    categories: ProductCategory[];
    types: ProductType[];
}

const MAX_IMAGES = 10;
const FALLBACK_TYPES = ['food', 'beverage', 'dessert', 'bundle'];
const resolveImageUrl = (image: ProductImage) => {
    const urlCandidate = image.url ?? image.path ?? '';
    if (!urlCandidate) return '';
    if (urlCandidate.startsWith('http://') || urlCandidate.startsWith('https://')) {
        return urlCandidate;
    }
    if (urlCandidate.startsWith('/storage/')) {
        return urlCandidate;
    }
    if (urlCandidate.startsWith('storage/')) {
        return `/${urlCandidate}`;
    }
    if (urlCandidate.startsWith('public/')) {
        return `/storage/${urlCandidate.replace(/^public\//, '')}`;
    }
    if (urlCandidate.startsWith('/')) {
        return urlCandidate;
    }
    return `/storage/${urlCandidate}`;
};

export const CellAction: React.FC<CellActionProps> = ({
    data,
    categories,
    types,
}) => {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [name, setName] = useState(data.name);
    const [categoryId, setCategoryId] = useState(
        data.product_category_id ? String(data.product_category_id) : '',
    );
    const [type, setType] = useState(data.type ?? types[0]?.name ?? 'food');
    const [basePrice, setBasePrice] = useState(
        data.base_price !== undefined && data.base_price !== null
            ? String(data.base_price)
            : '',
    );
    const [description, setDescription] = useState(data.description ?? '');
    const [isActive, setIsActive] = useState(!!data.is_active);
    const [existingImages, setExistingImages] = useState<ProductImage[]>(
        data.images ?? [],
    );
    const [removeImageIds, setRemoveImageIds] = useState<number[]>([]);
    const [newImages, setNewImages] = useState<PendingImage[]>([]);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const availableTypes = types.length > 0 ? types.map((item) => item.name) : FALLBACK_TYPES;

    useEffect(() => {
        return () => {
            newImages.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, [newImages]);

    const resetEdit = () => {
        setName(data.name);
        setCategoryId(
            data.product_category_id ? String(data.product_category_id) : '',
        );
        setType(data.type ?? types[0]?.name ?? 'food');
        setBasePrice(
            data.base_price !== undefined && data.base_price !== null
                ? String(data.base_price)
                : '',
        );
        setDescription(data.description ?? '');
        setIsActive(!!data.is_active);
        setExistingImages(data.images ?? []);
        setRemoveImageIds([]);
        newImages.forEach((image) => URL.revokeObjectURL(image.preview));
        setNewImages([]);
        setEditErrors({});
    };

    const handleRemoveExistingImage = (imageId: number) => {
        setRemoveImageIds((prev) =>
            prev.includes(imageId)
                ? prev.filter((id) => id !== imageId)
                : [...prev, imageId],
        );
    };

    const handleNewImageChange = (files: FileList | null) => {
        if (!files) {
            return;
        }

        const currentRemaining =
            existingImages.filter((image) => !removeImageIds.includes(image.id))
                .length + newImages.length;
        const availableSlots = MAX_IMAGES - currentRemaining;
        const nextFiles = Array.from(files).slice(0, availableSlots);

        setNewImages((prev) => [
            ...prev,
            ...nextFiles.map((file, index) => ({
                id: `${Date.now()}-${file.name}-${index}`,
                file,
                preview: URL.createObjectURL(file),
            })),
        ]);
    };

    const removeNewImage = (id: string) => {
        setNewImages((prev) => {
            const target = prev.find((image) => image.id === id);
            if (target) {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter((image) => image.id !== id);
        });
    };

    const handleEditSubmit = () => {
        if (!name.trim() || !categoryId || !type || !basePrice || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('_method', 'put');
        formData.append('name', name.trim());
        formData.append('product_category_id', String(Number(categoryId)));
        formData.append('type', type);
        formData.append('base_price', String(Number(basePrice)));
        formData.append('description', description.trim());
        formData.append('is_active', isActive ? '1' : '0');

        removeImageIds.forEach((id, index) => {
            formData.append(`remove_image_ids[${index}]`, String(id));
        });

        newImages.forEach((image, index) => {
            formData.append(`images[${index}]`, image.file);
        });

        router.post(`/products/${data.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product updated successfully.');
                setIsEditOpen(false);
            },
            onError: (errors) => {
                setEditErrors(errors);
                const firstError = Object.values(errors)[0];
                toast.error(firstError || 'Failed to update product.');
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
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Update product details, pricing, and images.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`product-name-${data.id}`}>Name</Label>
                            <Input
                                id={`product-name-${data.id}`}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
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
                            <InputError message={editErrors.product_category_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTypes.map((productType) => (
                                        <SelectItem
                                            key={productType}
                                            value={productType}
                                        >
                                            <span className="capitalize">
                                                {productType}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`product-price-${data.id}`}>
                                Base Price (AFN)
                            </Label>
                            <Input
                                id={`product-price-${data.id}`}
                                type="number"
                                min="0"
                                step="1"
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

                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Existing Images</Label>
                            <div className="flex flex-wrap gap-2 rounded-md border p-3">
                                {existingImages.length === 0 ? (
                                    <span className="text-sm text-muted-foreground">
                                        No images
                                    </span>
                                ) : (
                                    existingImages.map((image) => {
                                        const marked = removeImageIds.includes(
                                            image.id,
                                        );

                                        return (
                                            <div
                                                key={image.id}
                                                className="relative h-20 w-20 overflow-hidden rounded-md border"
                                            >
                                                <img
                                                    src={resolveImageUrl(image)}
                                                    alt="Product image"
                                                    className={`h-full w-full object-cover ${marked ? 'opacity-35' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveExistingImage(
                                                            image.id,
                                                        )
                                                    }
                                                    className="absolute right-1 top-1 rounded bg-black/65 p-1 text-white"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <InputError message={editErrors.remove_image_ids} />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`product-images-new-${data.id}`}>
                                Add New Images
                            </Label>
                            <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Max {MAX_IMAGES} total images. Recommended size: 400x400 or 400x480.
                                    </p>
                                    <Label
                                        htmlFor={`product-images-new-${data.id}`}
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                    >
                                        <ImagePlus className="h-4 w-4" />
                                        Select Images
                                    </Label>
                                </div>
                                <Input
                                    id={`product-images-new-${data.id}`}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(event) =>
                                        handleNewImageChange(event.target.files)
                                    }
                                    className="hidden"
                                />
                                {newImages.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {newImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className="relative h-20 w-20 overflow-hidden rounded-md border"
                                            >
                                                <img
                                                    src={image.preview}
                                                    alt={image.file.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-1 top-1 rounded bg-black/65 p-1 text-white"
                                                    onClick={() =>
                                                        removeNewImage(image.id)
                                                    }
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <InputError message={editErrors.images} />
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
                                !type ||
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
                        <AlertDialogTitle>Delete product</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the product and all its
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
