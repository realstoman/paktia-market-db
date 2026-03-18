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
import {
    Cuisine,
    Kitchen,
    KitchenCategory,
    KitchenType,
    Product,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import {
    ChefHat,
    CookingPot,
    Plus,
    Save,
    Shapes,
    Tags,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildColumns } from './columns';

interface KitchensClientProps {
    data: Kitchen[];
    products: Product[];
    kitchenTypes: KitchenType[];
    cuisines: Cuisine[];
    kitchenCategories: KitchenCategory[];
    isLoading?: boolean;
}

export const KitchensClient: React.FC<KitchensClientProps> = ({
    data,
    products,
    kitchenTypes,
    cuisines,
    kitchenCategories,
    isLoading = false,
}) => {
    const NO_KITCHEN_TYPE = '__none__';
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isKitchenTypesOpen, setIsKitchenTypesOpen] = useState(false);
    const [isCuisinesOpen, setIsCuisinesOpen] = useState(false);
    const [isKitchenCategoriesOpen, setIsKitchenCategoriesOpen] =
        useState(false);
    const [name, setName] = useState('');
    const [kitchenTypeId, setKitchenTypeId] = useState(NO_KITCHEN_TYPE);
    const [selectedCuisineIds, setSelectedCuisineIds] = useState<number[]>([]);
    const [selectedKitchenCategoryIds, setSelectedKitchenCategoryIds] =
        useState<number[]>([]);
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [kitchenTypeName, setKitchenTypeName] = useState('');
    const [kitchenTypeDescription, setKitchenTypeDescription] = useState('');
    const [editingKitchenTypeId, setEditingKitchenTypeId] = useState<
        number | null
    >(null);
    const [kitchenTypeErrors, setKitchenTypeErrors] = useState<
        Record<string, string>
    >({});
    const [cuisineName, setCuisineName] = useState('');
    const [cuisineDescription, setCuisineDescription] = useState('');
    const [editingCuisineId, setEditingCuisineId] = useState<number | null>(
        null,
    );
    const [cuisineErrors, setCuisineErrors] = useState<Record<string, string>>(
        {},
    );
    const [kitchenCategoryName, setKitchenCategoryName] = useState('');
    const [kitchenCategoryDescription, setKitchenCategoryDescription] =
        useState('');
    const [editingKitchenCategoryId, setEditingKitchenCategoryId] = useState<
        number | null
    >(null);
    const [kitchenCategoryErrors, setKitchenCategoryErrors] = useState<
        Record<string, string>
    >({});

    const resetForm = () => {
        setName('');
        setKitchenTypeId(NO_KITCHEN_TYPE);
        setSelectedCuisineIds([]);
        setSelectedKitchenCategoryIds([]);
        setCreateErrors({});
    };

    const resetKitchenTypeForm = () => {
        setKitchenTypeName('');
        setKitchenTypeDescription('');
        setEditingKitchenTypeId(null);
        setKitchenTypeErrors({});
    };

    const resetCuisineForm = () => {
        setCuisineName('');
        setCuisineDescription('');
        setEditingCuisineId(null);
        setCuisineErrors({});
    };

    const resetKitchenCategoryForm = () => {
        setKitchenCategoryName('');
        setKitchenCategoryDescription('');
        setEditingKitchenCategoryId(null);
        setKitchenCategoryErrors({});
    };

    const toggleCuisine = (cuisineId: number) => {
        setSelectedCuisineIds((current) =>
            current.includes(cuisineId)
                ? current.filter((id) => id !== cuisineId)
                : [...current, cuisineId],
        );
    };

    const toggleKitchenCategory = (kitchenCategoryId: number) => {
        setSelectedKitchenCategoryIds((current) =>
            current.includes(kitchenCategoryId)
                ? current.filter((id) => id !== kitchenCategoryId)
                : [...current, kitchenCategoryId],
        );
    };

    const handleCreateSubmit = () => {
        if (!name.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/kitchens',
            {
                name: name.trim(),
                kitchen_type_id:
                    kitchenTypeId !== NO_KITCHEN_TYPE
                        ? Number(kitchenTypeId)
                        : null,
                cuisines: selectedCuisineIds,
                kitchen_categories: selectedKitchenCategoryIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kitchen created successfully.');
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

    const handleSaveKitchenType = () => {
        if (!kitchenTypeName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: kitchenTypeName.trim(),
            description: kitchenTypeDescription.trim() || null,
        };

        if (editingKitchenTypeId) {
            router.put(`/kitchen-types/${editingKitchenTypeId}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Kitchen type updated successfully.');
                    resetKitchenTypeForm();
                },
                onError: (errors) => setKitchenTypeErrors(errors),
                onFinish: () => setIsSubmitting(false),
            });
            return;
        }

        router.post('/kitchen-types', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kitchen type created successfully.');
                resetKitchenTypeForm();
            },
            onError: (errors) => setKitchenTypeErrors(errors),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDeleteKitchenType = (entry: KitchenType) => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/kitchen-types/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kitchen type deleted successfully.');
                if (editingKitchenTypeId === entry.id) {
                    resetKitchenTypeForm();
                }
            },
            onError: (errors) => {
                setKitchenTypeErrors(errors);
                toast.error(
                    errors.kitchen_type || 'Failed to delete kitchen type.',
                );
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSaveCuisine = () => {
        if (!cuisineName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: cuisineName.trim(),
            description: cuisineDescription.trim() || null,
        };

        if (editingCuisineId) {
            router.put(`/cuisines/${editingCuisineId}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Cuisine updated successfully.');
                    resetCuisineForm();
                },
                onError: (errors) => setCuisineErrors(errors),
                onFinish: () => setIsSubmitting(false),
            });
            return;
        }

        router.post('/cuisines', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Cuisine created successfully.');
                resetCuisineForm();
            },
            onError: (errors) => setCuisineErrors(errors),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDeleteCuisine = (entry: Cuisine) => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/cuisines/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Cuisine deleted successfully.');
                if (editingCuisineId === entry.id) {
                    resetCuisineForm();
                }
            },
            onError: (errors) => {
                setCuisineErrors(errors);
                toast.error(errors.cuisine || 'Failed to delete cuisine.');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSaveKitchenCategory = () => {
        if (!kitchenCategoryName.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: kitchenCategoryName.trim(),
            description: kitchenCategoryDescription.trim() || null,
        };

        if (editingKitchenCategoryId) {
            router.put(
                `/kitchen-categories/${editingKitchenCategoryId}`,
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Kitchen category updated successfully.');
                        resetKitchenCategoryForm();
                    },
                    onError: (errors) => setKitchenCategoryErrors(errors),
                    onFinish: () => setIsSubmitting(false),
                },
            );
            return;
        }

        router.post('/kitchen-categories', payload, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kitchen category created successfully.');
                resetKitchenCategoryForm();
            },
            onError: (errors) => setKitchenCategoryErrors(errors),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDeleteKitchenCategory = (entry: KitchenCategory) => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/kitchen-categories/${entry.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Kitchen category deleted successfully.');
                if (editingKitchenCategoryId === entry.id) {
                    resetKitchenCategoryForm();
                }
            },
            onError: (errors) => {
                setKitchenCategoryErrors(errors);
                toast.error(
                    errors.kitchen_category ||
                        'Failed to delete kitchen category.',
                );
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const tableColumns = useMemo(
        () => buildColumns(kitchenTypes, cuisines, kitchenCategories, products),
        [kitchenTypes, cuisines, kitchenCategories, products],
    );

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`Kitchens: ${formatNumber(data.length)}`}
                    description="Manage kitchens"
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsKitchenCategoriesOpen(true)}
                        className="gap-2"
                    >
                        <Tags className="h-4 w-4" />
                        Kitchen Categories
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsCuisinesOpen(true)}
                        className="gap-2"
                    >
                        <UtensilsCrossed className="h-4 w-4" />
                        Cuisines
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsKitchenTypesOpen(true)}
                        className="gap-2"
                    >
                        <Shapes className="h-4 w-4" />
                        Kitchen Types
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add New
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'name',
                    'kitchen_type',
                    'cuisines_label',
                    'branches',
                    'products',
                ]}
                columns={tableColumns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search kitchens by name or location..."
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
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <ChefHat className="mr-2 h-5 w-5" />
                            Create Kitchen
                        </DialogTitle>
                        <DialogDescription>
                            Add a kitchen, choose its station type, and assign
                            one or more cuisines.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="kitchen-name">Name</Label>
                            <Input
                                id="kitchen-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={createErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kitchen Type</Label>
                            <Select
                                value={kitchenTypeId}
                                onValueChange={setKitchenTypeId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select kitchen type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_KITCHEN_TYPE}>
                                        No Kitchen Type
                                    </SelectItem>
                                    {kitchenTypes.map((kitchenType) => (
                                        <SelectItem
                                            key={kitchenType.id}
                                            value={String(kitchenType.id)}
                                        >
                                            {kitchenType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={createErrors.kitchen_type_id}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Cuisines</Label>
                        <ScrollArea className="h-44 rounded-md border p-3">
                            <div className="space-y-2">
                                {cuisines.map((cuisine) => (
                                    <label
                                        key={cuisine.id}
                                        className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={selectedCuisineIds.includes(
                                                cuisine.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleCuisine(cuisine.id)
                                            }
                                        />
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {cuisine.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {cuisine.description || '—'}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </ScrollArea>
                        <InputError message={createErrors.cuisines} />
                    </div>

                    <div className="grid gap-2">
                        <Label>Kitchen Categories</Label>
                        <ScrollArea className="h-44 rounded-md border p-3">
                            <div className="space-y-2">
                                {kitchenCategories.map((category) => (
                                    <label
                                        key={category.id}
                                        className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={selectedKitchenCategoryIds.includes(
                                                category.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggleKitchenCategory(
                                                    category.id,
                                                )
                                            }
                                        />
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {category.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {category.description || '—'}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </ScrollArea>
                        <InputError message={createErrors.kitchen_categories} />
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
                            disabled={!name.trim() || isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Kitchen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isKitchenCategoriesOpen}
                onOpenChange={(open) => {
                    setIsKitchenCategoriesOpen(open);
                    if (!open) {
                        resetKitchenCategoryForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5" />
                            Kitchen Category Manager
                        </DialogTitle>
                        <DialogDescription>
                            Manage product-focused kitchen categories such as
                            Pizza, Chicken Wings, or Burgers.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="kitchen-category-name">
                                    Name
                                </Label>
                                <Input
                                    id="kitchen-category-name"
                                    value={kitchenCategoryName}
                                    onChange={(event) =>
                                        setKitchenCategoryName(
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={kitchenCategoryErrors.name}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kitchen-category-description">
                                    Description
                                </Label>
                                <Input
                                    id="kitchen-category-description"
                                    value={kitchenCategoryDescription}
                                    onChange={(event) =>
                                        setKitchenCategoryDescription(
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={kitchenCategoryErrors.description}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Button
                                    onClick={handleSaveKitchenCategory}
                                    disabled={
                                        !kitchenCategoryName.trim() ||
                                        isSubmitting
                                    }
                                >
                                    {editingKitchenCategoryId
                                        ? 'Update Kitchen Category'
                                        : 'Add Kitchen Category'}
                                </Button>
                                {editingKitchenCategoryId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetKitchenCategoryForm}
                                        disabled={isSubmitting}
                                    >
                                        Cancel Edit
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] rounded-lg border p-3">
                            <div className="space-y-2">
                                {kitchenCategories.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {entry.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {entry.description || '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingKitchenCategoryId(
                                                        entry.id,
                                                    );
                                                    setKitchenCategoryName(
                                                        entry.name,
                                                    );
                                                    setKitchenCategoryDescription(
                                                        entry.description ?? '',
                                                    );
                                                    setKitchenCategoryErrors(
                                                        {},
                                                    );
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteKitchenCategory(
                                                        entry,
                                                    )
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isKitchenTypesOpen}
                onOpenChange={(open) => {
                    setIsKitchenTypesOpen(open);
                    if (!open) {
                        resetKitchenTypeForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shapes className="h-5 w-5" />
                            Kitchen Type Manager
                        </DialogTitle>
                        <DialogDescription>
                            Manage kitchen station types such as Main, Grill, or
                            Drinks.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="kitchen-type-name">Name</Label>
                                <Input
                                    id="kitchen-type-name"
                                    value={kitchenTypeName}
                                    onChange={(event) =>
                                        setKitchenTypeName(event.target.value)
                                    }
                                />
                                <InputError message={kitchenTypeErrors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="kitchen-type-description">
                                    Description
                                </Label>
                                <Input
                                    id="kitchen-type-description"
                                    value={kitchenTypeDescription}
                                    onChange={(event) =>
                                        setKitchenTypeDescription(
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={kitchenTypeErrors.description}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Button
                                    onClick={handleSaveKitchenType}
                                    disabled={
                                        !kitchenTypeName.trim() || isSubmitting
                                    }
                                >
                                    {editingKitchenTypeId
                                        ? 'Update Kitchen Type'
                                        : 'Add Kitchen Type'}
                                </Button>
                                {editingKitchenTypeId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetKitchenTypeForm}
                                        disabled={isSubmitting}
                                    >
                                        Cancel Edit
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] rounded-lg border p-3">
                            <div className="space-y-2">
                                {kitchenTypes.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {entry.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {entry.description || '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingKitchenTypeId(
                                                        entry.id,
                                                    );
                                                    setKitchenTypeName(
                                                        entry.name,
                                                    );
                                                    setKitchenTypeDescription(
                                                        entry.description ?? '',
                                                    );
                                                    setKitchenTypeErrors({});
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteKitchenType(
                                                        entry,
                                                    )
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCuisinesOpen}
                onOpenChange={(open) => {
                    setIsCuisinesOpen(open);
                    if (!open) {
                        resetCuisineForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CookingPot className="h-5 w-5" />
                            Cuisine Manager
                        </DialogTitle>
                        <DialogDescription>
                            Manage cuisines such as Afghan, Indian, and
                            Pakistani.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="cuisine-name">Name</Label>
                                <Input
                                    id="cuisine-name"
                                    value={cuisineName}
                                    onChange={(event) =>
                                        setCuisineName(event.target.value)
                                    }
                                />
                                <InputError message={cuisineErrors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cuisine-description">
                                    Description
                                </Label>
                                <Input
                                    id="cuisine-description"
                                    value={cuisineDescription}
                                    onChange={(event) =>
                                        setCuisineDescription(
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={cuisineErrors.description}
                                />
                            </div>
                            <div className="flex items-center gap-2 sm:col-span-2">
                                <Button
                                    onClick={handleSaveCuisine}
                                    disabled={
                                        !cuisineName.trim() || isSubmitting
                                    }
                                >
                                    {editingCuisineId
                                        ? 'Update Cuisine'
                                        : 'Add Cuisine'}
                                </Button>
                                {editingCuisineId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetCuisineForm}
                                        disabled={isSubmitting}
                                    >
                                        Cancel Edit
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <ScrollArea className="h-[320px] rounded-lg border p-3">
                            <div className="space-y-2">
                                {cuisines.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between rounded-md border px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {entry.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {entry.description || '—'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingCuisineId(
                                                        entry.id,
                                                    );
                                                    setCuisineName(entry.name);
                                                    setCuisineDescription(
                                                        entry.description ?? '',
                                                    );
                                                    setCuisineErrors({});
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteCuisine(entry)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
