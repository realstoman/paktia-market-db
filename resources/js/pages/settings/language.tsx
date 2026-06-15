import HeadingSmall from '@/components/shared/heading-small';
import { useLocalization } from '@/lib/localization';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { show } from '@/routes/language';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Check } from 'lucide-react';

export default function LanguageSettings() {
    const { locale, languages, t } = useLocalization();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.languageTitle', 'Language settings'),
            href: show().url,
        },
    ];

    const handleChangeLanguage = (language: string) => {
        if (language === locale) {
            return;
        }

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
                    router.reload({
                        preserveScroll: true,
                        preserveState: false,
                    });
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.languageTitle', 'Language settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t('settings.languageTitle', 'Language settings')}
                        description={t(
                            'settings.languageDescription',
                            'Choose the language used for your interface',
                        )}
                    />

                    <div className="space-y-4">
                        <div className="rounded-lg border border-border/70 p-4">
                            <p className="text-sm font-medium text-foreground">
                                {t(
                                    'settings.currentLanguage',
                                    'Current language',
                                )}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {languages.find(
                                    (language) => language.code === locale,
                                )?.nativeLabel ??
                                    languages.find(
                                        (language) => language.code === locale,
                                    )?.label ??
                                    locale}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">
                                {t(
                                    'settings.chooseLanguage',
                                    'Choose a language',
                                )}
                            </p>
                            <div className="grid gap-3">
                                {languages.map((language) => {
                                    const isActive =
                                        language.code === locale;

                                    return (
                                        <button
                                            key={language.code}
                                            type="button"
                                            onClick={() =>
                                                handleChangeLanguage(
                                                    language.code,
                                                )
                                            }
                                            className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                                                isActive
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border/70 hover:bg-muted/50'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {language.label}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {language.nativeLabel}
                                                </p>
                                            </div>
                                            {isActive ? (
                                                <Check className="h-5 w-5 text-primary" />
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {t(
                                'settings.languageHelp',
                                'Dari is the default language. Pashto also uses a right-to-left layout.',
                            )}
                        </p>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
