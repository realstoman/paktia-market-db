import InputError from '@/components/input-error';
import { LocalizedNameFields } from '@/components/locations/localized-name-fields';
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
import { useLocalization } from '@/lib/localization';
import { Country, Province } from '@/types';
import { router } from '@inertiajs/react';
import {
    Edit,
    Eye,
    MapPin,
    MapPinned,
    MapPinOff,
    MoreHorizontal,
    Plus,
    Save,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface CellActionProps {
    data: Country;
}

function translatedName(item: Country | Province, locale: 'fa' | 'ps'): string {
    return item.name_translations?.[locale] ?? '';
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
    const { isRtl, t } = useLocalization();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isProvinceOpen, setIsProvinceOpen] = useState(false);
    const [isEditProvinceOpen, setIsEditProvinceOpen] = useState(false);
    const [editNameEn, setEditNameEn] = useState(data.name_en ?? data.name);
    const [editNameFa, setEditNameFa] = useState(translatedName(data, 'fa'));
    const [editNamePs, setEditNamePs] = useState(translatedName(data, 'ps'));
    const [editCode, setEditCode] = useState(data.code);
    const [editCurrencyCode, setEditCurrencyCode] = useState(
        data.currency_code,
    );
    const [editCurrencySymbol, setEditCurrencySymbol] = useState(
        data.currency_symbol ?? '',
    );
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [provinceNameEn, setProvinceNameEn] = useState('');
    const [provinceNameFa, setProvinceNameFa] = useState('');
    const [provinceNamePs, setProvinceNamePs] = useState('');
    const [provinceErrors, setProvinceErrors] = useState<
        Record<string, string>
    >({});
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(
        null,
    );
    const [deleteProvinceTarget, setDeleteProvinceTarget] =
        useState<Province | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetEdit = () => {
        setEditNameEn(data.name_en ?? data.name);
        setEditNameFa(translatedName(data, 'fa'));
        setEditNamePs(translatedName(data, 'ps'));
        setEditCode(data.code);
        setEditCurrencyCode(data.currency_code);
        setEditCurrencySymbol(data.currency_symbol ?? '');
        setEditErrors({});
    };

    const resetProvinceNames = () => {
        setProvinceNameEn('');
        setProvinceNameFa('');
        setProvinceNamePs('');
        setProvinceErrors({});
    };

    const openEditProvince = (province: Province) => {
        setSelectedProvince(province);
        setProvinceNameEn(province.name_en ?? province.name);
        setProvinceNameFa(translatedName(province, 'fa'));
        setProvinceNamePs(translatedName(province, 'ps'));
        setProvinceErrors({});
        setIsEditProvinceOpen(true);
    };

    const handleEditCountry = () => {
        if (
            !editNameEn.trim() ||
            !editNameFa.trim() ||
            !editNamePs.trim() ||
            !editCode.trim() ||
            !editCurrencyCode.trim() ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        router.put(
            `/countries/${data.id}`,
            {
                name: editNameEn.trim(),
                name_fa: editNameFa.trim(),
                name_ps: editNamePs.trim(),
                code: editCode.trim().toUpperCase(),
                currency_code: editCurrencyCode.trim().toUpperCase(),
                currency_symbol: editCurrencySymbol.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIsEditOpen(false),
                onError: setEditErrors,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleCreateProvince = () => {
        if (
            !provinceNameEn.trim() ||
            !provinceNameFa.trim() ||
            !provinceNamePs.trim() ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/provinces',
            {
                country_id: data.id,
                name: provinceNameEn.trim(),
                name_fa: provinceNameFa.trim(),
                name_ps: provinceNamePs.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: resetProvinceNames,
                onError: setProvinceErrors,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleEditProvince = () => {
        if (
            !selectedProvince ||
            !provinceNameEn.trim() ||
            !provinceNameFa.trim() ||
            !provinceNamePs.trim() ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        router.put(
            `/provinces/${selectedProvince.id}`,
            {
                country_id: data.id,
                name: provinceNameEn.trim(),
                name_fa: provinceNameFa.trim(),
                name_ps: provinceNamePs.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditProvinceOpen(false);
                    setSelectedProvince(null);
                    resetProvinceNames();
                },
                onError: setProvinceErrors,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleToggle = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        router.post(`/countries/${data.id}/disable`, undefined, {
            preserveScroll: true,
            onSuccess: () => setIsToggleOpen(false),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        router.delete(`/countries/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => setIsDeleteOpen(false),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const confirmDeleteProvince = () => {
        if (!deleteProvinceTarget || isSubmitting) return;
        setIsSubmitting(true);
        router.delete(`/provinces/${deleteProvinceTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteProvinceTarget(null),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const canSaveProvince =
        provinceNameEn.trim() && provinceNameFa.trim() && provinceNamePs.trim();

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('countryManagement.actions.openMenu')}
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={isRtl ? 'start' : 'end'}
                    className={isRtl ? 'text-right' : ''}
                >
                    <DropdownMenuLabel>
                        {t('countryManagement.actions.title')}
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => router.visit(`/countries/${data.id}`)}
                    >
                        <Eye className="me-2 size-4" />
                        {t('countryManagement.actions.view')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            resetEdit();
                            setIsEditOpen(true);
                        }}
                    >
                        <Edit className="me-2 size-4" />
                        {t('countryManagement.actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsProvinceOpen(true)}>
                        <MapPinned className="me-2 size-4" />
                        {t('countryManagement.actions.manageProvinces')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsToggleOpen(true)}>
                        {data.is_active ? (
                            <MapPinOff className="me-2 size-4" />
                        ) : (
                            <MapPin className="me-2 size-4" />
                        )}
                        {data.is_active
                            ? t('countryManagement.actions.deactivate')
                            : t('countryManagement.actions.activate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="me-2 size-4" />
                        {t('countryManagement.actions.delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('countryManagement.editCountryTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('countryManagement.editCountryHelp')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <LocalizedNameFields
                            idPrefix={`country-${data.id}`}
                            english={editNameEn}
                            dari={editNameFa}
                            pashto={editNamePs}
                            onEnglishChange={setEditNameEn}
                            onDariChange={setEditNameFa}
                            onPashtoChange={setEditNamePs}
                            errors={editErrors}
                        />
                        <div className="grid gap-2">
                            <Label htmlFor={`country-code-${data.id}`}>
                                {t('countryManagement.fields.countryCode')}
                            </Label>
                            <Input
                                id={`country-code-${data.id}`}
                                dir="ltr"
                                value={editCode}
                                onChange={(event) =>
                                    setEditCode(event.target.value)
                                }
                                maxLength={2}
                            />
                            <InputError message={editErrors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`currency-code-${data.id}`}>
                                {t('countryManagement.fields.currencyCode')}
                            </Label>
                            <Input
                                id={`currency-code-${data.id}`}
                                dir="ltr"
                                value={editCurrencyCode}
                                onChange={(event) =>
                                    setEditCurrencyCode(event.target.value)
                                }
                                maxLength={3}
                            />
                            <InputError message={editErrors.currency_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`currency-symbol-${data.id}`}>
                                {t('countryManagement.fields.currencySymbol')}
                            </Label>
                            <Input
                                id={`currency-symbol-${data.id}`}
                                value={editCurrencySymbol}
                                onChange={(event) =>
                                    setEditCurrencySymbol(event.target.value)
                                }
                            />
                            <InputError message={editErrors.currency_symbol} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="me-2 size-4" />
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleEditCountry}
                            disabled={
                                !editNameEn.trim() ||
                                !editNameFa.trim() ||
                                !editNamePs.trim() ||
                                !editCode.trim() ||
                                !editCurrencyCode.trim() ||
                                isSubmitting
                            }
                        >
                            <Save className="me-2 size-4" />
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isProvinceOpen}
                onOpenChange={(open) => {
                    setIsProvinceOpen(open);
                    if (!open) resetProvinceNames();
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('countryManagement.manageProvincesTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('countryManagement.manageProvincesHelp').replace(
                                ':country',
                                data.name,
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 rounded-xl border bg-[#f8f9fd] p-4 sm:grid-cols-3">
                        <LocalizedNameFields
                            idPrefix={`province-create-${data.id}`}
                            english={provinceNameEn}
                            dari={provinceNameFa}
                            pashto={provinceNamePs}
                            onEnglishChange={setProvinceNameEn}
                            onDariChange={setProvinceNameFa}
                            onPashtoChange={setProvinceNamePs}
                            errors={provinceErrors}
                        />
                        <Button
                            className="sm:col-span-3"
                            onClick={handleCreateProvince}
                            disabled={!canSaveProvince || isSubmitting}
                        >
                            <Plus className="me-2 size-4" />
                            {t('countryManagement.createProvince')}
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">
                            {t('countryManagement.existingProvinces')}
                        </h3>
                        {data.provinces?.length ? (
                            data.provinces.map((province) => (
                                <div
                                    key={province.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3"
                                >
                                    <div className="min-w-0 text-start">
                                        <p className="truncate font-medium">
                                            {province.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {province.name_en}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                openEditProvince(province)
                                            }
                                        >
                                            <Edit className="me-1 size-3.5" />
                                            {t('common.edit')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                setDeleteProvinceTarget(
                                                    province,
                                                )
                                            }
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="me-1 size-3.5" />
                                            {t('common.delete')}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                                {t('countryManagement.noProvinces')}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isEditProvinceOpen}
                onOpenChange={(open) => {
                    setIsEditProvinceOpen(open);
                    if (!open) {
                        setSelectedProvince(null);
                        resetProvinceNames();
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('countryManagement.editProvinceTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('countryManagement.editProvinceHelp')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <LocalizedNameFields
                            idPrefix={`province-edit-${selectedProvince?.id ?? data.id}`}
                            english={provinceNameEn}
                            dari={provinceNameFa}
                            pashto={provinceNamePs}
                            onEnglishChange={setProvinceNameEn}
                            onDariChange={setProvinceNameFa}
                            onPashtoChange={setProvinceNamePs}
                            errors={provinceErrors}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditProvinceOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleEditProvince}
                            disabled={!canSaveProvince || isSubmitting}
                        >
                            <Save className="me-2 size-4" />
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isToggleOpen} onOpenChange={setIsToggleOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? t('countryManagement.deactivateTitle')
                                : t('countryManagement.activateTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? t('countryManagement.deactivateHelp')
                                : t('countryManagement.activateHelp')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleToggle}
                            disabled={isSubmitting}
                        >
                            {data.is_active
                                ? t('countryManagement.actions.deactivate')
                                : t('countryManagement.actions.activate')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('countryManagement.deleteCountryTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('countryManagement.deleteCountryHelp')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={deleteProvinceTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteProvinceTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('countryManagement.deleteProvinceTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('countryManagement.deleteProvinceHelp').replace(
                                ':province',
                                deleteProvinceTarget?.name ?? '',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={confirmDeleteProvince}
                            disabled={isSubmitting}
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
