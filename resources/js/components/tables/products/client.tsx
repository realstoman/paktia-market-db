import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
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
import { Product, ProductCategory, ProductSize } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { PackagePlus, Plus, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface ProductsClientProps {
    data: Product[];
    categories: ProductCategory[];
    sizes: ProductSize[];
    isLoading?: boolean;
}

export const ProductsClient: React.FC<ProductsClientProps> = ({
    data,
    categories,
    sizes,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [type, setType] = useState('food');
    const [basePrice, setBasePrice] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [sizePrices, setSizePrices] = useState<Record<number, string>>({});
    const [images, setImages] = useState<File[]>([]);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setName('');
        setCategoryId('');
        setType('food');
        setBasePrice('');
        setDescription('');
        setIsActive(true);
        setSizePrices({});
        setImages([]);
        setCreateErrors({});
    };

    const handleImageChange = (files: FileList | null) => {
        if (!files) {
            setImages([]);
            return;
        }

        setImages(Array.from(files).slice(0, 10));
    };

    const handleSizePriceChange = (sizeId: number, value: string) => {
        setSizePrices((prev) => ({
            ...prev,
            [sizeId]: value,
        }));
    };

    const handleCreateSubmit = () => {
        if (!name.trim() || !categoryId || !basePrice || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const sizePricePayload = Object.entries(sizePrices)
            .filter(([, price]) => price !== '' && !Number.isNaN(Number(price)))
            .map(([sizeId, price]) => ({
                product_size_id: Number(sizeId),
                price: Number(price),
            }));

        router.post(
            '/products',
            {
                name: name.trim(),
                product_category_id: Number(categoryId),
                type,
                base_price: Number(basePrice),
                description: description.trim() || null,
                is_active: isActive,
                size_prices: sizePricePayload,
                images,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Product created successfully.');
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
        () => buildColumns(categories),
        [categories],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Products: ${formatNumber(data.length)}`}
                    description="Manage menu items and pricing"
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'category.name', 'type']}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search products by name or category..."
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
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <PackagePlus className="mr-2 h-5 w-5" />
                            Create Product
                        </DialogTitle>
                        <DialogDescription>
                            Add a new product with sizes and images.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="product-name">Name</Label>
                            <Input
                                id="product-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={createErrors.name} />
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
                                message={createErrors.product_category_id}
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
                            <InputError message={createErrors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="product-base-price">
                                Base Price
                            </Label>
                            <Input
                                id="product-base-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={basePrice}
                                onChange={(event) =>
                                    setBasePrice(event.target.value)
                                }
                            />
                            <InputError message={createErrors.base_price} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="product-description">
                                Description
                            </Label>
                            <Textarea
                                id="product-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                            <InputError message={createErrors.description} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Size Pricing (Optional)</Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {sizes.map((size) => (
                                    <div
                                        key={size.id}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="w-28 text-sm text-muted-foreground">
                                            {size.name}
                                        </span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Use base price"
                                            value={sizePrices[size.id] ?? ''}
                                            onChange={(event) =>
                                                handleSizePriceChange(
                                                    size.id,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="product-images">
                                Product Images (up to 10)
                            </Label>
                            <Input
                                id="product-images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(event) =>
                                    handleImageChange(event.target.files)
                                }
                            />
                            <InputError message={createErrors.images} />
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
                                !categoryId ||
                                !basePrice ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Product
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
