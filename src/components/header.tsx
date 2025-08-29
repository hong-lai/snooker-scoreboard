import Link from 'next/link';
import { Trophy } from 'lucide-react';
import type { ReactNode } from 'react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-card border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            SnookerScoreMate
          </h1>
        </Link>
        {children}
      </div>
    </header>
  );
}
