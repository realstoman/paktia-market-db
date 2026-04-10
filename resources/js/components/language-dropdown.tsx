import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/localization';
import { setFormattingLocale } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Check, Globe } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { toast } from 'sonner';

export default function LanguageDropdown({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { locale, languages, t, isRtl } = useLocalization();

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
                    document.documentElement.classList.toggle(
                        'rtl',
                        isNextRtl,
                    );
                    document.body.classList.toggle('rtl', isNextRtl);
                    toast.success(
                        t(
                            'language.updated',
                            'Language updated successfully.',
                        ),
                    );
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
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full border border-neutral-200/70 bg-neutral-100 transition-all duration-300 hover:bg-neutral-200/70 dark:border-neutral-700/90 dark:bg-neutral-950"
                    >
                        <Globe className="h-5 w-5" />
                        <span className="sr-only">
                            {t('language.switchLanguage', 'Switch language')}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRtl ? 'start' : 'end'}>
                    <DropdownMenuLabel>
                        {t('language.language', 'Language')}
                    </DropdownMenuLabel>
                    {languages.map((language) => (
                        <DropdownMenuItem
                            key={language.code}
                            onClick={() => handleSelectLanguage(language.code)}
                        >
                            <div className="flex w-full items-center justify-between gap-4">
                                <span>
                                    {language.label}
                                    {language.nativeLabel !== language.label
                                        ? ` (${language.nativeLabel})`
                                        : ''}
                                </span>
                                {language.code === locale ? (
                                    <Check className="h-4 w-4 text-primary" />
                                ) : null}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
