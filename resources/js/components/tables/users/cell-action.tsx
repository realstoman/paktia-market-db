import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAutoSelectSingleOption } from '@/hooks/use-auto-select-single-option';
import { useLocalization } from '@/lib/localization';
import { useAuthorization } from '@/lib/permissions';
import { Branch, Country, Province, Role, User } from '@/types';
import { router, usePage } from '@inertiajs/react';
import {
    Ban,
    CheckCircle,
    Edit,
    Eye,
    EyeOff,
    KeyRound,
    MoreHorizontal,
    Save,
    Trash,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CellActionProps {
    data: User;
    roles: Role[];
    countries: Country[];
    provinces: Province[];
    branches: Branch[];
}

export const CellAction: React.FC<CellActionProps> = ({
    data,
    roles,
    countries,
    provinces,
    branches,
}) => {
    const { t } = useLocalization();
    const { auth } = usePage().props as {
        auth: { user: User; is_super_admin?: boolean };
    };
    const { can, isSuperAdmin } = useAuthorization();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBlockOpen, setIsBlockOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [editName, setEditName] = useState(data.name);
    const [editEmail, setEditEmail] = useState(data.email);
    const [editRoleId, setEditRoleId] = useState(
        data.role_ids?.[0] ? String(data.role_ids[0]) : '',
    );
    const [editCountryId, setEditCountryId] = useState(
        data.country_id ? String(data.country_id) : '',
    );
    const [editProvinceId, setEditProvinceId] = useState(
        data.province_id ? String(data.province_id) : '',
    );
    const [editBranchId, setEditBranchId] = useState(
        data.branch_id ? String(data.branch_id) : '',
    );
    const [editPassword, setEditPassword] = useState('');
    const [editPasswordConfirmation, setEditPasswordConfirmation] =
        useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetPasswordConfirmation, setResetPasswordConfirmation] =
        useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [resetPasswordErrors, setResetPasswordErrors] = useState<
        Record<string, string>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const canViewUser = can('user.view');
    const canEditUser = can('user.update');
    const canToggleBlock = can('user.block') && auth.user.id !== data.id;
    const canDeleteUser =
        isSuperAdmin && can('user.update') && auth.user.id !== data.id;
    const canResetPassword =
        isSuperAdmin && can('user.reset-password') && auth.user.id !== data.id;
    const visibleActionCount = useMemo(
        () =>
            [
                canViewUser,
                canEditUser,
                canToggleBlock,
                canResetPassword,
                canDeleteUser,
            ].filter(Boolean).length,
        [
            canDeleteUser,
            canEditUser,
            canResetPassword,
            canToggleBlock,
            canViewUser,
        ],
    );
    const editProvinceOptions = useMemo(
        () =>
            provinces.filter((province) => {
                if (!editCountryId) {
                    return true;
                }

                return String(province.country_id ?? '') === editCountryId;
            }),
        [provinces, editCountryId],
    );
    const editBranchOptions = useMemo(
        () =>
            branches.filter((branch) => {
                const matchesCountry = editCountryId
                    ? String(branch.country_id ?? '') === editCountryId
                    : true;
                const matchesProvince = editProvinceId
                    ? String(branch.province_id ?? '') === editProvinceId
                    : true;

                return matchesCountry && matchesProvince;
            }),
        [branches, editCountryId, editProvinceId],
    );
    const editBranchSelectOptions = useMemo(
        () =>
            editBranchOptions.map((branch) => ({
                value: String(branch.id),
                label: branch.name,
            })),
        [editBranchOptions],
    );

    useAutoSelectSingleOption(
        editBranchSelectOptions,
        editBranchId,
        setEditBranchId,
    );

    const resetEdit = () => {
        setEditName(data.name);
        setEditEmail(data.email);
        setEditRoleId(data.role_ids?.[0] ? String(data.role_ids[0]) : '');
        setEditCountryId(data.country_id ? String(data.country_id) : '');
        setEditProvinceId(data.province_id ? String(data.province_id) : '');
        setEditBranchId(data.branch_id ? String(data.branch_id) : '');
        setEditPassword('');
        setEditPasswordConfirmation('');
        setEditErrors({});
    };

    const handleEditSubmit = () => {
        if (!editName.trim() || !editEmail.trim() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/users/${data.id}`,
            {
                name: editName.trim(),
                email: editEmail.trim(),
                password: editPassword || null,
                password_confirmation: editPasswordConfirmation || null,
                roles: editRoleId ? [Number(editRoleId)] : [],
                country_id: editCountryId ? Number(editCountryId) : null,
                province_id: editProvinceId ? Number(editProvinceId) : null,
                branch_id: editBranchId ? Number(editBranchId) : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'users.feedback.userUpdated',
                            'User updated successfully.',
                        ),
                    );
                    setIsEditOpen(false);
                },
                onError: (errors) => {
                    setEditErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const editRoleError =
        editErrors.roles ??
        Object.entries(editErrors).find(([key]) =>
            key.startsWith('roles.'),
        )?.[1];

    const handleBlock = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/users/${data.id}/block`, undefined, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    data.is_active
                        ? t(
                              'users.feedback.userBlocked',
                              'User blocked successfully.',
                          )
                        : t(
                              'users.feedback.userUnblocked',
                              'User unblocked successfully.',
                          ),
                );
                setIsBlockOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDelete = () => {
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.delete(`/users/${data.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(
                    t(
                        'users.feedback.userDeleted',
                        'User deleted successfully.',
                    ),
                );
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const resetPasswordForm = () => {
        setResetPassword('');
        setResetPasswordConfirmation('');
        setShowResetPassword(false);
        setResetPasswordErrors({});
    };

    const handleResetPassword = () => {
        if (!canResetPassword || !resetPassword || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        router.put(
            `/users/${data.id}/reset-password`,
            {
                password: resetPassword,
                password_confirmation: resetPasswordConfirmation,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t(
                            'users.feedback.passwordReset',
                            'Password reset successfully.',
                        ),
                    );
                    setIsResetPasswordOpen(false);
                    resetPasswordForm();
                },
                onError: (errors) => {
                    setResetPasswordErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <>
            {visibleActionCount > 0 ? (
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">
                                {t('users.actions.openMenu', 'Open menu')}
                            </span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            {t('users.table.actions', 'Actions')}
                        </DropdownMenuLabel>
                        {canViewUser ? (
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(`/users/${data.id}`)
                                }
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {t('users.actions.view', 'View')}
                            </DropdownMenuItem>
                        ) : null}
                        {canEditUser ? (
                            <DropdownMenuItem
                                onClick={() => {
                                    resetEdit();
                                    setIsEditOpen(true);
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('users.actions.edit', 'Edit')}
                            </DropdownMenuItem>
                        ) : null}
                        {canToggleBlock ? (
                            <DropdownMenuItem
                                onClick={() => setIsBlockOpen(true)}
                            >
                                <Ban className="mr-2 h-4 w-4" />
                                {data.is_active
                                    ? t('users.actions.block', 'Block')
                                    : t('users.actions.unblock', 'Unblock')}
                            </DropdownMenuItem>
                        ) : null}
                        {canResetPassword ? (
                            <DropdownMenuItem
                                onClick={() => {
                                    resetPasswordForm();
                                    setIsResetPasswordOpen(true);
                                }}
                            >
                                <KeyRound className="mr-2 h-4 w-4" />
                                {t(
                                    'users.actions.resetPassword',
                                    'Reset password',
                                )}
                            </DropdownMenuItem>
                        ) : null}
                        {canDeleteUser ? (
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                            >
                                <Trash className="mr-2 h-4 w-4 text-red-600" />
                                {t('users.actions.delete', 'Delete')}
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {t('users.modals.edit.title', 'Edit User')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'users.modals.edit.description',
                                'Update profile details and role assignments.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`edit-name-${data.id}`}>
                                {t('users.fields.name', 'Name')}
                            </Label>
                            <Input
                                id={`edit-name-${data.id}`}
                                value={editName}
                                onChange={(event) =>
                                    setEditName(event.target.value)
                                }
                            />
                            <InputError message={editErrors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`edit-email-${data.id}`}>
                                {t('users.fields.email', 'Email')}
                            </Label>
                            <Input
                                id={`edit-email-${data.id}`}
                                type="email"
                                value={editEmail}
                                onChange={(event) =>
                                    setEditEmail(event.target.value)
                                }
                            />
                            <InputError message={editErrors.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`edit-password-${data.id}`}>
                                {t('users.fields.newPassword', 'New password')}
                            </Label>
                            <Input
                                id={`edit-password-${data.id}`}
                                type="password"
                                value={editPassword}
                                onChange={(event) =>
                                    setEditPassword(event.target.value)
                                }
                                placeholder={t(
                                    'users.placeholders.leaveBlankPassword',
                                    'Leave blank to keep current',
                                )}
                            />
                            <InputError message={editErrors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`edit-password-confirm-${data.id}`}>
                                {t(
                                    'users.fields.confirmPassword',
                                    'Confirm password',
                                )}
                            </Label>
                            <Input
                                id={`edit-password-confirm-${data.id}`}
                                type="password"
                                value={editPasswordConfirmation}
                                onChange={(event) =>
                                    setEditPasswordConfirmation(
                                        event.target.value,
                                    )
                                }
                            />
                            <InputError
                                message={editErrors.password_confirmation}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('users.fields.role', 'Role')}</Label>
                            <Select
                                value={editRoleId}
                                onValueChange={setEditRoleId}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectRole',
                                            'Select role',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editRoleError} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('users.fields.country', 'Country')}
                            </Label>
                            <Select
                                value={editCountryId}
                                onValueChange={(value) => {
                                    setEditCountryId(value);
                                    if (value !== editCountryId) {
                                        setEditProvinceId('');
                                        setEditBranchId('');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectCountry',
                                            'Select country',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem
                                            key={country.id}
                                            value={String(country.id)}
                                        >
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.country_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>
                                {t('users.fields.province', 'Province')}
                            </Label>
                            <Select
                                value={editProvinceId}
                                onValueChange={(value) => {
                                    setEditProvinceId(value);
                                    if (value !== editProvinceId) {
                                        setEditBranchId('');
                                    }
                                }}
                                disabled={
                                    !!editCountryId &&
                                    editProvinceOptions.length === 0
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectProvince',
                                            'Select province',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {editProvinceOptions.map((province) => (
                                        <SelectItem
                                            key={province.id}
                                            value={String(province.id)}
                                        >
                                            {province.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.province_id} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('users.fields.branch', 'Branch')}</Label>
                            <Select
                                value={editBranchId}
                                onValueChange={setEditBranchId}
                                disabled={editBranchOptions.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'users.placeholders.selectBranch',
                                            'Select branch',
                                        )}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {editBranchOptions.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editErrors.branch_id} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={isSubmitting}
                        >
                            <X className="mr-2 h-4 w-4" />
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={
                                !editName.trim() ||
                                !editEmail.trim() ||
                                isSubmitting
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t('users.actions.saveChanges', 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isResetPasswordOpen}
                onOpenChange={(open) => {
                    setIsResetPasswordOpen(open);

                    if (!open) {
                        resetPasswordForm();
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {t(
                                'users.modals.resetPassword.title',
                                'Reset User Password',
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'users.modals.resetPassword.description',
                                'Set a new password for :name. Ask the user to change it after signing in.',
                            ).replace(':name', data.name)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor={`reset-password-${data.id}`}>
                                {t('users.fields.newPassword', 'New password')}
                            </Label>
                            <div className="relative">
                                <Input
                                    id={`reset-password-${data.id}`}
                                    type={
                                        showResetPassword ? 'text' : 'password'
                                    }
                                    value={resetPassword}
                                    onChange={(event) =>
                                        setResetPassword(event.target.value)
                                    }
                                    placeholder={t(
                                        'users.placeholders.minimumPassword',
                                        'Minimum 8 characters',
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2"
                                    onClick={() =>
                                        setShowResetPassword(
                                            (current) => !current,
                                        )
                                    }
                                >
                                    {showResetPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <InputError
                                message={resetPasswordErrors.password}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor={`reset-password-confirmation-${data.id}`}
                            >
                                {t(
                                    'users.fields.confirmPassword',
                                    'Confirm password',
                                )}
                            </Label>
                            <Input
                                id={`reset-password-confirmation-${data.id}`}
                                type={showResetPassword ? 'text' : 'password'}
                                value={resetPasswordConfirmation}
                                onChange={(event) =>
                                    setResetPasswordConfirmation(
                                        event.target.value,
                                    )
                                }
                                placeholder={t(
                                    'users.placeholders.repeatPassword',
                                    'Repeat the new password',
                                )}
                            />
                            <InputError
                                message={
                                    resetPasswordErrors.password_confirmation
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsResetPasswordOpen(false);
                                resetPasswordForm();
                            }}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleResetPassword}
                            disabled={!resetPassword || isSubmitting}
                        >
                            {t('users.actions.resetPassword', 'Reset password')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={canToggleBlock ? isBlockOpen : false}
                onOpenChange={setIsBlockOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {data.is_active
                                ? t('users.modals.block.title', 'Block user')
                                : t(
                                      'users.modals.unblock.title',
                                      'Unblock user',
                                  )}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {data.is_active
                                ? t(
                                      'users.modals.block.description',
                                      'This will prevent the user from signing in.',
                                  )
                                : t(
                                      'users.modals.unblock.description',
                                      'This will restore access for the user.',
                                  )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4" />
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant={data.is_active ? 'destructive' : 'default'}
                            onClick={handleBlock}
                            disabled={isSubmitting}
                        >
                            {data.is_active ? (
                                <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    {t('users.actions.blockUser', 'Block user')}
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {t(
                                        'users.actions.unblockUser',
                                        'Unblock user',
                                    )}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={canDeleteUser ? isDeleteOpen : false}
                onOpenChange={setIsDeleteOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('users.modals.delete.title', 'Delete user')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'users.modals.delete.description',
                                'This will permanently remove the user and revoke all role assignments.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>
                            <X className="mr-2 h-4 w-4" />
                            {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('users.actions.deleteUser', 'Delete user')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
