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
import {
    Branch,
    Currency,
    InventoryCategory,
    InventoryItem,
    Unit,
    Vendor,
} from '@/types';
import { formatPrice } from '@/utils/format';
import { router } from '@inertiajs/react';
import {
    CalendarClock,
    Eye,
    ImagePlus,
    MoreHorizontal,
    PackagePlus,
    Pencil,
    Save,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: InventoryItem;
    branches: Branch[];
    vendors: Vendor[];
    currencies: Currency[];
    units: Unit[];
    categories: InventoryCategory[];
}

interface PendingImage {
    id: string;
    file: File;
    preview: string;
}

const MAX_EDIT_IMAGES = 10;

export const CellAction: React.FC<CellActionProps> = ({
    data,
    branches,
    vendors,
    currencies,
    units,
    categories,
}) => {
    const VENDOR_NONE = '__none__';
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isUsageHistoryOpen, setIsUsageHistoryOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [restockQty, setRestockQty] = useState('');
    const [restockNote, setRestockNote] = useState('');
    const [restockReceipt, setRestockReceipt] = useState<File | null>(null);
    const [restockHasNewPrice, setRestockHasNewPrice] = useState(false);
    const [restockCurrencyCode, setRestockCurrencyCode] = useState(
        data.currency_code ?? 'AFN',
    );
    const [restockUnitPrice, setRestockUnitPrice] = useState(
        data.unit_price !== undefined && data.unit_price !== null
            ? String(data.unit_price)
            : '',
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editBranchId, setEditBranchId] = useState(String(data.branch_id));
    const [editName, setEditName] = useState(data.name);
    const [editType, setEditType] = useState(data.type);
    const [editQuantity, setEditQuantity] = useState(
        String(data.quantity ?? ''),
    );
    const [editUnitPrice, setEditUnitPrice] = useState(
        String(data.unit_price ?? ''),
    );
    const [editPaidAmount, setEditPaidAmount] = useState(
        String(data.paid_amount ?? '0'),
    );
    const [editVendorId, setEditVendorId] = useState(
        data.vendor_id ? String(data.vendor_id) : VENDOR_NONE,
    );
    const [editUnitId, setEditUnitId] = useState(
        data.unit_id ? String(data.unit_id) : '',
    );
    const [editCategoryId, setEditCategoryId] = useState(
        data.category_id ? String(data.category_id) : '',
    );
    const [editCurrencyCode, setEditCurrencyCode] = useState(
        data.currency_code ?? 'AFN',
    );
    const [editDescription, setEditDescription] = useState(
        data.description ?? '',
    );
    const [editUsable, setEditUsable] = useState(!!data.is_usable);
    const [editReceipt, setEditReceipt] = useState<File | null>(null);
    const [editImages, setEditImages] = useState<PendingImage[]>([]);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    const latestTransactions = useMemo(
        () => (data.transactions ?? []).slice(0, 5),
        [data.transactions],
    );
    const usageTransactions = useMemo(
        () =>
            (data.transactions ?? []).filter(
                (transaction) => transaction.action === 'usage_cycle',
            ),
        [data.transactions],
    );

    const editTotalPrice = useMemo(() => {
        const qty = Number(editQuantity);
        const unitPrice = Number(editUnitPrice);
        if (Number.isNaN(qty) || Number.isNaN(unitPrice)) return 0;
        return qty * unitPrice;
    }, [editQuantity, editUnitPrice]);

    const editCurrencySymbol = useMemo(() => {
        const matched = currencies.find(
            (currency) => currency.code === editCurrencyCode,
        );
        return matched?.symbol ?? data.currency_symbol ?? '';
    }, [currencies, data.currency_symbol, editCurrencyCode]);

    const restockCurrencySymbol = useMemo(() => {
        const matched = currencies.find(
            (currency) => currency.code === restockCurrencyCode,
        );
        return matched?.symbol ?? data.currency_symbol ?? '';
    }, [currencies, data.currency_symbol, restockCurrencyCode]);

    useEffect(() => {
        return () => {
            editImages.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, [editImages]);

    const resetEditForm = () => {
        setEditBranchId(String(data.branch_id));
        setEditName(data.name);
        setEditType(data.type);
        setEditQuantity(String(data.quantity ?? ''));
        setEditUnitPrice(String(data.unit_price ?? ''));
        setEditPaidAmount(String(data.paid_amount ?? '0'));
        setEditVendorId(data.vendor_id ? String(data.vendor_id) : VENDOR_NONE);
        setEditUnitId(data.unit_id ? String(data.unit_id) : '');
        setEditCategoryId(data.category_id ? String(data.category_id) : '');
        setEditCurrencyCode(data.currency_code ?? 'AFN');
        setEditDescription(data.description ?? '');
        setEditUsable(!!data.is_usable);
        setEditReceipt(null);
        editImages.forEach((image) => URL.revokeObjectURL(image.preview));
        setEditImages([]);
        setEditErrors({});
    };

    const handleEditImageChange = (files: FileList | null) => {
        if (!files) return;

        setEditImages((prev) => {
            const remainingSlots = MAX_EDIT_IMAGES - prev.length;
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

    const removeEditImage = (id: string) => {
        setEditImages((prev) => {
            const target = prev.find((image) => image.id === id);
            if (target) {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter((image) => image.id !== id);
        });
    };

    const resetRestockForm = () => {
        setRestockQty('');
        setRestockNote('');
        setRestockHasNewPrice(false);
        setRestockCurrencyCode(data.currency_code ?? 'AFN');
        setRestockUnitPrice(
            data.unit_price !== undefined && data.unit_price !== null
                ? String(data.unit_price)
                : '',
        );
        setRestockReceipt(null);
        setErrors({});
    };

    const handleRestock = () => {
        if (!restockQty || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/inventory/${data.id}/restock`,
            {
                quantity: Number(restockQty),
                note: restockNote.trim() || null,
                apply_new_price: restockHasNewPrice,
                currency_code: restockHasNewPrice ? restockCurrencyCode : null,
                unit_price: restockHasNewPrice
                    ? Number(restockUnitPrice)
                    : null,
                receipt: restockReceipt,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Item restocked successfully.');
                    setIsRestockOpen(false);
                    resetRestockForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to restock item.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleUpdate = () => {
        if (
            !editName.trim() ||
            !editBranchId ||
            !editType ||
            !editQuantity ||
            !editUnitPrice ||
            !editPaidAmount ||
            !editCurrencyCode ||
            isEditSubmitting
        ) {
            return;
        }

        setIsEditSubmitting(true);
        router.post(
            `/inventory/${data.id}`,
            {
                _method: 'put',
                branch_id: Number(editBranchId),
                name: editName.trim(),
                type: editType.trim(),
                quantity: Number(editQuantity),
                unit_price: Number(editUnitPrice),
                paid_amount: Number(editPaidAmount),
                currency_code: editCurrencyCode,
                vendor_id:
                    editVendorId !== VENDOR_NONE ? Number(editVendorId) : null,
                unit_id: editUnitId ? Number(editUnitId) : null,
                category_id: editCategoryId ? Number(editCategoryId) : null,
                description: editDescription.trim() || null,
                is_usable: editUsable,
                receipt: editReceipt,
                images: editImages.map((image) => image.file),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Inventory item updated successfully.');
                    setIsEditOpen(false);
                    resetEditForm();
                },
                onError: (validationErrors) => {
                    setEditErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to update inventory item.',
                    );
                },
                onFinish: () => {
                    setIsEditSubmitting(false);
                },
            },
        );
    };

    const handleDelete = () => {
        if (isDeleteSubmitting) return;

        setIsDeleteSubmitting(true);
        router.delete(`/inventory/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Inventory item deleted successfully.');
                setIsDeleteOpen(false);
            },
            onError: () => {
                toast.error('Failed to delete inventory item.');
            },
            onFinish: () => {
                setIsDeleteSubmitting(false);
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
                    <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                    </DropdownMenuItem>
                    {data.is_usable ? (
                        <DropdownMenuItem
                            onClick={() => setIsUsageHistoryOpen(true)}
                        >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Usage History
                        </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem
                        onClick={() => {
                            resetEditForm();
                            setIsEditOpen(true);
                        }}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsRestockOpen(true)}>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Restock
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setIsDeleteOpen(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Inventory Item?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{data.name}" and
                            cascade related records (images and transactions).
                            <br />
                            <br />
                            Current stock: {Number(data.quantity || 0)}{' '}
                            {data.unit ?? 'unit'}
                            <br />
                            Payment due: {data.currency_symbol ?? ''}
                            {formatPrice(
                                Math.max(
                                    0,
                                    Number(data.outstanding_amount ?? 0),
                                ),
                            )}
                            {data.vendor?.name
                                ? ` (Vendor: ${data.vendor.name})`
                                : ''}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleteSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleteSubmitting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Inventory Item</DialogTitle>
                        <DialogDescription>
                            Update item details, price, quantity, and receipt.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input
                                    value={editName}
                                    onChange={(event) =>
                                        setEditName(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Branch</Label>
                                <Select
                                    value={editBranchId}
                                    onValueChange={setEditBranchId}
                                >
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
                                <InputError message={editErrors.branch_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Input
                                    value={editType}
                                    onChange={(event) =>
                                        setEditType(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.type} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Vendor</Label>
                                <Select
                                    value={editVendorId}
                                    onValueChange={setEditVendorId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={VENDOR_NONE}>
                                            No Vendor
                                        </SelectItem>
                                        {vendors.map((vendor) => (
                                            <SelectItem
                                                key={vendor.id}
                                                value={String(vendor.id)}
                                            >
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.vendor_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Currency</Label>
                                <Select
                                    value={editCurrencyCode}
                                    onValueChange={setEditCurrencyCode}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((currency) => (
                                            <SelectItem
                                                key={currency.id}
                                                value={currency.code}
                                            >
                                                {currency.code} (
                                                {currency.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editErrors.currency_code}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit</Label>
                                <Select
                                    value={editUnitId}
                                    onValueChange={setEditUnitId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {units.map((entry) => (
                                            <SelectItem
                                                key={entry.id}
                                                value={String(entry.id)}
                                            >
                                                {entry.name} ({entry.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.unit_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={editCategoryId}
                                    onValueChange={setEditCategoryId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((entry) => (
                                            <SelectItem
                                                key={entry.id}
                                                value={String(entry.id)}
                                            >
                                                {entry.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editErrors.category_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Quantity</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editQuantity}
                                    onChange={(event) =>
                                        setEditQuantity(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.quantity} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Single Price {editCurrencySymbol}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editUnitPrice}
                                    onChange={(event) =>
                                        setEditUnitPrice(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.unit_price} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Total Price (Auto) {editCurrencySymbol}
                                </Label>
                                <Input
                                    value={formatPrice(editTotalPrice)}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Paid Amount {editCurrencySymbol}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editPaidAmount}
                                    onChange={(event) =>
                                        setEditPaidAmount(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.paid_amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Remaining Amount (Auto) {editCurrencySymbol}
                                </Label>
                                <Input
                                    value={`${editCurrencySymbol}${formatPrice(
                                        Math.max(
                                            0,
                                            editTotalPrice -
                                                (Number(editPaidAmount) || 0),
                                        ),
                                    )}`}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="flex items-end">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={editUsable}
                                        onCheckedChange={(checked) =>
                                            setEditUsable(!!checked)
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
                                    value={editDescription}
                                    onChange={(event) =>
                                        setEditDescription(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.description} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor={`edit-receipt-${data.id}`}>
                                    Replace Receipt/Bill (optional)
                                </Label>
                                <Input
                                    id={`edit-receipt-${data.id}`}
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(event) =>
                                        setEditReceipt(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                {data.receipt_url || data.receipt_path ? (
                                    <a
                                        href={String(
                                            data.receipt_url ??
                                                data.receipt_path,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        View current receipt
                                    </a>
                                ) : null}
                                {editReceipt ? (
                                    <p className="text-xs text-muted-foreground">
                                        New file: {editReceipt.name}
                                    </p>
                                ) : null}
                                <InputError message={editErrors.receipt} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Add New Images (optional)</Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Upload additional images for this
                                            item.
                                        </p>
                                        <Label
                                            htmlFor={`edit-images-${data.id}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            Select Images
                                        </Label>
                                    </div>
                                    <Input
                                        id={`edit-images-${data.id}`}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) =>
                                            handleEditImageChange(
                                                event.target.files,
                                            )
                                        }
                                    />
                                    {editImages.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {editImages.map((image) => (
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
                                                        className="absolute top-1 right-1 rounded bg-black/65 p-1 text-white"
                                                        onClick={() =>
                                                            removeEditImage(
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
                                <InputError message={editErrors.images} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isEditSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={
                                !editName.trim() ||
                                !editBranchId ||
                                !editType.trim() ||
                                !editQuantity ||
                                !editUnitPrice ||
                                !editPaidAmount ||
                                !editCurrencyCode ||
                                isEditSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{data.name}</DialogTitle>
                        <DialogDescription>
                            Inventory item details and latest transactions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Type
                            </p>
                            <p className="font-medium capitalize">
                                {data.type}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Branch
                            </p>
                            <p className="font-medium">
                                {data.branch?.name ?? 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Vendor
                            </p>
                            <p className="font-medium">
                                {data.vendor?.name ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Stock
                            </p>
                            <p className="font-medium">
                                {Number(data.quantity)} {data.unit ?? 'unit'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Usable
                            </p>
                            <p className="font-medium">
                                {data.is_usable ? 'Yes' : 'No'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Single Price
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(data.unit_price ?? 0)}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Total Price
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(
                                    Number(data.quantity || 0) *
                                        Number(data.unit_price || 0),
                                )}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Paid Amount
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(data.paid_amount ?? 0)}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Remaining Amount
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(data.outstanding_amount ?? 0)}`}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Receipt/Bill
                            </p>
                            {data.receipt_url || data.receipt_path ? (
                                <a
                                    href={String(
                                        data.receipt_url ?? data.receipt_path,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    View uploaded receipt
                                </a>
                            ) : (
                                <p className="font-medium">-</p>
                            )}
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Description
                            </p>
                            <p className="font-medium">
                                {data.description || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Latest Transactions
                        </p>
                        <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
                            {latestTransactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No transactions yet.
                                </p>
                            ) : (
                                latestTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                                    >
                                        <span className="capitalize">
                                            {transaction.action.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </span>
                                        <span>
                                            {Number(transaction.quantity)}{' '}
                                            {data.unit ?? 'unit'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isUsageHistoryOpen}
                onOpenChange={setIsUsageHistoryOpen}
            >
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Usage History - {data.name}</DialogTitle>
                        <DialogDescription>
                            Usage cycle records for this usable item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[65vh] overflow-y-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-3 py-2 font-medium">
                                        Date
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Usage Amount
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Note
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {usageTransactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-3 py-6 text-center text-muted-foreground"
                                        >
                                            No usage history found.
                                        </td>
                                    </tr>
                                ) : (
                                    usageTransactions.map((transaction) => {
                                        const quantity = Math.abs(
                                            Number(transaction.quantity || 0),
                                        );
                                        const dateLabel = transaction.created_at
                                            ? new Intl.DateTimeFormat('en-US', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                              }).format(
                                                  new Date(
                                                      transaction.created_at,
                                                  ),
                                              )
                                            : '-';

                                        return (
                                            <tr
                                                key={transaction.id}
                                                className="border-t"
                                            >
                                                <td className="px-3 py-2">
                                                    {dateLabel}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {quantity}{' '}
                                                    {data.unit ?? 'unit'}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {transaction.note || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isRestockOpen}
                onOpenChange={(open) => {
                    setIsRestockOpen(open);
                    if (!open) {
                        resetRestockForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Restock {data.name}</DialogTitle>
                        <DialogDescription>
                            Increase stock quantity for this inventory item.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-qty-${data.id}`}>
                                Quantity to add ({data.unit ?? 'unit'})
                            </Label>
                            <Input
                                id={`restock-qty-${data.id}`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={restockQty}
                                onChange={(event) =>
                                    setRestockQty(event.target.value)
                                }
                            />
                            <InputError message={errors.quantity} />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={restockHasNewPrice}
                                    onCheckedChange={(checked) =>
                                        setRestockHasNewPrice(!!checked)
                                    }
                                />
                                <span className="text-sm text-muted-foreground">
                                    Apply new price to all stock
                                </span>
                            </div>
                        </div>
                        {restockHasNewPrice ? (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`restock-currency-${data.id}`}
                                    >
                                        Currency
                                    </Label>
                                    <Select
                                        value={restockCurrencyCode}
                                        onValueChange={setRestockCurrencyCode}
                                    >
                                        <SelectTrigger
                                            id={`restock-currency-${data.id}`}
                                        >
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((currency) => (
                                                <SelectItem
                                                    key={currency.id}
                                                    value={currency.code}
                                                >
                                                    {currency.code} (
                                                    {currency.symbol})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.currency_code}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`restock-price-${data.id}`}>
                                        New Single Price {restockCurrencySymbol}
                                    </Label>
                                    <Input
                                        id={`restock-price-${data.id}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={restockUnitPrice}
                                        onChange={(event) =>
                                            setRestockUnitPrice(
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <InputError message={errors.unit_price} />
                                </div>
                            </>
                        ) : null}
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-note-${data.id}`}>
                                Note (optional)
                            </Label>
                            <Textarea
                                id={`restock-note-${data.id}`}
                                value={restockNote}
                                onChange={(event) =>
                                    setRestockNote(event.target.value)
                                }
                            />
                            <InputError message={errors.note} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-receipt-${data.id}`}>
                                Upload Receipt/Bill (optional)
                            </Label>
                            <Input
                                id={`restock-receipt-${data.id}`}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(event) =>
                                    setRestockReceipt(
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {data.receipt_url || data.receipt_path ? (
                                <a
                                    href={String(
                                        data.receipt_url ?? data.receipt_path,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    View current receipt
                                </a>
                            ) : null}
                            {restockReceipt ? (
                                <p className="text-xs text-muted-foreground">
                                    New file: {restockReceipt.name}
                                </p>
                            ) : null}
                            <InputError message={errors.receipt} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRestockOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestock}
                            disabled={
                                !restockQty ||
                                (restockHasNewPrice &&
                                    (!restockCurrencyCode ||
                                        !restockUnitPrice)) ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Restock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
