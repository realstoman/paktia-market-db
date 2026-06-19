import InputError from '@/components/input-error';
import LanguageDropdown from '@/components/language-dropdown';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocalization } from '@/lib/localization';
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Copyright,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';

const AUTH_BRAND_NAME = 'Paktiawal Group';
const AUTH_BRAND_LOGO = '/brand/pg-logo-portrait.png';
const AUTH_BRAND_URL = 'https://paktiawalgroup.com';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t, locale, isRtl } = useLocalization();
    const authBrandName = t('brand.marketName', AUTH_BRAND_NAME);
    const copyrightYear = new Intl.DateTimeFormat(
        locale === 'en' ? 'en-US' : `${locale}-AF-u-ca-persian`,
        { year: 'numeric' },
    ).format(new Date());
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="min-h-svh bg-white text-neutral-950">
            <Head title={t('auth.forgotPassword.title', 'Forgot password')} />

            <main className="grid min-h-svh w-full overflow-hidden bg-white lg:grid-cols-[0.94fr_1.86fr]">
                <section className="relative hidden min-h-svh overflow-hidden lg:block">
                    <img
                        src="/images/mall.jpg"
                        alt={t(
                            'auth.login.mallImageAlt',
                            'Modern shopping mall interior',
                        )}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,15,16,0.18)_0%,rgba(4,15,16,0.04)_42%,rgba(4,15,16,0.78)_100%)]" />

                    <div className="absolute inset-x-0 top-0 flex items-center gap-3 p-9 text-white xl:p-4">
                        <a
                            href={AUTH_BRAND_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-26 w-26 items-center justify-center rounded-xl bg-white/95 shadow-sm transition-transform hover:scale-[1.03]"
                        >
                            <img
                                src={AUTH_BRAND_LOGO}
                                alt={authBrandName}
                                className="h-full w-full object-contain"
                            />
                        </a>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-9 text-white xl:p-11">
                        <p className="max-w-sm text-[2rem] leading-[1.12] font-bold tracking-[-0.035em] xl:text-[2.35rem]">
                            {t(
                                'auth.login.mallQuote',
                                'Everything your market needs, in one place.',
                            )}
                        </p>
                        <div className="mt-7 h-px w-14 bg-white/70" />
                        <a
                            href={AUTH_BRAND_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-block text-sm font-semibold transition-colors hover:text-brand-secondary"
                        >
                            {authBrandName}
                        </a>
                        <p className="mt-1 text-xs text-white/75">
                            {t(
                                'auth.login.mallQuoteCaption',
                                'Retail operations and management',
                            )}
                        </p>
                    </div>
                </section>

                <section className="relative flex min-h-svh flex-col bg-white px-6 sm:px-12 lg:px-16 xl:px-24">
                    <div
                        className={`absolute top-6 z-10 ${
                            isRtl ? 'left-6' : 'right-6'
                        }`}
                    >
                        <LanguageDropdown />
                    </div>

                    <div className="flex flex-1 items-center justify-center py-20 sm:py-24">
                        <div className="w-full max-w-107.5">
                            <div className="mb-10 text-center">
                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 p-3 shadow-sm ring-1 ring-neutral-200 lg:hidden">
                                    <a
                                        href={AUTH_BRAND_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            src={AUTH_BRAND_LOGO}
                                            alt={authBrandName}
                                            className="h-full w-full object-contain"
                                        />
                                    </a>
                                </div>
                                <h1 className="text-3xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-[2.05rem]">
                                    {t(
                                        'auth.forgotPassword.title',
                                        'Forgot password',
                                    )}
                                </h1>
                                <p className="mx-auto mt-3 max-w-sm text-base leading-6 text-neutral-500">
                                    {t(
                                        'auth.forgotPassword.description',
                                        'Enter your email to receive a password reset link',
                                    )}
                                </p>
                            </div>

                            {status ? (
                                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {status}
                                </div>
                            ) : null}

                            <Form {...email.form()} className="space-y-4">
                                {({ processing, errors }) => (
                                    <>
                                        <div>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoComplete="email"
                                                autoFocus
                                                tabIndex={1}
                                                aria-label={t(
                                                    'auth.forgotPassword.email',
                                                    'Email address',
                                                )}
                                                placeholder={t(
                                                    'auth.forgotPassword.email',
                                                    'Email address',
                                                )}
                                                className={`h-13.5 rounded-xl border-neutral-200 bg-white px-4 text-[15px] shadow-none placeholder:text-neutral-400 focus-visible:border-brand-primary focus-visible:ring-brand-primary/20 ${
                                                    isRtl ? 'text-right' : ''
                                                }`}
                                            />
                                            <InputError
                                                message={errors.email}
                                                className="mt-1.5"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            tabIndex={2}
                                            disabled={processing}
                                            data-test="email-password-reset-link-button"
                                            className="mt-3 h-13.5 w-full rounded-full bg-brand-primary text-[15px] font-semibold text-white shadow-none transition-all hover:bg-brand-primary/90 hover:shadow-[0_10px_30px_rgba(0,36,82,0.28)] focus-visible:ring-brand-primary/30"
                                        >
                                            {processing ? (
                                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                            ) : null}
                                            {t(
                                                'auth.forgotPassword.submit',
                                                'Email password reset link',
                                            )}
                                        </Button>
                                    </>
                                )}
                            </Form>

                            <div className="mt-6 text-center">
                                <TextLink
                                    href={login()}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary no-underline transition-colors hover:text-brand-secondary hover:underline"
                                >
                                    <BackIcon className="h-4 w-4" />
                                    {t(
                                        'auth.forgotPassword.returnToLogin',
                                        'Return to login',
                                    )}
                                </TextLink>
                            </div>
                        </div>
                    </div>

                    <footer className="w-full pb-6 text-center sm:pb-8">
                        <div className="mx-auto max-w-107.5 border-t border-neutral-100 pt-5">
                            <p className="flex items-center justify-center gap-2 text-[15px] text-neutral-600">
                                <Copyright className="h-3.5 w-3.5" />
                                <span>
                                    {copyrightYear}{' '}
                                    <a
                                        href={AUTH_BRAND_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium text-brand-primary transition-colors hover:text-brand-secondary"
                                    >
                                        {authBrandName}
                                    </a>
                                    .{' '}
                                    {t(
                                        'footer.allRightsReserved',
                                        'All rights reserved.',
                                    )}
                                </span>
                            </p>
                            <p className="mt-2 flex items-center justify-center gap-1.5 text-[15px] text-neutral-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {t(
                                    'auth.securedBy',
                                    'Secured by industry-standard encryption',
                                )}
                            </p>
                        </div>
                    </footer>
                </section>
            </main>
        </div>
    );
}
