import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    type AppNotification,
    type Role,
    type SharedData,
    type User,
} from '@/types';
import { router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    Boxes,
    BriefcaseBusiness,
    CheckCheck,
    CreditCard,
    DollarSign,
    Package,
    ReceiptText,
    ShieldCheck,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type NotificationCategory =
    | 'orders'
    | 'payments'
    | 'salary'
    | 'employees'
    | 'inventory'
    | 'products'
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
    inventory: {
        label: 'Inventory',
        icon: Boxes,
        accent: 'bg-orange-500/12 text-orange-700 ring-orange-500/20',
        dot: 'bg-orange-500',
    },
    products: {
        label: 'Products',
        icon: Package,
        accent: 'bg-teal-500/12 text-teal-700 ring-teal-500/20',
        dot: 'bg-teal-500',
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
    admin: ['orders', 'payments', 'salary', 'employees', 'inventory', 'products', 'users', 'system'],
    administrator: [
        'orders',
        'payments',
        'salary',
        'employees',
        'inventory',
        'products',
        'users',
        'system',
    ],
    manager: ['orders', 'payments', 'salary', 'employees', 'inventory', 'products', 'users'],
    accountant: ['payments', 'salary', 'system'],
    hr: ['salary', 'employees', 'users'],
    'human resources': ['salary', 'employees', 'users'],
    supervisor: ['orders', 'payments', 'employees', 'inventory', 'products'],
    'super-admin': ['orders', 'payments', 'salary', 'employees', 'inventory', 'products', 'users', 'system'],
};

const STORAGE_READ_KEY = 'header-notifications-read';
const STORAGE_HIDDEN_KEY = 'header-notifications-hidden';

function readStoredIds(key: string): string[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
    } catch {
        return [];
    }
}

function writeStoredIds(key: string, ids: string[]) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(ids));
}

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

function getDefaultHref(category: NotificationCategory): string {
    switch (category) {
        case 'orders':
            return '/orders';
        case 'payments':
            return '/finance/cash-bank';
        case 'salary':
            return '/finance/payroll';
        case 'employees':
            return '/employees';
        case 'inventory':
            return '/inventory';
        case 'products':
            return '/products';
        case 'users':
            return '/users';
        case 'system':
        default:
            return '/dashboard';
    }
}

export function HeaderNotifications({ user }: HeaderNotificationsProps) {
    const page = usePage<SharedData>();
    const [selectedCategory, setSelectedCategory] = useState<
        NotificationCategory | 'all'
    >('all');
    const [readIds, setReadIds] = useState<string[]>(() =>
        readStoredIds(STORAGE_READ_KEY),
    );
    const [hiddenIds, setHiddenIds] = useState<string[]>(() =>
        readStoredIds(STORAGE_HIDDEN_KEY),
    );

    const notifications = useMemo(
        () =>
            getVisibleNotifications(user, page.props.notifications ?? [])
                .filter((notification) => !hiddenIds.includes(notification.id))
                .map((notification) => ({
                    ...notification,
                    unread:
                        Boolean(notification.unread) &&
                        !readIds.includes(notification.id),
                })),
        [hiddenIds, page.props.notifications, readIds, user],
    );
    const displayedNotifications =
        selectedCategory === 'all'
            ? notifications
            : notifications.filter(
                  (notification) => notification.category === selectedCategory,
              );
    const unreadCount = notifications.filter(
        (notification) => notification.unread,
    ).length;
    const visibleCategories = new Set(
        notifications.map((notification) => notification.category),
    );

    const markAsRead = (ids: string[]) => {
        const next = Array.from(new Set([...readIds, ...ids]));
        setReadIds(next);
        writeStoredIds(STORAGE_READ_KEY, next);
    };

    const hideNotifications = (ids: string[]) => {
        const next = Array.from(new Set([...hiddenIds, ...ids]));
        setHiddenIds(next);
        writeStoredIds(STORAGE_HIDDEN_KEY, next);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full border border-neutral-200/70 bg-neutral-100 text-neutral-700 transition-all duration-300 hover:bg-neutral-200/70 hover:text-neutral-950 dark:border-neutral-700/90 dark:bg-neutral-950 dark:text-neutral-200"
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
                            {displayedNotifications.length} items
                        </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs"
                                onClick={() =>
                                    markAsRead(
                                        notifications
                                            .filter((notification) => notification.unread)
                                            .map((notification) => notification.id),
                                    )
                                }
                            >
                                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                                Mark all read
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full px-3 text-xs"
                                onClick={() =>
                                    hideNotifications(
                                        notifications.map(
                                            (notification) => notification.id,
                                        ),
                                    )
                                }
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Clear all
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm shadow-black/5 transition',
                                selectedCategory === 'all'
                                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                                    : 'border-white/70 bg-white/80 text-neutral-700 hover:border-neutral-200 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-neutral-700',
                            )}
                        >
                            All
                        </button>
                        {Array.from(visibleCategories).map((category) => {
                            const config = categoryConfig[category];
                            const CategoryIcon = config.icon;

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory(category)
                                    }
                                    className={cn(
                                        'inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm shadow-black/5 transition',
                                        selectedCategory === category
                                            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                                            : 'border-white/70 bg-white/80 text-neutral-700 hover:border-neutral-200 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-neutral-700',
                                    )}
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
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto overscroll-contain p-3">
                    {displayedNotifications.length === 0 ? (
                        notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                                    No notifications yet
                                </p>
                                <p className="mt-1 max-w-[240px] text-sm text-neutral-500 dark:text-neutral-400">
                                    New orders, products, inventory, payroll,
                                    employees, and users will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold text-neutral-950 dark:text-white">
                                    No items in this category
                                </p>
                                <p className="mt-1 max-w-[240px] text-sm text-neutral-500 dark:text-neutral-400">
                                    Choose another badge above to see more
                                    recent updates.
                                </p>
                            </div>
                        )
                    ) : (
                        <div className="space-y-2">
                            {displayedNotifications.map((notification) => {
                                const config =
                                    categoryConfig[notification.category];
                                const CategoryIcon = config.icon;
                                const href =
                                    notification.href ??
                                    getDefaultHref(notification.category);

                                return (
                                    <button
                                        key={notification.id}
                                        type="button"
                                        onClick={() => {
                                            markAsRead([notification.id]);
                                            router.visit(href);
                                        }}
                                        className="group flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-transparent bg-neutral-50/80 px-3 py-3 text-left transition hover:border-neutral-200 hover:bg-white hover:shadow-sm dark:bg-neutral-900/70 dark:hover:border-neutral-800 dark:hover:bg-neutral-900"
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
                                                            {notification.title}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="pointer-events-none rounded-full border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
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

                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                <div className="flex flex-wrap items-center gap-2">
                                                {notification.meta ? (
                                                    <span className="pointer-events-none rounded-full bg-neutral-900 px-2.5 py-1 font-medium text-white dark:bg-white dark:text-neutral-950">
                                                        {notification.meta}
                                                    </span>
                                                ) : null}
                                                <span className="text-neutral-500 dark:text-neutral-400">
                                                    {getPriorityLabel(
                                                        notification.priority,
                                                    )}
                                                </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        hideNotifications([
                                                            notification.id,
                                                        ]);
                                                    }}
                                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
                                                    aria-label="Remove notification"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
