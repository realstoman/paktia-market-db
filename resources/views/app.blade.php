@php
    $branding = app(\App\Services\Settings\SystemBrandingService::class)->getBranding();
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', $locale ?? app()->getLocale()) }}" dir="{{ $textDirection ?? 'ltr' }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';
                window.__APP_BRANDING__ = @json($branding);

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            :root {
                --brand-primary: {{ $branding['primaryColor'] }};
                --brand-secondary: {{ $branding['secondaryColor'] }};
                --brand-tertiary: {{ $branding['tertiaryColor'] }};
            }

            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ $branding['name'] }}</title>

        @php
            $faviconIcoVersion = filemtime(public_path('favicon.ico'));
            $favicon16Version = filemtime(public_path('favicon-16x16.png'));
            $favicon32Version = filemtime(public_path('favicon-32x32.png'));
            $appleTouchVersion = filemtime(public_path('apple-touch-icon.png'));
        @endphp
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v={{ $appleTouchVersion }}">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v={{ $favicon32Version }}">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v={{ $favicon16Version }}">
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v={{ $faviconIcoVersion }}">
        <link rel="shortcut icon" href="/favicon.ico?v={{ $faviconIcoVersion }}">
        <link rel="manifest" href="/site.webmanifest">
        <meta name="theme-color" content="{{ $branding['primaryColor'] }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
