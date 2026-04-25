import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
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
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import {
    Branch,
    Currency,
    InventoryCategory,
    InventoryItem,
    InventoryItemImage,
    InventoryType,
    SharedData,
    Unit,
    Vendor,
} from '@/types';
import { formatPrice } from '@/utils/format';
import { router, usePage } from '@inertiajs/react';
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
    inventoryTypes: InventoryType[];
}

interface PendingImage {
    id: string;
    file: File;
    preview: string;
}

const MAX_EDIT_IMAGES = 10;

const resolveImageUrl = (image: InventoryItemImage) => {
    const urlCandidate = image.url ?? image.path ?? '';
    if (!urlCandidate) return '';
    if (
        urlCandidate.startsWith('http://') ||
        urlCandidate.startsWith('https://')
    ) {
        return urlCandidate;
    }
    if (urlCandidate.startsWith('/storage/')) {
        return urlCandidate;
    }
    if (urlCandidate.startsWith('storage/')) {
        return `/${urlCandidate}`;
    }
    if (urlCandidate.startsWith('/')) {
        return urlCandidate;
    }
    return `/storage/${urlCandidate}`;
};

export const CellAction: React.FC<CellActionProps> = ({
    data,
    branches,
    vendors,
    currencies,
    units,
    categories,
    inventoryTypes,
}) => {
    const { t, locale } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const { can } = useAuthorization();
    const VENDOR_NONE = '__none__';
    const canViewInventory = can('inventory.view');
    const canAdjustInventory = can('inventory.adjust');
    const canDeleteInventoryItem =
        can('inventory.delete') &&
        (auth.is_super_admin === true || auth.roles.includes('super-admin'));
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
    const [editTypeId, setEditTypeId] = useState(
        data.inventory_type_id ? String(data.inventory_type_id) : '',
    );
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
    const [removedExistingImageIds, setRemovedExistingImageIds] = useState<
        number[]
    >([]);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);
    const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

    const latestTransactions = useMemo(
        () => (data.transactions ?? []).slice(0, 5),
        [data.transactions],
    );
    const existingImages = useMemo(() => data.images ?? [], [data.images]);
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

    const dateLocale =
        locale === 'fa' ? 'fa-AF' : locale === 'ps' ? 'ps-AF' : 'en-US';

    useEffect(() => {
        return () => {
            editImages.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, [editImages]);

    const resetEditForm = () => {
        setEditBranchId(String(data.branch_id));
        setEditName(data.name);
        setEditTypeId(
            data.inventory_type_id ? String(data.inventory_type_id) : '',
        );
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
        setRemovedExistingImageIds([]);
        editImages.forEach((image) => URL.revokeObjectURL(image.preview));
        setEditImages([]);
        setEditErrors({});
    };

    const handleEditImageChange = (files: FileList | null) => {
        if (!files) return;

        setEditImages((prev) => {
            const remainingSlots =
                MAX_EDIT_IMAGES -
                (existingImages.length - removedExistingImageIds.length) -
                prev.length;
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

    const toggleExistingImageRemoval = (imageId: number) => {
        setRemovedExistingImageIds((prev) =>
            prev.includes(imageId)
                ? prev.filter((id) => id !== imageId)
                : [...prev, imageId],
        );
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
                    toast.success(
                        t(
                            'inventory.rowActions.restocked',
                            'Item restocked successfully.',
                        ),
                    );
                    setIsRestockOpen(false);
                    resetRestockForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.rowActions.restockFailed',
                                'Failed to restock item.',
                            ),
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
            !editTypeId ||
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
                inventory_type_id: Number(editTypeId),
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
                remove_image_ids: removedExistingImageIds,
                images: editImages.map((image) => image.file),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'inventory.rowActions.updated',
                            'Inventory item updated successfully.',
                        ),
                    );
                    setIsEditOpen(false);
                    resetEditForm();
                },
                onError: (validationErrors) => {
                    setEditErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.rowActions.updateFailed',
                                'Failed to update inventory item.',
                            ),
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
                toast.success(
                    t(
                        'inventory.rowActions.deleted',
                        'Inventory item deleted successfully.',
                    ),
                );
                setIsDeleteOpen(false);
            },
            onError: () => {
                toast.error(
                    t(
                        'inventory.rowActions.deleteFailed',
                        'Failed to delete inventory item.',
                    ),
                );
            },
            onFinish: () => {
                setIsDeleteSubmitting(false);
            },
        });
    };

    return (
        <>
            {canViewInventory || canAdjustInventory || canDeleteInventoryItem ? (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">
                                {t('inventory.rowActions.openMenu', 'Open menu')}
                            </span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {t('inventory.rowActions.actions', 'Actions')}
                        </DropdownMenuLabel>
                        {canViewInventory ? (
                            <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('inventory.rowActions.details', 'Details')}
                            </DropdownMenuItem>
                        ) : null}
                        {canViewInventory && data.is_usable ? (
                            <DropdownMenuItem
                                onClick={() => setIsUsageHistoryOpen(true)}
                            >
                                <CalendarClock className="mr-2 h-4 w-4" />
                                {t(
                                    'inventory.rowActions.usageHistory',
                                    'Usage History',
                                )}
                            </DropdownMenuItem>
                        ) : null}
                        {canAdjustInventory ? (
                            <DropdownMenuItem
                                onClick={() => {
                                    resetEditForm();
                                    setIsEditOpen(true);
                                }}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t('inventory.common.edit', 'Edit')}
                            </DropdownMenuItem>
                        ) : null}
                        {canAdjustInventory ? (
                            <DropdownMenuItem onClick={() => setIsRestockOpen(true)}>
                                <PackagePlus className="mr-2 h-4 w-4" />
                                {t('inventory.rowActions.restock', 'Restock')}
                            </DropdownMenuItem>
                        ) : null}
                        {canDeleteInventoryItem ? (
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('inventory.common.delete', 'Delete')}
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            {canDeleteInventoryItem ? (
                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t(
                                    'inventory.rowActions.deleteTitle',
                                    'Delete Inventory Item?',
                                )}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t(
                                    'inventory.rowActions.deleteDescription',
                                    'This will permanently delete ":name" and cascade related records (images and transactions).',
                                ).replace(':name', data.name)}
                                <br />
                                <br />
                                {t(
                                    'inventory.rowActions.currentStock',
                                    'Current stock',
                                )}
                                : {Number(data.quantity || 0)}{' '}
                                {data.unit ??
                                    t('inventory.common.unit', 'unit')}
                                <br />
                                {t(
                                    'inventory.rowActions.paymentDue',
                                    'Payment due',
                                )}
                                : {data.currency_symbol ?? ''}
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
                                {t('inventory.common.cancel', 'Cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleteSubmitting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('inventory.common.delete', 'Delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : null}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'inventory.rowActions.editTitle',
                                'Edit Inventory Item',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.rowActions.editDescription',
                                'Update item details, price, quantity, and receipt.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>{t('inventory.common.name', 'Name')}</Label>
                                <Input
                                    value={editName}
                                    onChange={(event) =>
                                        setEditName(event.target.value)
                                    }
                                />
                                <InputError message={editErrors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('inventory.common.branch', 'Branch')}</Label>
                                <Select
                                    value={editBranchId}
                                    onValueChange={setEditBranchId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'inventory.common.selectBranch',
                                                'Select branch',
                                            )}
                                        />
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
                                <Label>{t('inventory.common.type', 'Type')}</Label>
                                <Select
                                    value={editTypeId}
                                    onValueChange={setEditTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'inventory.common.selectType',
                                                'Select type',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {inventoryTypes.map((entry) => (
                                            <SelectItem
                                                key={entry.id}
                                                value={String(entry.id)}
                                            >
                                                {entry.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={editErrors.inventory_type_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('inventory.common.vendor', 'Vendor')}</Label>
                                <Select
                                    value={editVendorId}
                                    onValueChange={setEditVendorId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'inventory.common.selectVendor',
                                                'Select vendor',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={VENDOR_NONE}>
                                            {t('inventory.common.noVendor', 'No Vendor')}
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
                                <Label>{t('inventory.common.currency', 'Currency')}</Label>
                                <Select
                                    value={editCurrencyCode}
                                    onValueChange={setEditCurrencyCode}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'inventory.common.selectCurrency',
                                                'Select currency',
                                            )}
                                        />
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
                                <Label>{t('inventory.common.unitLabel', 'Unit')}</Label>
                                <Select
                                    value={editUnitId}
                                    onValueChange={setEditUnitId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'inventory.common.selectUnit',
                                                'Select unit',
                                            )}
                                        />
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
                                <Label>{t('inventory.common.category', 'Category')}</Label>
                                <Select
                                    value={editCategoryId}
                                    onValueChange={setEditCategoryId}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'inventory.common.selectCategory',
                                                'Select category',
                                            )}
                                        />
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
                                <Label>
                                    {t('inventory.common.quantity', 'Quantity')}
                                </Label>
                                <NumericInput
                                    min="0"
                                    value={editQuantity}
                                    onValueChange={setEditQuantity}
                                />
                                <InputError message={editErrors.quantity} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.singlePrice', 'Single Price')}{' '}
                                    {editCurrencySymbol}
                                </Label>
                                <NumericInput
                                    min="0"
                                    value={editUnitPrice}
                                    onValueChange={setEditUnitPrice}
                                />
                                <InputError message={editErrors.unit_price} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.totalPriceAuto', 'Total Price (Auto)')}{' '}
                                    {editCurrencySymbol}
                                </Label>
                                <Input
                                    value={formatPrice(editTotalPrice)}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.paidAmount', 'Paid Amount')}{' '}
                                    {editCurrencySymbol}
                                </Label>
                                <NumericInput
                                    min="0"
                                    value={editPaidAmount}
                                    onValueChange={setEditPaidAmount}
                                />
                                <InputError message={editErrors.paid_amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'inventory.common.remainingAmountAuto',
                                        'Remaining Amount (Auto)',
                                    )}{' '}
                                    {editCurrencySymbol}
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
                                        {t('inventory.common.usableItem', 'Usable item')}
                                    </span>
                                </div>
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t('inventory.common.description', 'Description')}
                                </Label>
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
                                    {t(
                                        'inventory.rowActions.replaceReceipt',
                                        'Replace Receipt/Bill (optional)',
                                    )}
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
                                        {t(
                                            'inventory.common.viewCurrentReceipt',
                                            'View current receipt',
                                        )}
                                    </a>
                                ) : null}
                                {editReceipt ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('inventory.common.newFile', 'New file')}:
                                        {' '}{editReceipt.name}
                                    </p>
                                ) : null}
                                <InputError message={editErrors.receipt} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'inventory.rowActions.currentImages',
                                        'Current Images',
                                    )}
                                </Label>
                                <div className="rounded-lg border p-4">
                                    {existingImages.length === 0 ? (
                                        <span className="text-sm text-muted-foreground">
                                            {t(
                                                'inventory.rowActions.noCurrentImages',
                                                'No current images available.',
                                            )}
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {existingImages.map((image) => {
                                                const markedForRemoval =
                                                    removedExistingImageIds.includes(
                                                        image.id,
                                                    );

                                                return (
                                                    <div
                                                        key={image.id}
                                                        className="relative h-20 w-20 overflow-hidden rounded-md border"
                                                    >
                                                        <img
                                                            src={resolveImageUrl(
                                                                image,
                                                            )}
                                                            alt={t(
                                                                'inventory.rowActions.imageAlt',
                                                                'Inventory image',
                                                            )}
                                                            className={`h-full w-full object-cover ${markedForRemoval ? 'opacity-35' : ''}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute top-1 right-1 rounded bg-black/65 p-1 text-white"
                                                            onClick={() =>
                                                                toggleExistingImageRemoval(
                                                                    image.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <InputError
                                    message={
                                        editErrors.remove_image_ids ??
                                        Object.entries(editErrors).find(
                                            ([key]) =>
                                                key.startsWith(
                                                    'remove_image_ids.',
                                                ),
                                        )?.[1]
                                    }
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'inventory.rowActions.addNewImages',
                                        'Add New Images (optional)',
                                    )}
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'inventory.rowActions.uploadAdditionalImages',
                                                'Upload additional images for this item.',
                                            )}
                                        </p>
                                        <Label
                                            htmlFor={`edit-images-${data.id}`}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            {t('inventory.common.selectImages', 'Select Images')}
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
                            {t('inventory.common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={
                                !editName.trim() ||
                                !editBranchId ||
                                !editTypeId ||
                                !editQuantity ||
                                !editUnitPrice ||
                                !editPaidAmount ||
                                !editCurrencyCode ||
                                isEditSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t('inventory.common.saveChanges', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{data.name}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.details.description',
                                'Inventory item details and latest transactions.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.type', 'Type')}
                            </p>
                            <p className="font-medium capitalize">
                                {data.type}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.branch', 'Branch')}
                            </p>
                            <p className="font-medium">
                                {data.branch?.name ??
                                    t('inventory.common.unknown', 'Unknown')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.vendor', 'Vendor')}
                            </p>
                            <p className="font-medium">
                                {data.vendor?.name ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.stock', 'Stock')}
                            </p>
                            <p className="font-medium">
                                {Number(data.quantity)}{' '}
                                {data.unit ?? t('inventory.common.unit', 'unit')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.usableLabel', 'Usable')}
                            </p>
                            <p className="font-medium">
                                {data.is_usable
                                    ? t('inventory.common.yes', 'Yes')
                                    : t('inventory.common.no', 'No')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.singlePrice', 'Single Price')}
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(data.unit_price ?? 0)}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.totalPrice', 'Total Price')}
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
                                {t('inventory.common.paidAmount', 'Paid Amount')}
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(data.paid_amount ?? 0)}`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'inventory.common.remainingAmount',
                                    'Remaining Amount',
                                )}
                            </p>
                            <p className="font-medium">
                                {`${data.currency_symbol ?? ''}${formatPrice(data.outstanding_amount ?? 0)}`}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.receipt', 'Receipt/Bill')}
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
                                    {t(
                                        'inventory.common.viewUploadedReceipt',
                                        'View uploaded receipt',
                                    )}
                                </a>
                            ) : (
                                <p className="font-medium">-</p>
                            )}
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                {t('inventory.common.description', 'Description')}
                            </p>
                            <p className="font-medium">
                                {data.description || '-'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {t(
                                'inventory.details.latestTransactions',
                                'Latest Transactions',
                            )}
                        </p>
                        <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
                            {latestTransactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'inventory.details.noTransactions',
                                        'No transactions yet.',
                                    )}
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
                        <DialogTitle>
                            {t(
                                'inventory.usageHistory.title',
                                'Usage History',
                            )}{' '}
                            - {data.name}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.usageHistory.description',
                                'Usage cycle records for this usable item.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[65vh] overflow-y-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-left">
                                <tr>
                                    <th className="px-3 py-2 font-medium">
                                        {t('inventory.common.date', 'Date')}
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        {t(
                                            'inventory.usageHistory.amount',
                                            'Usage Amount',
                                        )}
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        {t('inventory.common.note', 'Note')}
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
                                            {t(
                                                'inventory.usageHistory.empty',
                                                'No usage history found.',
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    usageTransactions.map((transaction) => {
                                        const quantity = Math.abs(
                                            Number(transaction.quantity || 0),
                                        );
                                        const dateLabel = transaction.created_at
                                            ? new Intl.DateTimeFormat(dateLocale, {
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
                                                    {data.unit ??
                                                        t(
                                                            'inventory.common.unit',
                                                            'unit',
                                                        )}
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
                        <DialogTitle>
                            {t('inventory.rowActions.restock', 'Restock')}{' '}
                            {data.name}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.rowActions.restockDescription',
                                'Increase stock quantity for this inventory item.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-qty-${data.id}`}>
                                {t(
                                    'inventory.rowActions.quantityToAdd',
                                    'Quantity to add',
                                )}{' '}
                                ({data.unit ?? t('inventory.common.unit', 'unit')})
                            </Label>
                            <NumericInput
                                id={`restock-qty-${data.id}`}
                                min="1"
                                value={restockQty}
                                onValueChange={setRestockQty}
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
                                    {t(
                                        'inventory.rowActions.applyNewPrice',
                                        'Apply new price to all stock',
                                    )}
                                </span>
                            </div>
                        </div>
                        {restockHasNewPrice ? (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`restock-currency-${data.id}`}
                                    >
                                        {t('inventory.common.currency', 'Currency')}
                                    </Label>
                                    <Select
                                        value={restockCurrencyCode}
                                        onValueChange={setRestockCurrencyCode}
                                    >
                                        <SelectTrigger
                                            id={`restock-currency-${data.id}`}
                                        >
                                            <SelectValue
                                                placeholder={t(
                                                    'inventory.common.selectCurrency',
                                                    'Select currency',
                                                )}
                                            />
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
                                        {t(
                                            'inventory.rowActions.newSinglePrice',
                                            'New Single Price',
                                        )}{' '}
                                        {restockCurrencySymbol}
                                    </Label>
                                    <NumericInput
                                        id={`restock-price-${data.id}`}
                                        min="0"
                                        value={restockUnitPrice}
                                        onValueChange={setRestockUnitPrice}
                                    />
                                    <InputError message={errors.unit_price} />
                                </div>
                            </>
                        ) : null}
                        <div className="grid gap-2">
                            <Label htmlFor={`restock-note-${data.id}`}>
                                {t('inventory.common.noteOptional', 'Note (optional)')}
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
                                {t(
                                    'inventory.rowActions.uploadReceipt',
                                    'Upload Receipt/Bill (optional)',
                                )}
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
                                    {t(
                                        'inventory.common.viewCurrentReceipt',
                                        'View current receipt',
                                    )}
                                </a>
                            ) : null}
                            {restockReceipt ? (
                                <p className="text-xs text-muted-foreground">
                                    {t('inventory.common.newFile', 'New file')}:
                                    {' '}{restockReceipt.name}
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
                            {t('inventory.common.cancel', 'Cancel')}
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
                            {t(
                                'inventory.rowActions.saveRestock',
                                'Save Restock',
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
