import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/localization';
import { setFormattingLocale } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function LanguageDropdown({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { locale, languages, t, isRtl } = useLocalization();
    const activeLanguage = languages.find(
        (language) => language.code === locale,
    );

    const handleSelectLanguage = (language: string) => {
        if (language === locale) {
            return;
        }

        setFormattingLocale(language);
        router.put(
            '/language',
            { locale: language },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    document.documentElement.lang = language;
                    const isNextRtl = language === 'fa' || language === 'ps';
                    document.documentElement.dir = isNextRtl ? 'rtl' : 'ltr';
                    document.body.dir = isNextRtl ? 'rtl' : 'ltr';
                    document.documentElement.classList.toggle('rtl', isNextRtl);
                    document.body.classList.toggle('rtl', isNextRtl);
                    router.reload({
                        preserveScroll: true,
                        preserveState: false,
                    });
                },
            },
        );
    };

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-10 gap-2 rounded-xl border-neutral-200 bg-white/90 px-3 text-neutral-700 shadow-sm backdrop-blur transition-all hover:border-brand-primary/30 hover:bg-white hover:text-brand-primary dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-200"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                            <Languages className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium">
                            {activeLanguage?.nativeLabel ?? locale.toUpperCase()}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="sr-only">
                            {t('language.switchLanguage', 'Switch language')}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align={isRtl ? 'start' : 'end'}
                    className="w-64 rounded-2xl border-neutral-200/80 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
                >
                    <div className="px-3 pt-2 pb-3">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {t('language.language', 'Language')}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                            {t(
                                'language.description',
                                'Choose the language used across the interface.',
                            )}
                        </p>
                    </div>

                    <div className="space-y-1">
                        {languages.map((language) => {
                            const isActive = language.code === locale;

                            return (
                                <DropdownMenuItem
                                    key={language.code}
                                    onClick={() =>
                                        handleSelectLanguage(language.code)
                                    }
                                    className={`rounded-xl px-3 py-2.5 focus:bg-brand-primary/5 ${
                                        isActive ? 'bg-brand-primary/5' : ''
                                    }`}
                                >
                                    <div className="flex w-full items-center gap-3">
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold uppercase ${
                                                isActive
                                                    ? 'bg-brand-primary text-white'
                                                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300'
                                            }`}
                                        >
                                            {language.code}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                                                {language.nativeLabel}
                                            </span>
                                            <span className="block text-xs text-neutral-500">
                                                {language.label}
                                            </span>
                                        </span>
                                        {isActive ? (
                                            <Check className="h-4 w-4 text-brand-secondary" />
                                        ) : null}
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
