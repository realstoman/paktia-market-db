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

                const normalizeHex = (value, fallback = '#102F33') => {
                    if (typeof value !== 'string') {
                        return fallback;
                    }

                    const normalized = value.trim().toUpperCase();
                    return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
                };

                const hexToHslChannels = (hex) => {
                    const normalized = normalizeHex(hex).slice(1);
                    const intValue = parseInt(normalized, 16);
                    const red = ((intValue >> 16) & 255) / 255;
                    const green = ((intValue >> 8) & 255) / 255;
                    const blue = (intValue & 255) / 255;

                    const max = Math.max(red, green, blue);
                    const min = Math.min(red, green, blue);
                    const delta = max - min;
                    const lightness = (max + min) / 2;

                    let hue = 0;
                    let saturation = 0;

                    if (delta !== 0) {
                        saturation = delta / (1 - Math.abs(2 * lightness - 1));

                        switch (max) {
                            case red:
                                hue = ((green - blue) / delta) % 6;
                                break;
                            case green:
                                hue = (blue - red) / delta + 2;
                                break;
                            default:
                                hue = (red - green) / delta + 4;
                                break;
                        }
                    }

                    return `${Math.round((hue * 60 + 360) % 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
                };

                const getForegroundChannels = (hex) => {
                    const normalized = normalizeHex(hex).slice(1);
                    const intValue = parseInt(normalized, 16);
                    const red = (intValue >> 16) & 255;
                    const green = (intValue >> 8) & 255;
                    const blue = intValue & 255;
                    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

                    return brightness >= 160 ? '222 47% 11%' : '0 0% 100%';
                };

                const primaryColor = normalizeHex(window.__APP_BRANDING__?.primaryColor, '#102F33');
                document.documentElement.style.setProperty('--brand-primary', primaryColor);
                document.documentElement.style.setProperty(
                    '--brand-secondary',
                    normalizeHex(window.__APP_BRANDING__?.secondaryColor, '#CC924B'),
                );
                document.documentElement.style.setProperty(
                    '--brand-tertiary',
                    normalizeHex(window.__APP_BRANDING__?.tertiaryColor, '#F8FAFD'),
                );
                document.documentElement.style.setProperty('--primary', hexToHslChannels(primaryColor));
                document.documentElement.style.setProperty('--primary-foreground', getForegroundChannels(primaryColor));
                document.documentElement.style.setProperty('--ring', hexToHslChannels(primaryColor));
                document.documentElement.style.setProperty('--sidebar-ring', hexToHslChannels(primaryColor));

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
