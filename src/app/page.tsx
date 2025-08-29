'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { MatchCard } from '@/components/match-card';
import type { Match } from '@/lib/types';
import { getMatches } from '@/lib/store';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PlayerWinData {
  name: string;
  wins: number;
}

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [playerWinData, setPlayerWinData] = useState<PlayerWinData[]>([]);

  useEffect(() => {
    const allMatches = getMatches();
    setMatches(allMatches);

    const endedMatches = allMatches.filter(match => match.status === 'ended');
    const playerWins: { [key: string]: number } = {};

    endedMatches.forEach(match => {
      let p1Wins = 0;
      let p2Wins = 0;
      match.frames.forEach(frame => {
        if (frame.player1Score > frame.player2Score) p1Wins++;
        else if (frame.player2Score > frame.player1Score) p2Wins++;
      });

      if (p1Wins > p2Wins) {
        playerWins[match.player1Name] = (playerWins[match.player1Name] || 0) + 1;
      } else if (p2Wins > p1Wins) {
        playerWins[match.player2Name] = (playerWins[match.player2Name] || 0) + 1;
      }
    });

    const winData = Object.keys(playerWins)
      .map(name => ({
        name,
        wins: playerWins[name],
      }))
      .sort((a, b) => b.wins - a.wins);

    setPlayerWinData(winData);
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
      <main className="p-4 md:p-8 page-transition">
        {playerWinData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Player Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerWinData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="wins" fill="hsl(var(--primary))" name="Matches Won" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
