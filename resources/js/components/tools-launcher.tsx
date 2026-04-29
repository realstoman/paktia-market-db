import InputError from '@/components/input-error';
import { NumericInput } from '@/components/shared/numeric-input';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { KitchensClient } from '@/components/tables/kitchens/client';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useLocalization } from '@/lib/localization';
import {
    Banner,
    Country,
    Cuisine,
    Currency,
    DiscountCard,
    Kitchen,
    KitchenCategory,
    KitchenType,
    Product,
    Province,
    SharedData,
    Vendor,
} from '@/types';
import { formatNumber } from '@/utils/format';
import { usePage } from '@inertiajs/react';
import {
    BadgePercent,
    Building2,
    ChefHat,
    Coins,
    Globe,
    ImagePlus,
    LayoutDashboard,
    Link2,
    Pencil,
    Save,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type ToolReferenceData = NonNullable<SharedData['tools']>;
type DeleteResourceType =
    | 'country'
    | 'province'
    | 'currency'
    | 'vendor'
    | 'banner'
    | 'discountCard';

const emptyToolReferenceData = (): ToolReferenceData => ({
    countries: [],
    provinces: [],
    currencies: [],
    discountCards: [],
    vendors: [],
    banners: [],
    kitchens: [],
    products: [],
    kitchenTypes: [],
    cuisines: [],
    kitchenCategories: [],
});

function getCsrfToken() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export function ToolsLauncher() {
    const { t } = useLocalization();
    const { auth } = usePage<SharedData>().props;
    const canDeleteTools = auth.is_super_admin === true;
    const [toolData, setToolData] = useState<ToolReferenceData>(
        emptyToolReferenceData,
    );
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
    const [isLoadingTools, setIsLoadingTools] = useState(false);
    const [hasLoadedTools, setHasLoadedTools] = useState(false);
    const countries = useMemo(() => toolData.countries ?? [], [toolData]);
    const currencies = useMemo(() => toolData.currencies ?? [], [toolData]);
    const discountCards = useMemo(
        () => toolData.discountCards ?? [],
        [toolData],
    );
    const provinces = useMemo(() => toolData.provinces ?? [], [toolData]);
    const vendors = useMemo(() => toolData.vendors ?? [], [toolData]);
    const banners = useMemo(() => toolData.banners ?? [], [toolData]);
    const kitchens = useMemo(() => toolData.kitchens ?? [], [toolData]);
    const products = useMemo(() => toolData.products ?? [], [toolData]);
    const kitchenTypes = useMemo(() => toolData.kitchenTypes ?? [], [toolData]);
    const cuisines = useMemo(() => toolData.cuisines ?? [], [toolData]);
    const kitchenCategories = useMemo(
        () => toolData.kitchenCategories ?? [],
        [toolData],
    );

    const [isCountriesOpen, setIsCountriesOpen] = useState(false);
    const [isCitiesOpen, setIsCitiesOpen] = useState(false);
    const [isCurrenciesOpen, setIsCurrenciesOpen] = useState(false);
    const [isDiscountCardsOpen, setIsDiscountCardsOpen] = useState(false);
    const [isVendorsOpen, setIsVendorsOpen] = useState(false);
    const [isBannersOpen, setIsBannersOpen] = useState(false);
    const [isKitchensOpen, setIsKitchensOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [countryId, setCountryId] = useState<number | null>(null);
    const [countryName, setCountryName] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [countryCurrencyCode, setCountryCurrencyCode] = useState('AFN');
    const [countryCurrencySymbol, setCountryCurrencySymbol] = useState('؋');

    const [currencyId, setCurrencyId] = useState<number | null>(null);
    const [currencyName, setCurrencyName] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('');

    const [vendorId, setVendorId] = useState<number | null>(null);
    const [vendorName, setVendorName] = useState('');
    const [vendorCategory, setVendorCategory] = useState('');
    const [vendorAddress, setVendorAddress] = useState('');
    const [vendorContact, setVendorContact] = useState('');
    const [vendorPhone, setVendorPhone] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorNotes, setVendorNotes] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{
        type: DeleteResourceType;
        id: number;
        name: string;
    } | null>(null);
    const [discountCardId, setDiscountCardId] = useState<number | null>(null);
    const [discountCardName, setDiscountCardName] = useState('');
    const [discountCardCode, setDiscountCardCode] = useState('');
    const [discountCardType, setDiscountCardType] = useState<
        'percentage' | 'fixed'
    >('percentage');
    const [discountCardValue, setDiscountCardValue] = useState('');
    const [discountCardMaxAmount, setDiscountCardMaxAmount] = useState('');
    const [discountCardDescription, setDiscountCardDescription] = useState('');

    const handleDeleteVendor = (vendor: Vendor) => {
        void deleteToolResource({
            url: `/vendors/${vendor.id}`,
            successMessage: 'Vendor deleted successfully.',
            onSuccess: () => {
                setToolData((current) => ({
                    ...current,
                    vendors: (current.vendors ?? []).filter(
                        (entry) => entry.id !== vendor.id,
                    ),
                }));

                if (vendorId === vendor.id) {
                    resetVendorForm();
                }

                setDeleteDialog(null);
            },
        });
    };

    const [bannerId, setBannerId] = useState<number | null>(null);
    const [bannerTitle, setBannerTitle] = useState('');
    const [bannerType, setBannerType] = useState<
        'product' | 'gift' | 'category' | 'type' | 'social'
    >('product');
    const [bannerLink, setBannerLink] = useState('');
    const [bannerLinkType, setBannerLinkType] = useState<
        'internal' | 'external'
    >('internal');
    const [bannerSortOrder, setBannerSortOrder] = useState('0');
    const [bannerIsActive, setBannerIsActive] = useState(true);
    const [bannerImage, setBannerImage] = useState<File | null>(null);
    const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(
        null,
    );
    const [provinceId, setProvinceId] = useState<number | null>(null);
    const [provinceName, setProvinceName] = useState('');
    const [provinceCountryId, setProvinceCountryId] = useState('');
    const [provinceFilterCountryId, setProvinceFilterCountryId] = useState('');

    const submitJsonRequest = async <TResponse,>({
        url,
        method = 'POST',
        payload,
        successMessage,
        onSuccess,
    }: {
        url: string;
        method?: 'POST' | 'PUT' | 'DELETE';
        payload?: Record<string, unknown> | FormData;
        successMessage: string;
        onSuccess?: (data: TResponse | null) => void | Promise<void>;
    }) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const isFormData = payload instanceof FormData;
            const requestMethod = method === 'POST' ? 'POST' : 'POST';
            const normalizedPayload =
                method === 'POST'
                    ? payload
                    : isFormData
                      ? (() => {
                            const formData = new FormData();
                            formData.append('_method', method);

                            payload.forEach((value, key) => {
                                formData.append(key, value);
                            });

                            return formData;
                        })()
                      : {
                            _method: method,
                            ...(payload ?? {}),
                        };
            const normalizedIsFormData = normalizedPayload instanceof FormData;
            const response = await fetch(url, {
                method: requestMethod,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    ...(normalizedIsFormData
                        ? {}
                        : { 'Content-Type': 'application/json' }),
                },
                cache: 'no-store',
                body:
                    normalizedPayload === undefined
                        ? undefined
                        : normalizedIsFormData
                          ? normalizedPayload
                          : JSON.stringify(normalizedPayload),
            });

            if (response.status === 422) {
                const validationPayload = (await response.json()) as {
                    errors?: Record<string, string>;
                };
                setErrors(validationPayload.errors ?? {});
                return;
            }

            if (!response.ok) {
                throw new Error(
                    `Request failed with status ${response.status}`,
                );
            }

            const responseData = response.headers
                .get('content-type')
                ?.includes('application/json')
                ? ((await response.json()) as TResponse)
                : null;

            await onSuccess?.(responseData);
            await fetchTools(true);
            toast.success(successMessage);
        } catch (error) {
            console.error(error);
            toast.error('Unable to save changes right now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteToolResource = async ({
        url,
        successMessage,
        onSuccess,
    }: {
        url: string;
        successMessage: string;
        onSuccess?: () => void | Promise<void>;
    }) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
                body: JSON.stringify({
                    _method: 'DELETE',
                }),
            });

            if (response.status === 422) {
                const validationPayload = (await response.json()) as {
                    errors?: Record<string, string>;
                };
                setErrors(validationPayload.errors ?? {});
                return;
            }

            if (!response.ok) {
                throw new Error(`Delete failed with status ${response.status}`);
            }

            await onSuccess?.();
            await fetchTools(true);
            toast.success(successMessage);
        } catch (error) {
            console.error(error);
            toast.error('Unable to delete this item right now.');
        }
    };

    const currencyByCode = useMemo(() => {
        return new Map(currencies.map((entry) => [entry.code, entry]));
    }, [currencies]);

    const fetchTools = async (force = false) => {
        if ((!force && hasLoadedTools) || isLoadingTools) {
            return;
        }

        setIsLoadingTools(true);

        try {
            const response = await fetch('/tools/reference-data', {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`Failed to load tools (${response.status})`);
            }

            const payload = (await response.json()) as {
                data?: ToolReferenceData;
            };
            setToolData(payload.data ?? emptyToolReferenceData());
            setHasLoadedTools(true);
        } catch (error) {
            console.error(error);
            toast.error('Unable to load tools right now.');
        } finally {
            setIsLoadingTools(false);
        }
    };

    const handleToolsMenuOpenChange = (open: boolean) => {
        setIsToolsMenuOpen(open);

        if (open) {
            void fetchTools();
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteDialog) return;

        const { type, id } = deleteDialog;

        switch (type) {
            case 'country':
                void deleteToolResource({
                    url: `/countries/${id}`,
                    successMessage: 'Country deleted successfully.',
                    onSuccess: () => {
                        if (countryId === id) resetCountryForm();
                        setDeleteDialog(null);
                    },
                });
                break;
            case 'province':
                void deleteToolResource({
                    url: `/provinces/${id}`,
                    successMessage: 'City deleted successfully.',
                    onSuccess: () => {
                        if (provinceId === id) resetProvinceForm();
                        setDeleteDialog(null);
                    },
                });
                break;
            case 'currency':
                void deleteToolResource({
                    url: `/currencies/${id}`,
                    successMessage: 'Currency deleted successfully.',
                    onSuccess: () => {
                        if (currencyId === id) resetCurrencyForm();
                        setDeleteDialog(null);
                    },
                });
                break;
            case 'discountCard':
                void deleteToolResource({
                    url: `/discount-cards/${id}`,
                    successMessage: 'Discount card deleted successfully.',
                    onSuccess: () => {
                        if (discountCardId === id) resetDiscountCardForm();
                        setDeleteDialog(null);
                    },
                });
                break;
            case 'vendor': {
                const vendor = vendors.find((item) => item.id === id);
                if (vendor) {
                    handleDeleteVendor(vendor);
                } else {
                    setDeleteDialog(null);
                }
                break;
            }
            case 'banner':
                void deleteToolResource({
                    url: `/banners/${id}`,
                    successMessage: 'Banner deleted successfully.',
                    onSuccess: () => {
                        if (bannerId === id) resetBannerForm();
                        setDeleteDialog(null);
                    },
                });
                break;
        }
    };

    const resetCountryForm = () => {
        setCountryId(null);
        setCountryName('');
        setCountryCode('');
        setCountryCurrencyCode('AFN');
        setCountryCurrencySymbol('؋');
        setErrors({});
    };

    const resetCurrencyForm = () => {
        setCurrencyId(null);
        setCurrencyName('');
        setCurrencyCode('');
        setCurrencySymbol('');
        setErrors({});
    };

    const resetDiscountCardForm = () => {
        setDiscountCardId(null);
        setDiscountCardName('');
        setDiscountCardCode('');
        setDiscountCardType('percentage');
        setDiscountCardValue('');
        setDiscountCardMaxAmount('');
        setDiscountCardDescription('');
        setErrors({});
    };

    const resetProvinceForm = () => {
        setProvinceId(null);
        setProvinceName('');
        setProvinceCountryId('');
        setErrors({});
    };

    const resetVendorForm = () => {
        setVendorId(null);
        setVendorName('');
        setVendorCategory('');
        setVendorAddress('');
        setVendorContact('');
        setVendorPhone('');
        setVendorEmail('');
        setVendorNotes('');
        setErrors({});
    };

    const revokeObjectUrlIfBlob = (url: string | null) => {
        if (url?.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    };

    useEffect(() => {
        return () => {
            revokeObjectUrlIfBlob(bannerImagePreview);
        };
    }, [bannerImagePreview]);

    const resetBannerForm = () => {
        setBannerId(null);
        setBannerTitle('');
        setBannerType('product');
        setBannerLink('');
        setBannerLinkType('internal');
        setBannerSortOrder('0');
        setBannerIsActive(true);
        setBannerImage(null);
        revokeObjectUrlIfBlob(bannerImagePreview);
        setBannerImagePreview(null);
        setErrors({});
    };

    const countryOptions = useMemo(
        () => [
            { value: '', label: 'All countries' },
            ...countries.map((country) => ({
                value: String(country.id),
                label: country.name,
            })),
        ],
        [countries],
    );

    const filteredProvinces = useMemo(() => {
        return provinces.filter((province) =>
            provinceFilterCountryId
                ? String(province.country_id ?? '') === provinceFilterCountryId
                : true,
        );
    }, [provinces, provinceFilterCountryId]);

    const submitCountry = () => {
        if (!countryName.trim() || !countryCode.trim() || isSubmitting) return;

        const payload = {
            name: countryName.trim(),
            code: countryCode.trim().toUpperCase(),
            currency_code: countryCurrencyCode,
            currency_symbol: countryCurrencySymbol || null,
        };

        void submitJsonRequest({
            url: countryId ? `/countries/${countryId}` : '/countries',
            method: countryId ? 'PUT' : 'POST',
            payload,
            successMessage: countryId
                ? 'Country updated successfully.'
                : 'Country created successfully.',
            onSuccess: () => {
                resetCountryForm();
            },
        });
    };

    const submitProvince = () => {
        if (!provinceName.trim() || !provinceCountryId || isSubmitting) return;

        const payload = {
            name: provinceName.trim(),
            country_id: Number(provinceCountryId),
        };

        void submitJsonRequest({
            url: provinceId ? `/provinces/${provinceId}` : '/provinces',
            method: provinceId ? 'PUT' : 'POST',
            payload,
            successMessage: provinceId
                ? 'City updated successfully.'
                : 'City created successfully.',
            onSuccess: () => {
                resetProvinceForm();
            },
        });
    };

    const submitCurrency = () => {
        if (
            !currencyName.trim() ||
            !currencyCode.trim() ||
            !currencySymbol.trim() ||
            isSubmitting
        )
            return;
        const payload = {
            name: currencyName.trim(),
            code: currencyCode.trim().toUpperCase(),
            symbol: currencySymbol.trim(),
            is_active: true,
        };

        void submitJsonRequest({
            url: currencyId ? `/currencies/${currencyId}` : '/currencies',
            method: currencyId ? 'PUT' : 'POST',
            payload,
            successMessage: currencyId
                ? 'Currency updated successfully.'
                : 'Currency created successfully.',
            onSuccess: () => {
                resetCurrencyForm();
            },
        });
    };

    const submitDiscountCard = () => {
        if (
            !discountCardName.trim() ||
            !discountCardCode.trim() ||
            !discountCardValue.trim() ||
            isSubmitting
        ) {
            return;
        }

        void submitJsonRequest({
            url: discountCardId
                ? `/discount-cards/${discountCardId}`
                : '/discount-cards',
            method: discountCardId ? 'PUT' : 'POST',
            payload: {
                name: discountCardName.trim(),
                code: discountCardCode.trim().toUpperCase(),
                discount_type: discountCardType,
                discount_value: Number(discountCardValue),
                max_discount_amount: discountCardMaxAmount.trim()
                    ? Number(discountCardMaxAmount)
                    : null,
                description: discountCardDescription.trim() || null,
                is_active: true,
            },
            successMessage: discountCardId
                ? 'Discount card updated successfully.'
                : 'Discount card created successfully.',
            onSuccess: () => {
                resetDiscountCardForm();
            },
        });
    };

    const submitVendor = () => {
        if (!vendorName.trim() || isSubmitting) return;

        const payload = {
            name: vendorName.trim(),
            category: vendorCategory.trim() || null,
            address: vendorAddress.trim() || null,
            contact_person: vendorContact.trim() || null,
            phone: vendorPhone.trim() || null,
            email: vendorEmail.trim() || null,
            notes: vendorNotes.trim() || null,
            is_active: true,
        };

        void submitJsonRequest({
            url: vendorId ? `/vendors/${vendorId}` : '/vendors',
            method: vendorId ? 'PUT' : 'POST',
            payload,
            successMessage: vendorId
                ? 'Vendor updated successfully.'
                : 'Vendor created successfully.',
            onSuccess: () => {
                resetVendorForm();
            },
        });
    };

    const submitBanner = () => {
        if (
            !bannerTitle.trim() ||
            (!bannerId && !bannerImage) ||
            isSubmitting
        ) {
            return;
        }

        const payload = new FormData();
        payload.append('title', bannerTitle.trim());
        payload.append('banner_type', bannerType);
        payload.append('link', bannerLink.trim() || '');
        payload.append('link_type', bannerLinkType);
        payload.append(
            'sort_order',
            bannerSortOrder.trim() ? String(Number(bannerSortOrder)) : '0',
        );
        payload.append('is_active', bannerIsActive ? '1' : '0');
        if (bannerImage) {
            payload.append('image', bannerImage);
        }

        void submitJsonRequest({
            url: bannerId ? `/banners/${bannerId}` : '/banners',
            method: bannerId ? 'PUT' : 'POST',
            payload,
            successMessage: bannerId
                ? 'Banner updated successfully.'
                : 'Banner created successfully.',
            onSuccess: () => {
                resetBannerForm();
            },
        });
    };

    return (
        <>
            <SidebarMenuItem>
                <Popover
                    open={isToolsMenuOpen}
                    onOpenChange={handleToolsMenuOpenChange}
                >
                    <PopoverTrigger asChild className="cursor-pointer">
                        <SidebarMenuButton
                            tooltip={{
                                children: t('navigation.tools', 'Tools'),
                            }}
                        >
                            <LayoutDashboard />
                            <span className="text-sm">
                                {t('navigation.tools', 'Tools')}
                            </span>
                        </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                        side="right"
                        align="start"
                        className="w-64 p-3"
                    >
                        {isLoadingTools ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {t(
                                    'toolsLauncher.common.loading',
                                    'Loading tools...',
                                )}
                            </div>
                        ) : null}
                        <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => {
                                            resetCountryForm();
                                            setIsCountriesOpen(true);
                                        }}
                                    >
                                        <Globe className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.countries',
                                                'Countries',
                                            )}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => {
                                            resetProvinceForm();
                                            setProvinceFilterCountryId('');
                                            setIsCitiesOpen(true);
                                        }}
                                    >
                                        <Globe className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.cities',
                                                'Cities',
                                            )}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => {
                                            resetCurrencyForm();
                                            setIsCurrenciesOpen(true);
                                        }}
                                    >
                                        <Coins className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.currencies',
                                                'Currencies',
                                            )}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => {
                                            resetVendorForm();
                                            setIsVendorsOpen(true);
                                        }}
                                    >
                                        <Building2 className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.vendors',
                                                'Vendors',
                                            )}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => {
                                            resetBannerForm();
                                            setIsBannersOpen(true);
                                        }}
                                    >
                                        <ImagePlus className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.banners',
                                                'Banners',
                                            )}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => {
                                            resetDiscountCardForm();
                                            setIsDiscountCardsOpen(true);
                                        }}
                                    >
                                        <BadgePercent className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.discountCards',
                                                'Discount',
                                            )}{' '}
                                            <br />{' '}
                                            {t(
                                                'toolsLauncher.tiles.cards',
                                                'Cards',
                                            )}
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        disabled={isLoadingTools}
                                        onClick={() => setIsKitchensOpen(true)}
                                    >
                                        <ChefHat className="h-5 w-5" />
                                        <span className="text-xs">
                                            {t(
                                                'toolsLauncher.tiles.kitchens',
                                                'Kitchens',
                                            )}
                                        </span>
                                    </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </SidebarMenuItem>

            <Dialog open={isCountriesOpen} onOpenChange={setIsCountriesOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.countries.title',
                                'Manage Countries',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.countries.description',
                                'Country CRUD with currency details.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={countryName}
                                onChange={(event) =>
                                    setCountryName(event.target.value)
                                }
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Code</Label>
                            <Input
                                maxLength={2}
                                value={countryCode}
                                onChange={(event) =>
                                    setCountryCode(event.target.value)
                                }
                            />
                            <InputError message={errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Currency Code</Label>
                            <Input
                                maxLength={3}
                                value={countryCurrencyCode}
                                onChange={(event) => {
                                    const code =
                                        event.target.value.toUpperCase();
                                    setCountryCurrencyCode(code);
                                    const selected = currencyByCode.get(code);
                                    if (selected?.symbol)
                                        setCountryCurrencySymbol(
                                            selected.symbol,
                                        );
                                }}
                            />
                            <InputError message={errors.currency_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Currency Symbol</Label>
                            <Input
                                value={countryCurrencySymbol}
                                onChange={(event) =>
                                    setCountryCurrencySymbol(event.target.value)
                                }
                            />
                            <InputError message={errors.currency_symbol} />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={resetCountryForm}>
                            {t('toolsLauncher.actions.clear', 'Clear')}
                        </Button>
                        <Button
                            onClick={submitCountry}
                            disabled={
                                isSubmitting ||
                                !countryName.trim() ||
                                !countryCode.trim()
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {countryId
                                ? t(
                                      'toolsLauncher.actions.updateCountry',
                                      'Update Country',
                                  )
                                : t(
                                      'toolsLauncher.actions.saveCountry',
                                      'Save Country',
                                  )}
                        </Button>
                    </DialogFooter>
                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {countries.map((country: Country) => (
                            <div
                                key={country.id}
                                className="flex items-center justify-between rounded border p-2"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {country.name} ({country.code})
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {country.currency_code}{' '}
                                        {country.currency_symbol ?? '-'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setCountryId(country.id);
                                            setCountryName(country.name);
                                            setCountryCode(country.code);
                                            setCountryCurrencyCode(
                                                country.currency_code,
                                            );
                                            setCountryCurrencySymbol(
                                                country.currency_symbol ?? '',
                                            );
                                            setErrors({});
                                        }}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        {t('toolsLauncher.actions.edit', 'Edit')}
                                    </Button>
                                    {canDeleteTools ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteDialog({
                                                    type: 'country',
                                                    id: country.id,
                                                    name: country.name,
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            {t(
                                                'toolsLauncher.actions.delete',
                                                'Delete',
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCitiesOpen} onOpenChange={setIsCitiesOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.cities.title',
                                'Manage Cities',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.cities.description',
                                'Add, edit, or delete cities and assign them to a country.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 sm:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="grid gap-4 rounded-md border p-4">
                            <div className="grid gap-2">
                                <Label>Country</Label>
                                <SearchableDropdown
                                    value={provinceCountryId}
                                    options={countryOptions.filter(
                                        (option) => option.value !== '',
                                    )}
                                    onValueChange={setProvinceCountryId}
                                    placeholder="Select country"
                                    searchPlaceholder="Search countries..."
                                    emptyText="No countries found."
                                />
                                <InputError message={errors.country_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>City Name</Label>
                                <Input
                                    value={provinceName}
                                    onChange={(event) =>
                                        setProvinceName(event.target.value)
                                    }
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={resetProvinceForm}
                                    disabled={isSubmitting}
                                >
                                    {t('toolsLauncher.actions.clear', 'Clear')}
                                </Button>
                                <Button
                                    onClick={submitProvince}
                                    disabled={
                                        isSubmitting ||
                                        !provinceName.trim() ||
                                        !provinceCountryId
                                    }
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {provinceId
                                        ? t(
                                              'toolsLauncher.actions.updateCity',
                                              'Update City',
                                          )
                                        : t(
                                              'toolsLauncher.actions.saveCity',
                                              'Save City',
                                          )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <SearchableDropdown
                                value={provinceFilterCountryId}
                                options={countryOptions}
                                onValueChange={setProvinceFilterCountryId}
                                placeholder="All countries"
                                searchPlaceholder="Search countries..."
                                emptyText="No countries found."
                                className="sm:w-[240px]"
                            />
                            <div className="max-h-72 space-y-2 overflow-auto rounded-md border p-3">
                                {filteredProvinces.map((province: Province) => (
                                    <div
                                        key={province.id}
                                        className="flex items-center justify-between rounded border p-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {province.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {typeof province.country ===
                                                'string'
                                                    ? province.country
                                                    : (province.country?.name ??
                                                      countries.find(
                                                          (country) =>
                                                              country.id ===
                                                              province.country_id,
                                                      )?.name ??
                                                      '-')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setProvinceId(province.id);
                                                    setProvinceName(
                                                        province.name,
                                                    );
                                                    setProvinceCountryId(
                                                        String(
                                                            province.country_id ??
                                                                '',
                                                        ),
                                                    );
                                                    setErrors({});
                                                }}
                                            >
                                                <Pencil className="mr-1 h-3 w-3" />
                                                {t(
                                                    'toolsLauncher.actions.edit',
                                                    'Edit',
                                                )}
                                            </Button>
                                            {canDeleteTools ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeleteDialog({
                                                            type: 'province',
                                                            id: province.id,
                                                            name: province.name,
                                                        })
                                                    }
                                                >
                                                    <Trash2 className="mr-1 h-3 w-3" />
                                                    {t(
                                                        'toolsLauncher.actions.delete',
                                                        'Delete',
                                                    )}
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                                {filteredProvinces.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No cities found.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCurrenciesOpen} onOpenChange={setIsCurrenciesOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.currencies.title',
                                'Manage Currencies',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.currencies.description',
                                'Global currencies for inventory, payments and other modules.',
                            )}
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
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Code</Label>
                            <Input
                                maxLength={3}
                                value={currencyCode}
                                onChange={(event) =>
                                    setCurrencyCode(event.target.value)
                                }
                            />
                            <InputError message={errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Symbol</Label>
                            <Input
                                value={currencySymbol}
                                onChange={(event) =>
                                    setCurrencySymbol(event.target.value)
                                }
                            />
                            <InputError message={errors.symbol} />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={resetCurrencyForm}>
                            {t('toolsLauncher.actions.clear', 'Clear')}
                        </Button>
                        <Button
                            onClick={submitCurrency}
                            disabled={
                                isSubmitting ||
                                !currencyName.trim() ||
                                !currencyCode.trim() ||
                                !currencySymbol.trim()
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {currencyId
                                ? t(
                                      'toolsLauncher.actions.updateCurrency',
                                      'Update Currency',
                                  )
                                : t(
                                      'toolsLauncher.actions.saveCurrency',
                                      'Save Currency',
                                  )}
                        </Button>
                    </DialogFooter>
                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {currencies.map((currency: Currency) => (
                            <div
                                key={currency.id}
                                className="flex items-center justify-between rounded border p-2"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {currency.name} ({currency.code})
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {currency.symbol}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setCurrencyId(currency.id);
                                            setCurrencyName(currency.name);
                                            setCurrencyCode(currency.code);
                                            setCurrencySymbol(currency.symbol);
                                            setErrors({});
                                        }}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        {t('toolsLauncher.actions.edit', 'Edit')}
                                    </Button>
                                    {canDeleteTools ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteDialog({
                                                    type: 'currency',
                                                    id: currency.id,
                                                    name: currency.name,
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            {t(
                                                'toolsLauncher.actions.delete',
                                                'Delete',
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isDiscountCardsOpen}
                onOpenChange={setIsDiscountCardsOpen}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.discountCards.title',
                                'Manage Discount Cards',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.discountCards.description',
                                'Create flexible discount cards for percentage or fixed-amount customer benefits.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={discountCardName}
                                onChange={(event) =>
                                    setDiscountCardName(event.target.value)
                                }
                                placeholder="Platinum"
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Code</Label>
                            <Input
                                value={discountCardCode}
                                onChange={(event) =>
                                    setDiscountCardCode(event.target.value)
                                }
                                placeholder="PLATINUM-15"
                            />
                            <InputError message={errors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Discount Type</Label>
                            <Select
                                value={discountCardType}
                                onValueChange={(value) =>
                                    setDiscountCardType(
                                        value as 'percentage' | 'fixed',
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">
                                        Percentage
                                    </SelectItem>
                                    <SelectItem value="fixed">
                                        Fixed Amount
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.discount_type} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {discountCardType === 'percentage'
                                    ? 'Percentage'
                                    : 'Fixed Amount'}
                            </Label>
                            <NumericInput
                                min="0"
                                value={discountCardValue}
                                onValueChange={setDiscountCardValue}
                            />
                            <InputError message={errors.discount_value} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Max Discount (Optional)</Label>
                            <NumericInput
                                min="0"
                                value={discountCardMaxAmount}
                                onValueChange={setDiscountCardMaxAmount}
                            />
                            <InputError message={errors.max_discount_amount} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Description</Label>
                            <Input
                                value={discountCardDescription}
                                onChange={(event) =>
                                    setDiscountCardDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="VIP repeat customer card"
                            />
                            <InputError message={errors.description} />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={resetDiscountCardForm}
                        >
                            {t('toolsLauncher.actions.clear', 'Clear')}
                        </Button>
                        <Button
                            variant={'outline'}
                            onClick={submitDiscountCard}
                            disabled={
                                isSubmitting ||
                                !discountCardName.trim() ||
                                !discountCardCode.trim() ||
                                !discountCardValue.trim()
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {discountCardId
                                ? t(
                                      'toolsLauncher.actions.updateDiscountCard',
                                      'Update Discount Card',
                                  )
                                : t(
                                      'toolsLauncher.actions.saveDiscountCard',
                                      'Save Discount Card',
                                  )}
                        </Button>
                    </DialogFooter>
                    <div className="max-h-60 space-y-2 overflow-auto rounded-md border p-3">
                        {discountCards.map((card: DiscountCard) => (
                            <div
                                key={card.id}
                                className="flex items-center justify-between rounded border p-2"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {card.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {card.code} •{' '}
                                        {card.discount_type === 'percentage'
                                            ? `${Number(card.discount_value) || 0}%`
                                            : formatNumber(
                                                  Number(card.discount_value) ||
                                                      0,
                                              )}{' '}
                                        {card.discount_type === 'fixed'
                                            ? 'AFN'
                                            : ''}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setDiscountCardId(card.id);
                                            setDiscountCardName(card.name);
                                            setDiscountCardCode(card.code);
                                            setDiscountCardType(
                                                card.discount_type === 'fixed'
                                                    ? 'fixed'
                                                    : 'percentage',
                                            );
                                            setDiscountCardValue(
                                                String(
                                                    Number(
                                                        card.discount_value,
                                                    ) || 0,
                                                ),
                                            );
                                            setDiscountCardMaxAmount(
                                                card.max_discount_amount
                                                    ? String(
                                                          Number(
                                                              card.max_discount_amount,
                                                          ) || 0,
                                                      )
                                                    : '',
                                            );
                                            setDiscountCardDescription(
                                                card.description ?? '',
                                            );
                                            setErrors({});
                                        }}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        {t('toolsLauncher.actions.edit', 'Edit')}
                                    </Button>
                                    {canDeleteTools ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteDialog({
                                                    type: 'discountCard',
                                                    id: card.id,
                                                    name: card.name,
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            {t(
                                                'toolsLauncher.actions.delete',
                                                'Delete',
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                        {discountCards.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No discount cards found.
                            </p>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isVendorsOpen} onOpenChange={setIsVendorsOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.vendors.title',
                                'Manage Vendors',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.vendors.description',
                                'Global vendor CRUD for all purchasing modules.',
                            )}
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
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Input
                                value={vendorCategory}
                                onChange={(event) =>
                                    setVendorCategory(event.target.value)
                                }
                            />
                            <InputError message={errors.category} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Contact Person</Label>
                            <Input
                                value={vendorContact}
                                onChange={(event) =>
                                    setVendorContact(event.target.value)
                                }
                            />
                            <InputError message={errors.contact_person} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input
                                value={vendorPhone}
                                onChange={(event) =>
                                    setVendorPhone(event.target.value)
                                }
                            />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input
                                value={vendorEmail}
                                onChange={(event) =>
                                    setVendorEmail(event.target.value)
                                }
                            />
                            <InputError message={errors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Address</Label>
                            <Input
                                value={vendorAddress}
                                onChange={(event) =>
                                    setVendorAddress(event.target.value)
                                }
                            />
                            <InputError message={errors.address} />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Notes</Label>
                            <Input
                                value={vendorNotes}
                                onChange={(event) =>
                                    setVendorNotes(event.target.value)
                                }
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="outline" onClick={resetVendorForm}>
                            {t('toolsLauncher.actions.clear', 'Clear')}
                        </Button>
                        <Button
                            onClick={submitVendor}
                            disabled={isSubmitting || !vendorName.trim()}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {vendorId
                                ? t(
                                      'toolsLauncher.actions.updateVendor',
                                      'Update Vendor',
                                  )
                                : t(
                                      'toolsLauncher.actions.saveVendor',
                                      'Save Vendor',
                                  )}
                        </Button>
                    </DialogFooter>
                    <div className="max-h-52 space-y-2 overflow-auto rounded-md border p-3">
                        {vendors.map((vendor: Vendor) => (
                            <div
                                key={vendor.id}
                                className="flex items-center justify-between rounded border p-2"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {vendor.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {vendor.category || '-'} |{' '}
                                        {vendor.contact_person || '-'} |{' '}
                                        {vendor.phone || '-'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setVendorId(vendor.id);
                                            setVendorName(vendor.name);
                                            setVendorCategory(
                                                vendor.category ?? '',
                                            );
                                            setVendorAddress(
                                                vendor.address ?? '',
                                            );
                                            setVendorContact(
                                                vendor.contact_person ?? '',
                                            );
                                            setVendorPhone(vendor.phone ?? '');
                                            setVendorEmail(vendor.email ?? '');
                                            setVendorNotes(vendor.notes ?? '');
                                            setErrors({});
                                        }}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        {t('toolsLauncher.actions.edit', 'Edit')}
                                    </Button>
                                    {canDeleteTools ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteDialog({
                                                    type: 'vendor',
                                                    id: vendor.id,
                                                    name: vendor.name,
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            {t(
                                                'toolsLauncher.actions.delete',
                                                'Delete',
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteDialog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteDialog(null);
                    }
                }}
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete{' '}
                            {deleteDialog?.type === 'province'
                                ? 'City'
                                : deleteDialog?.type === 'discountCard'
                                  ? 'Discount Card'
                                  : deleteDialog?.type
                                    ? deleteDialog.type
                                          .charAt(0)
                                          .toUpperCase() +
                                      deleteDialog.type.slice(1)
                                    : 'Item'}
                            ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDialog
                                ? `This will permanently remove ${deleteDialog.name} from the ${
                                      deleteDialog.type === 'province'
                                          ? 'cities'
                                          : deleteDialog.type === 'discountCard'
                                            ? 'discount cards'
                                            : `${deleteDialog.type}s`
                                  } list.`
                                : 'This action cannot be undone.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleConfirmDelete}
                        >
                            {t('toolsLauncher.actions.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isBannersOpen} onOpenChange={setIsBannersOpen}>
                <DialogContent className="sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.banners.title',
                                'Manage Banners',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.banners.description',
                                'Home-screen slider banners for the mobile app. Use internal links for app routes and external links for websites or social pages.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Title</Label>
                                <Input
                                    value={bannerTitle}
                                    onChange={(event) =>
                                        setBannerTitle(event.target.value)
                                    }
                                    placeholder="Qabuli Palaw Special"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Banner Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={bannerType}
                                        onChange={(event) =>
                                            setBannerType(
                                                event.target.value as
                                                    | 'product'
                                                    | 'gift'
                                                    | 'category'
                                                    | 'type'
                                                    | 'social',
                                            )
                                        }
                                    >
                                        <option value="product">Product</option>
                                        <option value="gift">Gift</option>
                                        <option value="category">
                                            Category
                                        </option>
                                        <option value="type">Type</option>
                                        <option value="social">Social</option>
                                    </select>
                                    <InputError message={errors.banner_type} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Link Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={bannerLinkType}
                                        onChange={(event) =>
                                            setBannerLinkType(
                                                event.target.value as
                                                    | 'internal'
                                                    | 'external',
                                            )
                                        }
                                    >
                                        <option value="internal">
                                            Internal
                                        </option>
                                        <option value="external">
                                            External
                                        </option>
                                    </select>
                                    <InputError message={errors.link_type} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sort Order</Label>
                                    <NumericInput
                                        min="0"
                                        value={bannerSortOrder}
                                        onValueChange={setBannerSortOrder}
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Link</Label>
                                <Input
                                    value={bannerLink}
                                    onChange={(event) =>
                                        setBannerLink(event.target.value)
                                    }
                                    placeholder={
                                        bannerLinkType === 'internal'
                                            ? '/products/qabuli-palaw'
                                            : 'https://facebook.com/babataste'
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    {bannerType === 'product' &&
                                    bannerLinkType === 'internal'
                                        ? 'Use a product route or deep link.'
                                        : bannerType === 'category' &&
                                            bannerLinkType === 'internal'
                                          ? 'Use a category route such as Afghan dishes.'
                                          : bannerType === 'type' &&
                                              bannerLinkType === 'internal'
                                            ? 'Use a type route such as dessert.'
                                            : bannerType === 'social'
                                              ? 'Social banners usually point to a full external URL.'
                                              : 'Internal links can be app routes or deep links. External links should be full URLs.'}
                                </p>
                                <InputError message={errors.link} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Banner Image</Label>
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={(event) => {
                                        const file =
                                            event.target.files?.[0] ?? null;

                                        setBannerImage(file);
                                        revokeObjectUrlIfBlob(
                                            bannerImagePreview,
                                        );
                                        setBannerImagePreview(
                                            file
                                                ? URL.createObjectURL(file)
                                                : null,
                                        );
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use a wide image for the mobile slider.
                                </p>
                                <InputError message={errors.image} />
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={bannerIsActive}
                                    onChange={(event) =>
                                        setBannerIsActive(event.target.checked)
                                    }
                                />
                                Active banner
                            </label>

                            <DialogFooter className="sm:justify-between">
                                <Button
                                    variant="outline"
                                    onClick={resetBannerForm}
                                >
                                    {t('toolsLauncher.actions.clear', 'Clear')}
                                </Button>
                                <Button
                                    onClick={submitBanner}
                                    disabled={
                                        isSubmitting ||
                                        !bannerTitle.trim() ||
                                        (!bannerId && !bannerImage)
                                    }
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {bannerId
                                        ? t(
                                              'toolsLauncher.actions.updateBanner',
                                              'Update Banner',
                                          )
                                        : t(
                                              'toolsLauncher.actions.saveBanner',
                                              'Save Banner',
                                          )}
                                </Button>
                            </DialogFooter>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="mb-2 text-sm font-medium">Preview</p>
                            {bannerImagePreview ? (
                                <img
                                    src={bannerImagePreview}
                                    alt={bannerTitle || 'Banner preview'}
                                    className="h-44 w-full rounded-md object-cover"
                                />
                            ) : (
                                <div className="flex h-44 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                                    Select an image to preview it.
                                </div>
                            )}
                            <div className="mt-3 space-y-1 text-sm">
                                <p className="font-medium">
                                    {bannerTitle || 'Banner title'}
                                </p>
                                <p className="text-muted-foreground">
                                    Type: {bannerType}
                                </p>
                                <p className="flex items-center gap-2 text-muted-foreground">
                                    <Link2 className="h-4 w-4" />
                                    {bannerLink || 'No link configured'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-auto rounded-md border p-3">
                        {banners.map((banner: Banner) => (
                            <div
                                key={banner.id}
                                className="flex flex-col gap-3 rounded border p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {banner.image_url ? (
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="h-16 w-24 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-24 items-center justify-center rounded border text-xs text-muted-foreground">
                                            No image
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">
                                            {banner.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {banner.banner_type} |{' '}
                                            {banner.link_type} | order:{' '}
                                            {banner.sort_order ?? 0} |{' '}
                                            {banner.is_active
                                                ? 'active'
                                                : 'inactive'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {banner.link || 'No link'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setBannerId(banner.id);
                                            setBannerTitle(banner.title);
                                            setBannerType(banner.banner_type);
                                            setBannerLink(banner.link ?? '');
                                            setBannerLinkType(banner.link_type);
                                            setBannerSortOrder(
                                                String(banner.sort_order ?? 0),
                                            );
                                            setBannerIsActive(
                                                banner.is_active ?? true,
                                            );
                                            setBannerImage(null);
                                            revokeObjectUrlIfBlob(
                                                bannerImagePreview,
                                            );
                                            setBannerImagePreview(
                                                banner.image_url ?? null,
                                            );
                                            setErrors({});
                                        }}
                                    >
                                        <Pencil className="mr-1 h-3 w-3" />
                                        {t('toolsLauncher.actions.edit', 'Edit')}
                                    </Button>
                                    {canDeleteTools ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setDeleteDialog({
                                                    type: 'banner',
                                                    id: banner.id,
                                                    name: banner.title,
                                                })
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3 w-3" />
                                            {t(
                                                'toolsLauncher.actions.delete',
                                                'Delete',
                                            )}
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isKitchensOpen} onOpenChange={setIsKitchensOpen}>
                <DialogContent className="sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'toolsLauncher.dialogs.kitchens.title',
                                'Manage Kitchens',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'toolsLauncher.dialogs.kitchens.description',
                                'Manage kitchens with the same table columns and actions.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[75vh] overflow-auto pr-1">
                        <KitchensClient
                            data={kitchens as Kitchen[]}
                            products={products as Product[]}
                            kitchenTypes={kitchenTypes as KitchenType[]}
                            cuisines={cuisines as Cuisine[]}
                            kitchenCategories={
                                kitchenCategories as KitchenCategory[]
                            }
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
