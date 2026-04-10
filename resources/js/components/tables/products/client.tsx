import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useLocalization } from '@/lib/localization';
import {
    Kitchen,
    Product,
    ProductCategory,
    ProductSize,
    ProductType,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import {
    Edit3,
    ImagePlus,
    PackagePlus,
    Plus,
    Save,
    Settings2,
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

interface ProductsClientProps {
    data: Product[];
    categories: ProductCategory[];
    types: ProductType[];
    kitchens: Kitchen[];
    sizes: ProductSize[];
    isLoading?: boolean;
}

const MAX_IMAGES = 10;
const FALLBACK_TYPES = ['food', 'beverage', 'dessert', 'bundle'];
const CATEGORY_IMAGE_DIMENSION_HINT = 'Recommended: 1920x800 (12:5 ratio)';
const TYPE_IMAGE_DIMENSION_HINT = 'Recommended: 1920x800 (12:5 ratio)';

export const ProductsClient: React.FC<ProductsClientProps> = ({
    data,
    categories,
    types,
    kitchens,
    sizes,
    isLoading = false,
}) => {
    const { t, locale } = useLocalization();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCategoryMetaOpen, setIsCategoryMetaOpen] = useState(false);
    const [isTypeMetaOpen, setIsTypeMetaOpen] = useState(false);
    const [name, setName] = useState('');
    const [pashtoName, setPashtoName] = useState('');
    const [dariName, setDariName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [kitchenId, setKitchenId] = useState('');
    const [type, setType] = useState(types[0]?.name ?? 'food');
    const [basePrice, setBasePrice] = useState('');
    const [description, setDescription] = useState('');
    const [pashtoDescription, setPashtoDescription] = useState('');
    const [dariDescription, setDariDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [sizePrices, setSizePrices] = useState<Record<number, string>>({});
    const [images, setImages] = useState<SelectedImage[]>([]);
    const [categoryName, setCategoryName] = useState('');
    const [categoryPashtoName, setCategoryPashtoName] = useState('');
    const [categoryDariName, setCategoryDariName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [categoryPashtoDescription, setCategoryPashtoDescription] =
        useState('');
    const [categoryDariDescription, setCategoryDariDescription] = useState('');
    const [categoryImage, setCategoryImage] = useState<File | null>(null);
    const [categoryImagePreview, setCategoryImagePreview] = useState<
        string | null
    >(null);
    const [typeName, setTypeName] = useState('');
    const [typePashtoName, setTypePashtoName] = useState('');
    const [typeDariName, setTypeDariName] = useState('');
    const [typeDescription, setTypeDescription] = useState('');
    const [typePashtoDescription, setTypePashtoDescription] = useState('');
    const [typeDariDescription, setTypeDariDescription] = useState('');
    const [typeImage, setTypeImage] = useState<File | null>(null);
    const [typeImagePreview, setTypeImagePreview] = useState<string | null>(
        null,
    );
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
        null,
    );
    const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
    const [categoryToDelete, setCategoryToDelete] =
        useState<ProductCategory | null>(null);
    const [typeToDelete, setTypeToDelete] = useState<ProductType | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [kitchenFilter, setKitchenFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [metaErrors, setMetaErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const revokePreviewIfBlob = (previewUrl: string | null) => {
        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
    };

    useEffect(() => {
        return () => {
            images.forEach((image) => URL.revokeObjectURL(image.preview));
            revokePreviewIfBlob(categoryImagePreview);
            revokePreviewIfBlob(typeImagePreview);
        };
    }, [images, categoryImagePreview, typeImagePreview]);

    const clearSelectedImages = () => {
        images.forEach((image) => URL.revokeObjectURL(image.preview));
        setImages([]);
    };

    const resetForm = () => {
        setName('');
        setPashtoName('');
        setDariName('');
        setCategoryId('');
        setKitchenId('');
        setType(types[0]?.name ?? 'food');
        setBasePrice('');
        setDescription('');
        setPashtoDescription('');
        setDariDescription('');
        setIsActive(true);
        setSizePrices({});
        clearSelectedImages();
        setCreateErrors({});
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

    const handleImageChange = (files: FileList | null) => {
        if (!files) {
            return;
        }

        setImages((prev) => {
            const remainingSlots = MAX_IMAGES - prev.length;
            const nextFiles = Array.from(files).slice(0, remainingSlots);
            const mapped = nextFiles.map((file, index) => ({
                id: `${Date.now()}-${file.name}-${index}`,
                file,
                preview: URL.createObjectURL(file),
            }));
            return [...prev, ...mapped];
        });
    };

    const handleSizePriceChange = (sizeId: number, value: string) => {
        setSizePrices((prev) => ({
            ...prev,
            [sizeId]: value,
        }));
    };

    const handleCreateSubmit = () => {
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
                pashto_name: pashtoName.trim() || null,
                dari_name: dariName.trim() || null,
                product_category_id: Number(categoryId),
                kitchen_id: Number(kitchenId),
                type,
                base_price: Number(basePrice),
                description: description.trim() || null,
                pashto_description: pashtoDescription.trim() || null,
                dari_description: dariDescription.trim() || null,
                is_active: isActive,
                size_prices: sizePricePayload,
                images: images.map((image) => image.file),
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'products.messages.productCreated',
                            'Product created successfully.',
                        ),
                    );
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

    const handleCategoryCreate = () => {
        if (!categoryName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setMetaErrors({});

        const payload = new FormData();
        payload.append('name', categoryName.trim());
        payload.append('pashto_name', categoryPashtoName.trim());
        payload.append('dari_name', categoryDariName.trim());
        payload.append('description', categoryDescription.trim());
        payload.append('pashto_description', categoryPashtoDescription.trim());
        payload.append('dari_description', categoryDariDescription.trim());

        if (categoryImage) {
            payload.append('image', categoryImage);
        }

        const requestUrl = editingCategoryId
            ? `/products/categories/${editingCategoryId}`
            : '/products/categories';

        if (editingCategoryId) {
            payload.append('_method', 'put');

            router.post(requestUrl, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'products.messages.categoryUpdated',
                            'Category updated successfully.',
                        ),
                    );
                    resetCategoryForm();
                    setMetaErrors({});
                },
                onError: (errors) => {
                    setMetaErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });

            return;
        }

        router.post(requestUrl, payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'products.messages.categoryCreated',
                        'Category created successfully.',
                    ),
                );
                resetCategoryForm();
                setMetaErrors({});
            },
            onError: (errors) => {
                setMetaErrors(errors);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const resetCategoryForm = () => {
        setCategoryName('');
        setCategoryPashtoName('');
        setCategoryDariName('');
        setCategoryDescription('');
        setCategoryPashtoDescription('');
        setCategoryDariDescription('');
        setEditingCategoryId(null);
        revokePreviewIfBlob(categoryImagePreview);
        setCategoryImage(null);
        setCategoryImagePreview(null);
    };

    const handleCategoryImageChange = (file: File | null) => {
        revokePreviewIfBlob(categoryImagePreview);

        setCategoryImage(file);
        setCategoryImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const handleCategoryDelete = (id: number) => {
        router.delete(`/products/categories/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'products.messages.categoryDeleted',
                        'Category deleted successfully.',
                    ),
                );
            },
            onError: (errors) => {
                setMetaErrors(errors);
            },
        });
    };

    const handleCategoryEdit = (category: ProductCategory) => {
        setEditingCategoryId(category.id);
        setCategoryName(category.name);
        setCategoryPashtoName(category.pashto_name ?? '');
        setCategoryDariName(category.dari_name ?? '');
        setCategoryDescription(category.description ?? '');
        setCategoryPashtoDescription(category.pashto_description ?? '');
        setCategoryDariDescription(category.dari_description ?? '');
        revokePreviewIfBlob(categoryImagePreview);
        setCategoryImage(null);
        setCategoryImagePreview(category.image_url ?? null);
        setMetaErrors({});
    };

    const handleTypeCreate = () => {
        if (!typeName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setMetaErrors({});

        const payload = new FormData();
        payload.append('name', typeName.trim().toLowerCase());
        payload.append('pashto_name', typePashtoName.trim());
        payload.append('dari_name', typeDariName.trim());
        payload.append('description', typeDescription.trim());
        payload.append('pashto_description', typePashtoDescription.trim());
        payload.append('dari_description', typeDariDescription.trim());

        if (typeImage) {
            payload.append('image', typeImage);
        }

        const requestUrl = editingTypeId
            ? `/products/types/${editingTypeId}`
            : '/products/types';

        if (editingTypeId) {
            payload.append('_method', 'put');

            router.post(requestUrl, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'products.messages.typeUpdated',
                            'Type updated successfully.',
                        ),
                    );
                    resetTypeForm();
                    setMetaErrors({});
                },
                onError: (errors) => {
                    setMetaErrors(errors);
                    toast.error(
                        String(
                                errors.name ??
                                errors.image ??
                                errors.type ??
                                t(
                                    'products.messages.typeUpdateFailed',
                                    'Unable to update type.',
                                ),
                        ),
                    );
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });

            return;
        }

        router.post(requestUrl, payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'products.messages.typeCreated',
                        'Type created successfully.',
                    ),
                );
                resetTypeForm();
                setMetaErrors({});
            },
            onError: (errors) => {
                setMetaErrors(errors);
                toast.error(
                    String(
                        errors.name ??
                            errors.image ??
                            errors.type ??
                            t(
                                'products.messages.typeCreateFailed',
                                'Unable to create type.',
                            ),
                    ),
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const resetTypeForm = () => {
        setTypeName('');
        setTypePashtoName('');
        setTypeDariName('');
        setTypeDescription('');
        setTypePashtoDescription('');
        setTypeDariDescription('');
        setEditingTypeId(null);
        revokePreviewIfBlob(typeImagePreview);
        setTypeImage(null);
        setTypeImagePreview(null);
    };

    const handleTypeImageChange = (file: File | null) => {
        revokePreviewIfBlob(typeImagePreview);

        setTypeImage(file);
        setTypeImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const handleTypeDelete = (id: number) => {
        router.delete(`/products/types/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'products.messages.typeDeleted',
                        'Type deleted successfully.',
                    ),
                );
            },
            onError: (errors) => {
                setMetaErrors(errors);
            },
        });
    };

    const handleTypeEdit = (productType: ProductType) => {
        setEditingTypeId(productType.id);
        setTypeName(productType.name);
        setTypePashtoName(productType.pashto_name ?? '');
        setTypeDariName(productType.dari_name ?? '');
        setTypeDescription(productType.description ?? '');
        setTypePashtoDescription(productType.pashto_description ?? '');
        setTypeDariDescription(productType.dari_description ?? '');
        revokePreviewIfBlob(typeImagePreview);
        setTypeImage(null);
        setTypeImagePreview(productType.image_url ?? null);
        setMetaErrors({});
    };

    const availableTypes = useMemo(() => {
        const fromDb = types.map((item) => item.name);
        return fromDb.length > 0 ? fromDb : FALLBACK_TYPES;
    }, [types]);

    const tableColumns = useMemo(
        () => buildColumns(categories, types, kitchens, sizes, t),
        [categories, kitchens, sizes, t, types],
    );

    const filteredData = useMemo(() => {
        return data.filter((product) => {
            const byCategory =
                categoryFilter === 'all' ||
                String(product.product_category_id ?? '') === categoryFilter;
            const byKitchen =
                kitchenFilter === 'all' ||
                String(product.kitchen_id ?? '') === kitchenFilter;
            const byType =
                typeFilter === 'all' ||
                (product.type ?? '').trim().toLowerCase() === typeFilter;
            const byStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active'
                    ? !!product.is_active
                    : !product.is_active);

            return byCategory && byKitchen && byType && byStatus;
        });
    }, [categoryFilter, data, kitchenFilter, statusFilter, typeFilter]);

    const filterToolbar = useMemo(
        () => (
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                <SearchableDropdown
                    value={categoryFilter}
                    options={[
                        {
                            value: 'all',
                            label: t(
                                'products.filters.allCategories',
                                'All Categories',
                            ),
                        },
                        ...categories.map((category) => ({
                            value: String(category.id),
                            label: category.name,
                        })),
                    ]}
                    onValueChange={setCategoryFilter}
                    placeholder={t('products.filters.category', 'Category')}
                    searchPlaceholder={t(
                        'products.filters.searchCategories',
                        'Search categories...',
                    )}
                    emptyText={t(
                        'products.filters.noCategories',
                        'No categories found.',
                    )}
                    className="w-44"
                />

                <SearchableDropdown
                    value={kitchenFilter}
                    options={[
                        {
                            value: 'all',
                            label: t(
                                'products.filters.allKitchens',
                                'All Kitchens',
                            ),
                        },
                        ...kitchens.map((kitchen) => ({
                            value: String(kitchen.id),
                            label: kitchen.name ?? `Kitchen #${kitchen.id}`,
                        })),
                    ]}
                    onValueChange={setKitchenFilter}
                    placeholder={t('products.filters.kitchen', 'Kitchen')}
                    searchPlaceholder={t(
                        'products.filters.searchKitchens',
                        'Search kitchens...',
                    )}
                    emptyText={t(
                        'products.filters.noKitchens',
                        'No kitchens found.',
                    )}
                    className="w-44"
                />

                <SearchableDropdown
                    value={typeFilter}
                    options={[
                        {
                            value: 'all',
                            label: t('products.filters.allTypes', 'All Types'),
                        },
                        ...availableTypes.map((productType) => ({
                            value: productType.trim().toLowerCase(),
                            label:
                                productType.charAt(0).toUpperCase() +
                                productType.slice(1),
                        })),
                    ]}
                    onValueChange={setTypeFilter}
                    placeholder={t('products.filters.type', 'Type')}
                    searchPlaceholder={t(
                        'products.filters.searchTypes',
                        'Search types...',
                    )}
                    emptyText={t(
                        'products.filters.noTypes',
                        'No types found.',
                    )}
                    className="w-44"
                />

                <SearchableDropdown
                    value={statusFilter}
                    options={[
                        {
                            value: 'all',
                            label: t(
                                'products.filters.allStatuses',
                                'All Statuses',
                            ),
                        },
                        {
                            value: 'active',
                            label: t('products.filters.active', 'Active'),
                        },
                        {
                            value: 'inactive',
                            label: t('products.filters.inactive', 'Inactive'),
                        },
                    ]}
                    onValueChange={setStatusFilter}
                    placeholder={t('products.filters.status', 'Status')}
                    searchPlaceholder={t(
                        'products.filters.searchStatuses',
                        'Search statuses...',
                    )}
                    emptyText={t(
                        'products.filters.noStatuses',
                        'No statuses found.',
                    )}
                    className="w-44"
                />
            </div>
        ),
        [
            availableTypes,
            categories,
            categoryFilter,
            kitchenFilter,
            kitchens,
            statusFilter,
            t,
            typeFilter,
        ],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <Heading
                    title={`${t('products.headingTitle', 'Products:')} ${formatNumber(data.length)}`}
                    description={t(
                        'products.headingDescription',
                        'Manage menu items, categories, types, and pricing',
                    )}
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsCategoryMetaOpen(true)}
                        className="gap-2"
                    >
                        <Tag className="h-4 w-4" />
                        {t(
                            'products.manageCategories',
                            'Manage Categories',
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsTypeMetaOpen(true)}
                        className="gap-2"
                    >
                        <Settings2 className="h-4 w-4" />
                        {t('products.manageTypes', 'Manage Types')}
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {t('products.addNewProduct', 'Add New Product')}
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'name',
                    'pashto_name',
                    'dari_name',
                    'description',
                    'pashto_description',
                    'dari_description',
                    'category.name',
                    'kitchen.name',
                    'type',
                ]}
                columns={tableColumns}
                data={filteredData}
                isLoading={isLoading}
                searchPlaceholder={t(
                    'products.searchPlaceholder',
                    'Search products by name or category...',
                )}
                toolbar={filterToolbar}
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
                <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <PackagePlus className="mr-2 h-5 w-5" />
                            {t('products.createProduct', 'Create Product')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'products.createProductDescription',
                                'Add a new product with images and optional size pricing.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[68vh] overflow-y-auto pr-1">
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
                                <Label htmlFor="product-pashto-name">
                                    Pashto Name
                                </Label>
                                <Input
                                    id="product-pashto-name"
                                    value={pashtoName}
                                    onChange={(event) =>
                                        setPashtoName(event.target.value)
                                    }
                                />
                                <InputError
                                    message={createErrors.pashto_name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="product-dari-name">
                                    Dari Name
                                </Label>
                                <Input
                                    id="product-dari-name"
                                    value={dariName}
                                    onChange={(event) =>
                                        setDariName(event.target.value)
                                    }
                                />
                                <InputError message={createErrors.dari_name} />
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
                                <Label>Kitchen</Label>
                                <Select
                                    value={kitchenId}
                                    onValueChange={setKitchenId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select kitchen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {kitchens.map((kitchen) => (
                                            <SelectItem
                                                key={kitchen.id}
                                                value={String(kitchen.id)}
                                            >
                                                {kitchen.name ??
                                                    `Kitchen #${kitchen.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createErrors.kitchen_id} />
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
                                <InputError message={createErrors.type} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="product-base-price">
                                    Base Price (AFN)
                                </Label>
                                <NumericInput
                                    id="product-base-price"
                                    min="0"
                                    value={basePrice}
                                    onValueChange={setBasePrice}
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
                                <InputError
                                    message={createErrors.description}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="product-pashto-description">
                                    Pashto Description
                                </Label>
                                <Textarea
                                    id="product-pashto-description"
                                    value={pashtoDescription}
                                    onChange={(event) =>
                                        setPashtoDescription(event.target.value)
                                    }
                                />
                                <InputError
                                    message={createErrors.pashto_description}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="product-dari-description">
                                    Dari Description
                                </Label>
                                <Textarea
                                    id="product-dari-description"
                                    value={dariDescription}
                                    onChange={(event) =>
                                        setDariDescription(event.target.value)
                                    }
                                />
                                <InputError
                                    message={createErrors.dari_description}
                                />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label>Size Pricing (Optional, AFN)</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {sizes.map((size) => (
                                        <div
                                            key={size.id}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="w-28 text-sm text-muted-foreground">
                                                {size.name}
                                            </span>
                                            <NumericInput
                                                min="0"
                                                placeholder="Use base price"
                                                value={
                                                    sizePrices[size.id] ?? ''
                                                }
                                                onValueChange={(value) =>
                                                    handleSizePriceChange(
                                                        size.id,
                                                        value,
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <Label htmlFor="product-images">
                                    Product Images
                                </Label>
                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm text-muted-foreground">
                                            Upload up to {MAX_IMAGES} images.
                                            Recommended size: 400x400 or
                                            400x480.
                                        </p>
                                        <Label
                                            htmlFor="product-images"
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                                        >
                                            <ImagePlus className="h-4 w-4" />
                                            Select Images
                                        </Label>
                                    </div>
                                    <Input
                                        id="product-images"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(event) =>
                                            handleImageChange(
                                                event.target.files,
                                            )
                                        }
                                        className="hidden"
                                    />
                                    {images.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {images.map((image) => (
                                                <div
                                                    key={image.id}
                                                    className="group relative h-20 w-20 overflow-hidden rounded-md border"
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
                                !kitchenId ||
                                !type ||
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

            <Dialog
                open={isCategoryMetaOpen}
                onOpenChange={(open) => {
                    setIsCategoryMetaOpen(open);
                    if (!open) {
                        resetCategoryForm();
                        setMetaErrors({});
                    }
                }}
            >
                <DialogContent className="flex max-h-[84vh] flex-col overflow-hidden sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Categories</DialogTitle>
                        <DialogDescription>
                            Create, edit, and remove product categories.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                        <div className="space-y-2 rounded-md border p-3">
                            <Input
                                placeholder="Category name"
                                value={categoryName}
                                onChange={(event) =>
                                    setCategoryName(event.target.value)
                                }
                            />
                            <Input
                                placeholder="Pashto title (optional)"
                                value={categoryPashtoName}
                                onChange={(event) =>
                                    setCategoryPashtoName(event.target.value)
                                }
                            />
                            <Input
                                placeholder="Dari title (optional)"
                                value={categoryDariName}
                                onChange={(event) =>
                                    setCategoryDariName(event.target.value)
                                }
                            />
                            <Textarea
                                placeholder="Category description (optional)"
                                value={categoryDescription}
                                onChange={(event) =>
                                    setCategoryDescription(event.target.value)
                                }
                            />
                            <Textarea
                                placeholder="Pashto description (optional)"
                                value={categoryPashtoDescription}
                                onChange={(event) =>
                                    setCategoryPashtoDescription(
                                        event.target.value,
                                    )
                                }
                            />
                            <Textarea
                                placeholder="Dari description (optional)"
                                value={categoryDariDescription}
                                onChange={(event) =>
                                    setCategoryDariDescription(
                                        event.target.value,
                                    )
                                }
                            />
                            <div className="space-y-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        handleCategoryImageChange(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    {CATEGORY_IMAGE_DIMENSION_HINT}
                                </p>
                                {categoryImagePreview && (
                                    <div className="overflow-hidden rounded-md border">
                                        <img
                                            src={categoryImagePreview}
                                            alt="Category preview"
                                            className="h-24 w-full object-cover"
                                        />
                                    </div>
                                )}
                                <InputError message={metaErrors.image} />
                            </div>
                            <Button
                                type="button"
                                onClick={handleCategoryCreate}
                                className="w-full"
                                disabled={!categoryName.trim() || isSubmitting}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {editingCategoryId
                                    ? 'Update Category'
                                    : 'Add Category'}
                            </Button>
                            {editingCategoryId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={resetCategoryForm}
                                    disabled={isSubmitting}
                                >
                                    Cancel Edit
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="h-[28vh] min-h-0 rounded-md border">
                            <div className="space-y-2 p-2">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between rounded-md border p-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="h-10 w-16 overflow-hidden rounded border bg-neutral-100 dark:bg-neutral-900">
                                                {category.image_url ? (
                                                    <img
                                                        src={category.image_url}
                                                        alt={category.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {category.name}
                                                </p>
                                                {category.pashto_name ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {category.pashto_name}
                                                    </p>
                                                ) : null}
                                                {category.dari_name ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {category.dari_name}
                                                    </p>
                                                ) : null}
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {category.description ||
                                                        '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleCategoryEdit(category)
                                                }
                                            >
                                                <Edit3 className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setCategoryToDelete(
                                                        category,
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <InputError
                        message={
                            metaErrors.name ||
                            metaErrors.category ||
                            metaErrors.image
                        }
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={isTypeMetaOpen}
                onOpenChange={(open) => {
                    setIsTypeMetaOpen(open);
                    if (!open) {
                        resetTypeForm();
                        setMetaErrors({});
                    }
                }}
            >
                <DialogContent className="flex max-h-[84vh] flex-col overflow-hidden sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Manage Types</DialogTitle>
                        <DialogDescription>
                            Create, edit, or remove product types.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                        <div className="space-y-2 rounded-md border p-3">
                            <Input
                                placeholder="Type name (example: food)"
                                value={typeName}
                                onChange={(event) =>
                                    setTypeName(event.target.value)
                                }
                            />
                            <Input
                                placeholder="Pashto title (optional)"
                                value={typePashtoName}
                                onChange={(event) =>
                                    setTypePashtoName(event.target.value)
                                }
                            />
                            <Input
                                placeholder="Dari title (optional)"
                                value={typeDariName}
                                onChange={(event) =>
                                    setTypeDariName(event.target.value)
                                }
                            />
                            <Textarea
                                placeholder="Type description (optional)"
                                value={typeDescription}
                                onChange={(event) =>
                                    setTypeDescription(event.target.value)
                                }
                            />
                            <Textarea
                                placeholder="Pashto description (optional)"
                                value={typePashtoDescription}
                                onChange={(event) =>
                                    setTypePashtoDescription(event.target.value)
                                }
                            />
                            <Textarea
                                placeholder="Dari description (optional)"
                                value={typeDariDescription}
                                onChange={(event) =>
                                    setTypeDariDescription(event.target.value)
                                }
                            />
                            <div className="space-y-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        handleTypeImageChange(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    {TYPE_IMAGE_DIMENSION_HINT}
                                </p>
                                {typeImagePreview && (
                                    <div className="overflow-hidden rounded-md border">
                                        <img
                                            src={typeImagePreview}
                                            alt="Type preview"
                                            className="h-24 w-full object-cover"
                                        />
                                    </div>
                                )}
                                <InputError message={metaErrors.image} />
                            </div>
                            <Button
                                type="button"
                                onClick={handleTypeCreate}
                                className="w-full"
                                disabled={!typeName.trim() || isSubmitting}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {editingTypeId ? 'Update Type' : 'Add Type'}
                            </Button>
                            {editingTypeId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={resetTypeForm}
                                    disabled={isSubmitting}
                                >
                                    Cancel Edit
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="h-[28vh] min-h-0 rounded-md border">
                            <div className="space-y-2 p-2">
                                {types.map((productType) => (
                                    <div
                                        key={productType.id}
                                        className="flex items-center justify-between rounded-md border p-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="h-10 w-16 overflow-hidden rounded border bg-neutral-100 dark:bg-neutral-900">
                                                {productType.image_url ? (
                                                    <img
                                                        src={
                                                            productType.image_url
                                                        }
                                                        alt={productType.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium capitalize">
                                                    {productType.name}
                                                </p>
                                                {productType.pashto_name ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {
                                                            productType.pashto_name
                                                        }
                                                    </p>
                                                ) : null}
                                                {productType.dari_name ? (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {productType.dari_name}
                                                    </p>
                                                ) : null}
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {productType.description ||
                                                        '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleTypeEdit(productType)
                                                }
                                            >
                                                <Edit3 className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setTypeToDelete(productType)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <InputError
                        message={
                            metaErrors.name ||
                            metaErrors.category ||
                            metaErrors.type
                        }
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={categoryToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setCategoryToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete category</AlertDialogTitle>
                        <AlertDialogDescription>
                            {categoryToDelete
                                ? `Are you sure you want to delete "${categoryToDelete.name}"? This action cannot be undone.`
                                : 'Are you sure you want to delete this category?'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isSubmitting || categoryToDelete === null}
                            onClick={() => {
                                if (categoryToDelete) {
                                    handleCategoryDelete(categoryToDelete.id);
                                    setCategoryToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={typeToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setTypeToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete type</AlertDialogTitle>
                        <AlertDialogDescription>
                            {typeToDelete
                                ? `Are you sure you want to delete "${typeToDelete.name}"? This action cannot be undone.`
                                : 'Are you sure you want to delete this type?'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={isSubmitting || typeToDelete === null}
                            onClick={() => {
                                if (typeToDelete) {
                                    handleTypeDelete(typeToDelete.id);
                                    setTypeToDelete(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
