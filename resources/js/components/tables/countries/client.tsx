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
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/table/data-table';
import { Country } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Globe, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { columns } from './columns';

interface CountriesClientProps {
    data: Country[];
    isLoading?: boolean;
}

export const CountriesClient: React.FC<CountriesClientProps> = ({
    data,
    isLoading = false,
}) => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isProvinceOpen, setIsProvinceOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('');
    const [provinceName, setProvinceName] = useState('');
    const [provinceCountryId, setProvinceCountryId] = useState('');
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
                    toast.success('Province created successfully.');
                    setIsProvinceOpen(false);
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

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <Heading
                    title={`System Countries: ${formatNumber(data.length)}`}
                    description="Manage system countries"
                />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsProvinceOpen(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Province
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
                open={isProvinceOpen}
                onOpenChange={(open) => {
                    setIsProvinceOpen(open);
                    if (!open) {
                        resetProvinceForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-1">
                            <Globe className="mr-2 h-5 w-5" />
                            Create Province
                        </DialogTitle>
                        <DialogDescription>
                            Add a province and assign it to a country.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Country</Label>
                            <SearchableDropdown
                                value={provinceCountryId}
                                onValueChange={setProvinceCountryId}
                                options={data.map((country) => ({
                                    value: String(country.id),
                                    label: country.name,
                                }))}
                                placeholder="Select country"
                            />
                            <InputError message={provinceErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="province-name">Name</Label>
                            <Input
                                id="province-name"
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
                            onClick={() => setIsProvinceOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateProvince}
                            disabled={
                                !provinceName.trim() ||
                                !provinceCountryId ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Create Province
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
