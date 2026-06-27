import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
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
import { DataTable } from '@/components/ui/table/data-table';
import { Textarea } from '@/components/ui/textarea';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import {
    Currency,
    InventoryCategory,
    InventoryItem,
    InventoryType,
    Property,
    SharedData,
    Unit,
    Vendor,
} from '@/types';
import {
    formatAfn,
    formatCurrencySymbol,
    formatNumber,
    formatPrice,
} from '@/utils/format';
import { router, usePage } from '@inertiajs/react';
import {
    Clock,
    ImagePlus,
    PackageSearch,
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
    properties: Property[];
    vendors: Vendor[];
    currencies: Currency[];
    units: Unit[];
    categories: InventoryCategory[];
    inventoryTypes: InventoryType[];
    isLoading?: boolean;
}

type ManagedInventoryDeleteType = 'unit' | 'type' | 'category';

const MAX_IMAGES = 10;
const VENDOR_NONE = '__none__';
const DEFAULT_CURRENCY_CODE = 'AFN';
const LOW_STOCK_THRESHOLD = 10;

export const InventoryClient: React.FC<InventoryClientProps> = ({
    data,
    properties,
    vendors,
    currencies,
    units,
    categories,
    inventoryTypes,
    isLoading = false,
}) => {
    const { t } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const { can } = useAuthorization();
    const canAdjustInventory = can('inventory.adjust');
    const canDeleteInventory = can('inventory.delete');
    const canDeleteInventoryResources =
        canDeleteInventory &&
        (auth.is_super_admin === true || auth.roles.includes('super-admin'));
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
    const [propertyId, setPropertyId] = useState('');
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
    const [deleteTarget, setDeleteTarget] = useState<{
        type: ManagedInventoryDeleteType;
        id: number;
        name: string;
        dependentCount: number;
    } | null>(null);
    const [replacementResourceId, setReplacementResourceId] = useState('');
    const [deleteResourceErrors, setDeleteResourceErrors] = useState<
        Record<string, string>
    >({});
    const [isDeleteResourceSubmitting, setIsDeleteResourceSubmitting] =
        useState(false);
    const [selectedPropertyFilter, setSelectedPropertyFilter] =
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

    const propertySelectOptions = useMemo(
        () =>
            properties.map((property) => ({
                value: String(property.id),
                label: property.name,
            })),
        [properties],
    );

    useAutoSelectSingleOption(propertySelectOptions, propertyId, setPropertyId);

    const clearSelectedImages = () => {
        images.forEach((image) => URL.revokeObjectURL(image.preview));
        setImages([]);
    };

    const resetForm = () => {
        setName('');
        setPropertyId('');
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

    const openDeleteDialog = (
        type: ManagedInventoryDeleteType,
        entry: Unit | InventoryType | InventoryCategory,
    ) => {
        const dependentCount = data.filter((item) => {
            if (type === 'unit') {
                return item.unit_id === entry.id;
            }

            if (type === 'type') {
                return item.inventory_type_id === entry.id;
            }

            return item.category_id === entry.id;
        }).length;

        setDeleteTarget({
            type,
            id: entry.id,
            name: entry.name,
            dependentCount,
        });
        setReplacementResourceId('');
        setDeleteResourceErrors({});
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
                            ? t(
                                  'inventory.vendorModal.updated',
                                  'Vendor updated successfully.',
                              )
                            : t(
                                  'inventory.vendorModal.created',
                                  'Vendor created successfully.',
                              ),
                    );
                    setIsVendorDialogOpen(false);
                    resetVendorForm();
                },
                onError: (validationErrors) => {
                    setVendorErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.vendorModal.saveFailed',
                                'Failed to save vendor.',
                            ),
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
                            ? t(
                                  'inventory.currencyModal.updated',
                                  'Currency updated successfully.',
                              )
                            : t(
                                  'inventory.currencyModal.created',
                                  'Currency created successfully.',
                              ),
                    );
                    setIsCurrencyDialogOpen(false);
                    resetCurrencyForm();
                },
                onError: (validationErrors) => {
                    setCurrencyErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.currencyModal.saveFailed',
                                'Failed to save currency.',
                            ),
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
                toast.success(
                    t(
                        'inventory.currencyModal.deleted',
                        'Currency deleted successfully.',
                    ),
                );
                if (currency.code === currencyCode) {
                    setCurrencyCode(DEFAULT_CURRENCY_CODE);
                }
            },
            onError: () => {
                toast.error(
                    t(
                        'inventory.currencyModal.deleteFailed',
                        'Failed to delete currency.',
                    ),
                );
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
                            ? t(
                                  'inventory.unitModal.updated',
                                  'Unit updated successfully.',
                              )
                            : t(
                                  'inventory.unitModal.created',
                                  'Unit created successfully.',
                              ),
                    );
                    setIsUnitDialogOpen(false);
                    resetUnitForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.unitModal.saveFailed',
                                'Failed to save unit.',
                            ),
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteUnit = (unit: Unit) => {
        openDeleteDialog('unit', unit);
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
                            ? t(
                                  'inventory.typeModal.updated',
                                  'Inventory type updated successfully.',
                              )
                            : t(
                                  'inventory.typeModal.created',
                                  'Inventory type created successfully.',
                              ),
                    );
                    setIsTypeDialogOpen(false);
                    resetTypeForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.typeModal.saveFailed',
                                'Failed to save inventory type.',
                            ),
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteType = (entry: InventoryType) => {
        openDeleteDialog('type', entry);
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
                            ? t(
                                  'inventory.categoryModal.updated',
                                  'Category updated successfully.',
                              )
                            : t(
                                  'inventory.categoryModal.created',
                                  'Category created successfully.',
                              ),
                    );
                    setIsCategoryDialogOpen(false);
                    resetCategoryForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.categoryModal.saveFailed',
                                'Failed to save category.',
                            ),
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteCategory = (category: InventoryCategory) => {
        openDeleteDialog('category', category);
    };

    const handleCreate = () => {
        if (
            !name.trim() ||
            !propertyId ||
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
                property_id: Number(propertyId),
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
                    toast.success(
                        t(
                            'inventory.createModal.created',
                            'Inventory item created successfully.',
                        ),
                    );
                    setIsCreateOpen(false);
                    resetForm();
                },
                onError: (validationErrors) => {
                    setErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.createModal.createFailed',
                                'Failed to create inventory item.',
                            ),
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
                    toast.success(
                        t(
                            'inventory.usageModal.saved',
                            'Usage cycle saved successfully.',
                        ),
                    );
                    setIsUsageCycleOpen(false);
                    resetUsageCycleForm();
                },
                onError: (validationErrors) => {
                    setUsageErrors(validationErrors);
                    toast.error(
                        Object.values(validationErrors)[0] ||
                            t(
                                'inventory.usageModal.saveFailed',
                                'Failed to save usage cycle.',
                            ),
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
                properties,
                vendors,
                currencies,
                units,
                categories,
                inventoryTypes,
                t,
            ),
        [properties, vendors, currencies, units, categories, inventoryTypes, t],
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
            const propertyMatch =
                selectedPropertyFilter === FILTER_ALL ||
                String(item.property_id) === selectedPropertyFilter;

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

            return propertyMatch && vendorMatch && typeMatch && stockMatch;
        });
    }, [
        data,
        selectedPropertyFilter,
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

    const deleteTargetReplacementOptions = useMemo(() => {
        if (!deleteTarget) return [];

        if (deleteTarget.type === 'unit') {
            return units
                .filter((entry) => entry.id !== deleteTarget.id)
                .map((entry) => ({
                    id: entry.id,
                    label: `${entry.name} (${entry.symbol})`,
                }));
        }

        if (deleteTarget.type === 'type') {
            return inventoryTypes
                .filter((entry) => entry.id !== deleteTarget.id)
                .map((entry) => ({
                    id: entry.id,
                    label: entry.name,
                }));
        }

        return categories
            .filter((entry) => entry.id !== deleteTarget.id)
            .map((entry) => ({
                id: entry.id,
                label: entry.name,
            }));
    }, [categories, deleteTarget, inventoryTypes, units]);

    const handleConfirmManagedDelete = () => {
        if (!deleteTarget || isDeleteResourceSubmitting) {
            return;
        }

        setIsDeleteResourceSubmitting(true);
        setDeleteResourceErrors({});

        const payload: Record<string, number> = {};
        let url = '';
        let successMessage = '';
        let failureMessage = '';

        if (deleteTarget.type === 'unit') {
            url = `/units/${deleteTarget.id}`;
            successMessage = t(
                'inventory.unitModal.deleted',
                'Unit deleted successfully.',
            );
            failureMessage = t(
                'inventory.unitModal.deleteFailed',
                'Failed to delete unit.',
            );

            if (deleteTarget.dependentCount > 0 && replacementResourceId) {
                payload.replacement_unit_id = Number(replacementResourceId);
            }
        } else if (deleteTarget.type === 'type') {
            url = `/inventory-types/${deleteTarget.id}`;
            successMessage = t(
                'inventory.typeModal.deleted',
                'Inventory type deleted successfully.',
            );
            failureMessage = t(
                'inventory.typeModal.deleteFailed',
                'Failed to delete inventory type.',
            );

            if (deleteTarget.dependentCount > 0 && replacementResourceId) {
                payload.replacement_type_id = Number(replacementResourceId);
            }
        } else {
            url = `/inventory-categories/${deleteTarget.id}`;
            successMessage = t(
                'inventory.categoryModal.deleted',
                'Category deleted successfully.',
            );
            failureMessage = t(
                'inventory.categoryModal.deleteFailed',
                'Failed to delete category.',
            );

            if (deleteTarget.dependentCount > 0 && replacementResourceId) {
                payload.replacement_category_id = Number(replacementResourceId);
            }
        }

        router.delete(url, {
            data: payload,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(successMessage);

                if (
                    deleteTarget.type === 'unit' &&
                    String(deleteTarget.id) === unitId
                ) {
                    setUnitId(replacementResourceId || '');
                }

                if (
                    deleteTarget.type === 'type' &&
                    String(deleteTarget.id) === inventoryTypeId
                ) {
                    setInventoryTypeId(replacementResourceId || '');
                }

                if (
                    deleteTarget.type === 'category' &&
                    String(deleteTarget.id) === categoryId
                ) {
                    setCategoryId(replacementResourceId || '');
                }

                setDeleteTarget(null);
                setReplacementResourceId('');
                setDeleteResourceErrors({});
            },
            onError: (validationErrors) => {
                setDeleteResourceErrors(validationErrors);
                toast.error(
                    Object.values(validationErrors)[0] || failureMessage,
                );
            },
            onFinish: () => {
                setIsDeleteResourceSubmitting(false);
            },
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-[#102f33] p-3 text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950">
                        <PackageSearch className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {t(
                                'inventory.toolbar.title',
                                'Inventory Items: :count',
                            ).replace(':count', formatNumber(data.length))}
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-neutral-400">
                            {t(
                                'inventory.toolbar.description',
                                'Manage grocery, food supplies, and other usable/non-usable inventory.',
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canAdjustInventory ? (
                        <Button
                            variant="outline"
                            onClick={() => setIsUsageCycleOpen(true)}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <Clock className="h-4 w-4" />
                            {t('inventory.toolbar.usage', 'Usage')}
                        </Button>
                    ) : null}
                    {canAdjustInventory ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetCategoryForm();
                                setIsCategoryDialogOpen(true);
                            }}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <Tag className="h-4 w-4" />
                            {t('inventory.toolbar.categories', 'Categories')}
                        </Button>
                    ) : null}
                    {canAdjustInventory ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetUnitForm();
                                setIsUnitDialogOpen(true);
                            }}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <ImagePlus className="h-4 w-4" />
                            {t('inventory.toolbar.units', 'Units')}
                        </Button>
                    ) : null}
                    {canAdjustInventory ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetTypeForm();
                                setIsTypeDialogOpen(true);
                            }}
                            className="h-10 gap-2 rounded-xl border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <Pencil className="h-4 w-4" />
                            {t('inventory.toolbar.types', 'Types')}
                        </Button>
                    ) : null}
                    {canAdjustInventory ? (
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-10 gap-2 rounded-xl bg-[#102f33] px-4 text-white shadow-sm hover:bg-[#17464b] dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                        >
                            <Plus className="h-4 w-4" />
                            {t('inventory.toolbar.addNewItem', 'Add New Item')}
                        </Button>
                    ) : null}
                </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-neutral-700" />
            <DataTable
                searchKey={['name', 'type', 'property.name', 'vendor.name']}
                columns={tableColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder={t(
                    'inventory.filters.searchPlaceholder',
                    'Search inventory by item, type, or property...',
                )}
                toolbar={
                    <div className="grid w-full gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <SearchableDropdown
                            value={selectedPropertyFilter}
                            onValueChange={setSelectedPropertyFilter}
                            placeholder={t(
                                'inventory.filters.property',
                                'Filter by property',
                            )}
                            searchPlaceholder={t(
                                'inventory.filters.searchProperties',
                                'Search properties...',
                            )}
                            emptyText={t(
                                'inventory.filters.noProperties',
                                'No properties found.',
                            )}
                            className="w-full rounded-xl bg-white dark:bg-neutral-900"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'inventory.filters.allProperties',
                                        'All Properties',
                                    ),
                                },
                                ...properties.map((property) => ({
                                    value: String(property.id),
                                    label: property.name,
                                })),
                            ]}
                        />

                        <SearchableDropdown
                            value={selectedTypeFilter}
                            onValueChange={setSelectedTypeFilter}
                            placeholder={t(
                                'inventory.filters.type',
                                'Filter by type',
                            )}
                            searchPlaceholder={t(
                                'inventory.filters.searchTypes',
                                'Search types...',
                            )}
                            emptyText={t(
                                'inventory.filters.noTypes',
                                'No types found.',
                            )}
                            className="w-full rounded-xl bg-white dark:bg-neutral-900"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'inventory.filters.allTypes',
                                        'All Types',
                                    ),
                                },
                                {
                                    value: 'usable',
                                    label: t(
                                        'inventory.common.usable',
                                        'Usable',
                                    ),
                                },
                                {
                                    value: 'not_usable',
                                    label: t(
                                        'inventory.common.notUsable',
                                        'Not Usable',
                                    ),
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
                            placeholder={t(
                                'inventory.filters.vendor',
                                'Filter by vendor',
                            )}
                            searchPlaceholder={t(
                                'inventory.filters.searchVendors',
                                'Search vendors...',
                            )}
                            emptyText={t(
                                'inventory.filters.noVendors',
                                'No vendors found.',
                            )}
                            className="w-full rounded-xl bg-white dark:bg-neutral-900"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'inventory.filters.allVendors',
                                        'All Vendors',
                                    ),
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
                            placeholder={t(
                                'inventory.filters.stock',
                                'Filter by stock',
                            )}
                            searchPlaceholder={t(
                                'inventory.filters.searchStock',
                                'Search stock status...',
                            )}
                            emptyText={t(
                                'inventory.filters.noStockFilters',
                                'No stock filters found.',
                            )}
                            className="w-full rounded-xl bg-white dark:bg-neutral-900"
                            options={[
                                {
                                    value: FILTER_ALL,
                                    label: t(
                                        'inventory.filters.allStockLevels',
                                        'All Stock Levels',
                                    ),
                                },
                                {
                                    value: 'low_stock',
                                    label: t(
                                        'inventory.filters.lowStock',
                                        'Low Stock (<= :count)',
                                    ).replace(
                                        ':count',
                                        String(LOW_STOCK_THRESHOLD),
                                    ),
                                },
                                {
                                    value: 'out_of_stock',
                                    label: t(
                                        'inventory.filters.outOfStock',
                                        'Out of Stock',
                                    ),
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
                            {editingVendorId
                                ? t(
                                      'inventory.vendorModal.editTitle',
                                      'Edit Vendor',
                                  )
                                : t(
                                      'inventory.vendorModal.title',
                                      'Manage Vendors',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.vendorModal.description',
                                'Create and update vendors/wholesale stores you buy inventory from.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'inventory.vendorModal.storeName',
                                    'Store Name',
                                )}
                            </Label>
                            <Input
                                value={vendorName}
                                onChange={(event) =>
                                    setVendorName(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'inventory.vendorModal.category',
                                    'Category',
                                )}
                            </Label>
                            <Input
                                placeholder={t(
                                    'inventory.vendorModal.categoryPlaceholder',
                                    'Butcher, Grocery, Furniture...',
                                )}
                                value={vendorCategory}
                                onChange={(event) =>
                                    setVendorCategory(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'inventory.vendorModal.contactPerson',
                                    'Contact Person',
                                )}
                            </Label>
                            <Input
                                value={vendorContactPerson}
                                onChange={(event) =>
                                    setVendorContactPerson(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.contact_person} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('inventory.vendorModal.phone', 'Phone')}
                            </Label>
                            <Input
                                value={vendorPhone}
                                onChange={(event) =>
                                    setVendorPhone(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('inventory.vendorModal.email', 'Email')}
                            </Label>
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
                            <Label>
                                {t('inventory.vendorModal.address', 'Address')}
                            </Label>
                            <Input
                                value={vendorAddress}
                                onChange={(event) =>
                                    setVendorAddress(event.target.value)
                                }
                            />
                            <InputError message={vendorErrors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>
                                {t('inventory.vendorModal.notes', 'Notes')}
                            </Label>
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
                            {t('inventory.common.clear', 'Clear')}
                        </Button>
                        <Button
                            onClick={handleSaveVendor}
                            disabled={!vendorName.trim() || isVendorSubmitting}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingVendorId
                                ? t(
                                      'inventory.vendorModal.update',
                                      'Update Vendor',
                                  )
                                : t(
                                      'inventory.vendorModal.save',
                                      'Save Vendor',
                                  )}
                        </Button>
                    </DialogFooter>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {t(
                                'inventory.vendorModal.existing',
                                'Existing Vendors',
                            )}
                        </p>
                        <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                            {vendors.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'inventory.vendorModal.empty',
                                        'No vendors yet.',
                                    )}
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
                                                {vendor.phone || '-'} |{' '}
                                                {t(
                                                    'inventory.common.owed',
                                                    'Owed',
                                                )}
                                                :
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
                                            {t('inventory.common.edit', 'Edit')}
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
                                ? t(
                                      'inventory.currencyModal.editTitle',
                                      'Edit Currency',
                                  )
                                : t(
                                      'inventory.currencyModal.title',
                                      'Manage Currencies',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.currencyModal.description',
                                'Add, update, and remove currencies by name and symbol.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>{t('inventory.common.name', 'Name')}</Label>
                            <Input
                                value={currencyName}
                                onChange={(event) =>
                                    setCurrencyName(event.target.value)
                                }
                            />
                            <InputError message={currencyErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('inventory.currencyModal.code', 'Code')}
                            </Label>
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
                            <Label>
                                {t('inventory.currencyModal.symbol', 'Symbol')}
                            </Label>
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
                            {t('inventory.common.clear', 'Clear')}
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
                                ? t(
                                      'inventory.currencyModal.update',
                                      'Update Currency',
                                  )
                                : t(
                                      'inventory.currencyModal.save',
                                      'Save Currency',
                                  )}
                        </Button>
                    </DialogFooter>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {t(
                                'inventory.currencyModal.existing',
                                'Existing Currencies',
                            )}
                        </p>
                        <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                            {currencies.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'inventory.currencyModal.empty',
                                        'No currencies yet.',
                                    )}
                                </p>
                            ) : (
                                currencies.map((currency) => (
                                    <div
                                        key={currency.id}
                                        className="flex items-center justify-between rounded-md border p-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {currency.name} (
                                                {formatCurrencySymbol(currency)}
                                                )
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    'inventory.currencyModal.symbol',
                                                    'Symbol',
                                                )}
                                                : {currency.symbol}
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
                                                {t(
                                                    'inventory.common.edit',
                                                    'Edit',
                                                )}
                                            </Button>
                                            {canDeleteInventoryResources ? (
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
                                                    {t(
                                                        'inventory.common.delete',
                                                        'Delete',
                                                    )}
                                                </Button>
                                            ) : null}
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
                            {editingUnitId
                                ? t(
                                      'inventory.unitModal.editTitle',
                                      'Edit Unit',
                                  )
                                : t(
                                      'inventory.unitModal.title',
                                      'Manage Units',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.unitModal.description',
                                'Add, update, and remove units used in inventory items.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label>{t('inventory.common.name', 'Name')}</Label>
                            <Input
                                value={unitName}
                                onChange={(event) =>
                                    setUnitName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('inventory.unitModal.symbol', 'Symbol')}
                            </Label>
                            <Input
                                value={unitSymbol}
                                onChange={(event) =>
                                    setUnitSymbol(event.target.value)
                                }
                            />
                            <InputError message={errors.symbol} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'inventory.common.description',
                                    'Description',
                                )}
                            </Label>
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
                            {t('inventory.common.clear', 'Clear')}
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
                            {editingUnitId
                                ? t('inventory.unitModal.update', 'Update Unit')
                                : t('inventory.unitModal.save', 'Save Unit')}
                        </Button>
                    </DialogFooter>

                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {units.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'inventory.unitModal.empty',
                                    'No units yet.',
                                )}
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
                                            {t('inventory.common.edit', 'Edit')}
                                        </Button>
                                        {canDeleteInventoryResources ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteUnit(entry)
                                                }
                                            >
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                {t(
                                                    'inventory.common.delete',
                                                    'Delete',
                                                )}
                                            </Button>
                                        ) : null}
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
                                ? t(
                                      'inventory.typeModal.editTitle',
                                      'Edit Inventory Type',
                                  )
                                : t(
                                      'inventory.typeModal.title',
                                      'Manage Inventory Types',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.typeModal.description',
                                'Add, update, and remove inventory item types.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>{t('inventory.common.name', 'Name')}</Label>
                            <Input
                                value={typeName}
                                onChange={(event) =>
                                    setTypeName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'inventory.common.description',
                                    'Description',
                                )}
                            </Label>
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
                            {t('inventory.common.clear', 'Clear')}
                        </Button>
                        <Button
                            onClick={handleSaveType}
                            disabled={isSubmitting || !typeName.trim()}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingTypeId
                                ? t('inventory.typeModal.update', 'Update Type')
                                : t('inventory.typeModal.save', 'Save Type')}
                        </Button>
                    </DialogFooter>

                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {inventoryTypes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'inventory.typeModal.empty',
                                    'No inventory types yet.',
                                )}
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
                                            {t('inventory.common.edit', 'Edit')}
                                        </Button>
                                        {canDeleteInventoryResources ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteType(entry)
                                                }
                                            >
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                {t(
                                                    'inventory.common.delete',
                                                    'Delete',
                                                )}
                                            </Button>
                                        ) : null}
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
                                ? t(
                                      'inventory.categoryModal.editTitle',
                                      'Edit Category',
                                  )
                                : t(
                                      'inventory.categoryModal.title',
                                      'Manage Categories',
                                  )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.categoryModal.description',
                                'Add, update, and remove inventory categories.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>{t('inventory.common.name', 'Name')}</Label>
                            <Input
                                value={categoryName}
                                onChange={(event) =>
                                    setCategoryName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t(
                                    'inventory.common.description',
                                    'Description',
                                )}
                            </Label>
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
                            {t('inventory.common.clear', 'Clear')}
                        </Button>
                        <Button
                            onClick={handleSaveCategory}
                            disabled={isSubmitting || !categoryName.trim()}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {editingCategoryId
                                ? t(
                                      'inventory.categoryModal.update',
                                      'Update Category',
                                  )
                                : t(
                                      'inventory.categoryModal.save',
                                      'Save Category',
                                  )}
                        </Button>
                    </DialogFooter>

                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'inventory.categoryModal.empty',
                                    'No categories yet.',
                                )}
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
                                            {t('inventory.common.edit', 'Edit')}
                                        </Button>
                                        {canDeleteInventoryResources ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteCategory(entry)
                                                }
                                            >
                                                <Trash2 className="mr-1 h-3 w-3" />
                                                {t(
                                                    'inventory.common.delete',
                                                    'Delete',
                                                )}
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                        setReplacementResourceId('');
                        setDeleteResourceErrors({});
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {deleteTarget?.type === 'unit'
                                ? t(
                                      'inventory.unitModal.deleteTitle',
                                      'Delete Unit?',
                                  )
                                : deleteTarget?.type === 'type'
                                  ? t(
                                        'inventory.typeModal.deleteTitle',
                                        'Delete Inventory Type?',
                                    )
                                  : t(
                                        'inventory.categoryModal.deleteTitle',
                                        'Delete Category?',
                                    )}
                        </DialogTitle>
                        <DialogDescription>
                            {deleteTarget?.dependentCount
                                ? t(
                                      'inventory.common.deleteReassignDescription',
                                      'This item is assigned to inventory records. Choose a replacement before deleting it.',
                                  )
                                : t(
                                      'inventory.common.deleteConfirmDescription',
                                      'This action will permanently remove this record.',
                                  )}
                        </DialogDescription>
                    </DialogHeader>

                    {deleteTarget ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                <div className="font-medium text-foreground">
                                    {deleteTarget.name}
                                </div>
                                <div className="mt-1 text-muted-foreground">
                                    {deleteTarget.dependentCount > 0
                                        ? t(
                                              'inventory.common.assignedItemCount',
                                              ':count inventory items will be reassigned before deletion.',
                                          ).replace(
                                              ':count',
                                              formatNumber(
                                                  deleteTarget.dependentCount,
                                              ),
                                          )
                                        : t(
                                              'inventory.common.noAssignments',
                                              'No inventory items are assigned to this record.',
                                          )}
                                </div>
                            </div>

                            {deleteTarget.dependentCount > 0 ? (
                                <div className="grid gap-2">
                                    <Label>
                                        {deleteTarget.type === 'unit'
                                            ? t(
                                                  'inventory.unitModal.reassignLabel',
                                                  'Reassign items to another unit',
                                              )
                                            : deleteTarget.type === 'type'
                                              ? t(
                                                    'inventory.typeModal.reassignLabel',
                                                    'Reassign items to another inventory type',
                                                )
                                              : t(
                                                    'inventory.categoryModal.reassignLabel',
                                                    'Reassign items to another category',
                                                )}
                                    </Label>
                                    <SearchableDropdown
                                        value={replacementResourceId}
                                        onValueChange={setReplacementResourceId}
                                        options={deleteTargetReplacementOptions.map(
                                            (option) => ({
                                                value: String(option.id),
                                                label: option.label,
                                            }),
                                        )}
                                        placeholder={t(
                                            'inventory.common.selectReplacement',
                                            'Select a replacement',
                                        )}
                                    />
                                    <InputError
                                        message={
                                            deleteResourceErrors[
                                                deleteTarget.type === 'unit'
                                                    ? 'replacement_unit_id'
                                                    : deleteTarget.type ===
                                                        'type'
                                                      ? 'replacement_type_id'
                                                      : 'replacement_category_id'
                                            ]
                                        }
                                    />
                                    {deleteTargetReplacementOptions.length ===
                                    0 ? (
                                        <p className="text-xs text-amber-600">
                                            {deleteTarget.type === 'unit'
                                                ? t(
                                                      'inventory.unitModal.noReplacement',
                                                      'Create another unit before deleting this one.',
                                                  )
                                                : deleteTarget.type === 'type'
                                                  ? t(
                                                        'inventory.typeModal.noReplacement',
                                                        'Create another inventory type before deleting this one.',
                                                    )
                                                  : t(
                                                        'inventory.categoryModal.noReplacement',
                                                        'Create another category before deleting this one.',
                                                    )}
                                        </p>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteTarget(null);
                                setReplacementResourceId('');
                                setDeleteResourceErrors({});
                            }}
                            disabled={isDeleteResourceSubmitting}
                        >
                            {t('inventory.common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmManagedDelete}
                            disabled={
                                isDeleteResourceSubmitting ||
                                (deleteTarget?.dependentCount
                                    ? !replacementResourceId ||
                                      deleteTargetReplacementOptions.length ===
                                          0
                                    : false)
                            }
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('inventory.common.delete', 'Delete')}
                        </Button>
                    </DialogFooter>
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
                        <DialogTitle>
                            {t(
                                'inventory.createModal.title',
                                'Create Inventory Item',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.createModal.description',
                                'Add a new item with stock quantity, price, receipt/bill, and images.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.name', 'Name')}
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.property', 'Property')}
                                </Label>
                                <SearchableDropdown
                                    value={propertyId}
                                    onValueChange={setPropertyId}
                                    options={properties.map((property) => ({
                                        value: String(property.id),
                                        label: property.name,
                                    }))}
                                    placeholder={t(
                                        'inventory.common.selectProperty',
                                        'Select property',
                                    )}
                                />
                                <InputError message={errors.property_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'inventory.createModal.vendorOptional',
                                        'Vendor (optional)',
                                    )}
                                </Label>
                                <SearchableDropdown
                                    value={vendorId}
                                    onValueChange={setVendorId}
                                    options={[
                                        {
                                            value: VENDOR_NONE,
                                            label: t(
                                                'inventory.common.noVendor',
                                                'No Vendor',
                                            ),
                                        },
                                        ...vendors.map((vendor) => ({
                                            value: String(vendor.id),
                                            label: vendor.name,
                                        })),
                                    ]}
                                    placeholder={t(
                                        'inventory.common.selectVendor',
                                        'Select vendor',
                                    )}
                                    searchPlaceholder={t(
                                        'inventory.filters.searchVendors',
                                        'Search vendors...',
                                    )}
                                    emptyText={t(
                                        'inventory.filters.noVendors',
                                        'No vendors found.',
                                    )}
                                />
                                <InputError message={errors.vendor_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.currency', 'Currency')}
                                </Label>
                                <SearchableDropdown
                                    value={currencyCode}
                                    onValueChange={setCurrencyCode}
                                    options={currencies.map((currency) => ({
                                        value: currency.code,
                                        label: `${formatCurrencySymbol(currency)} - ${currency.name}`,
                                    }))}
                                    placeholder={t(
                                        'inventory.common.selectCurrency',
                                        'Select currency',
                                    )}
                                />
                                <InputError message={errors.currency_code} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.type', 'Type')}
                                </Label>
                                <SearchableDropdown
                                    value={inventoryTypeId}
                                    onValueChange={setInventoryTypeId}
                                    options={inventoryTypes.map((entry) => ({
                                        value: String(entry.id),
                                        label: entry.name,
                                    }))}
                                    placeholder={t(
                                        'inventory.common.selectType',
                                        'Select type',
                                    )}
                                    searchPlaceholder={t(
                                        'inventory.filters.searchTypes',
                                        'Search types...',
                                    )}
                                    emptyText={t(
                                        'inventory.filters.noTypes',
                                        'No types found.',
                                    )}
                                />
                                <InputError
                                    message={errors.inventory_type_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.unitLabel', 'Unit')}
                                </Label>
                                <SearchableDropdown
                                    value={unitId}
                                    onValueChange={setUnitId}
                                    options={units.map((entry) => ({
                                        value: String(entry.id),
                                        label: `${entry.name} (${entry.symbol})`,
                                    }))}
                                    placeholder={t(
                                        'inventory.common.selectUnit',
                                        'Select unit',
                                    )}
                                    searchPlaceholder={t(
                                        'inventory.common.searchUnits',
                                        'Search units...',
                                    )}
                                    emptyText={t(
                                        'inventory.common.noUnitFound',
                                        'No units found.',
                                    )}
                                />
                                <InputError message={errors.unit_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.category', 'Category')}
                                </Label>
                                <SearchableDropdown
                                    value={categoryId}
                                    onValueChange={setCategoryId}
                                    options={categories.map((entry) => ({
                                        value: String(entry.id),
                                        label: entry.name,
                                    }))}
                                    placeholder={t(
                                        'inventory.common.selectCategory',
                                        'Select category',
                                    )}
                                    searchPlaceholder={t(
                                        'inventory.common.searchCategories',
                                        'Search categories...',
                                    )}
                                    emptyText={t(
                                        'inventory.common.noCategoryFound',
                                        'No categories found.',
                                    )}
                                />
                                <InputError message={errors.category_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'inventory.createModal.initialQuantity',
                                        'Initial Quantity',
                                    )}
                                </Label>
                                <NumericInput
                                    min="0"
                                    value={quantity}
                                    onValueChange={setQuantity}
                                />
                                <InputError message={errors.quantity} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'inventory.common.singlePrice',
                                        'Single Price',
                                    )}{' '}
                                    {selectedCurrencySymbol || ''}
                                </Label>
                                <NumericInput
                                    min="0"
                                    value={unitPrice}
                                    onValueChange={setUnitPrice}
                                />
                                <InputError message={errors.unit_price} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'inventory.common.totalPriceAuto',
                                        'Total Price (Auto)',
                                    )}{' '}
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
                                    {t(
                                        'inventory.common.paidAmount',
                                        'Paid Amount',
                                    )}{' '}
                                    {selectedCurrencySymbol || ''}
                                </Label>
                                <NumericInput
                                    min="0"
                                    value={paidAmount}
                                    onValueChange={setPaidAmount}
                                />
                                <InputError message={errors.paid_amount} />
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    {t(
                                        'inventory.common.remainingAmountAuto',
                                        'Remaining Amount (Auto)',
                                    )}{' '}
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
                                        {t(
                                            'inventory.common.usableItem',
                                            'Usable item',
                                        )}
                                    </span>
                                </div>
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'inventory.common.description',
                                        'Description',
                                    )}
                                </Label>
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
                                    {t(
                                        'inventory.common.receiptUpload',
                                        'Receipt/Bill (image or PDF)',
                                    )}
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
                                        {t(
                                            'inventory.common.selected',
                                            'Selected',
                                        )}
                                        : {receipt.name}
                                    </p>
                                ) : null}
                                <InputError message={errors.receipt} />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>
                                    {t(
                                        'inventory.createModal.imagesLabel',
                                        'Images (up to :count)',
                                    ).replace(':count', String(MAX_IMAGES))}
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t(
                                                'inventory.createModal.uploadImages',
                                                'Upload item images.',
                                            )}
                                        </p>
                                        <Label
                                            htmlFor="inventory-images"
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            {t(
                                                'inventory.common.selectImages',
                                                'Select Images',
                                            )}
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
                            {t('inventory.common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={
                                !name.trim() ||
                                !propertyId ||
                                !inventoryTypeId ||
                                !quantity ||
                                !unitPrice ||
                                !paidAmount ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {t('inventory.createModal.create', 'Create Item')}
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
                        <DialogTitle>
                            {t('inventory.usageModal.title', 'Usage Cycle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'inventory.usageModal.description',
                                'Record usable item consumption and deduct stock.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>
                                    {t('inventory.common.date', 'Date')}
                                </Label>
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
                                                    <Label>
                                                        {t(
                                                            'inventory.usageModal.usableItem',
                                                            'Usable Item',
                                                        )}
                                                    </Label>
                                                    <SearchableDropdown
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
                                                        options={usableItems.map(
                                                            (item) => ({
                                                                value: String(
                                                                    item.id,
                                                                ),
                                                                label: `${item.name} (${item.property?.name ?? `Property #${item.property_id}`}) - ${t(
                                                                    'inventory.usageModal.available',
                                                                    'Available',
                                                                )}: ${Number(
                                                                    item.quantity ||
                                                                        0,
                                                                )} ${
                                                                    item.unit ??
                                                                    t(
                                                                        'inventory.common.unit',
                                                                        'unit',
                                                                    )
                                                                }`,
                                                            }),
                                                        )}
                                                        placeholder={t(
                                                            'inventory.usageModal.selectUsableItem',
                                                            'Select usable item',
                                                        )}
                                                        searchPlaceholder={t(
                                                            'inventory.usageModal.searchUsableItems',
                                                            'Search usable items...',
                                                        )}
                                                        emptyText={t(
                                                            'inventory.usageModal.noUsableItems',
                                                            'No usable items found.',
                                                        )}
                                                    />
                                                    <InputError
                                                        message={
                                                            usageErrors[
                                                                `items.${index}.inventory_item_id`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>
                                                        {t(
                                                            'inventory.usageModal.quantityUsed',
                                                            'Quantity Used',
                                                        )}
                                                    </Label>
                                                    <NumericInput
                                                        min="1"
                                                        value={row.quantityUsed}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateUsageItemField(
                                                                row.id,
                                                                'quantityUsed',
                                                                value,
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
                                                        {t(
                                                            'inventory.common.noteOptional',
                                                            'Note (optional)',
                                                        )}
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
                                                    {t(
                                                        'inventory.common.unitPrice',
                                                        'Unit Price',
                                                    )}
                                                    :{' '}
                                                    {selectedItem.currency_symbol ??
                                                        ''}
                                                    {formatPrice(
                                                        selectedItem.unit_price ||
                                                            0,
                                                    )}{' '}
                                                    |{' '}
                                                    {t(
                                                        'inventory.usageModal.available',
                                                        'Available',
                                                    )}
                                                    :{' '}
                                                    {Number(
                                                        selectedItem.quantity ||
                                                            0,
                                                    )}{' '}
                                                    {selectedItem.unit ??
                                                        t(
                                                            'inventory.common.unit',
                                                            'unit',
                                                        )}
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
                                                        {t(
                                                            'inventory.common.remove',
                                                            'Remove',
                                                        )}
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
                                    {t('inventory.common.addItem', 'Add Item')}
                                </Button>
                                <InputError message={usageErrors.items} />
                            </div>

                            <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'inventory.usageModal.totalNumberUsed',
                                            'Total Number Used',
                                        )}
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatNumber(
                                            usageSummary.totalQuantityUsed,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t(
                                            'inventory.usageModal.totalValuation',
                                            'Total Valuation',
                                        )}
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
                            {t('inventory.common.cancel', 'Cancel')}
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
                            {t('inventory.usageModal.save', 'Save Usage Cycle')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
