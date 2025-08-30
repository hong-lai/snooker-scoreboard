'use client';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Match } from '@/lib/types';
import { Users, Calendar, ChevronRight, Trophy, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MatchCardProps {
  match: Match;
  onDelete: () => void;
}

export function MatchCard({ match, onDelete }: MatchCardProps) {
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
    <Card className="flex flex-col justify-between transition-all hover:shadow-xl hover:bg-accent">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl leading-snug">
              <span className="font-semibold">{match.player1Name}</span>
              <span className="font-normal text-muted-foreground mx-2">vs</span>
              <span className="font-semibold">{match.player2Name}</span>
            </CardTitle>
            <Badge variant={match.status === 'ended' ? 'secondary' : 'default'} className="capitalize shrink-0">
              {match.status}
            </Badge>
        </div>
        <CardDescription className="flex items-center pt-1">
          <Calendar className="mr-2 h-4 w-4" />
          {format(parseISO(match.createdAt), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {finalScore ? (
          <div className="flex items-center text-lg font-semibold text-primary">
            <Trophy className="mr-2 h-5 w-5" />
            <span>Final Score: {finalScore.p1Wins} - {finalScore.p2Wins}</span>
          </div>
        ) : (
          <div className="text-muted-foreground">Match in progress...</div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/match/${match.id}`}>
            View Match <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Match</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this match and all of its data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
