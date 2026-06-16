import '../css/app.css';

import { UnauthorizedAccessModal } from '@/components/unauthorized-access-modal';
import { queryClient } from '@/lib/query-client';
import translations, { type LocaleCode } from '@/locales';
import { SharedData } from '@/types';
import { createInertiaApp, router } from '@inertiajs/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster, toast } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = 'Paktiawal Group';
const displayedLoginWelcomeToasts = new Set<string>();

function welcomeToastMessage(pageProps: Partial<SharedData>): string {
    const locale = (pageProps.localization?.locale ?? 'fa') as LocaleCode;

    return (
        translations[locale]?.auth.login.welcomeToast ??
        translations.en.auth.login.welcomeToast
    );
}

function showLoginWelcomeToast(pageProps: Partial<SharedData>) {
    const toastId = pageProps.flash?.loginWelcome?.id;

    if (!toastId || displayedLoginWelcomeToasts.has(toastId)) {
        return;
    }

    displayedLoginWelcomeToasts.add(toastId);

    toast.success(welcomeToastMessage(pageProps), {
        duration: 5000,
    });
}

function LoginWelcomeToast({
    initialPageProps,
}: {
    initialPageProps: Partial<SharedData>;
}) {
    useEffect(() => {
        showLoginWelcomeToast(initialPageProps);

        const removeSuccessListener = router.on('success', (event) => {
            showLoginWelcomeToast(event.detail.page.props as SharedData);
        });

        const removeNavigateListener = router.on('navigate', (event) => {
            showLoginWelcomeToast(event.detail.page.props as SharedData);
        });

        return () => {
            removeSuccessListener();
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
    const sharedProps = (props?.initialPage?.props ?? {}) as {
        unauthorizedAccess?: {
            show: boolean;
            path?: string | null;
        } | null;
        localization?: SharedData['localization'];
    };

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
            <LoginWelcomeToast initialPageProps={sharedProps} />
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
        const root = createRoot(el);

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
        color: '#F2A20C',
    },
});

initializeTheme();
