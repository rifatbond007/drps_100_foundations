'use client';

/**
 * Last-resort boundary for errors thrown by the locale layout itself.
 * It replaces the whole document, so it renders its own `<html>` and
 * can't rely on translations being available.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="bn">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p>কিছু একটা ভুল হয়েছে · Something went wrong</p>
          <button type="button" onClick={reset} style={{ marginTop: 16 }}>
            আবার চেষ্টা করুন · Try again
          </button>
        </div>
      </body>
    </html>
  );
}
