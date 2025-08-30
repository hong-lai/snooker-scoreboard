'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { MatchCard } from '@/components/match-card';
import type { Match, Frame } from '@/lib/types';
import { getMatches, createMatch, updateMatch, deleteMatch } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Plus, Camera, Loader2, Star, Circle, LogOut, Upload, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { translateSnookerScoreFromImage } from '@/ai/flows/translate-snooker-score-from-image';
import { format, parseISO } from 'date-fns';
import JSZip from 'jszip';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TooltipProps } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


interface PlayerWinData {
  name: string;
  wins: number;
}

interface MonthlyWinData {
    month: string;
    avgFrames: number;
    totalFrames: number;
}

interface PlayerScoreByMonthData {
  month: string;
  [key: string]: any; // Player names as keys
}

type TimePeriod = 'month' | 'year';

const parseDateFromFilename = (filename: string): Date | null => {
    const regex = /(\d{4})[-_]?(\d{2})[-_]?(\d{2})/;
    const match = filename.match(regex);
    if (match) {
        const [, year, month, day] = match;
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
    }
    return null;
};

const reduceImageSize = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.width / img.height;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        width = maxWidth;
        height = maxWidth / ratio;
      }
      
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

const playerColors = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [playerWinData, setPlayerWinData] = useState<PlayerWinData[]>([]);
  const [monthlyMatchData, setMonthlyMatchData] = useState<MonthlyWinData[]>([]);
  const [playerScoreByMonthData, setPlayerScoreByMonthData] = useState<PlayerScoreByMonthData[]>([]);
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const loadData = useCallback(async (period: TimePeriod) => {
    if (!user) return;
    setIsLoading(true);
    const allMatches = await getMatches(user.uid);
    setMatches(allMatches);

    const playerStats: { [key: string]: { wins: number } } = {};
    const periodStats: { [key: string]: { totalFrames: number, matchCount: number } } = {};
    const periodPlayerScores: { 
        [key: string]: { 
            [player: string]: { totalScore: number, frameCount: number } 
        } 
    } = {};

    const players = new Set<string>();
    const timeFormat = period === 'month' ? 'yyyy-MM' : 'yyyy';
    const displayFormat = period === 'month' ? 'MMM yyyy' : 'yyyy';

    allMatches.forEach(match => {
      const matchDate = parseISO(match.createdAt);
      const periodKey = format(matchDate, timeFormat);
      
      players.add(match.player1Name);
      players.add(match.player2Name);

      if (!periodPlayerScores[periodKey]) {
        periodPlayerScores[periodKey] = {};
      }
      
      if (!periodStats[periodKey]) {
          periodStats[periodKey] = { totalFrames: 0, matchCount: 0 };
      }
      
      if (match.status === 'ended') {
          periodStats[periodKey].matchCount++;
      }
      periodStats[periodKey].totalFrames += match.frames.length;

      if (!playerStats[match.player1Name]) playerStats[match.player1Name] = { wins: 0 };
      if (!playerStats[match.player2Name]) playerStats[match.player2Name] = { wins: 0 };
      
      match.frames.forEach(frame => {
          if (!periodPlayerScores[periodKey][match.player1Name]) {
            periodPlayerScores[periodKey][match.player1Name] = { totalScore: 0, frameCount: 0 };
          }
          if (!periodPlayerScores[periodKey][match.player2Name]) {
            periodPlayerScores[periodKey][match.player2Name] = { totalScore: 0, frameCount: 0 };
          }

          periodPlayerScores[periodKey][match.player1Name].totalScore += frame.player1Score;
          periodPlayerScores[periodKey][match.player1Name].frameCount++;

          periodPlayerScores[periodKey][match.player2Name].totalScore += frame.player2Score;
          periodPlayerScores[periodKey][match.player2Name].frameCount++;
      });

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
    
    const uniquePlayers = Array.from(players);
    setAllPlayers(uniquePlayers);

    const winData = Object.keys(playerStats)
      .map(name => ({
        name,
        wins: playerStats[name].wins,
      }))
      .sort((a, b) => b.wins - a.wins);
      
    const monthlyData = Object.keys(periodStats)
      .map(month => ({
        month: format(parseISO(month), displayFormat),
        avgFrames: periodStats[month].matchCount > 0 ? parseFloat((periodStats[month].totalFrames / periodStats[month].matchCount).toFixed(1)) : 0,
        totalFrames: periodStats[month].totalFrames,
      }))
      .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    
    const scoreData = Object.keys(periodPlayerScores)
        .map(month => {
            const record: PlayerScoreByMonthData = { month: format(parseISO(month), displayFormat) };
            uniquePlayers.forEach(player => {
                const playerData = periodPlayerScores[month][player];
                if (playerData && playerData.frameCount > 0) {
                    record[player] = parseFloat((playerData.totalScore / playerData.frameCount).toFixed(1));
                } else {
                    record[player] = 0;
                }
            });
            return record;
        })
        .sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    setPlayerWinData(winData);
    setMonthlyMatchData(monthlyData);
    setPlayerScoreByMonthData(scoreData);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      loadData(timePeriod);
    }
  }, [user, timePeriod, loadData]);

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

  const processAndCreateMatch = async (photoDataUri: string, fileName: string) => {
    if (!user) throw new Error("User not authenticated.");

    const result = await translateSnookerScoreFromImage({ photoDataUri });
    const newFrames: Frame[] = result.frames.map(f => ({
        player1Score: f.player1Score,
        player2Score: f.player2Score,
        tag: f.tag,
    }));
    
    const matchDate = parseDateFromFilename(fileName) || new Date();

    const newMatch = await createMatch(user.uid, result.player1Name, result.player2Name, matchDate);
    
    const reducedImage = await reduceImageSize(photoDataUri);
    
    const updatedMatch: Match = { 
      ...newMatch,
      player1TotalFoulPoints: result.player1TotalFoulPoints,
      player2TotalFoulPoints: result.player2TotalFoulPoints,
      frames: newFrames,
      status: 'ended', // Assume uploaded scoreboards are for ended matches
      scoreboardImage: reducedImage,
    };
    await updateMatch(user.uid, updatedMatch);
    return updatedMatch;
  };

  const handleTranslateImage = async () => {
    if (!uploadedFile || !uploadedImagePreview || !user) return;
    setIsTranslating(true);

    try {
      const newMatch = await processAndCreateMatch(uploadedImagePreview, uploadedFile.name);

      toast({
        title: "Match Created!",
        description: `A new match between ${newMatch.player1Name} and ${newMatch.player2Name} has been created.`
      });

      router.push(`/match/${newMatch.id}`);

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
      loadData(timePeriod);
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file || !file.name.endsWith('.zip')) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please upload a .zip file.',
      });
      return;
    }

    setIsTranslating(true);
    const { dismiss } = toast({
      title: 'Processing Batch Upload...',
      description: 'Please wait while we extract and create your matches.',
    });

    try {
      const zip = await JSZip.loadAsync(file);
      const imageFiles = Object.values(zip.files).filter(
        (f) => !f.dir && /\.(jpe?g|png|gif|webp)$/i.test(f.name)
      );

      let createdCount = 0;
      for (const imageFile of imageFiles) {
        try {
          const content = await imageFile.async('base64');
          const mimeType = `image/${imageFile.name.split('.').pop()}`;
          const dataUri = `data:${mimeType};base64,${content}`;
          await processAndCreateMatch(dataUri, imageFile.name);
          createdCount++;
        } catch (err) {
            console.error(`Failed to process ${imageFile.name}:`, err)
        }
      }

       toast({
        title: 'Batch Upload Complete',
        description: `Successfully created ${createdCount} out of ${imageFiles.length} matches.`,
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Batch Upload Failed',
        description: 'There was an error processing the zip file.',
      });
    } finally {
      setIsTranslating(false);
      if (batchInputRef.current) batchInputRef.current.value = '';
      dismiss();
      loadData(timePeriod);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!user) return;
    try {
        await deleteMatch(user.uid, id);
        loadData(timePeriod);
        toast({
            title: "Match Deleted",
            description: "The match has been successfully removed."
        });
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the match.",
        });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'There was an issue signing out. Please try again.',
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border p-3 rounded-md shadow-lg text-sm">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color }} className="flex justify-between gap-4">
              <span>{p.name}:</span>
              <span className="font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const hasData = matches.length > 0;
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-background">
      <Header>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                         <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">My Account</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </Header>
      <main className="p-4 md:p-8 page-transition">
        {hasData && (
          <Tabs defaultValue="wins" className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
                <TabsList className="h-auto flex-wrap sm:flex-nowrap sm:overflow-x-auto sm:whitespace-nowrap">
                    <TabsTrigger value="wins">Player Rankings</TabsTrigger>
                    <TabsTrigger value="timeline">Match Timeline</TabsTrigger>
                    <TabsTrigger value="activity">Match Activity</TabsTrigger>
                    <TabsTrigger value="scores">Player Performance</TabsTrigger>
                </TabsList>
                 <div className="flex items-center space-x-2 sm:ml-auto">
                    <Label htmlFor="time-period-switch">Year</Label>
                    <Switch
                        id="time-period-switch"
                        checked={timePeriod === 'month'}
                        onCheckedChange={(checked) => setTimePeriod(checked ? 'month' : 'year')}
                    />
                    <Label htmlFor="time-period-switch">Month</Label>
                 </div>
            </div>
            <TabsContent value="wins">
              <Card>
                  <CardHeader>
                  <CardTitle>Player Rankings</CardTitle>
                  <CardDescription>Total number of frames won by each player across all matches.</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={playerWinData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                      <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
                      <Tooltip
                          cursor={{ fill: 'transparent' }}
                          content={<CustomTooltip />}
                      />
                      <Legend />
                      <Bar dataKey="wins" fill="hsl(var(--primary))" name="Frames Won" />
                      </BarChart>
                  </ResponsiveContainer>
                  </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="timeline">
              <Card>
                  <CardHeader>
                      <CardTitle>Match Timeline</CardTitle>
                      <CardDescription>Average frames played per match each {timePeriod}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyMatchData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                              <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
                              <Tooltip
                                  cursor={{ fill: 'transparent' }}
                                  content={<CustomTooltip />}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="avgFrames" stroke="hsl(var(--primary))" name="Avg. Frames / Match" />
                          </LineChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                  <CardHeader>
                      <CardTitle>Match Activity</CardTitle>
                      <CardDescription>Total frames played per {timePeriod}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={monthlyMatchData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                              <YAxis stroke="hsl(var(--foreground))" allowDecimals={false} />
                              <Tooltip
                                  cursor={{ fill: 'transparent' }}
                                  content={<CustomTooltip />}
                              />
                              <Legend />
                              <Bar dataKey="totalFrames" fill="hsl(var(--primary))" name="Total Frames" />
                          </BarChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="scores">
              <Card>
                  <CardHeader>
                      <CardTitle>Player Performance Timeline</CardTitle>
                      <CardDescription>Average points scored per frame by each player per {timePeriod}.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={playerScoreByMonthData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="month" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
                              <YAxis stroke="hsl(var(--foreground))" />
                              <Tooltip
                                  cursor={{ fill: 'transparent' }}
                                  content={<CustomTooltip />}
                              />
                              <Legend />
                              {allPlayers.map((player, index) => (
                                <Line key={player} type="monotone" dataKey={player} stroke={playerColors[index % playerColors.length]} name={player} />
                              ))}
                          </LineChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}


        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">Match History</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full"><Camera className="mr-2 h-4 w-4" /> Upload Scoreboard</Button>
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
                            {isTranslating ? 'Creating...' : 'Create Match'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Button asChild className="w-full">
              <Link href="/new-match">
                <Plus className="mr-2 h-4 w-4" />
                New Match
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Loading matches...</p>
          </div>
        ) : hasData ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onDelete={() => handleDeleteMatch(match.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium">No Matches Found</h3>
            <p className="text-muted-foreground mt-2 mb-4">Get started by creating your first match or uploading scoreboards.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/new-match">Create Your First Match</Link>
              </Button>
              <Button variant="outline" onClick={() => batchInputRef.current?.click()} disabled={isTranslating}>
                {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" /> }
                Batch Upload
              </Button>
              <input 
                type="file" 
                accept=".zip" 
                ref={batchInputRef} 
                onChange={handleBatchUpload}
                className="hidden"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
