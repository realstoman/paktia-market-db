import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { useLocalization } from '@/lib/localization';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t, isRtl } = useLocalization();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout
            title={t('auth.login.title', 'Log in')}
            description={t(
                'auth.login.description',
                'Sign in to continue to your account.',
            )}
        >
            <Head title={t('auth.login.title', 'Log in')} />

            <div className="bottom-0 w-full">
                <div className="mb-8">
                    <h2 className="mb-2 text-4xl font-bold text-white">
                        {t('auth.login.heading', 'Welcome back!')}
                    </h2>
                </div>

                {/* Status Message */}
                {status && (
                    <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                        <p className="text-sm text-green-400">{status}</p>
                    </div>
                )}

                {/* Login Form */}
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* Email Field */}
                            <div className="space-y-1">
                                <Label
                                    htmlFor="email"
                                    className="flex items-center justify-start gap-1 text-base text-slate-200"
                                >
                                    {t(
                                        'auth.login.email',
                                        'Email address',
                                    )}{' '}
                                    <span className="pt-2 text-red-600">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder={t(
                                        'auth.login.emailPlaceholder',
                                        'you@babarestaurant.com',
                                    )}
                                    className={`h-11 border-slate-700 bg-white text-base placeholder:text-slate-600 focus:border-brand-secondary focus:ring-brand-secondary/20 ${
                                        isRtl ? 'text-right' : ''
                                    }`}
                                />
                                <InputError
                                    message={errors.email}
                                    className="text-red-400"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="password"
                                        className="flex items-center justify-start gap-1 text-base text-slate-200"
                                    >
                                        {t('auth.login.password', 'Password')}
                                        <span className="pt-2 text-red-600">
                                            *
                                        </span>
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder={t(
                                            'auth.login.passwordPlaceholder',
                                            'Enter your password',
                                        )}
                                        className={`mt-1 h-11 border-slate-700 bg-white text-base placeholder:text-slate-600 focus:border-brand-secondary focus:ring-brand-secondary/20 ${
                                            isRtl
                                                ? 'pr-3 pl-11 text-right'
                                                : 'pr-11 pl-3'
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
                                            setShowPassword((value) => !value)
                                        }
                                        className={`absolute top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700 ${
                                            isRtl ? 'left-3' : 'right-3'
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
                                    className="text-red-400"
                                />
                            </div>

                            {/* Remember Me */}
                            <div
                                className={`flex items-center justify-between ${
                                    isRtl ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <div
                                    className={`flex items-center ${
                                        isRtl ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'
                                    }`}
                                >
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                        className="border-slate-600 data-[state=checked]:border-brand-secondary data-[state=checked]:bg-brand-secondary"
                                    />
                                    <Label
                                        htmlFor="remember"
                                        className="cursor-pointer text-sm text-slate-300"
                                    >
                                        {t(
                                            'auth.login.remember',
                                            'Keep me logged in',
                                        )}
                                    </Label>
                                </div>
                                <div className="text-center">
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-center text-sm text-brand-secondary hover:text-orange-300"
                                            tabIndex={5}
                                        >
                                            {t(
                                                'auth.login.forgotPassword',
                                                'Forgot password?',
                                            )}
                                        </TextLink>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mt-2 w-full cursor-pointer rounded-lg bg-brand-secondary py-6 text-lg font-semibold text-white transition-all duration-300 hover:bg-[#b07b3b]"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner className="mr-2" />}
                                {t('auth.login.submit', 'Login')}
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
