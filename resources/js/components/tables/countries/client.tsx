import InputError from '@/components/input-error';
import { LocalizedNameFields } from '@/components/locations/localized-name-fields';
import Heading from '@/components/shared/heading';
import { SearchableDropdown } from '@/components/shared/searchable-dropdown';
import { Badge } from '@/components/ui/badge';
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
import { useLocalization } from '@/lib/localization';
import { Country } from '@/types';
import { formatNumber } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Globe2, MapPinned, Plus, Save, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createCountryColumns } from './columns';

interface CountriesClientProps {
    data: Country[];
    isLoading?: boolean;
}

export const CountriesClient: React.FC<CountriesClientProps> = ({
    data,
    isLoading = false,
}) => {
    const { locale, t } = useLocalization();
    const columns = useMemo(
        () => createCountryColumns(t, locale),
        [locale, t],
    );
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isProvinceOpen, setIsProvinceOpen] = useState(false);
    const [nameEn, setNameEn] = useState('');
    const [nameFa, setNameFa] = useState('');
    const [namePs, setNamePs] = useState('');
    const [code, setCode] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [currencySymbol, setCurrencySymbol] = useState('');
    const [provinceNameEn, setProvinceNameEn] = useState('');
    const [provinceNameFa, setProvinceNameFa] = useState('');
    const [provinceNamePs, setProvinceNamePs] = useState('');
    const [provinceCountryId, setProvinceCountryId] = useState('');
    const [createErrors, setCreateErrors] = useState<Record<string, string>>(
        {},
    );
    const [provinceErrors, setProvinceErrors] = useState<
        Record<string, string>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedCountry = data.find(
        (country) => String(country.id) === provinceCountryId,
    );

    const resetCountryForm = () => {
        setNameEn('');
        setNameFa('');
        setNamePs('');
        setCode('');
        setCurrencyCode('');
        setCurrencySymbol('');
        setCreateErrors({});
    };

    const resetProvinceNames = () => {
        setProvinceNameEn('');
        setProvinceNameFa('');
        setProvinceNamePs('');
        setProvinceErrors({});
    };

    const resetProvinceForm = () => {
        resetProvinceNames();
        setProvinceCountryId('');
    };

    const handleCreateCountry = () => {
        if (
            !nameEn.trim() ||
            !nameFa.trim() ||
            !namePs.trim() ||
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
                name: nameEn.trim(),
                name_fa: nameFa.trim(),
                name_ps: namePs.trim(),
                code: code.trim().toUpperCase(),
                currency_code: currencyCode.trim().toUpperCase(),
                currency_symbol: currencySymbol.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateOpen(false);
                    resetCountryForm();
                },
                onError: setCreateErrors,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleCreateProvince = () => {
        if (
            !provinceNameEn.trim() ||
            !provinceNameFa.trim() ||
            !provinceNamePs.trim() ||
            !provinceCountryId ||
            isSubmitting
        ) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/provinces',
            {
                name: provinceNameEn.trim(),
                name_fa: provinceNameFa.trim(),
                name_ps: provinceNamePs.trim(),
                country_id: Number(provinceCountryId),
            },
            {
                preserveScroll: true,
                onSuccess: resetProvinceNames,
                onError: setProvinceErrors,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const canCreateCountry =
        nameEn.trim() &&
        nameFa.trim() &&
        namePs.trim() &&
        code.trim() &&
        currencyCode.trim();
    const canCreateProvince =
        provinceCountryId &&
        provinceNameEn.trim() &&
        provinceNameFa.trim() &&
        provinceNamePs.trim();

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Heading
                    title={t('countryManagement.titleWithCount').replace(
                        ':count',
                        formatNumber(data.length),
                    )}
                    description={t('countryManagement.subtitle')}
                />
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsProvinceOpen(true)}
                    >
                        <MapPinned className="me-2 size-4" />
                        {t('countryManagement.addProvince')}
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="me-2 size-4" />
                        {t('countryManagement.addCountry')}
                    </Button>
                </div>
            </div>
            <Separator className="bg-neutral-200/60 dark:bg-neutral-900/50" />
            <DataTable
                searchKey={[
                    'name',
                    'name_en',
                    'name_translations.fa',
                    'name_translations.ps',
                    'code',
                ]}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder={t('countryManagement.searchPlaceholder')}
            />

            <Dialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open);
                    if (!open) resetCountryForm();
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Globe2 className="size-5" />
                            {t('countryManagement.createCountryTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('countryManagement.createCountryHelp')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <LocalizedNameFields
                            idPrefix="country-create"
                            english={nameEn}
                            dari={nameFa}
                            pashto={namePs}
                            onEnglishChange={setNameEn}
                            onDariChange={setNameFa}
                            onPashtoChange={setNamePs}
                            errors={createErrors}
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="country-code">
                                {t('countryManagement.fields.countryCode')}
                            </Label>
                            <Input
                                id="country-code"
                                dir="ltr"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                placeholder="AF"
                                maxLength={2}
                            />
                            <InputError message={createErrors.code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency-code">
                                {t('countryManagement.fields.currencyCode')}
                            </Label>
                            <Input
                                id="currency-code"
                                dir="ltr"
                                value={currencyCode}
                                onChange={(event) =>
                                    setCurrencyCode(event.target.value)
                                }
                                placeholder="AFN"
                                maxLength={3}
                            />
                            <InputError message={createErrors.currency_code} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency-symbol">
                                {t('countryManagement.fields.currencySymbol')}
                            </Label>
                            <Input
                                id="currency-symbol"
                                value={currencySymbol}
                                onChange={(event) =>
                                    setCurrencySymbol(event.target.value)
                                }
                                placeholder="؋"
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
                            <X className="me-2 size-4" />
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleCreateCountry}
                            disabled={!canCreateCountry || isSubmitting}
                        >
                            <Save className="me-2 size-4" />
                            {t('countryManagement.createCountry')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isProvinceOpen}
                onOpenChange={(open) => {
                    setIsProvinceOpen(open);
                    if (!open) resetProvinceForm();
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPinned className="size-5" />
                            {t('countryManagement.createProvinceTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('countryManagement.createProvinceHelp')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                            <Label>{t('countryManagement.fields.country')}</Label>
                            <SearchableDropdown
                                value={provinceCountryId}
                                onValueChange={setProvinceCountryId}
                                options={data.map((country) => ({
                                    value: String(country.id),
                                    label: country.name,
                                }))}
                                placeholder={t(
                                    'countryManagement.selectCountry',
                                )}
                                searchPlaceholder={t(
                                    'countryManagement.searchCountries',
                                )}
                                emptyText={t(
                                    'countryManagement.noCountriesFound',
                                )}
                            />
                            <InputError message={provinceErrors.country_id} />
                        </div>
                        <LocalizedNameFields
                            idPrefix="province-create"
                            english={provinceNameEn}
                            dari={provinceNameFa}
                            pashto={provinceNamePs}
                            onEnglishChange={setProvinceNameEn}
                            onDariChange={setProvinceNameFa}
                            onPashtoChange={setProvinceNamePs}
                            errors={provinceErrors}
                        />
                    </div>
                    <div className="rounded-xl border bg-[#f8f9fd] p-4">
                        <h3 className="text-sm font-semibold">
                            {t('countryManagement.existingProvinces')}
                        </h3>
                        {!selectedCountry ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t('countryManagement.selectCountryFirst')}
                            </p>
                        ) : selectedCountry.provinces?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedCountry.provinces.map((province) => (
                                    <Badge
                                        key={province.id}
                                        variant="secondary"
                                    >
                                        {province.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t('countryManagement.noProvinces')}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsProvinceOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="me-2 size-4" />
                            {t('common.close')}
                        </Button>
                        <Button
                            onClick={handleCreateProvince}
                            disabled={!canCreateProvince || isSubmitting}
                        >
                            <Save className="me-2 size-4" />
                            {t('countryManagement.createProvince')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
