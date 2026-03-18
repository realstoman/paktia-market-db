import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    type AppNotification,
    type Role,
    type SharedData,
    type User,
} from '@/types';
import { usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    BriefcaseBusiness,
    CreditCard,
    DollarSign,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';

type NotificationCategory =
    | 'orders'
    | 'payments'
    | 'salary'
    | 'employees'
    | 'users'
    | 'system';

type NotificationPriority = 'high' | 'medium' | 'low';

interface HeaderNotificationsProps {
    user: User;
}

const categoryConfig = {
    orders: {
        label: 'Orders',
        icon: ReceiptText,
        accent: 'bg-amber-500/12 text-amber-700 ring-amber-500/20',
        dot: 'bg-amber-500',
    },
    payments: {
        label: 'Payments',
        icon: CreditCard,
        accent: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20',
        dot: 'bg-emerald-500',
    },
    salary: {
        label: 'Salary',
        icon: DollarSign,
        accent: 'bg-sky-500/12 text-sky-700 ring-sky-500/20',
        dot: 'bg-sky-500',
    },
    employees: {
        label: 'Employees',
        icon: BriefcaseBusiness,
        accent: 'bg-violet-500/12 text-violet-700 ring-violet-500/20',
        dot: 'bg-violet-500',
    },
    users: {
        label: 'Users',
        icon: Users,
        accent: 'bg-fuchsia-500/12 text-fuchsia-700 ring-fuchsia-500/20',
        dot: 'bg-fuchsia-500',
    },
    system: {
        label: 'System',
        icon: ShieldCheck,
        accent: 'bg-slate-500/12 text-slate-700 ring-slate-500/20',
        dot: 'bg-slate-500',
    },
} satisfies Record<
    NotificationCategory,
    {
        label: string;
        icon: typeof Bell;
        accent: string;
        dot: string;
    }
>;

const roleCategoryAccess: Record<string, NotificationCategory[]> = {
    cashier: ['orders', 'payments'],
    admin: ['orders', 'payments', 'salary', 'employees', 'users', 'system'],
    administrator: [
        'orders',
        'payments',
        'salary',
        'employees',
        'users',
        'system',
    ],
    manager: ['orders', 'payments', 'salary', 'employees', 'users'],
    accountant: ['payments', 'salary', 'system'],
    hr: ['salary', 'employees', 'users'],
    'human resources': ['salary', 'employees', 'users'],
    supervisor: ['orders', 'payments', 'employees'],
};

function getRoleNames(user: User): string[] {
    return (user.roles ?? [])
        .map((role) =>
            typeof role === 'string'
                ? role
                : ((role as Role | undefined)?.name ?? ''),
        )
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean);
}

function getVisibleNotifications(
    user: User,
    notifications: AppNotification[],
): AppNotification[] {
    const roles = getRoleNames(user);

    if (roles.length === 0) {
        return notifications;
    }

    const allowedCategories = new Set<NotificationCategory>();

    roles.forEach((role) => {
        roleCategoryAccess[role]?.forEach((category) =>
            allowedCategories.add(category),
        );
    });

    if (allowedCategories.size === 0) {
        return notifications;
    }

    return notifications.filter((notification) =>
        allowedCategories.has(notification.category),
    );
}

function getPriorityLabel(priority: NotificationPriority): string {
    if (priority === 'high') return 'High priority';
    if (priority === 'medium') return 'Needs attention';

    return 'Informational';
}

export function HeaderNotifications({ user }: HeaderNotificationsProps) {
    const page = usePage<SharedData>();
    const notifications = getVisibleNotifications(
        user,
        page.props.notifications ?? [],
    );
    const unreadCount = notifications.filter(
        (notification) => notification.unread,
    ).length;
    const visibleCategories = new Set(
        notifications.map((notification) => notification.category),
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-2xl border border-transparent bg-white/70 text-neutral-700 shadow-sm shadow-black/5 transition hover:border-neutral-200 hover:bg-white hover:text-neutral-950 dark:bg-neutral-950/40 dark:text-neutral-200 dark:hover:border-neutral-800 dark:hover:bg-neutral-950"
                >
                    <Bell className="h-[18px] w-[18px]" />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-950" />
                            <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-neutral-950 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white dark:bg-white dark:text-neutral-950">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </>
                    )}
                    <span className="sr-only">Open notifications</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-[380px] overflow-hidden rounded-3xl border border-neutral-200/80 bg-white p-0 shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950"
            >
                <div className="border-b border-neutral-200/80 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(16,185,129,0.08),rgba(15,23,42,0.02))] px-5 py-4 dark:border-neutral-800 dark:bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(16,185,129,0.10),rgba(15,23,42,0.4))]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500 uppercase dark:text-neutral-400">
                                Notifications Center
                            </p>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-neutral-950 dark:text-white">
                                    Recent activity
                                </h3>
                                <Sparkles className="h-4 w-4 text-amber-500" />
                            </div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                {unreadCount > 0
                                    ? `${unreadCount} unread updates need attention.`
                                    : 'Everything is reviewed for now.'}
                            </p>
                        </div>

                        <Badge
                            variant="outline"
                            className="rounded-full border-neutral-300 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                        >
                            {notifications.length} items
                        </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {Array.from(visibleCategories).map((category) => {
                            const config = categoryConfig[category];
                            const CategoryIcon = config.icon;

                            return (
                                <div
                                    key={category}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm shadow-black/5 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200"
                                >
                                    <span
                                        className={cn(
                                            'inline-flex h-5 w-5 items-center justify-center rounded-full ring-1',
                                            config.accent,
                                        )}
                                    >
                                        <CategoryIcon className="h-3.5 w-3.5" />
                                    </span>
                                    {config.label}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <ScrollArea className="max-h-[420px]">
                    <div className="p-3">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                                    No notifications yet
                                </p>
                                <p className="mt-1 max-w-[240px] text-sm text-neutral-500 dark:text-neutral-400">
                                    New orders, payments, salary activity,
                                    employees, and users will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notification) => {
                                    const config =
                                        categoryConfig[notification.category];
                                    const CategoryIcon = config.icon;

                                    return (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            className="group flex w-full items-start gap-3 rounded-2xl border border-transparent bg-neutral-50/80 px-3 py-3 text-left transition hover:border-neutral-200 hover:bg-white hover:shadow-sm dark:bg-neutral-900/70 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
                                        >
                                            <div className="relative mt-0.5">
                                                <div
                                                    className={cn(
                                                        'flex h-11 w-11 items-center justify-center rounded-2xl ring-1',
                                                        config.accent,
                                                    )}
                                                >
                                                    <CategoryIcon className="h-5 w-5" />
                                                </div>
                                                {notification.unread && (
                                                    <span
                                                        className={cn(
                                                            'absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-neutral-950',
                                                            config.dot,
                                                        )}
                                                    />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                                                                {
                                                                    notification.title
                                                                }
                                                            </p>
                                                            <Badge
                                                                variant="outline"
                                                                className="rounded-full border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                                                            >
                                                                {config.label}
                                                            </Badge>
                                                        </div>
                                                        <p className="line-clamp-2 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
                                                            {
                                                                notification.description
                                                            }
                                                        </p>
                                                    </div>

                                                    <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                                                        {notification.createdAt
                                                            ? formatDistanceToNow(
                                                                  new Date(
                                                                      notification.createdAt,
                                                                  ),
                                                                  {
                                                                      addSuffix: true,
                                                                  },
                                                              )
                                                            : 'Recently'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                    {notification.meta ? (
                                                        <span className="rounded-full bg-neutral-900 px-2.5 py-1 font-medium text-white dark:bg-white dark:text-neutral-950">
                                                            {notification.meta}
                                                        </span>
                                                    ) : null}
                                                    <span className="text-neutral-500 dark:text-neutral-400">
                                                        {getPriorityLabel(
                                                            notification.priority,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
