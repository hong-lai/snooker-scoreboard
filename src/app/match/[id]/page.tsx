'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { MatchBoard } from '@/components/match-board';
import type { Match } from '@/lib/types';
import { getMatchById } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
     const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/login');
    } else {
      setIsMounted(true);
      updateMatchData();
      // Poll for updates to reflect changes from other tabs/windows
      const interval = setInterval(updateMatchData, 1000);
      return () => clearInterval(interval);
    }
  }, [params.id, router]);

  const updateMatchData = () => {
    if (params.id) {
      const matchData = getMatchById(params.id as string);
      setMatch(matchData);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4 md:p-8 page-transition">
        <div className="mb-4">
            <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        {match === undefined && <MatchSkeleton />}
        {match === null && <MatchNotFound />}
        {match && <MatchBoard initialMatch={match} onUpdate={updateMatchData} />}
      </main>
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-8 w-1/4" />
      <div className="border rounded-lg">
        <Skeleton className="h-12 w-full rounded-b-none" />
        <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

function MatchNotFound() {
    return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold">Match Not Found</h2>
            <p className="text-muted-foreground mt-2">The match you are looking for does not exist.</p>
        </div>
    )
}
