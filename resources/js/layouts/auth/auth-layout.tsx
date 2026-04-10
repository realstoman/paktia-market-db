import { brand } from '@/config/brand';
import LanguageDropdown from '@/components/language-dropdown';
import { useLocalization } from '@/lib/localization';
import { ChefHat, Copyright, ShieldCheck, Utensils } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthLayout({
    children,
}: PropsWithChildren<AuthLayoutProps>) {
    const { t, isRtl } = useLocalization();

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Auth Forms */}
            <div className="flex-center flex flex-1 items-center justify-center bg-brand-primary p-8">
                <div className="flex h-full max-h-screen w-full max-w-lg flex-col items-start justify-between">
                    {/* Brand Logo */}
                    <div className="mb-0 flex w-full items-center justify-center sm:mb-12">
                        <img
                            src={`${brand.logoFull}`}
                            width="120"
                            height="120"
                            alt="Logo"
                        />
                    </div>

                    <div className="bottom-0 w-full">
                        {/* Form Content */}
                        {children}

                        {/* Footer - Security Note */}
                        <div
                            className={`mt-8 border-t border-slate-800 pt-6 ${
                                isRtl ? 'text-right' : 'text-left'
                            }`}
                        >
                            <p
                                className={`flex items-start gap-2 text-sm text-slate-400 ${
                                    isRtl ? 'justify-end flex-row-reverse text-right' : 'justify-left text-left'
                                }`}
                            >
                                <Copyright className="mt-1 h-4 w-4" />{' '}
                                <div>
                                    Copyright {new Date().getFullYear()}
                                    <a
                                        href="https://babataste.com"
                                        className="pr-1 pl-1 text-brand-secondary/80 transition-all duration-300 hover:text-brand-secondary"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {brand.name}.
                                    </a>
                                    {t(
                                        'footer.allRightsReserved',
                                        'All rights reserved.',
                                    )}
                                </div>
                            </p>
                            <p
                                className={`flex items-center gap-1 pt-2 text-sm text-slate-400 ${
                                    isRtl ? 'justify-end flex-row-reverse text-right' : 'justify-left text-left'
                                }`}
                            >
                                <ShieldCheck className="h-4 w-4" />
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
                        {/* Main Hero Image Card */}
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                            <img
                                src="https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800"
                                alt={t(
                                    'auth.promo.imageAlt',
                                    'Restaurant dish',
                                )}
                                className="h-80 w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute right-6 bottom-6 left-6">
                                <h3 className="mb-2 text-2xl font-bold text-white">
                                    {t(
                                        'auth.promo.heroTitle',
                                        'Manage Your Restaurant',
                                    )}
                                </h3>
                                <p className="text-sm text-white/90">
                                    {t(
                                        'auth.promo.heroDescription',
                                        'Complete ERP solution for modern restaurant operations',
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Feature Cards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-orange-50 bg-white/80 p-6">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary">
                                    <ChefHat className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="mb-1 font-semibold text-slate-800">
                                    {t(
                                        'auth.promo.kitchenTitle',
                                        'Kitchen Management',
                                    )}
                                </h4>
                                <p className="text-xs text-slate-600">
                                    {t(
                                        'auth.promo.kitchenDescription',
                                        'Real-time order tracking',
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl border border-orange-50 bg-white/80 p-6">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary">
                                    <Utensils className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="mb-1 font-semibold text-slate-800">
                                    {t(
                                        'auth.promo.menuTitle',
                                        'Menu Control',
                                    )}
                                </h4>
                                <p className="text-xs text-slate-600">
                                    {t(
                                        'auth.promo.menuDescription',
                                        'Dynamic pricing & inventory',
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
