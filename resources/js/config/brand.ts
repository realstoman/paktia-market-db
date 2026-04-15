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

const runtimeBranding =
    typeof window !== 'undefined' ? window.__APP_BRANDING__ : undefined;

export const brand = {
    name: runtimeBranding?.name ?? 'Baba Restaurant ERP',
    shortName: runtimeBranding?.shortName ?? 'Baba',
    logo: runtimeBranding?.logoUrl ?? '/brand/logo.svg',
    logoFull: runtimeBranding?.logoFullUrl ?? '/brand/logo-full.svg',
    primaryColor: runtimeBranding?.primaryColor ?? '#102F33',
    secondaryColor: runtimeBranding?.secondaryColor ?? '#CC924B',
    tertiaryColor: runtimeBranding?.tertiaryColor ?? '#F8FAFD',
};

export const illustrations = {
    babaChef: '/illustrations/baba-chef.png',
    babaChefDark: '/illustrations/baba-chef2.png',
};
