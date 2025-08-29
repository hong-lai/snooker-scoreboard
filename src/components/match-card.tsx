'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Match } from '@/lib/types';
import { Users, Calendar, ChevronRight, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const calculateFinalScore = () => {
    if (match.status !== 'ended') return null;
    let p1Wins = 0;
    let p2Wins = 0;
    match.frames.forEach(frame => {
      if (frame.player1Score > frame.player2Score) {
        p1Wins++;
      } else if (frame.player2Score > frame.player1Score) {
        p2Wins++;
      }
    });
    return { p1Wins, p2Wins };
  };

  const finalScore = calculateFinalScore();

  return (
    <Card className="flex flex-col justify-between transition-all hover:shadow-xl hover:bg-white/20">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl leading-snug text-white">
              {match.player1Name} vs {match.player2Name}
            </CardTitle>
            <Badge variant={match.status === 'ended' ? 'secondary' : 'default'} className="capitalize shrink-0">
              {match.status}
            </Badge>
        </div>
        <CardDescription className="flex items-center pt-1 text-white/70">
          <Calendar className="mr-2 h-4 w-4" />
          {format(new Date(match.createdAt), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {finalScore ? (
          <div className="flex items-center text-lg font-semibold text-yellow-300">
            <Trophy className="mr-2 h-5 w-5" />
            <span>Final Score: {finalScore.p1Wins} - {finalScore.p2Wins}</span>
          </div>
        ) : (
          <div className="text-white/80">Match in progress...</div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full bg-transparent text-white hover:bg-white/10 hover:text-white border-white/30">
          <Link href={`/match/${match.id}`}>
            View Match <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
