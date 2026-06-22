import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useEffect, useId, useMemo } from 'react';

interface PropertyImageUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    existingImageUrl?: string | null;
    className?: string;
}

export function PropertyImageUpload({
    value,
    onChange,
    error,
    existingImageUrl,
    className = '',
}: PropertyImageUploadProps) {
    const { t } = useLocalization();
    const inputId = useId();
    const previewUrl = useMemo(
        () => (value ? URL.createObjectURL(value) : existingImageUrl),
        [existingImageUrl, value],
    );

    useEffect(
        () => () => {
            if (value && previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        },
        [previewUrl, value],
    );

    return (
        <div className={`grid min-w-0 gap-2 ${className}`}>
            <Label htmlFor={inputId}>
                {t('propertyWorkspace.fields.photo')}
            </Label>
            <label
                htmlFor={inputId}
                className="group grid min-w-0 cursor-pointer gap-4 rounded-2xl border border-dashed border-[#002452]/20 bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center"
            >
                <input
                    id={inputId}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) =>
                        onChange(event.target.files?.[0] ?? null)
                    }
                />

                <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border bg-white">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="size-8 text-muted-foreground/60" />
                    )}
                </div>

                <div className="min-w-0 text-start">
                    <p className="text-sm font-semibold text-foreground">
                        {value
                            ? t('propertyWorkspace.selectedPhoto')
                            : existingImageUrl
                              ? t('propertyWorkspace.currentPhoto')
                              : t('propertyWorkspace.uploadPhoto')}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {value?.name ?? t('propertyWorkspace.uploadPhotoHelp')}
                    </p>
                </div>

                <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-white px-3 text-xs font-medium text-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                    <UploadCloud className="size-4" />
                    {t('propertyWorkspace.choosePhoto')}
                </span>
            </label>
            <InputError message={error} />
        </div>
    );
}
