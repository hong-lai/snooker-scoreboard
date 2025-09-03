'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Download, Star, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Match, Frame } from '@/lib/types';
import { getAllMatchesWithDetails } from '@/lib/store';
import { exportMatchesToCsv } from '@/ai/flows/export-matches-to-csv';
import { format, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';

interface FlatFrameData {
  matchId: string;
  date: string;
  player1Name: string;
  player2Name: string;
  frameNumber: number;
  player1Score: number;
  player2Score: number;
  tag: Frame['tag'];
}

export default function AllDataPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      const loadData = async () => {
        setIsLoading(true);
        const allMatches = await getAllMatchesWithDetails(user.uid);
        setMatches(allMatches);
        setIsLoading(false);
      };
      loadData();
    }
  }, [user, authLoading, router]);

  const flatData = useMemo(() => {
    const data: FlatFrameData[] = [];
    matches.forEach(match => {
      match.frames.forEach((frame, index) => {
        data.push({
          matchId: match.id,
          date: format(parseISO(match.createdAt), 'yyyy-MM-dd'),
          player1Name: match.player1Name,
          player2Name: match.player2Name,
          frameNumber: index + 1,
          player1Score: frame.player1Score,
          player2Score: frame.player2Score,
          tag: frame.tag,
        });
      });
    });
    return data;
  }, [matches]);

  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const { csvData } = await exportMatchesToCsv({ userId: user.uid });
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `snooker_scores_export_${new Date().toISOString().split('T')[0]}.csv`);
        toast({
          title: 'Export Successful',
          description: 'Your match data has been downloaded.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: 'No data available to export.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Export Error',
        description: 'An error occurred while exporting your data.',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const TagIcon = ({ tag }: { tag?: Frame['tag'] }) => {
    if (!tag) return null;

    if (tag === 'star') {
        return <Star className="h-4 w-4 text-yellow-500 inline-block" title="Star Frame" />;
    }
    if (tag === 'dot') {
        return <Circle className="h-3 w-3 text-blue-500 fill-current inline-block" title="Dot Frame" />;
    }
    return null;
  }

  if (authLoading || isLoading) {
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">All Match Data</h1>
                <p className="text-muted-foreground">A detailed breakdown of every frame recorded.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                 <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isExporting ? 'Exporting...' : 'Export to CSV'}
                </Button>
            </div>
        </div>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead className="text-center">Frame</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-center">Tag</TableHead>
                            <TableHead className="text-right">Match</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flatData.length > 0 ? (
                            flatData.map((row, index) => (
                                <TableRow key={`${row.matchId}-${row.frameNumber}-${index}`}>
                                    <TableCell>{row.date}</TableCell>
                                    <TableCell>
                                        <span className={row.player1Score > row.player2Score ? 'font-bold' : ''}>{row.player1Name}</span>
                                        <span className="text-muted-foreground mx-2">vs</span>
                                        <span className={row.player2Score > row.player1Score ? 'font-bold' : ''}>{row.player2Name}</span>
                                    </TableCell>
                                    <TableCell className="text-center">{row.frameNumber}</TableCell>
                                    <TableCell className="text-right font-code">
                                        {row.player1Score} - {row.player2Score}
                                    </TableCell>
                                    <TableCell className="text-center"><TagIcon tag={row.tag} /></TableCell>
                                    <TableCell className="text-right">
                                         <Button asChild variant="ghost" size="sm" className="h-auto px-2 py-1">
                                            <Link href={`/match/${row.matchId}`}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No match data found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
