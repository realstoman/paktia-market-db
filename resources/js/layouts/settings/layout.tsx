import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocalization } from '@/lib/localization';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { show as showLanguage } from '@/routes/language';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems = [
    {
        titleKey: 'common.profile',
        fallbackTitle: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        titleKey: 'common.password',
        fallbackTitle: 'Password',
        href: editPassword(),
        icon: null,
    },
    {
        titleKey: 'common.twoFactorAuth',
        fallbackTitle: 'Two-Factor Auth',
        href: show(),
        icon: null,
    },
    {
        titleKey: 'common.appearance',
        fallbackTitle: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
    {
        titleKey: 'common.language',
        fallbackTitle: 'Language',
        href: showLanguage(),
        icon: null,
    },
] as const;

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isRtl, t } = useLocalization();
    const { auth } = usePage<SharedData>().props;

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;
    const translatedNavItems: NavItem[] = sidebarNavItems.map((item) => ({
        title: t(item.titleKey, item.fallbackTitle),
        href: item.href,
        icon: item.icon,
    }));

    if (auth.is_super_admin === true) {
        translatedNavItems.push({
            title: t('common.systemBranding', 'System Branding'),
            href: '/settings/system-branding',
            icon: null,
        });
    }

    return (
        <div className="h-full rounded-lg bg-white px-4 py-6 dark:bg-brand-bg-dark">
            <Heading
                title={t('settings.title', 'Settings')}
                description={t(
                    'settings.description',
                    'Manage your profile and account settings',
                )}
            />

            <div className="flex flex-col lg:flex-row lg:gap-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className={cn('flex flex-col space-y-1 space-x-0', {
                            'text-right': isRtl,
                        })}
                    >
                        {translatedNavItems.map((item, index) => (
                            <Button
                                key={`${resolveUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full', {
                                    'justify-start': !isRtl,
                                    'justify-end text-right': isRtl,
                                    'bg-muted font-semibold': isSameUrl(
                                        currentPath,
                                        item.href,
                                    ),
                                    'font-bold': isRtl && isSameUrl(
                                        currentPath,
                                        item.href,
                                    ),
                                })}
                            >
                                <Link href={item.href}>
                                    <span className="w-full text-inherit">
                                        {item.title}
                                    </span>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section
                        className={cn('max-w-xl space-y-12', {
                            'text-right': isRtl,
                        })}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
