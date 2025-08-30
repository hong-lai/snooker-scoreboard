'use client';
import Link from 'next/link';
import { SnookerIcon } from '@/components/icons/snooker-icon';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-card border-b">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <SnookerIcon className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Snooker Loopy Scores
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
