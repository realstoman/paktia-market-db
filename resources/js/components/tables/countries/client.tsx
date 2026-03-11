import InputError from '@/components/input-error';
import Heading from '@/components/shared/heading';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Country, Province } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Edit, Globe, MapPinned, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { columns } from './columns';

interface CountriesClientProps {
    data: Country[];
    isLoading?: boolean;
}

type ProvinceWithCountry = Province & {
    countryId: number;
    countryName: string;
};

export const CountriesClient: React.FC<CountriesClientProps> = ({
    data,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCitiesOpen, setIsCitiesOpen] = useState(false);
    const [isEditCityOpen, setIsEditCityOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('');
    const [provinceName, setProvinceName] = useState('');
    const [provinceCountryId, setProvinceCountryId] = useState('');
    const [cityFilterCountryId, setCityFilterCountryId] = useState('');
    const [editingProvinceId, setEditingProvinceId] = useState<number | null>(
        null,
    );
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [provinceErrors, setProvinceErrors] = useState<
        Record<string, string>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetCountryForm = () => {
        setName('');
        setCode('');
        setCurrencyCode('');
        setCurrencySymbol('');
        setCreateErrors({});
    };

    const resetProvinceForm = () => {
        setProvinceName('');
        setProvinceCountryId('');
        setEditingProvinceId(null);
        setProvinceErrors({});
    };

    const handleCreateCountry = () => {
        if (
            !name.trim() ||
            !code.trim() ||
            !currencyCode.trim() ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/countries',
            {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                currency_code: currencyCode.trim().toUpperCase(),
                currency_symbol: currencySymbol.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Country created successfully.');
                    setIsCreateOpen(false);
                    resetCountryForm();
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

    const handleCreateProvince = () => {
        if (!provinceName.trim() || !provinceCountryId || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(
            '/provinces',
            {
                name: provinceName.trim(),
                country_id: Number(provinceCountryId),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('City created successfully.');
                    resetProvinceForm();
                },
                onError: (errors) => {
                    setProvinceErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const countryOptions = useMemo(
        () => [
            { value: '', label: 'All countries' },
            ...data.map((country) => ({
                value: String(country.id),
                label: country.name,
            })),
        ],
        [data],
    );

    const allProvinces = useMemo<ProvinceWithCountry[]>(
        () =>
            data.flatMap((country) =>
                (country.provinces ?? []).map((province) => ({
                    ...province,
                    countryId: country.id,
                    countryName: country.name,
                })),
            ),
        [data],
    );

    const filteredProvinces = useMemo(
        () =>
            allProvinces.filter((province) =>
                cityFilterCountryId
                    ? String(province.countryId) === cityFilterCountryId
                    : true,
            ),
        [allProvinces, cityFilterCountryId],
    );

    const openEditCity = (province: ProvinceWithCountry) => {
        setEditingProvinceId(province.id);
        setProvinceName(province.name);
        setProvinceCountryId(String(province.countryId));
        setProvinceErrors({});
        setIsEditCityOpen(true);
    };

    const handleEditProvince = () => {
        if (!editingProvinceId || !provinceName.trim() || !provinceCountryId) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/provinces/${editingProvinceId}`,
            {
                name: provinceName.trim(),
                country_id: Number(provinceCountryId),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('City updated successfully.');
                    setIsEditCityOpen(false);
                    resetProvinceForm();
                },
                onError: (errors) => {
                    setProvinceErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleDeleteProvince = (provinceId: number) => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/provinces/${provinceId}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('City deleted successfully.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Countries: ${formatNumber(data.length)}`}
                    description="Manage system countries and cities"
                />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsCitiesOpen(true)}
                        className="gap-2"
                    >
                        <MapPinned className="h-4 w-4" />
                        Cities
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Country
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={['name', 'code']}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder="Search countries by name or country code..."
            />

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) {
                        resetCountryForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <Globe className="mr-2 h-5 w-5" />
                            Create Country
                        </DialogTitle>
                        <DialogDescription>
                            Add a new country and currency details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="country-name">Name</Label>
                            <Input
                                id="country-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                            <InputError message={createErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="country-code">Code</Label>
                            <Input
                                id="country-code"
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value)
                                }
                                placeholder="US"
                                maxLength={2}
                            />
                            <InputError message={createErrors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency-code">Currency code</Label>
                            <Input
                                id="currency-code"
                                value={currencyCode}
                                onChange={(event) =>
                                    setCurrencyCode(event.target.value)
                                }
                                placeholder="USD"
                                maxLength={3}
                            />
                            <InputError message={createErrors.currency_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency-symbol">
                                Currency symbol
                            </Label>
                            <Input
                                id="currency-symbol"
                                value={currencySymbol}
                                onChange={(event) =>
                                    setCurrencySymbol(event.target.value)
                                }
                                placeholder="$"
                            />
                            <InputError
                                message={createErrors.currency_symbol}
                            />
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
                            onClick={handleCreateCountry}
                            disabled={
                                !name.trim() ||
                                !code.trim() ||
                                !currencyCode.trim() ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Country
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCitiesOpen}
                onOpenChange={(open) => {
                    setIsCitiesOpen(open);
                    if (!open) {
                        resetProvinceForm();
                        setCityFilterCountryId('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <MapPinned className="mr-2 h-5 w-5" />
                            Manage Cities
                        </DialogTitle>
                        <DialogDescription>
                            Add, edit, or delete cities and assign them to a
                            country.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <div className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                            <div className="grid gap-2">
                                <Label>Country</Label>
                                <Select
                                    value={provinceCountryId}
                                    onValueChange={setProvinceCountryId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.map((country) => (
                                            <SelectItem
                                                key={country.id}
                                                value={String(country.id)}
                                            >
                                                {country.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={provinceErrors.country_id}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="city-name">City name</Label>
                                <Input
                                    id="city-name"
                                    value={provinceName}
                                    onChange={(event) =>
                                        setProvinceName(event.target.value)
                                    }
                                    placeholder="Kabul"
                                />
                                <InputError message={provinceErrors.name} />
                            </div>
                            <Button
                                onClick={handleCreateProvince}
                                disabled={
                                    !provinceName.trim() ||
                                    !provinceCountryId ||
                                    isSubmitting
                                }
                                className="w-full gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add City
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <SearchableDropdown
                                value={cityFilterCountryId}
                                options={countryOptions}
                                onValueChange={setCityFilterCountryId}
                                placeholder="All countries"
                                searchPlaceholder="Search countries..."
                                emptyText="No countries found."
                                className="sm:w-[240px]"
                            />
                            <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                                {filteredProvinces.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No cities found.
                                    </p>
                                ) : (
                                    filteredProvinces.map((province) => (
                                        <div
                                            key={province.id}
                                            className="flex items-center justify-between rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {province.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {province.countryName}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEditCity(province)
                                                    }
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleDeleteProvince(
                                                            province.id,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCitiesOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isEditCityOpen}
                onOpenChange={(open) => {
                    setIsEditCityOpen(open);
                    if (!open) {
                        resetProvinceForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Edit City</DialogTitle>
                        <DialogDescription>
                            Update the city and assign it to a country.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Country</Label>
                            <Select
                                value={provinceCountryId}
                                onValueChange={setProvinceCountryId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {data.map((country) => (
                                        <SelectItem
                                            key={country.id}
                                            value={String(country.id)}
                                        >
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={provinceErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-city-name">City name</Label>
                            <Input
                                id="edit-city-name"
                                value={provinceName}
                                onChange={(event) =>
                                    setProvinceName(event.target.value)
                                }
                            />
                            <InputError message={provinceErrors.name} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditCityOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditProvince}
                            disabled={
                                !provinceName.trim() ||
                                !provinceCountryId ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
