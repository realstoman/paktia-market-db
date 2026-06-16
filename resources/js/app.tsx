import '../css/app.css';

import { UnauthorizedAccessModal } from '@/components/unauthorized-access-modal';
import { queryClient } from '@/lib/query-client';
import { SharedData } from '@/types';
import { createInertiaApp } from '@inertiajs/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = 'Paktiawal Group';

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
