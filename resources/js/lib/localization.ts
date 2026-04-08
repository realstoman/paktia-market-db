import translations, { type LocaleCode } from '@/locales';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

interface TranslationTree {
    [key: string]: string | TranslationTree;
}

function getNestedValue(
    source: TranslationTree,
    path: string,
): string | TranslationTree | undefined {
    return path.split('.').reduce<string | TranslationTree | undefined>(
        (current, segment) => {
            if (
                current === undefined ||
                current === null ||
                typeof current === 'string'
            ) {
                return undefined;
            }

            return current[segment];
        },
        source,
    );
}

export function useLocalization() {
    const { localization } = usePage<SharedData>().props;
    const locale = (localization?.locale ?? 'en') as LocaleCode;
    const activeTranslations = translations[locale] ?? translations.en;

    const t = (key: string, fallback?: string): string => {
        const translated =
            getNestedValue(activeTranslations as TranslationTree, key) ??
            getNestedValue(translations.en as TranslationTree, key);

        return typeof translated === 'string'
            ? translated
            : fallback ?? key;
    };

    return {
        locale,
        direction: localization?.direction ?? 'ltr',
        isRtl: localization?.isRtl ?? false,
        languages: localization?.languages ?? [],
        t,
    };
}
