import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/localization';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { t, isRtl } = useLocalization();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div
                    className={`px-1 py-1.5 text-sm ${
                        isRtl ? 'text-right' : 'text-left'
                    }`}
                >
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className={`flex w-full items-center gap-2 ${
                            isRtl
                                ? 'flex-row-reverse justify-end text-right'
                                : ''
                        }`}
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <UserIcon className={isRtl ? 'ml-2' : 'mr-2'} />
                        {t('userMenu.profile', 'Profile')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className={`flex w-full items-center gap-2 ${
                            isRtl
                                ? 'flex-row-reverse justify-end text-right'
                                : ''
                        }`}
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className={isRtl ? 'ml-2' : 'mr-2'} />
                        {t('userMenu.settings', 'Settings')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className={`flex w-full items-center gap-2 ${
                        isRtl
                            ? 'flex-row-reverse justify-end text-right'
                            : ''
                    }`}
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className={isRtl ? 'ml-2' : 'mr-2'} />
                    {t('userMenu.logout', 'Log out')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
