import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem' },
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
          soft: token('primary-soft'),
          'soft-foreground': token('primary-soft-foreground'),
        },
        bkash: {
          DEFAULT: token('bkash'),
          foreground: token('bkash-foreground'),
          soft: token('bkash-soft'),
        },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
          soft: token('destructive-soft'),
        },
        // Legacy aliases used by pages not yet rebuilt; removed in Task 19.
        secondary: { DEFAULT: token('muted'), foreground: token('foreground') },
        accent: { DEFAULT: token('muted'), foreground: token('foreground') },
        admin: { DEFAULT: token('warning'), foreground: token('primary-foreground') },
      },
      borderRadius: {
        xl: '20px',
        lg: '16px',
        md: '12px',
        sm: '8px',
      },
      boxShadow: {
        card: '0 1px 2px hsl(160 20% 10% / 0.04), 0 4px 16px hsl(160 20% 10% / 0.06)',
        lift: '0 2px 4px hsl(160 20% 10% / 0.05), 0 12px 32px hsl(160 20% 10% / 0.10)',
      },
      fontFamily: {
        sans: ['var(--font-hind)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'progress-fill': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'progress-fill': 'progress-fill 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
