import InputError from '@/components/input-error';
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
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { KitchensClient } from '@/components/tables/kitchens/client';
import {
    Country,
    Currency,
    Kitchen,
    Product,
    SharedData,
    Vendor,
} from '@/types';
import { router, usePage } from '@inertiajs/react';
import {
    Building2,
    ChefHat,
    Coins,
    Globe,
    LayoutDashboard,
    Pencil,
    Save,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export function ToolsLauncher() {
    const page = usePage<SharedData>();
    const countries = useMemo(
        () => page.props.tools?.countries ?? [],
        [page.props.tools?.countries],
    );
    const currencies = useMemo(
        () => page.props.tools?.currencies ?? [],
        [page.props.tools?.currencies],
    );
    const vendors = useMemo(
        () => page.props.tools?.vendors ?? [],
        [page.props.tools?.vendors],
    );
    const kitchens = useMemo(
        () => page.props.tools?.kitchens ?? [],
        [page.props.tools?.kitchens],
    );
    const products = useMemo(
        () => page.props.tools?.products ?? [],
        [page.props.tools?.products],
    );
    const kitchenTypes = useMemo(
        () => page.props.tools?.kitchenTypes ?? [],
        [page.props.tools?.kitchenTypes],
    );

    const [isCountriesOpen, setIsCountriesOpen] = useState(false);
    const [isCurrenciesOpen, setIsCurrenciesOpen] = useState(false);
    const [isVendorsOpen, setIsVendorsOpen] = useState(false);
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

    const currencyByCode = useMemo(() => {
        return new Map(currencies.map((entry) => [entry.code, entry]));
    }, [currencies]);

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

    const submitCountry = () => {
        if (!countryName.trim() || !countryCode.trim() || isSubmitting) return;
        setIsSubmitting(true);

        const payload = {
            name: countryName.trim(),
            code: countryCode.trim().toUpperCase(),
            currency_code: countryCurrencyCode,
            currency_symbol: countryCurrencySymbol || null,
        };

        router.post(
            countryId ? `/countries/${countryId}` : '/countries',
            countryId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        countryId
                            ? 'Country updated successfully.'
                            : 'Country created successfully.',
                    );
                    resetCountryForm();
                },
                onError: (validationErrors) => setErrors(validationErrors),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const submitCurrency = () => {
        if (
            !currencyName.trim() ||
            !currencyCode.trim() ||
            !currencySymbol.trim() ||
            isSubmitting
        )
            return;
        setIsSubmitting(true);

        const payload = {
            name: currencyName.trim(),
            code: currencyCode.trim().toUpperCase(),
            symbol: currencySymbol.trim(),
            is_active: true,
        };

        router.post(
            currencyId ? `/currencies/${currencyId}` : '/currencies',
            currencyId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        currencyId
                            ? 'Currency updated successfully.'
                            : 'Currency created successfully.',
                    );
                    resetCurrencyForm();
                },
                onError: (validationErrors) => setErrors(validationErrors),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const submitVendor = () => {
        if (!vendorName.trim() || isSubmitting) return;
        setIsSubmitting(true);

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

        router.post(
            vendorId ? `/vendors/${vendorId}` : '/vendors',
            vendorId ? { _method: 'put', ...payload } : payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        vendorId
                            ? 'Vendor updated successfully.'
                            : 'Vendor created successfully.',
                    );
                    resetVendorForm();
                },
                onError: (validationErrors) => setErrors(validationErrors),
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <>
            <SidebarGroup className="px-2 py-2">
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Popover>
                            <PopoverTrigger asChild className="cursor-pointer">
                                <SidebarMenuButton
                                    tooltip={{ children: 'Tools' }}
                                >
                                    <LayoutDashboard />
                                    <span className="text-base">Tools</span>
                                </SidebarMenuButton>
                            </PopoverTrigger>
                            <PopoverContent
                                side="right"
                                align="start"
                                className="w-64 p-3"
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        onClick={() => {
                                            resetCountryForm();
                                            setIsCountriesOpen(true);
                                        }}
                                    >
                                        <Globe className="h-5 w-5" />
                                        <span className="text-xs">
                                            Countries
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        onClick={() => {
                                            resetCurrencyForm();
                                            setIsCurrenciesOpen(true);
                                        }}
                                    >
                                        <Coins className="h-5 w-5" />
                                        <span className="text-xs">
                                            Currencies
                                        </span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        onClick={() => {
                                            resetVendorForm();
                                            setIsVendorsOpen(true);
                                        }}
                                    >
                                        <Building2 className="h-5 w-5" />
                                        <span className="text-xs">Vendors</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-20 flex-col gap-2"
                                        onClick={() => setIsKitchensOpen(true)}
                                    >
                                        <ChefHat className="h-5 w-5" />
                                        <span className="text-xs">Kitchens</span>
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>

            <Dialog open={isCountriesOpen} onOpenChange={setIsCountriesOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Manage Countries</DialogTitle>
                        <DialogDescription>
                            Country CRUD with currency details.
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
                            Clear
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
                            {countryId ? 'Update Country' : 'Save Country'}
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
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.delete(
                                                `/countries/${country.id}`,
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCurrenciesOpen} onOpenChange={setIsCurrenciesOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Manage Currencies</DialogTitle>
                        <DialogDescription>
                            Global currencies for inventory, payments and other
                            modules.
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
                            Clear
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
                            {currencyId ? 'Update Currency' : 'Save Currency'}
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
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.delete(
                                                `/currencies/${currency.id}`,
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isVendorsOpen} onOpenChange={setIsVendorsOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Manage Vendors</DialogTitle>
                        <DialogDescription>
                            Global vendor CRUD for all purchasing modules.
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
                            Clear
                        </Button>
                        <Button
                            onClick={submitVendor}
                            disabled={isSubmitting || !vendorName.trim()}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {vendorId ? 'Update Vendor' : 'Save Vendor'}
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
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.delete(
                                                `/vendors/${vendor.id}`,
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        <Trash2 className="mr-1 h-3 w-3" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isKitchensOpen} onOpenChange={setIsKitchensOpen}>
                <DialogContent className="sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>Manage Kitchens</DialogTitle>
                        <DialogDescription>
                            Manage kitchens with the same table columns and actions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[75vh] overflow-auto pr-1">
                        <KitchensClient
                            data={kitchens as Kitchen[]}
                            products={products as Product[]}
                            kitchenTypes={kitchenTypes}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
