import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
    darkMode: 'class',
    content: [
        './resources/js/**/*.{ts,tsx}',
        './resources/views/**/*.blade.php',
    ],
    theme: {
        extend: {
            colors: {
                /** ============================
                 * BRAND COLORS
                 * ============================ */
                brand: {
                    primary: '#102F33',
                    secondary: '#CC924B',
                },

                /** ============================
                 * SEMANTIC SYSTEM COLORS
                 * (Used by ShadCN)
                 * ============================ */
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                card: 'hsl(var(--card))',
                cardForeground: 'hsl(var(--card-foreground))',

                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },

                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },

                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },

                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },

                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },

            /** ============================
             * BRAND FONTS
             * ============================ */
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },

            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
        },
    },
    plugins: [animate],
};

export default config;
