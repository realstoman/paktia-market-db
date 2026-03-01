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
import { Branch, InventoryItem, Vendor } from '@/types';
import { formatNumber, formatPrice } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Building2, ImagePlus, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
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
    vendors: Vendor[];
    isLoading?: boolean;
}

const MAX_IMAGES = 10;
const VENDOR_NONE = '__none__';

export const InventoryClient: React.FC<InventoryClientProps> = ({
    data,
    branches,
    vendors,
    isLoading = false,
}) => {
    const FILTER_ALL = '__all__';
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState('');
    const [branchId, setBranchId] = useState('');
    const [type, setType] = useState('consumable');
    const [unit, setUnit] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [vendorId, setVendorId] = useState(VENDOR_NONE);
    const [description, setDescription] = useState('');
    const [isUsable, setIsUsable] = useState(true);
    const [receipt, setReceipt] = useState<File | null>(null);
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
    const [isVendorSubmitting, setIsVendorSubmitting] = useState(false);
    const [vendorErrors, setVendorErrors] = useState<Record<string, string>>({});
    const [vendorName, setVendorName] = useState('');
    const [vendorCategory, setVendorCategory] = useState('');
    const [vendorAddress, setVendorAddress] = useState('');
    const [vendorContactPerson, setVendorContactPerson] = useState('');
    const [vendorPhone, setVendorPhone] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorNotes, setVendorNotes] = useState('');
    const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState(FILTER_ALL);
    const [selectedTypeFilter, setSelectedTypeFilter] = useState(FILTER_ALL);

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
        setPaidAmount('');
        setVendorId(VENDOR_NONE);
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

    const resetVendorForm = () => {
        setVendorName('');
        setVendorCategory('');
        setVendorAddress('');
        setVendorContactPerson('');
        setVendorPhone('');
        setVendorEmail('');
        setVendorNotes('');
        setVendorErrors({});
        setEditingVendorId(null);
    };

    const populateVendorForm = (vendor: Vendor) => {
        setVendorName(vendor.name ?? '');
        setVendorCategory(vendor.category ?? '');
        setVendorAddress(vendor.address ?? '');
        setVendorContactPerson(vendor.contact_person ?? '');
        setVendorPhone(vendor.phone ?? '');
        setVendorEmail(vendor.email ?? '');
        setVendorNotes(vendor.notes ?? '');
        setVendorErrors({});
        setEditingVendorId(vendor.id);
        setIsVendorDialogOpen(true);
    };

    const handleSaveVendor = () => {
        if (!vendorName.trim() || isVendorSubmitting) {
            return;
        }

        setIsVendorSubmitting(true);

        const payload = {
            name: vendorName.trim(),
            category: vendorCategory.trim() || null,
            address: vendorAddress.trim() || null,
            contact_person: vendorContactPerson.trim() || null,
            phone: vendorPhone.trim() || null,
            email: vendorEmail.trim() || null,
            notes: vendorNotes.trim() || null,
            is_active: true,
        };

        const url = editingVendorId
            ? `/inventory/vendors/${editingVendorId}`
            : '/inventory/vendors';

        router.post(
            url,
            editingVendorId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        editingVendorId
                            ? 'Vendor updated successfully.'
                            : 'Vendor created successfully.',
                    );
                    setIsVendorDialogOpen(false);
                    resetVendorForm();
                },
                onError: (validationErrors) => {
                    setVendorErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to save vendor.',
                    );
                },
                onFinish: () => {
                    setIsVendorSubmitting(false);
                },
            },
        );
    };

    const handleCreate = () => {
        if (
            !name.trim() ||
            !branchId ||
            !type ||
            !quantity ||
            !unitPrice ||
            !paidAmount ||
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
                paid_amount: Number(paidAmount),
                vendor_id:
                    vendorId && vendorId !== VENDOR_NONE
                        ? Number(vendorId)
                        : null,
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

    const remainingAmount = useMemo(() => {
        const paid = Number(paidAmount);
        if (Number.isNaN(paid)) return totalPrice;
        return Math.max(0, totalPrice - paid);
    }, [paidAmount, totalPrice]);

    const tableColumns = useMemo(
        () => buildColumns(branches, vendors),
        [branches, vendors],
    );

    const availableTypes = useMemo(() => {
        return Array.from(
            new Set(
                data
                    .map((item) => (item.type ?? '').trim().toLowerCase())
                    .filter(Boolean),
            ),
        ).sort();
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const branchMatch =
                selectedBranchFilter === FILTER_ALL ||
                String(item.branch_id) === selectedBranchFilter;

            const typeMatch =
                selectedTypeFilter === FILTER_ALL ||
                ((selectedTypeFilter === 'usable' && item.is_usable) ||
                    (selectedTypeFilter === 'not_usable' && !item.is_usable) ||
                    (item.type ?? '').trim().toLowerCase() ===
                        selectedTypeFilter);

            return branchMatch && typeMatch;
        });
    }, [data, selectedBranchFilter, selectedTypeFilter]);

    const vendorOutstanding = useMemo(() => {
        const outstandingByVendor = new Map<number, number>();

        for (const item of data) {
            if (!item.vendor_id) continue;

            const total =
                Number(item.quantity || 0) * Number(item.unit_price || 0);
            const paid = Number(item.paid_amount || 0);
            const outstanding = Math.max(0, total - paid);

            outstandingByVendor.set(
                item.vendor_id,
                (outstandingByVendor.get(item.vendor_id) ?? 0) + outstanding,
            );
        }

        return outstandingByVendor;
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Inventory Items: ${formatNumber(data.length)}`}
                    description="Manage grocery, food supplies, and other usable/non-usable inventory."
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetVendorForm();
                            setIsVendorDialogOpen(true);
                        }}
                        className="gap-2"
                    >
                        <Building2 className="h-4 w-4" />
                        Manage Vendors
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Item
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'type', 'branch.name', 'vendor.name']}
                columns={tableColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder="Search inventory by item, type, or branch..."
                toolbar={
                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={selectedBranchFilter}
                            onValueChange={setSelectedBranchFilter}
                        >
                            <SelectTrigger className="h-10 w-[180px]">
                                <SelectValue placeholder="Filter by branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FILTER_ALL}>
                                    All Branches
                                </SelectItem>
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

                        <Select
                            value={selectedTypeFilter}
                            onValueChange={setSelectedTypeFilter}
                        >
                            <SelectTrigger className="h-10 w-[200px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={FILTER_ALL}>All Types</SelectItem>
                                <SelectItem value="usable">Usable</SelectItem>
                                <SelectItem value="not_usable">
                                    Not Usable
                                </SelectItem>
                                {availableTypes.map((typeEntry) => (
                                    <SelectItem
                                        key={typeEntry}
                                        value={typeEntry}
                                    >
                                        {typeEntry.charAt(0).toUpperCase() +
                                            typeEntry.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                }
            />

            <Dialog
                open={isVendorDialogOpen}
                onOpenChange={(open) => {
                    setIsVendorDialogOpen(open);
                    if (!open) {
                        resetVendorForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVendorId ? 'Edit Vendor' : 'Manage Vendors'}
                        </DialogTitle>
                        <DialogDescription>
                            Create and update vendors/wholesale stores you buy
                            inventory from.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Store Name</Label>
                            <Input
                                value={vendorName}
                                onChange={(event) =>
                                    setVendorName(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Input
                                placeholder="Butcher, Grocery, Furniture..."
                                value={vendorCategory}
                                onChange={(event) =>
                                    setVendorCategory(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Contact Person</Label>
                            <Input
                                value={vendorContactPerson}
                                onChange={(event) =>
                                    setVendorContactPerson(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.contact_person} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input
                                value={vendorPhone}
                                onChange={(event) =>
                                    setVendorPhone(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={vendorEmail}
                                onChange={(event) =>
                                    setVendorEmail(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Address</Label>
                            <Input
                                value={vendorAddress}
                                onChange={(event) =>
                                    setVendorAddress(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={vendorNotes}
                                onChange={(event) =>
                                    setVendorNotes(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.notes} />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={resetVendorForm}
                            disabled={isVendorSubmitting}
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={handleSaveVendor}
                            disabled={!vendorName.trim() || isVendorSubmitting}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingVendorId ? 'Update Vendor' : 'Save Vendor'}
                        </Button>
                    </DialogFooter>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Existing Vendors</p>
                        <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                            {vendors.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No vendors yet.
                                </p>
                            ) : (
                                vendors.map((vendor) => (
                                    <div
                                        key={vendor.id}
                                        className="flex items-center justify-between rounded-md border p-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {vendor.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {vendor.category || '-'} |{' '}
                                                {vendor.contact_person || '-'} |{' '}
                                                {vendor.phone || '-'} | Owed:{' '}
                                                {formatPrice(
                                                    vendorOutstanding.get(
                                                        vendor.id,
                                                    ) ?? 0,
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => populateVendorForm(vendor)}
                                        >
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Edit
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                            <Label>Vendor (optional)</Label>
                            <Select value={vendorId} onValueChange={setVendorId}>
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
                            <InputError message={errors.vendor_id} />
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
                        <div className="grid gap-2">
                            <Label>Paid Amount</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={paidAmount}
                                onChange={(event) =>
                                    setPaidAmount(event.target.value)
                                }
                            />
                            <InputError message={errors.paid_amount} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Remaining Amount (Auto)</Label>
                            <Input
                                value={formatPrice(remainingAmount)}
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
                                !paidAmount ||
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
