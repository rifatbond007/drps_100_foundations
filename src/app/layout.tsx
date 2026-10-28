import './globals.css';

/**
 * Root layout is a passthrough: `app/[locale]/layout.tsx` renders the one
 * `<html>` so it can set `lang` per locale. Pages outside a locale
 * (`not-found.tsx`, `global-error.tsx`) render their own document.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
