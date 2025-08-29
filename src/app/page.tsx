'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { MatchCard } from '@/components/match-card';
import type { Match } from '@/lib/types';
import { getMatches } from '@/lib/store';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setMatches(getMatches());
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Match History</h2>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Match History</h2>
          <Button asChild>
            <Link href="/new-match">
              <Plus className="mr-2 h-4 w-4" />
              New Match
            </Link>
          </Button>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium">No Matches Found</h3>
            <p className="text-muted-foreground mt-2 mb-4">Get started by creating a new match.</p>
            <Button asChild>
              <Link href="/new-match">Create Your First Match</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
