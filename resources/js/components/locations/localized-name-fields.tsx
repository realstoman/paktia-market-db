import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';

interface LocalizedNameFieldsProps {
    idPrefix: string;
    english: string;
    dari: string;
    pashto: string;
    onEnglishChange: (value: string) => void;
    onDariChange: (value: string) => void;
    onPashtoChange: (value: string) => void;
    errors?: Record<string, string>;
}

export function LocalizedNameFields({
    idPrefix,
    english,
    dari,
    pashto,
    onEnglishChange,
    onDariChange,
    onPashtoChange,
    errors = {},
}: LocalizedNameFieldsProps) {
    const { t } = useLocalization();

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name-en`}>
                    {t('countryManagement.fields.nameEn')}
                </Label>
                <Input
                    id={`${idPrefix}-name-en`}
                    dir="ltr"
                    value={english}
                    onChange={(event) => onEnglishChange(event.target.value)}
                />
                <InputError message={errors.name} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name-fa`}>
                    {t('countryManagement.fields.nameFa')}
                </Label>
                <Input
                    id={`${idPrefix}-name-fa`}
                    dir="rtl"
                    value={dari}
                    onChange={(event) => onDariChange(event.target.value)}
                />
                <InputError message={errors.name_fa} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name-ps`}>
                    {t('countryManagement.fields.namePs')}
                </Label>
                <Input
                    id={`${idPrefix}-name-ps`}
                    dir="rtl"
                    value={pashto}
                    onChange={(event) => onPashtoChange(event.target.value)}
                />
                <InputError message={errors.name_ps} />
            </div>
        </>
    );
}
