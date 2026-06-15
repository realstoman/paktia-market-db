import InputError from '@/components/input-error';
import LanguageDropdown from '@/components/language-dropdown';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useLocalization } from '@/lib/localization';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { Copyright, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

const LOGIN_BRAND_NAME = 'Paktiawal Group';
const LOGIN_BRAND_LOGO = '/brand/logo.png';

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t, locale, isRtl } = useLocalization();
    const [showPassword, setShowPassword] = useState(false);
    const copyrightYear = new Intl.DateTimeFormat(
        locale === 'en' ? 'en-US' : `${locale}-AF-u-ca-persian`,
        { year: 'numeric' },
    ).format(new Date());

    return (
        <div className="min-h-svh bg-[#eeeff1] px-4 py-6 text-neutral-950 sm:px-8 sm:py-10 lg:flex lg:items-center lg:justify-center lg:px-12">
            <Head title={t('auth.login.title', 'Log in')} />

            <main className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-[1360px] overflow-hidden rounded-[22px] bg-white shadow-[0_35px_80px_rgba(15,23,42,0.18)] sm:min-h-[760px] lg:max-h-[820px] lg:min-h-0 lg:grid-cols-[0.94fr_1.86fr]">
                <section className="relative hidden min-h-[760px] overflow-hidden lg:block">
                    <img
                        src="/images/login-mall.png"
                        alt={t(
                            'auth.login.mallImageAlt',
                            'Modern shopping mall interior',
                        )}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,15,16,0.18)_0%,rgba(4,15,16,0.04)_42%,rgba(4,15,16,0.78)_100%)]" />

                    <div className="absolute inset-x-0 top-0 flex items-center gap-3 p-9 text-white xl:p-4">
                        <span className="flex h-26 w-26 items-center justify-center rounded-xl bg-white/95 shadow-sm">
                            <img
                                src={LOGIN_BRAND_LOGO}
                                alt=""
                                className="h-full w-full object-contain"
                            />
                        </span>
                        {/* <span className="text-xl font-bold tracking-tight">
                            {LOGIN_BRAND_NAME}
                        </span> */}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-9 text-white xl:p-11">
                        <p className="max-w-sm text-[2rem] leading-[1.12] font-bold tracking-[-0.035em] xl:text-[2.35rem]">
                            {t(
                                'auth.login.mallQuote',
                                'Everything your market needs, in one place.',
                            )}
                        </p>
                        <div className="mt-7 h-px w-14 bg-white/70" />
                        <p className="mt-4 text-sm font-semibold">
                            {LOGIN_BRAND_NAME}
                        </p>
                        <p className="mt-1 text-xs text-white/75">
                            {t(
                                'auth.login.mallQuoteCaption',
                                'Retail operations and management',
                            )}
                        </p>
                    </div>
                </section>

                <section className="relative flex min-h-[calc(100svh-3rem)] items-center justify-center px-6 py-16 sm:px-12 lg:min-h-[760px] lg:px-16 xl:px-24">
                    <div
                        className={`absolute top-6 z-10 ${
                            isRtl ? 'left-6' : 'right-6'
                        }`}
                    >
                        <LanguageDropdown />
                    </div>

                    <div className="w-full max-w-[430px]">
                        <div className="mb-10 text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-50 p-3 shadow-sm ring-1 ring-neutral-200 lg:hidden">
                                <img
                                    src={LOGIN_BRAND_LOGO}
                                    alt={LOGIN_BRAND_NAME}
                                    className="h-full w-full object-contain"
                                />
                            </div>
                            <h1 className="text-3xl font-bold tracking-[-0.035em] text-neutral-950 sm:text-[2.05rem]">
                                {t(
                                    'auth.login.welcomeBack',
                                    'Welcome back to :name',
                                ).replace(':name', LOGIN_BRAND_NAME)}
                            </h1>
                            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-500">
                                {t(
                                    'auth.login.description',
                                    'Sign in to manage branches, inventory, finance, and daily market operations.',
                                )}
                            </p>
                        </div>

                        {status ? (
                            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {status}
                            </div>
                        ) : null}

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            aria-label={t(
                                                'auth.login.email',
                                                'Email address',
                                            )}
                                            placeholder={t(
                                                'auth.login.email',
                                                'Email address',
                                            )}
                                            className={`h-[54px] rounded-xl border-neutral-200 bg-white px-4 text-[15px] shadow-none placeholder:text-neutral-400 focus-visible:border-[#6d51f5] focus-visible:ring-[#6d51f5]/20 ${
                                                isRtl ? 'text-right' : ''
                                            }`}
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    <div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                aria-label={t(
                                                    'auth.login.password',
                                                    'Password',
                                                )}
                                                placeholder={t(
                                                    'auth.login.password',
                                                    'Password',
                                                )}
                                                className={`h-[54px] rounded-xl border-neutral-200 bg-white text-[15px] shadow-none placeholder:text-neutral-400 focus-visible:border-[#6d51f5] focus-visible:ring-[#6d51f5]/20 ${
                                                    isRtl
                                                        ? 'pr-4 pl-12 text-right'
                                                        : 'pr-12 pl-4'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                tabIndex={-1}
                                                aria-label={t(
                                                    showPassword
                                                        ? 'auth.login.hidePassword'
                                                        : 'auth.login.showPassword',
                                                    showPassword
                                                        ? 'Hide password'
                                                        : 'Show password',
                                                )}
                                                onClick={() =>
                                                    setShowPassword(
                                                        (value) => !value,
                                                    )
                                                }
                                                className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700 ${
                                                    isRtl ? 'left-4' : 'right-4'
                                                }`}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <InputError
                                            message={errors.password}
                                            className="mt-1.5"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                                        {canResetPassword ? (
                                            <TextLink
                                                href={request()}
                                                tabIndex={4}
                                                className="font-medium text-[#6045e8] no-underline transition-colors hover:text-[#4933be] hover:underline"
                                            >
                                                {t(
                                                    'auth.login.forgotPassword',
                                                    'Forgot password?',
                                                )}
                                            </TextLink>
                                        ) : (
                                            <span />
                                        )}

                                        <label
                                            htmlFor="remember"
                                            className="flex cursor-pointer items-center gap-3 text-neutral-500"
                                        >
                                            <span>
                                                {t(
                                                    'auth.login.remember',
                                                    'Remember sign in details',
                                                )}
                                            </span>
                                            <input
                                                id="remember"
                                                name="remember"
                                                type="checkbox"
                                                tabIndex={3}
                                                className="peer sr-only"
                                            />
                                            <span className="relative h-7 w-12 shrink-0 rounded-full bg-neutral-200 transition-colors peer-checked:bg-[#6d51f5] peer-focus-visible:ring-4 peer-focus-visible:ring-[#6d51f5]/20 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5 rtl:after:right-1 rtl:after:left-auto rtl:peer-checked:after:-translate-x-5" />
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        tabIndex={5}
                                        disabled={processing}
                                        data-test="login-button"
                                        className="mt-3 h-[54px] w-full rounded-full bg-[#6d51f5] text-[15px] font-semibold text-white shadow-none transition-all hover:bg-[#5d42e5] hover:shadow-[0_10px_30px_rgba(109,81,245,0.28)] focus-visible:ring-[#6d51f5]/30"
                                    >
                                        {processing ? <Spinner /> : null}
                                        {t('auth.login.submit', 'Log in')}
                                    </Button>
                                </>
                            )}
                        </Form>

                        <div className="my-8 flex items-center gap-4 text-[11px] tracking-[0.2em] text-neutral-400 uppercase">
                            <span className="h-px flex-1 bg-neutral-200" />
                            <span>{LOGIN_BRAND_NAME}</span>
                            <span className="h-px flex-1 bg-neutral-200" />
                        </div>

                        <div className="rounded-2xl bg-neutral-50 px-5 py-4 text-center ring-1 ring-neutral-100">
                            <p className="flex items-center justify-center gap-2 text-[13px] text-neutral-600">
                                <Copyright className="h-3.5 w-3.5" />
                                <span>
                                    {copyrightYear} {LOGIN_BRAND_NAME}.{' '}
                                    {t(
                                        'footer.allRightsReserved',
                                        'All rights reserved.',
                                    )}
                                </span>
                            </p>
                            <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-neutral-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {t(
                                    'auth.securedBy',
                                    'Secured by industry-standard encryption',
                                )}
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
