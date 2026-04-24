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
                        className={`flex w-full items-center ${
                            isRtl ? 'text-right' : 'gap-2'
                        }`}
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        {isRtl ? (
                            <span className="ml-auto inline-flex items-center gap-2 text-right">
                                <UserIcon />
                                <span>{t('userMenu.profile', 'Profile')}</span>
                            </span>
                        ) : (
                            <>
                                <UserIcon />
                                {t('userMenu.profile', 'Profile')}
                            </>
                        )}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link
                        className={`flex w-full items-center ${
                            isRtl ? 'text-right' : 'gap-2'
                        }`}
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        {isRtl ? (
                            <span className="ml-auto inline-flex items-center gap-2 text-right">
                                <Settings />
                                <span>{t('userMenu.settings', 'Settings')}</span>
                            </span>
                        ) : (
                            <>
                                <Settings />
                                {t('userMenu.settings', 'Settings')}
                            </>
                        )}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className={`flex w-full items-center ${
                        isRtl ? 'text-right' : 'gap-2'
                    }`}
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    {isRtl ? (
                        <span className="ml-auto inline-flex items-center gap-2 text-right">
                            <LogOut />
                            <span>{t('userMenu.logout', 'Log out')}</span>
                        </span>
                    ) : (
                        <>
                            <LogOut />
                            {t('userMenu.logout', 'Log out')}
                        </>
                    )}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
