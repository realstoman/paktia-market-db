import '../css/app.css';

import { UnauthorizedAccessModal } from '@/components/unauthorized-access-modal';
import { queryClient } from '@/lib/query-client';
import translations, { type LocaleCode } from '@/locales';
import { SharedData } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Toaster, toast } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = 'Paktiawal Group';
const displayedLoginWelcomeToasts = new Set<string>();
const displayedFlashToasts = new Set<string>();

type InertiaRootElement = HTMLElement & {
    __paktiaInertiaRoot?: Root;
};

function welcomeToastMessage(pageProps: Partial<SharedData>): string {
    const locale = (pageProps.localization?.locale ?? 'fa') as LocaleCode;

    return (
        translations[locale]?.auth.login.welcomeToast ??
        translations.en.auth.login.welcomeToast
    );
}

function welcomeToastTitleClass(pageProps: Partial<SharedData>): string {
    const locale = pageProps.localization?.locale;

    return locale === 'fa' || locale === 'ps'
        ? 'text-right text-lg leading-7'
        : 'text-sm';
}

function welcomeToastPosition(
    pageProps: Partial<SharedData>,
): 'bottom-left' | 'top-right' {
    const locale = pageProps.localization?.locale;

    return locale === 'fa' || locale === 'ps' ? 'bottom-left' : 'top-right';
}

function showLoginWelcomeToast(pageProps: Partial<SharedData>) {
    const toastId = pageProps.flash?.loginWelcome?.id;

    if (!toastId || displayedLoginWelcomeToasts.has(toastId)) {
        return;
    }

    displayedLoginWelcomeToasts.add(toastId);

    toast.success(welcomeToastMessage(pageProps), {
        id: `login-welcome-${toastId}`,
        position: welcomeToastPosition(pageProps),
        duration: 5000,
        classNames: {
            title: welcomeToastTitleClass(pageProps),
        },
    });
}

function flashToastPosition(
    pageProps: Partial<SharedData>,
): 'top-left' | 'top-right' {
    return pageProps.localization?.isRtl ? 'top-left' : 'top-right';
}

function showFlashToasts(
    pageProps: Partial<SharedData>,
    toastHistoryAtVisitStart: number,
) {
    (['success', 'error'] as const).forEach((type) => {
        const flash = pageProps.flash?.[type];

        if (!flash?.id || displayedFlashToasts.has(flash.id)) {
            return;
        }

        displayedFlashToasts.add(flash.id);

        window.setTimeout(() => {
            // Some feature screens already provide a more specific local toast.
            // Prefer that message when one was emitted during this visit.
            if (toast.getHistory().length > toastHistoryAtVisitStart) {
                return;
            }

            toast[type](flash.message, {
                id: `flash-${flash.id}`,
                position: flashToastPosition(pageProps),
                duration: type === 'success' ? 4500 : 6000,
                classNames: {
                    title: pageProps.localization?.isRtl
                        ? 'text-right leading-6'
                        : undefined,
                },
            });
        }, 0);
    });
}

function GlobalToastListener({
    initialPageProps,
}: {
    initialPageProps: Partial<SharedData>;
}) {
    useEffect(() => {
        let toastHistoryAtVisitStart = toast.getHistory().length;

        showLoginWelcomeToast(initialPageProps);
        showFlashToasts(initialPageProps, toastHistoryAtVisitStart);

        const removeBeforeListener = router.on('before', () => {
            toastHistoryAtVisitStart = toast.getHistory().length;
        });

        const removeNavigateListener = router.on('navigate', (event) => {
            const pageProps = event.detail.page.props as SharedData;

            showLoginWelcomeToast(pageProps);
            showFlashToasts(pageProps, toastHistoryAtVisitStart);
        });

        return () => {
            removeBeforeListener();
            removeNavigateListener();
        };
    }, [initialPageProps]);

    return null;
}

function AppWithGlobalOverlays({
    App,
    props,
}: {
    App: React.ComponentType<unknown>;
    props: Record<string, unknown>;
}) {
    const sharedProps = (props?.initialPage?.props ??
        {}) as Partial<SharedData>;

    return (
        <>
            <App {...props} />
            <UnauthorizedAccessModal
                unauthorizedAccess={sharedProps.unauthorizedAccess ?? null}
                localization={
                    sharedProps.localization ?? {
                        locale: 'fa',
                        direction: 'rtl',
                        isRtl: true,
                        languages: [],
                    }
                }
            />
            <GlobalToastListener initialPageProps={sharedProps} />
        </>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const rootElement = el as InertiaRootElement;
        const root =
            rootElement.__paktiaInertiaRoot ?? createRoot(rootElement);

        rootElement.__paktiaInertiaRoot = root;

        root.render(
            <StrictMode>
                <QueryClientProvider client={queryClient}>
                    <AppWithGlobalOverlays App={App} props={props} />
                    <Toaster richColors closeButton />
                </QueryClientProvider>
            </StrictMode>,
        );
    },
    progress: {
        // color: '#4B5563',
        color: '#D3A450',
    },
});

initializeTheme();
