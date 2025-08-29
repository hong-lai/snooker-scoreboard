'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { MatchCard } from '@/components/match-card';
import type { Match, Frame } from '@/lib/types';
import { getMatches, createMatch, updateMatch, deleteMatch } from '@/lib/store';
import { Plus, Camera, Loader2, Star, Circle, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { translateSnookerScoreFromImage } from '@/ai/flows/translate-snooker-score-from-image';
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
import { TooltipProps } from 'recharts';

interface PlayerWinData {
  name: string;
  wins: number;
}

// Function to parse date from filename (YYYY-MM-DD, YYYYMMDD, etc.)
const parseDateFromFilename = (filename: string): Date | null => {
    const regex = /(\d{4})[-_]?(\d{2})[-_]?(\d{2})/;
    const match = filename.match(regex);
    if (match) {
        const [, year, month, day] = match;
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
            // It's a valid date, return it (ensuring it's treated as UTC midnight)
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
    }
    return null;
};


export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [playerWinData, setPlayerWinData] = useState<PlayerWinData[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      router.replace('/login');
    } else {
      loadData();
      setIsMounted(true);
    }
  }, [router]);


  const loadData = () => {
    const allMatches = getMatches();
    setMatches(allMatches);

    const playerStats: { [key: string]: { wins: number } } = {};

    allMatches.forEach(match => {
      if (!playerStats[match.player1Name]) playerStats[match.player1Name] = { wins: 0 };
      if (!playerStats[match.player2Name]) playerStats[match.player2Name] = { wins: 0 };
      
      if (match.status === 'ended') {
          let p1Wins = 0;
          let p2Wins = 0;
          match.frames.forEach(frame => {
            if (frame.player1Score > frame.player2Score) p1Wins++;
            else if (frame.player2Score > frame.player1Score) p2Wins++;
          });

          if (p1Wins > p2Wins) {
            playerStats[match.player1Name].wins += 1;
          } else if (p2Wins > p1Wins) {
            playerStats[match.player2Name].wins += 1;
          }
      }
    });

    const winData = Object.keys(playerStats)
      .map(name => ({
        name,
        wins: playerStats[name].wins,
      }))
      .sort((a, b) => b.wins - a.wins);

    setPlayerWinData(winData);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadedFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setUploadedImagePreview(result);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleTranslateImage = async () => {
    if (!uploadedFile || !uploadedImagePreview) return;
    setIsTranslating(true);

    try {
      const result = await translateSnookerScoreFromImage({ photoDataUri: uploadedImagePreview });
      const newFrames: Frame[] = result.frames.map(f => ({
          player1Score: f.player1Score,
          player2Score: f.player2Score,
          tag: f.tag,
      }));
      
      const matchDate = parseDateFromFilename(uploadedFile.name) || new Date();

      const newMatch = createMatch(result.player1Name, result.player2Name, matchDate);
      
      const updatedMatch: Match = { 
        ...newMatch,
        player1TotalFoulPoints: result.player1TotalFoulPoints,
        player2TotalFoulPoints: result.player2TotalFoulPoints,
        frames: newFrames,
        status: 'ended', // Assume uploaded scoreboards are for ended matches
      };
      updateMatch(updatedMatch);

      toast({
        title: "Match Created!",
        description: `A new match between ${result.player1Name} and ${result.player2Name} has been created from the scoreboard.`
      });

      router.push(`/match/${updatedMatch.id}`);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "Translation Failed",
        description: "Could not extract scores from the image. Please try another photo."
      });
    } finally {
      setIsTranslating(false);
      setUploadedFile(null);
      setUploadedImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      document.getElementById('close-upload-dialog')?.click();
    }
  };

  const handleDeleteMatch = (id: string) => {
    deleteMatch(id);
    loadData();
    toast({
        title: "Match Deleted",
        description: "The match has been successfully removed."
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    router.replace('/login');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border p-2 rounded-md shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-primary">{`Wins: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header>
        <Button onClick={handleLogout} variant="ghost" size="sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </Header>
      <main className="p-4 md:p-8 page-transition">
        {playerWinData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Player Leaderboard</CardTitle>
              <CardDescription>An overview of player wins.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={playerWinData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--accent))'}}
                    content={<CustomTooltip />}
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
          <div className="flex gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline"><Camera className="mr-2 h-4 w-4" /> Upload Scoreboard</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Create Match from Scoreboard</DialogTitle>
                    <DialogDescription>
                        Upload a photo of a completed scoreboard, and AI will create the match for you.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} />
                        {uploadedImagePreview && <Image src={uploadedImagePreview} alt="Uploaded scoreboard" width={400} height={300} className="rounded-md object-contain mx-auto" data-ai-hint="scoreboard photo" />}
                    </div>
                    <DialogFooter>
                        <DialogClose id="close-upload-dialog" asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleTranslateImage} disabled={!uploadedImagePreview || isTranslating}>
                            {isTranslating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isTranslating ? 'Creating Match...' : 'Create Match'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button asChild>
              <Link href="/new-match">
                <Plus className="mr-2 h-4 w-4" />
                New Match
              </Link>
            </Button>
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {matches.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((match) => (
              <MatchCard key={match.id} match={match} onDelete={() => handleDeleteMatch(match.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium">No Matches Found</h3>
            <p className="text-muted-foreground mt-2 mb-4">Get started by creating a new match or uploading a scoreboard.</p>
            <Button asChild>
              <Link href="/new-match">Create Your First Match</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

    