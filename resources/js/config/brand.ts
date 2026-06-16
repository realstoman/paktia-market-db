declare global {
    interface Window {
        __APP_BRANDING__?: {
            name?: string;
            shortName?: string;
            logoUrl?: string;
            logoFullUrl?: string;
            primaryColor?: string;
            secondaryColor?: string;
            tertiaryColor?: string;
        };
    }
}

export interface RuntimeBranding {
    name?: string;
    shortName?: string;
    logoUrl?: string;
    logoFullUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
}

const runtimeBranding =
    typeof window !== 'undefined' ? window.__APP_BRANDING__ : undefined;

export const brand = {
    name: runtimeBranding?.name ?? 'Paktia Market ERP',
    shortName: runtimeBranding?.shortName ?? 'Paktia Market',
    logo: runtimeBranding?.logoUrl ?? '/brand/logo.png',
    logoFull: runtimeBranding?.logoFullUrl ?? '/brand/logo-full.svg',
    primaryColor: runtimeBranding?.primaryColor ?? '#0B5AA5',
    secondaryColor: runtimeBranding?.secondaryColor ?? '#F2A20C',
    tertiaryColor: runtimeBranding?.tertiaryColor ?? '#F8FAFD',
};

function normalizeHexColor(value?: string, fallback = '#0B5AA5'): string {
    if (!value) {
        return fallback;
    }

    const normalized = value.trim().toUpperCase();

    return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function hexToRgb(hex: string) {
    const normalized = normalizeHexColor(hex).slice(1);
    const intValue = parseInt(normalized, 16);

    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255,
    };
}

function toHslChannels(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;

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

    const normalizedHue = Math.round((hue * 60 + 360) % 360);
    const normalizedSaturation = Math.round(saturation * 100);
    const normalizedLightness = Math.round(lightness * 100);

    return `${normalizedHue} ${normalizedSaturation}% ${normalizedLightness}%`;
}

function getForegroundChannels(hex: string): string {
    const { r, g, b } = hexToRgb(hex);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness >= 160 ? '222 47% 11%' : '0 0% 100%';
}

export function getBrandingCssVariables(branding?: RuntimeBranding) {
    const primary = normalizeHexColor(
        branding?.primaryColor,
        brand.primaryColor,
    );
    const secondary = normalizeHexColor(
        branding?.secondaryColor,
        brand.secondaryColor,
    );
    const tertiary = normalizeHexColor(
        branding?.tertiaryColor,
        brand.tertiaryColor,
    );

    const primaryChannels = toHslChannels(primary);
    const primaryForegroundChannels = getForegroundChannels(primary);

    return {
        '--brand-primary': primary,
        '--brand-secondary': secondary,
        '--brand-tertiary': tertiary,
        '--primary': primaryChannels,
        '--primary-foreground': primaryForegroundChannels,
        '--ring': primaryChannels,
        '--sidebar-ring': primaryChannels,
        '--color-primary': `hsl(${primaryChannels})`,
        '--color-primary-foreground': `hsl(${primaryForegroundChannels})`,
        '--color-ring': `hsl(${primaryChannels})`,
        '--color-sidebar-ring': `hsl(${primaryChannels})`,
    } as const;
}

export function applyBrandingToDocument(branding?: RuntimeBranding) {
    if (typeof document === 'undefined') {
        return;
    }

    const root = document.documentElement;
    const variables = getBrandingCssVariables(branding);

    Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}
