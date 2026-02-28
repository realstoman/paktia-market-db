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
import { Badge } from '@/components/ui/badge';
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
import {
    Kitchen,
    Product,
    ProductCategory,
    ProductImage,
    ProductType,
} from '@/types';
import { router } from '@inertiajs/react';
import { formatAfn } from '@/utils/format';
import {
    Edit,
    Eye,
    ImagePlus,
    MoreHorizontal,
    Save,
    Trash2,
    X,
} from 'lucide-react';
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
    kitchens: Kitchen[];
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
    kitchens,
}) => {
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [name, setName] = useState(data.name);
    const [pashtoName, setPashtoName] = useState(data.pashto_name ?? '');
    const [dariName, setDariName] = useState(data.dari_name ?? '');
    const [categoryId, setCategoryId] = useState(
        data.product_category_id ? String(data.product_category_id) : '',
    );
    const [kitchenId, setKitchenId] = useState(
        data.kitchen_id ? String(data.kitchen_id) : '',
    );
    const [type, setType] = useState(data.type ?? types[0]?.name ?? 'food');
    const [basePrice, setBasePrice] = useState(
        data.base_price !== undefined && data.base_price !== null
            ? String(data.base_price)
            : '',
    );
    const [description, setDescription] = useState(data.description ?? '');
    const [pashtoDescription, setPashtoDescription] = useState(
        data.pashto_description ?? '',
    );
    const [dariDescription, setDariDescription] = useState(
        data.dari_description ?? '',
    );
    const [isActive, setIsActive] = useState(!!data.is_active);
    const [existingImages, setExistingImages] = useState<ProductImage[]>(
        data.images ?? [],
    );
    const [removeImageIds, setRemoveImageIds] = useState<number[]>([]);
    const [newImages, setNewImages] = useState<PendingImage[]>([]);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const availableTypes = types.length > 0 ? types.map((item) => item.name) : FALLBACK_TYPES;
    const activeImages = data.images ?? [];
    const resolvedCategory =
        data.category?.name ??
        categories.find((category) => category.id === data.product_category_id)
            ?.name ??
        'Uncategorized';
    const resolvedKitchen =
        data.kitchen?.name ??
        kitchens.find((kitchen) => kitchen.id === data.kitchen_id)?.name ??
        'Unassigned';

    useEffect(() => {
        return () => {
            newImages.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, [newImages]);

    const resetEdit = () => {
        setName(data.name);
        setPashtoName(data.pashto_name ?? '');
        setDariName(data.dari_name ?? '');
        setCategoryId(
            data.product_category_id ? String(data.product_category_id) : '',
        );
        setKitchenId(data.kitchen_id ? String(data.kitchen_id) : '');
        setType(data.type ?? types[0]?.name ?? 'food');
        setBasePrice(
            data.base_price !== undefined && data.base_price !== null
                ? String(data.base_price)
                : '',
        );
        setDescription(data.description ?? '');
        setPashtoDescription(data.pashto_description ?? '');
        setDariDescription(data.dari_description ?? '');
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
        if (
            !name.trim() ||
            !categoryId ||
            !kitchenId ||
            !type ||
            !basePrice ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('_method', 'put');
        formData.append('name', name.trim());
        formData.append('pashto_name', pashtoName.trim());
        formData.append('dari_name', dariName.trim());
        formData.append('product_category_id', String(Number(categoryId)));
        formData.append('kitchen_id', String(Number(kitchenId)));
        formData.append('type', type);
        formData.append('base_price', String(Number(basePrice)));
        formData.append('description', description.trim());
        formData.append('pashto_description', pashtoDescription.trim());
        formData.append('dari_description', dariDescription.trim());
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
                    <DropdownMenuItem onClick={() => setIsViewOpen(true)}>
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
                    <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Product Details</DialogTitle>
                        <DialogDescription>
                            View complete details for this product.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Name
                                </p>
                                <p className="font-medium">{data.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Pashto Name
                                </p>
                                <p className="font-medium">
                                    {data.pashto_name || '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Dari Name
                                </p>
                                <p className="font-medium">
                                    {data.dari_name || '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Category
                                </p>
                                <p className="font-medium">{resolvedCategory}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Kitchen
                                </p>
                                <p className="font-medium">{resolvedKitchen}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Type
                                </p>
                                <Badge variant="secondary" className="capitalize">
                                    {data.type ?? '-'}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Base Price
                                </p>
                                <p className="font-medium">
                                    {formatAfn(data.base_price ?? 0)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Status
                                </p>
                                <Badge variant={data.is_active ? 'default' : 'destructive'}>
                                    {data.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">
                                    Description
                                </p>
                                <p className="rounded-md border p-3 text-sm">
                                    {data.description || '-'}
                                </p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">
                                    Pashto Description
                                </p>
                                <p className="rounded-md border p-3 text-sm">
                                    {data.pashto_description || '-'}
                                </p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">
                                    Dari Description
                                </p>
                                <p className="rounded-md border p-3 text-sm">
                                    {data.dari_description || '-'}
                                </p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">
                                    Sizes
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {(data.sizes ?? []).length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            No size pricing set
                                        </span>
                                    ) : (
                                        data.sizes?.map((size) => (
                                            <Badge key={size.id} variant="outline">
                                                {size.name}:{' '}
                                                {formatAfn(size.pivot?.price ?? data.base_price ?? 0)}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <p className="text-xs text-muted-foreground">
                                    Images ({activeImages.length})
                                </p>
                                {activeImages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No images
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {activeImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className="h-24 overflow-hidden rounded-md border"
                                            >
                                                <img
                                                    src={resolveImageUrl(image)}
                                                    alt={data.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsViewOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Update product details, pricing, and images.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
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
                            <Label htmlFor={`product-pashto-name-${data.id}`}>
                                Pashto Name
                            </Label>
                            <Input
                                id={`product-pashto-name-${data.id}`}
                                value={pashtoName}
                                onChange={(event) =>
                                    setPashtoName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.pashto_name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`product-dari-name-${data.id}`}>
                                Dari Name
                            </Label>
                            <Input
                                id={`product-dari-name-${data.id}`}
                                value={dariName}
                                onChange={(event) =>
                                    setDariName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.dari_name} />
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
                            <Label>Kitchen</Label>
                            <Select value={kitchenId} onValueChange={setKitchenId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select kitchen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kitchens.map((kitchen) => (
                                        <SelectItem
                                            key={kitchen.id}
                                            value={String(kitchen.id)}
                                        >
                                            {kitchen.name ?? `Kitchen #${kitchen.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.kitchen_id} />
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
                            <Label
                                htmlFor={`product-pashto-description-${data.id}`}
                            >
                                Pashto Description
                            </Label>
                            <Textarea
                                id={`product-pashto-description-${data.id}`}
                                value={pashtoDescription}
                                onChange={(event) =>
                                    setPashtoDescription(event.target.value)
                                }
                            />
                            <InputError
                                message={editErrors.pashto_description}
                            />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`product-dari-description-${data.id}`}>
                                Dari Description
                            </Label>
                            <Textarea
                                id={`product-dari-description-${data.id}`}
                                value={dariDescription}
                                onChange={(event) =>
                                    setDariDescription(event.target.value)
                                }
                            />
                            <InputError message={editErrors.dari_description} />
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
                                !kitchenId ||
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
