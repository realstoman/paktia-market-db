import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalization } from '@/lib/localization';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { formatNumber } from '@/utils/format';
import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    Boxes,
    BriefcaseBusiness,
    CheckCheck,
    CreditCard,
    ShieldCheck,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { type KeyboardEvent, useMemo, useState } from 'react';

type NotificationCategory =
    | 'payments'
    | 'salary'
    | 'employees'
    | 'inventory'
    | 'users'
    | 'system';

type NotificationPriority = 'high' | 'medium' | 'low';

const categoryConfig = {
    payments: {
        label: 'Payments',
        icon: CreditCard,
        accent: 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20',
        dot: 'bg-brand-primary',
    },
    salary: {
        label: 'Salary',
        icon: AfnIcon,
        accent: 'bg-brand-secondary/15 text-amber-700 ring-brand-secondary/30 dark:text-amber-300',
        dot: 'bg-brand-secondary',
    },
    employees: {
        label: 'Employees',
        icon: BriefcaseBusiness,
        accent: 'bg-[#e8f0f1] text-[#123f4a] ring-[#123f4a]/15 dark:bg-[#123f4a]/20 dark:text-sky-100',
        dot: 'bg-[#123f4a]',
    },
    inventory: {
        label: 'Inventory',
        icon: Boxes,
        accent: 'bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    users: {
        label: 'Users',
        icon: Users,
        accent: 'bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300',
        dot: 'bg-sky-500',
    },
    system: {
        label: 'System',
        icon: ShieldCheck,
        accent: 'bg-slate-500/12 text-slate-700 ring-slate-500/20 dark:text-slate-200',
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

function AfnIcon({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'text-[1.15em] leading-none font-semibold',
                className,
            )}
        >
            ؋
        </span>
    );
}

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
        return Array.isArray(parsed)
            ? parsed.filter(
                  (value): value is string => typeof value === 'string',
              )
            : [];
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

function getPriorityLabel(
    priority: NotificationPriority,
    t: (key: string, fallback?: string) => string,
): string {
    if (priority === 'high') {
        return t('notifications.priority.high', 'High priority');
    }
    if (priority === 'medium') {
        return t('notifications.priority.medium', 'Needs attention');
    }

    return t('notifications.priority.low', 'Informational');
}

function getDefaultHref(category: NotificationCategory): string {
    switch (category) {
        case 'payments':
            return '/finance/cash-bank';
        case 'salary':
            return '/finance/payroll';
        case 'employees':
            return '/employees';
        case 'inventory':
            return '/inventory';
        case 'users':
            return '/users';
        case 'system':
        default:
            return '/dashboard';
    }
}

export function HeaderNotifications() {
    const page = usePage<SharedData>();
    const { t, locale, isRtl } = useLocalization();
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
            (page.props.notifications ?? [])
                .filter((notification) => !hiddenIds.includes(notification.id))
                .map((notification) => ({
                    ...notification,
                    unread:
                        Boolean(notification.unread) &&
                        !readIds.includes(notification.id),
                })),
        [hiddenIds, page.props.notifications, readIds],
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

    const getNotificationTimestamp = (createdAt?: string | null) => {
        if (!createdAt) {
            return t('notifications.recently', 'Recently');
        }

        return new Intl.DateTimeFormat(
            locale === 'en' ? 'en-US' : locale === 'fa' ? 'fa-AF' : 'ps-AF',
            {
                dateStyle: 'medium',
                timeStyle: 'short',
            },
        ).format(new Date(createdAt));
    };

    const openNotification = (id: string, href: string) => {
        markAsRead([id]);
        router.visit(href);
    };

    const handleNotificationKeyDown = (
        event: KeyboardEvent<HTMLDivElement>,
        id: string,
        href: string,
    ) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        openNotification(id, href);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-10 rounded-full border border-[#dfe7e9] bg-white text-[#123f4a] shadow-sm shadow-slate-950/3 transition-all duration-300 hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                        <>
                            <span
                                className={cn(
                                    'absolute top-2 h-2.5 w-2.5 rounded-full bg-brand-secondary ring-2 ring-white dark:ring-neutral-900',
                                    isRtl ? 'left-2' : 'right-2',
                                )}
                            />
                            <span
                                className={cn(
                                    'absolute -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white shadow-sm ring-2 ring-white dark:ring-neutral-950',
                                    isRtl ? '-left-1' : '-right-1',
                                )}
                            >
                                {unreadCount > 9
                                    ? '9+'
                                    : formatNumber(unreadCount)}
                            </span>
                        </>
                    )}
                    <span className="sr-only">
                        {t(
                            'notifications.openNotifications',
                            'Open notifications',
                        )}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align={isRtl ? 'start' : 'end'}
                sideOffset={10}
                className={cn(
                    'w-100 overflow-hidden rounded-4xl border border-[#dfe7e9] bg-[#f8fbfb] p-0 shadow-2xl shadow-slate-950/12 dark:border-neutral-800 dark:bg-neutral-950',
                    isRtl ? 'text-right' : 'text-left',
                )}
            >
                <div className="border-b border-[#dfe7e9] bg-[radial-gradient(circle_at_top_right,rgba(242,162,12,0.18),transparent_34%),linear-gradient(135deg,rgba(11,90,165,0.12),rgba(248,250,253,0.92))] px-5 py-4 dark:border-neutral-800 dark:bg-[radial-gradient(circle_at_top_right,rgba(242,162,12,0.16),transparent_34%),linear-gradient(135deg,rgba(11,90,165,0.20),rgba(10,15,25,0.92))]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-brand-primary shadow-sm shadow-slate-950/3 dark:border-white/10 dark:bg-white/10 dark:text-sky-100">
                                <Bell className="h-3.5 w-3.5" />
                                {t(
                                    'notifications.center',
                                    'Notifications Center',
                                )}
                            </div>
                            <div
                                className={cn(
                                    'flex items-center gap-2',
                                    isRtl && 'justify-end',
                                )}
                            >
                                <h3 className="text-lg font-bold text-[#123f4a] dark:text-white">
                                    {t(
                                        'notifications.recentActivity',
                                        'Recent activity',
                                    )}
                                </h3>
                                <Sparkles className="h-4 w-4 text-brand-secondary" />
                            </div>
                            <p className="text-sm leading-6 text-slate-600 dark:text-neutral-300">
                                {unreadCount > 0
                                    ? t(
                                          'notifications.unreadSummary',
                                          ':count unread updates need attention.',
                                      ).replace(
                                          ':count',
                                          formatNumber(unreadCount),
                                      )
                                    : t(
                                          'notifications.allCaughtUp',
                                          'Everything is reviewed for now.',
                                      )}
                            </p>
                        </div>

                        <Badge
                            variant="outline"
                            className="rounded-full border-brand-primary/15 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-primary dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
                        >
                            {t('notifications.items', ':count items').replace(
                                ':count',
                                formatNumber(displayedNotifications.length),
                            )}
                        </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <div
                            className={cn(
                                'flex flex-wrap gap-2',
                                isRtl && 'justify-end',
                            )}
                        >
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full border border-brand-primary/10 bg-white/80 px-3 text-xs text-brand-primary hover:bg-brand-primary hover:text-white"
                                onClick={() =>
                                    markAsRead(
                                        notifications
                                            .filter(
                                                (notification) =>
                                                    notification.unread,
                                            )
                                            .map(
                                                (notification) =>
                                                    notification.id,
                                            ),
                                    )
                                }
                            >
                                <CheckCheck
                                    className={cn(
                                        'h-3.5 w-3.5',
                                        isRtl ? 'ml-1.5' : 'mr-1.5',
                                    )}
                                />
                                {t(
                                    'notifications.markAllRead',
                                    'Mark all read',
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-full border border-brand-secondary/20 bg-white/80 px-3 text-xs text-amber-700 hover:bg-brand-secondary hover:text-white dark:text-amber-200"
                                onClick={() =>
                                    hideNotifications(
                                        notifications.map(
                                            (notification) => notification.id,
                                        ),
                                    )
                                }
                            >
                                <Trash2
                                    className={cn(
                                        'h-3.5 w-3.5',
                                        isRtl ? 'ml-1.5' : 'mr-1.5',
                                    )}
                                />
                                {t('notifications.clearAll', 'Clear all')}
                            </Button>
                        </div>
                    </div>

                    <div
                        dir={isRtl ? 'rtl' : 'ltr'}
                        className="mt-4 flex flex-wrap gap-2"
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm shadow-black/5 transition-[color,background-color,border-color,box-shadow]',
                                selectedCategory === 'all'
                                    ? 'border-brand-primary bg-brand-primary text-white dark:border-white dark:bg-white dark:text-neutral-950'
                                    : 'border-white/80 bg-white/85 text-slate-600 hover:border-brand-primary/20 hover:bg-white hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-neutral-700',
                            )}
                        >
                            {t('notifications.all', 'All')}
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
                                        'inline-flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold shadow-sm shadow-black/5 transition-[color,background-color,border-color,box-shadow]',
                                        selectedCategory === category
                                            ? 'border-brand-primary bg-brand-primary text-white dark:border-white dark:bg-white dark:text-neutral-950'
                                            : 'border-white/80 bg-white/85 text-slate-600 hover:border-brand-primary/20 hover:bg-white hover:text-brand-primary dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-neutral-700',
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
                                    {t(
                                        `notifications.categories.${category}`,
                                        config.label,
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="max-h-105 overflow-y-auto overscroll-contain p-3">
                    {displayedNotifications.length === 0 ? (
                        notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-primary/15 bg-white/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/15">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold text-[#123f4a] dark:text-white">
                                    {t(
                                        'notifications.empty.title',
                                        'No notifications yet',
                                    )}
                                </p>
                                <p className="mt-1 max-w-70 text-sm leading-6 text-slate-500 dark:text-neutral-400">
                                    {t(
                                        'notifications.empty.description',
                                        'New inventory, payroll, employee, finance, and user updates will appear here.',
                                    )}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-primary/15 bg-white/80 px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/15">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-semibold text-[#123f4a] dark:text-white">
                                    {t(
                                        'notifications.emptyCategory.title',
                                        'No items in this category',
                                    )}
                                </p>
                                <p className="mt-1 max-w-70 text-sm leading-6 text-slate-500 dark:text-neutral-400">
                                    {t(
                                        'notifications.emptyCategory.description',
                                        'Choose another badge above to see more recent updates.',
                                    )}
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
                                    <div
                                        key={notification.id}
                                        role="button"
                                        tabIndex={0}
                                        dir={isRtl ? 'rtl' : 'ltr'}
                                        onClick={() => {
                                            openNotification(
                                                notification.id,
                                                href,
                                            );
                                        }}
                                        onKeyDown={(event) =>
                                            handleNotificationKeyDown(
                                                event,
                                                notification.id,
                                                href,
                                            )
                                        }
                                        className={cn(
                                            'group flex w-full cursor-pointer items-start gap-3 rounded-2xl border bg-white px-3 py-3 shadow-sm shadow-slate-950/3 transition-[color,background-color,border-color,box-shadow] outline-none hover:border-brand-primary/20 hover:bg-brand-primary/5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-primary/25 dark:bg-neutral-900/70 dark:hover:border-neutral-800 dark:hover:bg-neutral-900',
                                            isRtl ? 'text-right' : 'text-left',
                                            notification.unread
                                                ? 'border-brand-secondary/35'
                                                : 'border-[#e8eef0] dark:border-neutral-800',
                                            notification.unread &&
                                                (isRtl
                                                    ? 'border-r-4'
                                                    : 'border-l-4'),
                                        )}
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
                                                        'absolute -top-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-neutral-950',
                                                        isRtl
                                                            ? '-left-0.5'
                                                            : '-right-0.5',
                                                        config.dot,
                                                    )}
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div
                                                        className={cn(
                                                            'flex flex-wrap items-center gap-2',
                                                            isRtl &&
                                                                'justify-end',
                                                        )}
                                                    >
                                                        <p className="text-sm font-bold text-[#123f4a] dark:text-white">
                                                            {notification.title}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className="pointer-events-none rounded-full border-brand-primary/10 bg-[#e8f0f1] px-2 py-0.5 text-[10px] font-semibold text-brand-primary dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                                                        >
                                                            {t(
                                                                `notifications.categories.${notification.category}`,
                                                                config.label,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                    <p className="line-clamp-2 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
                                                        {
                                                            notification.description
                                                        }
                                                    </p>
                                                </div>

                                                <span className="shrink-0 text-xs text-slate-400 dark:text-neutral-500">
                                                    {notification.createdAt
                                                        ? getNotificationTimestamp(
                                                              notification.createdAt,
                                                          )
                                                        : t(
                                                              'notifications.recently',
                                                              'Recently',
                                                          )}
                                                </span>
                                            </div>

                                            <div
                                                className={cn(
                                                    'mt-3 flex flex-wrap items-center justify-between gap-2 text-xs',
                                                    isRtl && 'flex-row-reverse',
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        'flex flex-wrap items-center gap-2',
                                                        isRtl && 'justify-end',
                                                    )}
                                                >
                                                    {notification.meta ? (
                                                        <span className="pointer-events-none rounded-full bg-brand-primary px-2.5 py-1 font-medium text-white dark:bg-white dark:text-neutral-950">
                                                            {notification.meta}
                                                        </span>
                                                    ) : null}
                                                    <span className="text-neutral-500 dark:text-neutral-400">
                                                        {getPriorityLabel(
                                                            notification.priority,
                                                            t,
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
                                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition-[color,background-color,border-color] hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
                                                    aria-label={t(
                                                        'notifications.remove',
                                                        'Remove notification',
                                                    )}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
