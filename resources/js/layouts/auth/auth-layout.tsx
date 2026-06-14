import { brand } from '@/config/brand';
import LanguageDropdown from '@/components/language-dropdown';
import { useLocalization } from '@/lib/localization';
import { Boxes, Building2, Copyright, ShieldCheck } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthLayout({
    children,
}: PropsWithChildren<AuthLayoutProps>) {
    const { t, locale, isRtl } = useLocalization();
    const copyrightYear = (() => {
        const getCalendarYear = (intlLocale: string) =>
            new Intl.DateTimeFormat(intlLocale, {
                year: 'numeric',
            })
                .formatToParts(new Date())
                .find((part) => part.type === 'year')
                ?.value ?? '';

        if (locale === 'fa') {
            return getCalendarYear('fa-AF-u-ca-persian');
        }

        if (locale === 'ps') {
            return getCalendarYear('ps-AF-u-ca-persian');
        }

        return String(new Date().getFullYear());
    })();

    return (
        <div className="flex min-h-screen min-h-svh w-full">
            {/* Left Side - Auth Forms */}
            <div className="relative flex-center flex min-h-screen min-h-svh flex-1 items-stretch justify-center bg-brand-primary p-6 md:p-8 lg:items-center">
                <div
                    className={`absolute top-4 z-20 lg:hidden ${
                        isRtl ? 'left-4' : 'right-4'
                    }`}
                >
                    <LanguageDropdown />
                </div>
                <div className="flex min-h-full w-full max-w-lg flex-col items-start justify-between gap-8 py-2 md:py-4 lg:min-h-[calc(100svh-4rem)]">
                    {/* Brand Logo */}
                    <div className="mb-0 flex w-full items-center justify-center sm:mb-12">
                        <img
                            src={`${brand.logoFull}`}
                            width="120"
                            height="120"
                            alt="Logo"
                        />
                    </div>

                    <div className="w-full">
                        {/* Form Content */}
                        {children}

                        {/* Footer - Security Note */}
                        <div
                            className={`mt-8 border-t border-slate-800 pt-6 ${
                                isRtl ? 'text-right' : 'text-left'
                            }`}
                        >
                            <div
                                className={`flex items-start gap-2 text-sm text-slate-400 ${
                                    isRtl
                                        ? 'justify-start text-right'
                                        : 'justify-left text-left'
                                }`}
                            >
                                <Copyright className="mt-1 h-4 w-4 shrink-0" />
                                <div>
                                    {locale === 'en'
                                        ? `Copyright ${copyrightYear}`
                                        : copyrightYear}
                                    <span className="pr-1 pl-1 text-brand-secondary/80">
                                        {t(
                                        'brand.marketName',
                                            brand.name,
                                        )}
                                        .
                                    </span>
                                    {t(
                                        'footer.allRightsReserved',
                                        'All rights reserved.',
                                    )}
                                </div>
                            </div>
                            <p
                                className={`flex items-center gap-1 pt-2 text-sm text-slate-400 ${
                                    isRtl
                                        ? 'justify-start text-right'
                                        : 'justify-left text-left'
                                }`}
                            >
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                {t(
                                    'auth.securedBy',
                                    'Secured by industry-standard encryption',
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Promotional Content */}
            <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-brand-tertiary p-12 lg:flex dark:bg-brand-bg-dark">
                <div
                    className={`absolute top-8 z-20 ${
                        isRtl ? 'left-8' : 'right-8'
                    }`}
                >
                    <LanguageDropdown />
                </div>
                {/* Decorative Background Elements */}
                <div className="relative z-10 max-w-lg">
                    {/* Feature Cards */}
                    <div className="mb-12 space-y-6">
                        {/* Main Hero Card */}
                        <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl bg-brand-primary shadow-2xl">
                            <img
                                src={brand.logoFull}
                                alt={brand.name}
                                className="max-h-40 w-3/4 object-contain"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            <div className="absolute right-6 bottom-6 left-6">
                                <h3 className="mb-2 text-2xl font-bold text-white">
                                    {t(
                                        'auth.promo.heroTitle',
                                        'Manage Paktia Market',
                                    )}
                                </h3>
                                <p className="text-sm text-white/90">
                                    {t(
                                        'auth.promo.heroDescription',
                                        'Complete ERP solution for modern market operations',
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Feature Cards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-orange-50 bg-white/80 p-6">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary">
                                    <Building2 className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="mb-1 font-semibold text-slate-800">
                                    {t(
                                        'auth.promo.branchTitle',
                                        'Branch Management',
                                    )}
                                </h4>
                                <p className="text-xs text-slate-600">
                                    {t(
                                        'auth.promo.branchDescription',
                                        'Organize locations and staff',
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl border border-orange-50 bg-white/80 p-6">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary">
                                    <Boxes className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="mb-1 font-semibold text-slate-800">
                                    {t(
                                        'auth.promo.inventoryTitle',
                                        'Inventory Control',
                                    )}
                                </h4>
                                <p className="text-xs text-slate-600">
                                    {t(
                                        'auth.promo.inventoryDescription',
                                        'Track stock and valuation',
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
