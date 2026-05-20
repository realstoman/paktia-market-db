import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState } from 'react';

import HeadingSmall from '@/components/shared/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';
import { edit } from '@/routes/user-password';

export default function Password() {
    const { t, isRtl } = useLocalization();
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('settings.passwordTitle', 'Password settings'),
            href: edit().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('settings.passwordTitle', 'Password settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title={t(
                            'settings.updatePasswordTitle',
                            'Update password',
                        )}
                        description={t(
                            'settings.updatePasswordDescription',
                            'Ensure your account is using a long, random password to stay secure',
                        )}
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        {t(
                                            'settings.currentPasswordLabel',
                                            'Current password',
                                        )}
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            className={`mt-1 block w-full ${
                                                isRtl
                                                    ? 'pr-3 pl-10 text-right'
                                                    : 'pr-10 pl-3'
                                            }`}
                                            autoComplete="current-password"
                                            placeholder={t(
                                                'settings.currentPasswordPlaceholder',
                                                'Current password',
                                            )}
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
                                            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground ${
                                                isRtl ? 'left-3' : 'right-3'
                                            }`}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        {t(
                                            'settings.newPasswordLabel',
                                            'New password',
                                        )}
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            className={`mt-1 block w-full ${
                                                isRtl
                                                    ? 'pr-3 pl-10 text-right'
                                                    : 'pr-10 pl-3'
                                            }`}
                                            autoComplete="new-password"
                                            placeholder={t(
                                                'settings.newPasswordPlaceholder',
                                                'New password',
                                            )}
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
                                            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground ${
                                                isRtl ? 'left-3' : 'right-3'
                                            }`}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        {t(
                                            'settings.confirmPasswordLabel',
                                            'Confirm password',
                                        )}
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            className={`mt-1 block w-full ${
                                                isRtl
                                                    ? 'pr-3 pl-10 text-right'
                                                    : 'pr-10 pl-3'
                                            }`}
                                            autoComplete="new-password"
                                            placeholder={t(
                                                'settings.confirmPasswordPlaceholder',
                                                'Confirm password',
                                            )}
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
                                            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground ${
                                                isRtl ? 'left-3' : 'right-3'
                                            }`}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-password-button"
                                    >
                                        {t(
                                            'settings.savePassword',
                                            'Save password',
                                        )}
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition-opacity ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition-opacity ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            {t('common.saved', 'Saved')}
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
