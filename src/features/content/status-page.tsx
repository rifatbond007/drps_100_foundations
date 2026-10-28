import type { ReactNode } from 'react';

interface StatusPageProps {
  code?: string;
  title: string;
  body: string;
  children?: ReactNode;
}

/** Full-height centered message used by the 404 and error pages. */
export function StatusPage({ code, title, body, children }: StatusPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(50%_40%_at_50%_30%,hsl(var(--primary)/0.1),transparent)] px-4 text-center">
      {code && <p className="tabular text-7xl font-bold text-primary sm:text-8xl">{code}</p>}
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
    </main>
  );
}
