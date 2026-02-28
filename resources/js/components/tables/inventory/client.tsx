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
import { Branch, InventoryItem } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { router } from '@inertiajs/react';
import { ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface SelectedImage {
    id: string;
    file: File;
    preview: string;
}

interface InventoryClientProps {
    data: InventoryItem[];
    branches: Branch[];
    isLoading?: boolean;
}

const MAX_IMAGES = 10;

export const InventoryClient: React.FC<InventoryClientProps> = ({
    data,
    branches,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [branchId, setBranchId] = useState('');
    const [type, setType] = useState('consumable');
    const [unit, setUnit] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [description, setDescription] = useState('');
    const [isUsable, setIsUsable] = useState(true);
    const [receipt, setReceipt] = useState<File | null>(null);
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            images.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, [images]);

    const clearSelectedImages = () => {
        images.forEach((image) => URL.revokeObjectURL(image.preview));
        setImages([]);
    };

    const resetForm = () => {
        setName('');
        setBranchId('');
        setType('consumable');
        setUnit('');
        setQuantity('');
        setUnitPrice('');
        setDescription('');
        setIsUsable(true);
        setReceipt(null);
        clearSelectedImages();
        setErrors({});
    };

    const handleImageChange = (files: FileList | null) => {
        if (!files) return;

        setImages((prev) => {
            const remainingSlots = MAX_IMAGES - prev.length;
            const nextFiles = Array.from(files).slice(0, remainingSlots);
            return [
                ...prev,
                ...nextFiles.map((file, index) => ({
                    id: `${Date.now()}-${file.name}-${index}`,
                    file,
                    preview: URL.createObjectURL(file),
                })),
            ];
        });
    };

    const removeSelectedImage = (id: string) => {
        setImages((prev) => {
            const target = prev.find((item) => item.id === id);
            if (target) {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter((item) => item.id !== id);
        });
    };

    const handleCreate = () => {
        if (
            !name.trim() ||
            !branchId ||
            !type ||
            !quantity ||
            !unitPrice ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/inventory',
            {
                branch_id: Number(branchId),
                name: name.trim(),
                type,
                unit: unit.trim() || null,
                quantity: Number(quantity),
                unit_price: Number(unitPrice),
                description: description.trim() || null,
                is_usable: isUsable,
                receipt,
                images: images.map((image) => image.file),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Inventory item created successfully.');
                    setIsCreateOpen(false);
                    resetForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to create inventory item.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const totalPrice = useMemo(() => {
        const qty = Number(quantity);
        const price = Number(unitPrice);
        if (Number.isNaN(qty) || Number.isNaN(price)) return 0;
        return qty * price;
    }, [quantity, unitPrice]);

    const tableColumns = useMemo(() => buildColumns(branches), [branches]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Inventory Items: ${formatNumber(data.length)}`}
                    description="Manage grocery, food supplies, and other usable/non-usable inventory."
                />
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Item
                </Button>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'type', 'branch.name']}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search inventory by item, type, or branch..."
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
                        <DialogTitle>Create Inventory Item</DialogTitle>
                        <DialogDescription>
                            Add a new item with stock quantity, price, receipt/bill,
                            and images.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="consumable">
                                        Consumable
                                    </SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="grocery">
                                        Grocery
                                    </SelectItem>
                                    <SelectItem value="food">Food</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.type} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Unit</Label>
                            <Input
                                placeholder="kg, bag, piece, box"
                                value={unit}
                                onChange={(event) => setUnit(event.target.value)}
                            />
                            <InputError message={errors.unit} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Initial Quantity</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={quantity}
                                onChange={(event) =>
                                    setQuantity(event.target.value)
                                }
                            />
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Single Price</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={unitPrice}
                                onChange={(event) =>
                                    setUnitPrice(event.target.value)
                                }
                            />
                            <InputError message={errors.unit_price} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Total Price (Auto)</Label>
                            <Input
                                value={formatPrice(totalPrice)}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                        <div className="flex items-end">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={isUsable}
                                    onCheckedChange={(checked) =>
                                        setIsUsable(!!checked)
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    Usable item
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor="inventory-receipt">
                                Receipt/Bill (image or PDF)
                            </Label>
                            <Input
                                id="inventory-receipt"
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(event) =>
                                    setReceipt(event.target.files?.[0] ?? null)
                                }
                            />
                            {receipt ? (
                                <p className="text-xs text-muted-foreground">
                                    Selected: {receipt.name}
                                </p>
                            ) : null}
                            <InputError message={errors.receipt} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Images (up to 10)</Label>
                            <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Upload item images.
                                    </p>
                                    <Label
                                        htmlFor="inventory-images"
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                    >
                                        <ImagePlus className="h-4 w-4" />
                                        Select Images
                                    </Label>
                                </div>
                                <Input
                                    id="inventory-images"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) =>
                                        handleImageChange(event.target.files)
                                    }
                                />
                                {images.length > 0 ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {images.map((image) => (
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
                                                        removeSelectedImage(
                                                            image.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                            <InputError message={errors.images} />
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
                            onClick={handleCreate}
                            disabled={
                                !name.trim() ||
                                !branchId ||
                                !type ||
                                !quantity ||
                                !unitPrice ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
