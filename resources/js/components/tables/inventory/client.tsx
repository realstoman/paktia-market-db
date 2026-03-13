import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
import {
    Branch,
    Currency,
    InventoryCategory,
    InventoryItem,
    InventoryType,
    Unit,
    Vendor,
} from '@/types';
import { formatAfn, formatNumber, formatPrice } from '@/utils/format';
import { router } from '@inertiajs/react';
import {
    Clock,
    ImagePlus,
    Pencil,
    Plus,
    Save,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
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
    currencies: Currency[];
    units: Unit[];
    categories: InventoryCategory[];
    inventoryTypes: InventoryType[];
    isLoading?: boolean;
}

const MAX_IMAGES = 10;
const VENDOR_NONE = '__none__';
const DEFAULT_CURRENCY_CODE = 'AFN';
const LOW_STOCK_THRESHOLD = 10;

export const InventoryClient: React.FC<InventoryClientProps> = ({
    data,
    branches,
    vendors,
    currencies,
    units,
    categories,
    inventoryTypes,
    isLoading = false,
}) => {
    interface UsageCycleItem {
        id: string;
        inventoryItemId: string;
        quantityUsed: string;
        note: string;
    }

    const FILTER_ALL = '__all__';
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isUsageCycleOpen, setIsUsageCycleOpen] = useState(false);
    const [name, setName] = useState('');
    const [branchId, setBranchId] = useState('');
    const [inventoryTypeId, setInventoryTypeId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [vendorId, setVendorId] = useState(VENDOR_NONE);
    const [unitId, setUnitId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY_CODE);
    const [description, setDescription] = useState('');
    const [isUsable, setIsUsable] = useState(true);
    const [receipt, setReceipt] = useState<File | null>(null);
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
    const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
    const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isVendorSubmitting, setIsVendorSubmitting] = useState(false);
    const [isCurrencySubmitting, setIsCurrencySubmitting] = useState(false);
    const [vendorErrors, setVendorErrors] = useState<Record<string, string>>(
        {},
    );
    const [currencyErrors, setCurrencyErrors] = useState<
        Record<string, string>
    >({});
    const [vendorName, setVendorName] = useState('');
    const [vendorCategory, setVendorCategory] = useState('');
    const [vendorAddress, setVendorAddress] = useState('');
    const [vendorContactPerson, setVendorContactPerson] = useState('');
    const [vendorPhone, setVendorPhone] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorNotes, setVendorNotes] = useState('');
    const [unitName, setUnitName] = useState('');
    const [unitSymbol, setUnitSymbol] = useState('');
    const [unitDescription, setUnitDescription] = useState('');
    const [typeName, setTypeName] = useState('');
    const [typeDescription, setTypeDescription] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
    const [currencyName, setCurrencyName] = useState('');
    const [currencyCodeInput, setCurrencyCodeInput] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('');
    const [editingCurrencyId, setEditingCurrencyId] = useState<number | null>(
        null,
    );
    const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
    const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
        null,
    );
    const [selectedBranchFilter, setSelectedBranchFilter] =
        useState(FILTER_ALL);
    const [selectedTypeFilter, setSelectedTypeFilter] = useState(FILTER_ALL);
    const [selectedVendorFilter, setSelectedVendorFilter] =
        useState(FILTER_ALL);
    const [selectedStockFilter, setSelectedStockFilter] = useState(FILTER_ALL);
    const [usageDate, setUsageDate] = useState(
        new Date().toISOString().slice(0, 10),
    );
    const [usageItems, setUsageItems] = useState<UsageCycleItem[]>([
        {
            id: 'usage-0',
            inventoryItemId: '',
            quantityUsed: '',
            note: '',
        },
    ]);
    const [usageErrors, setUsageErrors] = useState<Record<string, string>>({});
    const [isUsageSubmitting, setIsUsageSubmitting] = useState(false);

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
        setInventoryTypeId('');
        setQuantity('');
        setUnitPrice('');
        setPaidAmount('');
        setVendorId(VENDOR_NONE);
        setUnitId('');
        setCategoryId('');
        setCurrencyCode(DEFAULT_CURRENCY_CODE);
        setDescription('');
        setIsUsable(true);
        setReceipt(null);
        clearSelectedImages();
        setErrors({});
    };

    const resetUsageCycleForm = () => {
        setUsageDate(new Date().toISOString().slice(0, 10));
        setUsageItems([
            {
                id: `${Date.now()}-usage-0`,
                inventoryItemId: '',
                quantityUsed: '',
                note: '',
            },
        ]);
        setUsageErrors({});
    };

    const addUsageItemRow = () => {
        setUsageItems((prev) => [
            ...prev,
            {
                id: `${Date.now()}-usage-${prev.length}`,
                inventoryItemId: '',
                quantityUsed: '',
                note: '',
            },
        ]);
    };

    const removeUsageItemRow = (rowId: string) => {
        setUsageItems((prev) =>
            prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId),
        );
    };

    const updateUsageItemField = (
        rowId: string,
        field: 'inventoryItemId' | 'quantityUsed' | 'note',
        value: string,
    ) => {
        setUsageItems((prev) =>
            prev.map((row) =>
                row.id === rowId ? { ...row, [field]: value } : row,
            ),
        );
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

    const resetUnitForm = () => {
        setUnitName('');
        setUnitSymbol('');
        setUnitDescription('');
        setErrors({});
        setEditingUnitId(null);
    };

    const resetTypeForm = () => {
        setTypeName('');
        setTypeDescription('');
        setErrors({});
        setEditingTypeId(null);
    };

    const resetCategoryForm = () => {
        setCategoryName('');
        setCategoryDescription('');
        setErrors({});
        setEditingCategoryId(null);
    };

    const populateCategoryForm = (category: InventoryCategory) => {
        setCategoryName(category.name ?? '');
        setCategoryDescription(category.description ?? '');
        setErrors({});
        setEditingCategoryId(category.id);
        setIsCategoryDialogOpen(true);
    };

    const populateUnitForm = (unit: Unit) => {
        setUnitName(unit.name ?? '');
        setUnitSymbol(unit.symbol ?? '');
        setUnitDescription(unit.description ?? '');
        setErrors({});
        setEditingUnitId(unit.id);
        setIsUnitDialogOpen(true);
    };

    const populateTypeForm = (entry: InventoryType) => {
        setTypeName(entry.name ?? '');
        setTypeDescription(entry.description ?? '');
        setErrors({});
        setEditingTypeId(entry.id);
        setIsTypeDialogOpen(true);
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
            ? `/vendors/${editingVendorId}`
            : '/vendors';

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

    const resetCurrencyForm = () => {
        setCurrencyName('');
        setCurrencyCodeInput('');
        setCurrencySymbol('');
        setCurrencyErrors({});
        setEditingCurrencyId(null);
    };

    const populateCurrencyForm = (currency: Currency) => {
        setCurrencyName(currency.name ?? '');
        setCurrencyCodeInput(currency.code ?? '');
        setCurrencySymbol(currency.symbol ?? '');
        setCurrencyErrors({});
        setEditingCurrencyId(currency.id);
        setIsCurrencyDialogOpen(true);
    };

    const handleSaveCurrency = () => {
        if (
            !currencyName.trim() ||
            !currencyCodeInput.trim() ||
            !currencySymbol.trim() ||
            isCurrencySubmitting
        ) {
            return;
        }

        setIsCurrencySubmitting(true);

        const payload = {
            name: currencyName.trim(),
            code: currencyCodeInput.trim().toUpperCase(),
            symbol: currencySymbol.trim(),
            is_active: true,
        };

        const url = editingCurrencyId
            ? `/currencies/${editingCurrencyId}`
            : '/currencies';

        router.post(
            url,
            editingCurrencyId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        editingCurrencyId
                            ? 'Currency updated successfully.'
                            : 'Currency created successfully.',
                    );
                    setIsCurrencyDialogOpen(false);
                    resetCurrencyForm();
                },
                onError: (validationErrors) => {
                    setCurrencyErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to save currency.',
                    );
                },
                onFinish: () => {
                    setIsCurrencySubmitting(false);
                },
            },
        );
    };

    const handleDeleteCurrency = (currency: Currency) => {
        router.delete(`/currencies/${currency.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Currency deleted successfully.');
                if (currency.code === currencyCode) {
                    setCurrencyCode(DEFAULT_CURRENCY_CODE);
                }
            },
            onError: () => {
                toast.error('Failed to delete currency.');
            },
        });
    };

    const handleSaveUnit = () => {
        if (!unitName.trim() || !unitSymbol.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: unitName.trim(),
            symbol: unitSymbol.trim(),
            description: unitDescription.trim() || null,
            is_active: true,
        };

        const url = editingUnitId ? `/units/${editingUnitId}` : '/units';

        router.post(
            url,
            editingUnitId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        editingUnitId
                            ? 'Unit updated successfully.'
                            : 'Unit created successfully.',
                    );
                    setIsUnitDialogOpen(false);
                    resetUnitForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to save unit.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteUnit = (unit: Unit) => {
        router.delete(`/units/${unit.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Unit deleted successfully.');
                if (String(unit.id) === unitId) {
                    setUnitId('');
                }
            },
            onError: () => {
                toast.error('Failed to delete unit.');
            },
        });
    };

    const handleSaveType = () => {
        if (!typeName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: typeName.trim(),
            description: typeDescription.trim() || null,
            is_active: true,
        };

        const url = editingTypeId
            ? `/inventory-types/${editingTypeId}`
            : '/inventory-types';

        router.post(
            url,
            editingTypeId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        editingTypeId
                            ? 'Inventory type updated successfully.'
                            : 'Inventory type created successfully.',
                    );
                    setIsTypeDialogOpen(false);
                    resetTypeForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to save inventory type.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteType = (entry: InventoryType) => {
        router.delete(`/inventory-types/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Inventory type deleted successfully.');
                if (String(entry.id) === inventoryTypeId) {
                    setInventoryTypeId('');
                }
            },
            onError: () => {
                toast.error('Failed to delete inventory type.');
            },
        });
    };

    const handleSaveCategory = () => {
        if (!categoryName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: categoryName.trim(),
            description: categoryDescription.trim() || null,
            is_active: true,
        };

        const url = editingCategoryId
            ? `/inventory-categories/${editingCategoryId}`
            : '/inventory-categories';

        router.post(
            url,
            editingCategoryId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        editingCategoryId
                            ? 'Category updated successfully.'
                            : 'Category created successfully.',
                    );
                    setIsCategoryDialogOpen(false);
                    resetCategoryForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to save category.',
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteCategory = (category: InventoryCategory) => {
        router.delete(`/inventory-categories/${category.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Category deleted successfully.');
                if (String(category.id) === categoryId) {
                    setCategoryId('');
                }
            },
            onError: () => {
                toast.error('Failed to delete category.');
            },
        });
    };

    const handleCreate = () => {
        if (
            !name.trim() ||
            !branchId ||
            !inventoryTypeId ||
            !quantity ||
            !unitPrice ||
            !paidAmount ||
            !currencyCode ||
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
                inventory_type_id: Number(inventoryTypeId),
                quantity: Number(quantity),
                unit_price: Number(unitPrice),
                paid_amount: Number(paidAmount),
                currency_code: currencyCode,
                vendor_id:
                    vendorId && vendorId !== VENDOR_NONE
                        ? Number(vendorId)
                        : null,
                unit_id: unitId ? Number(unitId) : null,
                category_id: categoryId ? Number(categoryId) : null,
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

    const handleSaveUsageCycle = () => {
        const hasInvalidRows = usageItems.some(
            (row) => !row.inventoryItemId || !row.quantityUsed,
        );

        if (!usageDate || hasInvalidRows || isUsageSubmitting) {
            return;
        }

        setIsUsageSubmitting(true);
        router.post(
            '/inventory/usage-cycle',
            {
                usage_date: usageDate,
                items: usageItems.map((row) => ({
                    inventory_item_id: Number(row.inventoryItemId),
                    quantity: Number(row.quantityUsed),
                    note: row.note.trim() || null,
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Usage cycle saved successfully.');
                    setIsUsageCycleOpen(false);
                    resetUsageCycleForm();
                },
                onError: (validationErrors) => {
                    setUsageErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            'Failed to save usage cycle.',
                    );
                },
                onFinish: () => {
                    setIsUsageSubmitting(false);
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

    const selectedCurrencySymbol = useMemo(() => {
        const matched = currencies.find((entry) => entry.code === currencyCode);
        return matched?.symbol ?? '';
    }, [currencies, currencyCode]);

    const remainingAmount = useMemo(() => {
        const paid = Number(paidAmount);
        if (Number.isNaN(paid)) return totalPrice;
        return Math.max(0, totalPrice - paid);
    }, [paidAmount, totalPrice]);

    const usableItems = useMemo(() => {
        return data.filter(
            (item) => item.is_usable && Number(item.quantity || 0) > 0,
        );
    }, [data]);

    const usageSummary = useMemo(() => {
        let totalQuantityUsed = 0;
        let totalValuation = 0;

        for (const row of usageItems) {
            const qty = Number(row.quantityUsed || 0);
            if (Number.isNaN(qty) || qty <= 0) continue;

            const selectedItem = usableItems.find(
                (item) => String(item.id) === row.inventoryItemId,
            );

            if (!selectedItem) continue;

            const unitPrice = Number(selectedItem.unit_price || 0);
            totalQuantityUsed += qty;
            totalValuation += qty * unitPrice;
        }

        return {
            totalQuantityUsed,
            totalValuation,
        };
    }, [usageItems, usableItems]);

    const tableColumns = useMemo(
        () =>
            buildColumns(
                branches,
                vendors,
                currencies,
                units,
                categories,
                inventoryTypes,
            ),
        [branches, vendors, currencies, units, categories, inventoryTypes],
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
            const quantity = Number(item.quantity || 0);
            const branchMatch =
                selectedBranchFilter === FILTER_ALL ||
                String(item.branch_id) === selectedBranchFilter;

            const vendorMatch =
                selectedVendorFilter === FILTER_ALL ||
                String(item.vendor_id ?? '') === selectedVendorFilter;

            const typeMatch =
                selectedTypeFilter === FILTER_ALL ||
                (selectedTypeFilter === 'usable' && item.is_usable) ||
                (selectedTypeFilter === 'not_usable' && !item.is_usable) ||
                (item.type ?? '').trim().toLowerCase() === selectedTypeFilter;

            const stockMatch =
                selectedStockFilter === FILTER_ALL ||
                (selectedStockFilter === 'low_stock' &&
                    quantity > 0 &&
                    quantity <= LOW_STOCK_THRESHOLD) ||
                (selectedStockFilter === 'out_of_stock' && quantity <= 0);

            return branchMatch && vendorMatch && typeMatch && stockMatch;
        });
    }, [
        data,
        selectedBranchFilter,
        selectedVendorFilter,
        selectedTypeFilter,
        selectedStockFilter,
    ]);

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
                        onClick={() => setIsUsageCycleOpen(true)}
                        className="gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Usage
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetCategoryForm();
                            setIsCategoryDialogOpen(true);
                        }}
                        className="gap-2"
                    >
                        <Tag className="h-4 w-4" />
                        Categories
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetUnitForm();
                            setIsUnitDialogOpen(true);
                        }}
                        className="gap-2"
                    >
                        <ImagePlus className="h-4 w-4" />
                        Units
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetTypeForm();
                            setIsTypeDialogOpen(true);
                        }}
                        className="gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Types
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
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
                        <SearchableDropdown
                            value={selectedBranchFilter}
                            onValueChange={setSelectedBranchFilter}
                            placeholder="Filter by branch"
                            searchPlaceholder="Search branches..."
                            emptyText="No branches found."
                            className="w-[180px]"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: 'All Branches',
                                },
                                ...branches.map((branch) => ({
                                    value: String(branch.id),
                                    label: branch.name,
                                })),
                            ]}
                        />

                        <SearchableDropdown
                            value={selectedTypeFilter}
                            onValueChange={setSelectedTypeFilter}
                            placeholder="Filter by type"
                            searchPlaceholder="Search types..."
                            emptyText="No types found."
                            className="w-[200px]"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: 'All Types',
                                },
                                {
                                    value: 'usable',
                                    label: 'Usable',
                                },
                                {
                                    value: 'not_usable',
                                    label: 'Not Usable',
                                },
                                ...availableTypes.map((typeEntry) => ({
                                    value: typeEntry,
                                    label:
                                        typeEntry.charAt(0).toUpperCase() +
                                        typeEntry.slice(1),
                                })),
                            ]}
                        />

                        <SearchableDropdown
                            value={selectedVendorFilter}
                            onValueChange={setSelectedVendorFilter}
                            placeholder="Filter by vendor"
                            searchPlaceholder="Search vendors..."
                            emptyText="No vendors found."
                            className="w-[220px]"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: 'All Vendors',
                                },
                                ...vendors.map((vendor) => ({
                                    value: String(vendor.id),
                                    label: vendor.name,
                                })),
                            ]}
                        />

                        <SearchableDropdown
                            value={selectedStockFilter}
                            onValueChange={setSelectedStockFilter}
                            placeholder="Filter by stock"
                            searchPlaceholder="Search stock status..."
                            emptyText="No stock filters found."
                            className="w-[220px]"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: 'All Stock Levels',
                                },
                                {
                                    value: 'low_stock',
                                    label: `Low Stock (<= ${LOW_STOCK_THRESHOLD})`,
                                },
                                {
                                    value: 'out_of_stock',
                                    label: 'Out of Stock',
                                },
                            ]}
                        />
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
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
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
                                            onClick={() =>
                                                populateVendorForm(vendor)
                                            }
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
                open={isCurrencyDialogOpen}
                onOpenChange={(open) => {
                    setIsCurrencyDialogOpen(open);
                    if (!open) {
                        resetCurrencyForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCurrencyId
                                ? 'Edit Currency'
                                : 'Manage Currencies'}
                        </DialogTitle>
                        <DialogDescription>
                            Add, update, and remove currencies by name and
                            symbol.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={currencyName}
                                onChange={(event) =>
                                    setCurrencyName(event.target.value)
                                }
                            />
                            <InputError message={currencyErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Code</Label>
                            <Input
                                maxLength={3}
                                value={currencyCodeInput}
                                onChange={(event) =>
                                    setCurrencyCodeInput(event.target.value)
                                }
                            />
                            <InputError message={currencyErrors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Symbol</Label>
                            <Input
                                value={currencySymbol}
                                onChange={(event) =>
                                    setCurrencySymbol(event.target.value)
                                }
                            />
                            <InputError message={currencyErrors.symbol} />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={resetCurrencyForm}
                            disabled={isCurrencySubmitting}
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={handleSaveCurrency}
                            disabled={
                                !currencyName.trim() ||
                                !currencyCodeInput.trim() ||
                                !currencySymbol.trim() ||
                                isCurrencySubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingCurrencyId
                                ? 'Update Currency'
                                : 'Save Currency'}
                        </Button>
                    </DialogFooter>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Existing Currencies
                        </p>
                        <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                            {currencies.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No currencies yet.
                                </p>
                            ) : (
                                currencies.map((currency) => (
                                    <div
                                        key={currency.id}
                                        className="flex items-center justify-between rounded-md border p-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {currency.name} ({currency.code}
                                                )
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Symbol: {currency.symbol}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    populateCurrencyForm(
                                                        currency,
                                                    )
                                                }
                                            >
                                                <Pencil className="mr-1 h-3 w-3" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteCurrency(
                                                        currency,
                                                    )
                                                }
                                            >
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isUnitDialogOpen}
                onOpenChange={(open) => {
                    setIsUnitDialogOpen(open);
                    if (!open) {
                        resetUnitForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingUnitId ? 'Edit Unit' : 'Manage Units'}
                        </DialogTitle>
                        <DialogDescription>
                            Add, update, and remove units used in inventory
                            items.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={unitName}
                                onChange={(event) =>
                                    setUnitName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Symbol</Label>
                            <Input
                                value={unitSymbol}
                                onChange={(event) =>
                                    setUnitSymbol(event.target.value)
                                }
                            />
                            <InputError message={errors.symbol} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                value={unitDescription}
                                onChange={(event) =>
                                    setUnitDescription(event.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={resetUnitForm}>
                            Clear
                        </Button>
                        <Button
                            onClick={handleSaveUnit}
                            disabled={
                                isSubmitting ||
                                !unitName.trim() ||
                                !unitSymbol.trim()
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingUnitId ? 'Update Unit' : 'Save Unit'}
                        </Button>
                    </DialogFooter>

                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {units.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No units yet.
                            </p>
                        ) : (
                            units.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between rounded-md border p-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {entry.name} ({entry.symbol})
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.description || '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                populateUnitForm(entry)
                                            }
                                        >
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleDeleteUnit(entry)
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isTypeDialogOpen}
                onOpenChange={(open) => {
                    setIsTypeDialogOpen(open);
                    if (!open) {
                        resetTypeForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTypeId
                                ? 'Edit Inventory Type'
                                : 'Manage Inventory Types'}
                        </DialogTitle>
                        <DialogDescription>
                            Add, update, and remove inventory item types.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={typeName}
                                onChange={(event) =>
                                    setTypeName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                value={typeDescription}
                                onChange={(event) =>
                                    setTypeDescription(event.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={resetTypeForm}>
                            Clear
                        </Button>
                        <Button
                            onClick={handleSaveType}
                            disabled={isSubmitting || !typeName.trim()}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingTypeId ? 'Update Type' : 'Save Type'}
                        </Button>
                    </DialogFooter>

                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {inventoryTypes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No inventory types yet.
                            </p>
                        ) : (
                            inventoryTypes.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between rounded-md border p-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {entry.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.description || '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                populateTypeForm(entry)
                                            }
                                        >
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleDeleteType(entry)
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCategoryDialogOpen}
                onOpenChange={(open) => {
                    setIsCategoryDialogOpen(open);
                    if (!open) {
                        resetCategoryForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategoryId
                                ? 'Edit Category'
                                : 'Manage Categories'}
                        </DialogTitle>
                        <DialogDescription>
                            Add, update, and remove inventory categories.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={categoryName}
                                onChange={(event) =>
                                    setCategoryName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input
                                value={categoryDescription}
                                onChange={(event) =>
                                    setCategoryDescription(event.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={resetCategoryForm}>
                            Clear
                        </Button>
                        <Button
                            onClick={handleSaveCategory}
                            disabled={isSubmitting || !categoryName.trim()}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingCategoryId
                                ? 'Update Category'
                                : 'Save Category'}
                        </Button>
                    </DialogFooter>

                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No categories yet.
                            </p>
                        ) : (
                            categories.map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between rounded-md border p-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {entry.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {entry.description || '-'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                populateCategoryForm(entry)
                                            }
                                        >
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleDeleteCategory(entry)
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
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
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Create Inventory Item</DialogTitle>
                        <DialogDescription>
                            Add a new item with stock quantity, price,
                            receipt/bill, and images.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Branch</Label>
                                <Select
                                    value={branchId}
                                    onValueChange={setBranchId}
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
                                <InputError message={errors.branch_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Vendor (optional)</Label>
                                <Select
                                    value={vendorId}
                                    onValueChange={setVendorId}
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
                                <InputError message={errors.vendor_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Currency</Label>
                                <Select
                                    value={currencyCode}
                                    onValueChange={setCurrencyCode}
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
                                <InputError message={errors.currency_code} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select
                                    value={inventoryTypeId}
                                    onValueChange={setInventoryTypeId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
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
                                    message={errors.inventory_type_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit</Label>
                                <Select
                                    value={unitId}
                                    onValueChange={setUnitId}
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
                                <InputError message={errors.unit_id} />
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
                                <InputError message={errors.category_id} />
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
                                <Label>
                                    Single Price {selectedCurrencySymbol || ''}
                                </Label>
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
                                <Label>
                                    Total Price (Auto){' '}
                                    {selectedCurrencySymbol || ''}
                                </Label>
                                <Input
                                    value={`${selectedCurrencySymbol}${formatPrice(totalPrice)}`}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    Paid Amount {selectedCurrencySymbol || ''}
                                </Label>
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
                                <Label>
                                    Remaining Amount (Auto){' '}
                                    {selectedCurrencySymbol || ''}
                                </Label>
                                <Input
                                    value={`${selectedCurrencySymbol}${formatPrice(remainingAmount)}`}
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
                                        setReceipt(
                                            event.target.files?.[0] ?? null,
                                        )
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
                                            handleImageChange(
                                                event.target.files,
                                            )
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
                                                        className="absolute top-1 right-1 rounded bg-black/65 p-1 text-white"
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
                                !inventoryTypeId ||
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

            <Dialog
                open={isUsageCycleOpen}
                onOpenChange={(open) => {
                    setIsUsageCycleOpen(open);
                    if (!open) {
                        resetUsageCycleForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Usage Cycle</DialogTitle>
                        <DialogDescription>
                            Record usable item consumption and deduct stock.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={usageDate}
                                    onChange={(event) =>
                                        setUsageDate(event.target.value)
                                    }
                                />
                                <InputError message={usageErrors.usage_date} />
                            </div>

                            <div className="space-y-3">
                                {usageItems.map((row, index) => {
                                    const selectedItem = usableItems.find(
                                        (item) =>
                                            String(item.id) ===
                                            row.inventoryItemId,
                                    );

                                    return (
                                        <div
                                            key={row.id}
                                            className="space-y-3 rounded-md border p-3"
                                        >
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label>Usable Item</Label>
                                                    <Select
                                                        value={
                                                            row.inventoryItemId
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateUsageItemField(
                                                                row.id,
                                                                'inventoryItemId',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select usable item" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {usableItems.map(
                                                                (item) => (
                                                                    <SelectItem
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        value={String(
                                                                            item.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }{' '}
                                                                        (
                                                                        {item
                                                                            .branch
                                                                            ?.name ??
                                                                            `Branch #${item.branch_id}`}
                                                                        ) -
                                                                        Available:{' '}
                                                                        {Number(
                                                                            item.quantity ||
                                                                                0,
                                                                        )}{' '}
                                                                        {item.unit ??
                                                                            'unit'}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <InputError
                                                        message={
                                                            usageErrors[
                                                                `items.${index}.inventory_item_id`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Quantity Used</Label>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={row.quantityUsed}
                                                        onChange={(event) =>
                                                            updateUsageItemField(
                                                                row.id,
                                                                'quantityUsed',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            usageErrors[
                                                                `items.${index}.quantity`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2 sm:col-span-2">
                                                    <Label>
                                                        Note (optional)
                                                    </Label>
                                                    <Textarea
                                                        value={row.note}
                                                        onChange={(event) =>
                                                            updateUsageItemField(
                                                                row.id,
                                                                'note',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            usageErrors[
                                                                `items.${index}.note`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {selectedItem ? (
                                                <p className="text-xs text-muted-foreground">
                                                    Unit Price:{' '}
                                                    {selectedItem.currency_symbol ??
                                                        ''}
                                                    {formatPrice(
                                                        selectedItem.unit_price ||
                                                            0,
                                                    )}{' '}
                                                    | Available:{' '}
                                                    {Number(
                                                        selectedItem.quantity ||
                                                            0,
                                                    )}{' '}
                                                    {selectedItem.unit ??
                                                        'unit'}
                                                </p>
                                            ) : null}

                                            {usageItems.length > 1 ? (
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeUsageItemRow(
                                                                row.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-1 h-3 w-3" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addUsageItemRow}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </Button>
                                <InputError message={usageErrors.items} />
                            </div>

                            <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Total Number Used
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatNumber(
                                            usageSummary.totalQuantityUsed,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Total Valuation
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatAfn(usageSummary.totalValuation)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsUsageCycleOpen(false)}
                            disabled={isUsageSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveUsageCycle}
                            disabled={
                                !usageDate ||
                                usageItems.some(
                                    (row) =>
                                        !row.inventoryItemId ||
                                        !row.quantityUsed,
                                ) ||
                                isUsageSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Usage Cycle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
