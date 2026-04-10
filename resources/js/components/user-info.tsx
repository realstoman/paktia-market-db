import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { useLocalization } from '@/lib/localization';
import { type User } from '@/types';
import { cn } from '@/lib/utils';

export function UserInfo({
    user,
    showEmail = false,
    showName = true,
}: {
    user: User;
    showEmail?: boolean;
    showName?: boolean;
}) {
    const getInitials = useInitials();
    const { isRtl } = useLocalization();

    return (
        <div className={cn('flex items-center gap-2', isRtl && 'flex-row-reverse')}>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-full border border-neutral-200/70 bg-neutral-100 text-black transition-all duration-300 hover:bg-neutral-200/70 dark:border-neutral-700/90 dark:bg-neutral-950 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            {showName && (
                <div
                    className={cn(
                        'grid flex-1 text-left text-sm leading-tight',
                        isRtl && 'text-right',
                    )}
                >
                    <span className="truncate font-medium">{user.name}</span>
                    {showEmail && (
                        <span className="truncate text-xs text-muted-foreground">
                            {user.email}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
