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
import { Property, Country, Province } from '@/types';
import { router } from '@inertiajs/react';
import {
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
    data: Property;
    countries: Country[];
    provinces: Province[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    countries,
    provinces,
}) => {
    const { t } = useLocalization();
    const { can } = useAuthorization();
    const canViewProperty = can('property.view');
    const canManageProperty = can('property.update');
    const canDeleteProperty = can('property.delete');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDisableOpen, setIsDisableOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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

    const handleEditSubmit = () => {
        if (!name.trim() || !countryId || !provinceId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/properties/${data.id}`,
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
                            'properties.feedback.propertyUpdated',
                            'Property updated successfully.',
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

        router.post(`/properties/${data.id}/disable`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? t(
                              'properties.feedback.propertyDisabled',
                              'Property disabled successfully.',
                          )
                        : t(
                              'properties.feedback.propertyActivated',
                              'Property activated successfully.',
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

        router.delete(`/properties/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'properties.feedback.propertyDeleted',
                        'Property deleted successfully.',
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
            {canViewProperty || canManageProperty || canDeleteProperty ? (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">
                                {t('properties.actions.openMenu', 'Open menu')}
                            </span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {t('properties.table.actions', 'Actions')}
                        </DropdownMenuLabel>
                        {canViewProperty ? (
                            <DropdownMenuItem
                                onClick={() => router.visit(`/properties/${data.id}`)}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('properties.actions.view', 'View')}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageProperty ? (
                            <DropdownMenuItem
                                onClick={() => {
                                    resetEdit();
                                    setIsEditOpen(true);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('properties.actions.edit', 'Edit')}
                            </DropdownMenuItem>
                        ) : null}
                        {canManageProperty ? (
                            <DropdownMenuItem onClick={() => setIsDisableOpen(true)}>
                                {data.is_active ? (
                                    <MapPinOff className="mr-2 h-4 w-4" />
                                ) : (
                                    <MapPin className="mr-2 h-4 w-4" />
                                )}
                                {data.is_active
                                    ? t('properties.actions.deactivate', 'Deactivate')
                                    : t('properties.actions.activate', 'Activate')}
                            </DropdownMenuItem>
                        ) : null}
                        {canDeleteProperty ? (
                            <DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
                                <Trash className="mr-2 h-4 w-4 text-red-600" />
                                {t('properties.actions.delete', 'Delete')}
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('properties.modals.edit.title', 'Edit Property')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'properties.modals.edit.description',
                                'Update the property information and location.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`property-name-${data.id}`}>
                                {t('properties.fields.name', 'Name')}
                            </Label>
                            <Input
                                id={`property-name-${data.id}`}
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('properties.fields.country', 'Country')}</Label>
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
                                            'properties.placeholders.selectCountry',
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
                            <Label>{t('properties.fields.province', 'Province')}</Label>
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
                                            'properties.placeholders.selectProvince',
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
                            <Label htmlFor={`property-address-${data.id}`}>
                                {t('properties.fields.address', 'Address')}
                            </Label>
                            <Input
                                id={`property-address-${data.id}`}
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />
                            <InputError message={editErrors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`property-description-${data.id}`}>
                                {t('properties.fields.description', 'Description')}
                            </Label>
                            <Textarea
                                id={`property-description-${data.id}`}
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
                            {t('properties.actions.saveChanges', 'Save Changes')}
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
                                      'properties.modals.toggle.deactivateTitle',
                                      'Deactivate property',
                                  )
                                : t(
                                      'properties.modals.toggle.activateTitle',
                                      'Activate property',
                                  )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? t(
                                      'properties.modals.toggle.deactivateDescription',
                                      'This will mark the property as inactive.',
                                  )
                                : t(
                                      'properties.modals.toggle.activateDescription',
                                      'This will mark the property as active.',
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
                                ? t('properties.actions.deactivate', 'Deactivate')
                                : t('properties.actions.activate', 'Activate')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('properties.modals.delete.title', 'Delete property')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'properties.modals.delete.description',
                                'This will permanently remove the property and related data.',
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
                            {t('properties.actions.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
