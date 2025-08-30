'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { MatchBoard } from '@/components/match-board';
import type { Match } from '@/lib/types';
import { getMatchById } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const updateMatchData = useCallback(async () => {
    if (params.id && user) {
      setIsLoading(true);
      const matchData = await getMatchById(user.uid, params.id as string);
      setMatch(matchData);
      setIsLoading(false);
    }
  }, [params.id, user]);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if(user) {
      updateMatchData();
    }
  }, [user, updateMatchData]);


  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!match) {
    return <MatchNotFound />
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
        <MatchBoard initialMatch={match} onUpdate={updateMatchData} />
      </main>
    </div>
  );
}

function MatchNotFound() {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center py-16">
            <h2 className="text-2xl font-bold">Match Not Found</h2>
            <p className="text-muted-foreground mt-2 mb-4">The match you are looking for does not exist or you do not have permission to view it.</p>
            <Button asChild variant="outline" size="sm" onClick={() => router.push('/')}>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
      </div>
    )
}
