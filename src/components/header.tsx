'use client';
import Link from 'next/link';
import { SnookerIcon } from '@/components/icons/snooker-icon';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from './ui/button';
import { LayoutGrid } from 'lucide-react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-card/80 border-b backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <SnookerIcon className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
            Snooker Loopy Scores
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/data">
                <LayoutGrid className="mr-2 h-4 w-4"/>
                Data
            </Link>
          </Button>
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
