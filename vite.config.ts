import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        target: 'es2022',
        // Split heavy vendor groups into their own chunks so individual
        // page bundles stay small and the browser can long-cache the
        // libraries that don't change between deploys.
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    if (id.includes('@radix-ui') || id.includes('radix-ui')) {
                        return 'vendor-radix';
                    }
                    if (id.includes('@tanstack/')) {
                        return 'vendor-tanstack';
                    }
                    if (id.includes('recharts')) {
                        return 'vendor-recharts';
                    }
                    if (
                        id.includes('date-fns') ||
                        id.includes('dayjs') ||
                        id.includes('react-day-picker')
                    ) {
                        return 'vendor-date';
                    }
                    if (
                        id.includes('lucide-react') ||
                        id.includes('@tabler/icons-react')
                    ) {
                        return 'vendor-icons';
                    }
                    if (
                        id.includes('react-hook-form') ||
                        id.includes('@hookform') ||
                        id.includes('zod')
                    ) {
                        return 'vendor-forms';
                    }
                    if (id.includes('@inertiajs/')) {
                        return 'vendor-inertia';
                    }
                    return 'vendor';
                },
            },
        },
    },
});
