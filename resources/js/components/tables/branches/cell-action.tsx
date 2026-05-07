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
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { Branch, Country, Kitchen, Province } from '@/types';
import { router } from '@inertiajs/react';
import {
    CookingPot,
    Edit,
    Eye,
    MapPin,
    MapPinOff,
    MoreHorizontal,
    Save,
    Trash,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: Branch;
    countries: Country[];
    provinces: Province[];
    kitchens: Kitchen[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    countries,
    provinces,
    kitchens,
}) => {
    const { t } = useLocalization();
    const { can } = useAuthorization();
    const canViewBranch = can('branch.view');
    const canManageBranch = can('branch.update');
    const canDeleteBranch = can('branch.delete');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDisableOpen, setIsDisableOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isKitchenOpen, setIsKitchenOpen] = useState(false);
    const [name, setName] = useState(data.name);
    const [countryId, setCountryId] = useState(
        data.country_id ? String(data.country_id) : '',
    );
    const [provinceId, setProvinceId] = useState(
        data.province_id ? String(data.province_id) : '',
    );
    const [address, setAddress] = useState(data.address ?? '');
    const [description, setDescription] = useState(data.description ?? '');
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedKitchenIds, setSelectedKitchenIds] = useState<Set<number>>(
        new Set(data.kitchens?.map((kitchen) => kitchen.id)),
    );

    const sortedKitchens = useMemo(
        () =>
            [...kitchens].sort((a, b) =>
                (a.name ?? '').localeCompare(b.name ?? ''),
            ),
        [kitchens],
    );
    const editProvinceOptions = useMemo(
        () =>
            provinces.filter((province) => {
                if (!countryId) {
                    return true;
                }

                return String(province.country_id ?? '') === countryId;
            }),
        [provinces, countryId],
    );

    const resetEdit = () => {
        setName(data.name);
        setCountryId(data.country_id ? String(data.country_id) : '');
        setProvinceId(data.province_id ? String(data.province_id) : '');
        setAddress(data.address ?? '');
        setDescription(data.description ?? '');
        setEditErrors({});
    };

    const openKitchenAssign = () => {
        setSelectedKitchenIds(
            new Set(data.kitchens?.map((kitchen) => kitchen.id)),
        );
        setIsKitchenOpen(true);
    };

    const toggleAllKitchens = () => {
        setSelectedKitchenIds((prev) =>
            prev.size === sortedKitchens.length
                ? new Set<number>()
                : new Set(sortedKitchens.map((kitchen) => kitchen.id)),
        );
    };

    const toggleKitchen = (kitchenId: number) => {
        setSelectedKitchenIds((prev) => {
            const next = new Set(prev);
            if (next.has(kitchenId)) {
                next.delete(kitchenId);
            } else {
                next.add(kitchenId);
            }
            return next;
        });
    };

    const handleAssignKitchens = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            `/branches/${data.id}/kitchens`,
            {
                kitchens: Array.from(selectedKitchenIds),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'branches.feedback.kitchensUpdated',
                            'Branch kitchens updated successfully.',
                        ),
                    );
                    setIsKitchenOpen(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleEditSubmit = () => {
        if (!name.trim() || !countryId || !provinceId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/branches/${data.id}`,
            {
                name: name.trim(),
                country_id: Number(countryId),
                province_id: Number(provinceId),
                address: address.trim() || null,
                description: description.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'branches.feedback.branchUpdated',
                            'Branch updated successfully.',
                        ),
                    );
                    setIsEditOpen(false);
                },
                onError: (errors) => {
                    setEditErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDisable = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/branches/${data.id}/disable`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? t(
                              'branches.feedback.branchDisabled',
                              'Branch disabled successfully.',
                          )
                        : t(
                              'branches.feedback.branchActivated',
                              'Branch activated successfully.',
                          ),
                );
                setIsDisableOpen(false);
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

        router.delete(`/branches/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'branches.feedback.branchDeleted',
                        'Branch deleted successfully.',
                    ),
                );
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            {canViewBranch || canManageBranch || canDeleteBranch ? (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">
                                {t('branches.actions.openMenu', 'Open menu')}
                            </span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {t('branches.table.actions', 'Actions')}
                        </DropdownMenuLabel>
                        {canViewBranch ? (
                            <DropdownMenuItem
                                onClick={() => router.visit(`/branches/${data.id}`)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('branches.actions.view', 'View')}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageBranch ? (
                            <DropdownMenuItem
                                onClick={() => {
                                    resetEdit();
                                    setIsEditOpen(true);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('branches.actions.edit', 'Edit')}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageBranch ? (
                            <DropdownMenuItem onClick={openKitchenAssign}>
                                <CookingPot className="mr-2 h-4 w-4" />
                                {t('branches.actions.assignKitchens', 'Assign Kitchens')}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageBranch ? (
                            <DropdownMenuItem onClick={() => setIsDisableOpen(true)}>
                                {data.is_active ? (
                                    <MapPinOff className="mr-2 h-4 w-4" />
                                ) : (
                                    <MapPin className="mr-2 h-4 w-4" />
                                )}
                                {data.is_active
                                    ? t('branches.actions.deactivate', 'Deactivate')
                                    : t('branches.actions.activate', 'Activate')}
                            </DropdownMenuItem>
                        ) : null}
                        {canDeleteBranch ? (
                            <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                                <Trash className="mr-2 h-4 w-4 text-red-600" />
                                {t('branches.actions.delete', 'Delete')}
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('branches.modals.edit.title', 'Edit Branch')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'branches.modals.edit.description',
                                'Update the branch information and location.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`branch-name-${data.id}`}>
                                {t('branches.fields.name', 'Name')}
                            </Label>
                            <Input
                                id={`branch-name-${data.id}`}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('branches.fields.country', 'Country')}</Label>
                            <Select
                                value={countryId}
                                onValueChange={(value) => {
                                    setCountryId(value);
                                    if (value !== countryId) {
                                        setProvinceId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'branches.placeholders.selectCountry',
                                            'Select country',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country.id}
                                            value={String(country.id)}
                                        >
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('branches.fields.province', 'Province')}</Label>
                            <Select
                                value={provinceId}
                                onValueChange={setProvinceId}
                                disabled={
                                    !!countryId &&
                                    editProvinceOptions.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'branches.placeholders.selectProvince',
                                            'Select province',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {editProvinceOptions.map((province) => (
                                        <SelectItem
                                            key={province.id}
                                            value={String(province.id)}
                                        >
                                            {province.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.province_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`branch-address-${data.id}`}>
                                {t('branches.fields.address', 'Address')}
                            </Label>
                            <Input
                                id={`branch-address-${data.id}`}
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />
                            <InputError message={editErrors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`branch-description-${data.id}`}>
                                {t('branches.fields.description', 'Description')}
                            </Label>
                            <Textarea
                                id={`branch-description-${data.id}`}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                            <InputError message={editErrors.description} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={
                                !name.trim() ||
                                !countryId ||
                                !provinceId ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {t('branches.actions.saveChanges', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isKitchenOpen} onOpenChange={setIsKitchenOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'branches.modals.kitchens.title',
                                'Assign Kitchens',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'branches.modals.kitchens.description',
                                'Select kitchens available for :name.',
                            ).replace(':name', data.name)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('branches.common.selected', 'Selected')}</span>
                            <div className="flex items-center gap-3">
                                <span>
                                    {t(
                                        'branches.common.selectedCount',
                                        ':selected of :total',
                                    )
                                        .replace(':selected', String(selectedKitchenIds.size))
                                        .replace(':total', String(kitchens.length))}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-2 py-1 text-xs"
                                    onClick={toggleAllKitchens}
                                >
                                    {selectedKitchenIds.size === sortedKitchens.length
                                        ? t('common.clearAll', 'Clear all')
                                        : t('common.selectAll', 'Select all')}
                                </Button>
                            </div>
                        </div>
                        <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-3">
                            {sortedKitchens.map((kitchen) => (
                                <label
                                    key={kitchen.id}
                                    className="flex items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={selectedKitchenIds.has(
                                            kitchen.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggleKitchen(kitchen.id)
                                        }
                                    />
                                    <span>
                                        {kitchen.name ??
                                            t(
                                                'branches.common.kitchenFallback',
                                                'Kitchen #:id',
                                            ).replace(':id', String(kitchen.id))}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsKitchenOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleAssignKitchens}
                            disabled={isSubmitting}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            {t('branches.actions.saveKitchens', 'Save Kitchens')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? t(
                                      'branches.modals.toggle.deactivateTitle',
                                      'Deactivate branch',
                                  )
                                : t(
                                      'branches.modals.toggle.activateTitle',
                                      'Activate branch',
                                  )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? t(
                                      'branches.modals.toggle.deactivateDescription',
                                      'This will mark the branch as inactive.',
                                  )
                                : t(
                                      'branches.modals.toggle.activateDescription',
                                      'This will mark the branch as active.',
                                  )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-5 w-5" />
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleDisable}
                            disabled={isSubmitting}
                        >
                            <MapPinOff className="mr-2 h-5 w-5" />
                            {data.is_active
                                ? t('branches.actions.deactivate', 'Deactivate')
                                : t('branches.actions.activate', 'Activate')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('branches.modals.delete.title', 'Delete branch')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'branches.modals.delete.description',
                                'This will permanently remove the branch and related data.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-5 w-5" />
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            <Trash2 className="mr-2 h-5 w-5" />
                            {t('branches.actions.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
