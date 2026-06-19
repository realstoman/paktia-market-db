import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';
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
                        variant="ghost"
                        className="group h-10 gap-2 rounded-full border border-[#dfe7e9] bg-white py-1 ps-1.5 pe-2.5 text-brand-primary shadow-sm shadow-slate-950/3 transition-all duration-200 hover:border-brand-primary/25 hover:bg-brand-primary/5 hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                        <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm">
                            <Languages className="size-3.5" />
                        </span>
                        <span
                            dir={
                                activeLanguage?.direction ??
                                (isRtl ? 'rtl' : 'ltr')
                            }
                            style={
                                activeLanguage?.code === 'en'
                                    ? {
                                          fontFamily:
                                              "'Manrope', ui-sans-serif, system-ui, sans-serif",
                                      }
                                    : {
                                          fontFamily:
                                              "'Bahij Nazanin', ui-sans-serif, system-ui, sans-serif",
                                      }
                            }
                            className="max-w-20 truncate text-sm font-semibold"
                        >
                            {activeLanguage?.nativeLabel ??
                                locale.toUpperCase()}
                        </span>
                        <ChevronDown className="size-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        <span className="sr-only">
                            {t('language.switchLanguage', 'Switch language')}
                        </span>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align={isRtl ? 'start' : 'end'}
                    sideOffset={10}
                    className="w-60 overflow-hidden rounded-[1.25rem] border-neutral-200/80 bg-white p-0 shadow-[0_18px_50px_rgba(0,36,82,0.16)] dark:border-neutral-700 dark:bg-neutral-900"
                >
                    <div className="bg-brand-primary px-4 py-3.5 text-white">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                                <Languages className="size-4 text-white" />
                            </span>
                            <p className="text-base font-semibold">
                                {t(
                                    'language.switchLanguage',
                                    'Switch language',
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5 p-2">
                        {languages.map((language) => {
                            const isActive = language.code === locale;

                            return (
                                <DropdownMenuItem
                                    key={language.code}
                                    onSelect={() =>
                                        handleSelectLanguage(language.code)
                                    }
                                    className={cn(
                                        'min-h-15 rounded-xl border border-transparent px-3 py-2.5 transition-colors focus:bg-brand-primary/5',
                                        isActive &&
                                            'border-brand-primary/10 bg-brand-primary/5 focus:bg-brand-primary/10',
                                    )}
                                >
                                    <div className="flex w-full items-center gap-3">
                                        <span
                                            style={{
                                                fontFamily:
                                                    "'Manrope', ui-sans-serif, system-ui, sans-serif",
                                            }}
                                            className={cn(
                                                'flex size-9 shrink-0 items-center justify-center rounded-xl border text-[10px] font-extrabold tracking-wider uppercase',
                                                isActive
                                                    ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                                                    : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
                                            )}
                                        >
                                            {language.code}
                                        </span>
                                        <span
                                            dir={isRtl ? 'rtl' : 'ltr'}
                                            className="flex min-w-0 flex-1 items-baseline gap-2"
                                        >
                                            <span
                                                dir={language.direction}
                                                style={
                                                    language.code === 'en'
                                                        ? {
                                                              fontFamily:
                                                                  "'Manrope', ui-sans-serif, system-ui, sans-serif",
                                                          }
                                                        : {
                                                              fontFamily:
                                                                  "'Bahij Nazanin', ui-sans-serif, system-ui, sans-serif",
                                                          }
                                                }
                                                className={cn(
                                                    'truncate font-semibold text-neutral-900 dark:text-white',
                                                    language.code === 'en'
                                                        ? 'text-xs'
                                                        : 'text-sm',
                                                    language.direction === 'rtl'
                                                        ? 'text-right'
                                                        : 'text-left',
                                                )}
                                            >
                                                {language.nativeLabel}
                                            </span>
                                            {language.code !== 'en' ? (
                                                <span
                                                    dir="ltr"
                                                    style={{
                                                        fontFamily:
                                                            "'Manrope', ui-sans-serif, system-ui, sans-serif",
                                                    }}
                                                    className="shrink-0 truncate text-[10px] font-medium text-neutral-400"
                                                >
                                                    {language.label}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span
                                            className={cn(
                                                'flex size-6 shrink-0 items-center justify-center rounded-full transition',
                                                isActive
                                                    ? 'bg-brand-primary text-white'
                                                    : 'bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600',
                                            )}
                                        >
                                            <Check
                                                className={cn(
                                                    'size-3.5 stroke-[3]',
                                                    isActive
                                                        ? 'text-white'
                                                        : 'text-neutral-300 dark:text-neutral-600',
                                                )}
                                            />
                                        </span>
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
