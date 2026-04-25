import '../css/app.css';

import { UnauthorizedAccessModal } from '@/components/unauthorized-access-modal';
import { SharedData } from '@/types';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

const appName = 'Baba Restaurant';

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
                        locale: 'en',
                        direction: 'ltr',
                        isRtl: false,
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
                <AppWithGlobalOverlays App={App} props={props} />
                <Toaster richColors closeButton />
            </StrictMode>,
        );
    },
    progress: {
        // color: '#4B5563',
        color: '#CC924B',
    },
});

initializeTheme();
