import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // Foundation green — used sparingly for primary actions and active
        // states. HSL keeps a single hue family so all surfaces share one
        // colour story without us hand-tuning each shade.
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // Surface-tinted secondary — the "muted" feel of the page chrome
        // (footer, sidebar surface, account cards). Off-paper so it reads
        // as a quieter plane.
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // Reserved for payment surfaces only — never for chrome.
        // Distinct hue so the donor's eye finds the money path at a glance.
        bkash: {
          DEFAULT: 'hsl(var(--bkash))',
          foreground: 'hsl(var(--bkash-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Admin chrome — mustard. Gives /admin/* a distinct, trustworthy
        // tone separate from donor-facing pages, without resorting to a
        // different primary.
        admin: {
          DEFAULT: 'hsl(var(--admin))',
          foreground: 'hsl(var(--admin-foreground))',
        },
      },
      borderRadius: {
        // Tight corners. The pages are register-style — no rounded cards
        // stacked on rounded cards. Inputs/buttons get a hint (6px) but
        // everything else sits on the grid.
        lg: '6px',
        md: '4px',
        sm: '2px',
      },
      fontFamily: {
        // Single family — Hind Siliguri ships both Latin and Bengali in
        // one font file so headlines, body, and numerals all share the
        // same metrics.
        sans: ['var(--font-hind)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-hind)', 'system-ui', 'serif'],
      },
      // One orchestrated entrance — the body fades in once. No scattered
      // fade-and-slide on every section.
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
