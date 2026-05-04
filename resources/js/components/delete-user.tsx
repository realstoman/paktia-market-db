import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import HeadingSmall from '@/components/shared/heading-small';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocalization } from '@/lib/localization';
import { Form } from '@inertiajs/react';
import { useRef } from 'react';

interface DeleteUserProps {
    canDelete: boolean;
}

export default function DeleteUser({ canDelete }: DeleteUserProps) {
    const { t } = useLocalization();
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <HeadingSmall
                title={t('settings.deleteAccountTitle', 'Delete account')}
                description={
                    canDelete
                        ? t(
                              'settings.deleteAccountDescription',
                              'Delete your account and all of its resources',
                          )
                        : t(
                              'settings.deleteAccountUnavailableDescription',
                              'Internal restaurant staff accounts cannot be deleted from profile settings',
                          )
                }
            />
            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">
                        {canDelete
                            ? t('settings.warning', 'Warning')
                            : t('settings.notAvailable', 'Not available')}
                    </p>
                    <p className="text-sm">
                        {canDelete
                            ? t(
                                  'settings.deleteAccountWarning',
                                  'Please proceed with caution, this cannot be undone.',
                              )
                            : t(
                                  'settings.deleteAccountAdminManaged',
                                  'If this account belongs to a restaurant team member, an administrator should manage it from the users section instead.',
                              )}
                    </p>
                </div>

                {canDelete ? (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                data-test="delete-user-button"
                            >
                                {t(
                                    'settings.deleteAccountTitle',
                                    'Delete account',
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>
                                {t(
                                    'settings.confirmDeleteAccountTitle',
                                    'Are you sure you want to delete your account?',
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    'settings.confirmDeleteAccountDescription',
                                    'Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.',
                                )}
                            </DialogDescription>

                            <Form
                                {...ProfileController.destroy.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                onError={() => passwordInput.current?.focus()}
                                resetOnSuccess
                                className="space-y-6"
                            >
                                {({
                                    resetAndClearErrors,
                                    processing,
                                    errors,
                                }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor="password"
                                                className="sr-only"
                                            >
                                                {t(
                                                    'common.password',
                                                    'Password',
                                                )}
                                            </Label>

                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                ref={passwordInput}
                                                placeholder={t(
                                                    'common.password',
                                                    'Password',
                                                )}
                                                autoComplete="current-password"
                                            />

                                            <InputError
                                                message={
                                                    errors.password ??
                                                    errors.account
                                                }
                                            />
                                        </div>

                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        resetAndClearErrors()
                                                    }
                                                >
                                                    {t(
                                                        'common.cancel',
                                                        'Cancel',
                                                    )}
                                                </Button>
                                            </DialogClose>

                                            <Button
                                                variant="destructive"
                                                disabled={processing}
                                                asChild
                                            >
                                                <button
                                                    type="submit"
                                                    data-test="confirm-delete-user-button"
                                                >
                                                    {t(
                                                        'settings.deleteAccountTitle',
                                                        'Delete account',
                                                    )}
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Button variant="destructive" disabled>
                        {t('settings.deleteAccountTitle', 'Delete account')}
                    </Button>
                )}
            </div>
        </div>
    );
}
