'use client';
import { useState } from 'react';
import type { Match, Frame } from '@/lib/types';
import { updateMatch } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { verifySnookerScoreEntry } from '@/ai/flows/verify-snooker-score-entry';
import { Loader2, Save, Trophy, Star } from 'lucide-react';

interface MatchBoardProps {
  initialMatch: Match;
  onUpdate: () => void;
}

export function MatchBoard({ initialMatch, onUpdate }: MatchBoardProps) {
  const [match, setMatch] = useState(initialMatch);
  const [newFrame, setNewFrame] = useState({ p1Score: '', p2Score: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isEndingMatch, setIsEndingMatch] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) { // Only allow numbers
      setNewFrame(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveFrame = async () => {
    setIsSaving(true);
    const p1s = parseInt(newFrame.p1Score) || 0;
    const p2s = parseInt(newFrame.p2Score) || 0;

    const verificationResult = await verifySnookerScoreEntry({
      player1Score: p1s,
      player2Score: p2s,
    });

    if (!verificationResult.isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid Score Entry',
        description: <p className="font-code">{verificationResult.warningMessage}</p>,
      });
      setIsSaving(false);
      return;
    }

    const frame: Frame = {
      player1Score: p1s,
      player2Score: p2s,
    };

    const updatedMatch = { ...match, frames: [...match.frames, frame] };
    updateMatch(updatedMatch);
    setMatch(updatedMatch);
    setNewFrame({ p1Score: '', p2Score: '' });
    onUpdate();
    setIsSaving(false);
  };

  const handleEndMatch = () => {
    setIsEndingMatch(true);
    const updatedMatch = { ...match, status: 'ended' as const };
    updateMatch(updatedMatch);
    setMatch(updatedMatch);
    onUpdate();
    setIsEndingMatch(false);
  };

  let p1Wins = 0;
  let p2Wins = 0;
  match.frames.forEach(frame => {
    if (frame.player1Score > frame.player2Score) p1Wins++;
    else if (frame.player2Score > frame.player1Score) p2Wins++;
  });

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-between items-start relative">
            <div className="flex-1 text-center">
                <CardTitle className="flex items-center justify-center gap-3">
                  <span className="text-2xl md:text-3xl font-bold truncate">{match.player1Name}</span>
                  <span className="text-xl md:text-2xl text-muted-foreground">vs</span>
                  <span className="text-2xl md:text-3xl font-bold truncate">{match.player2Name}</span>
                </CardTitle>
                <div className="text-3xl md:text-4xl font-bold text-primary mt-2">{p1Wins} - {p2Wins}</div>
            </div>
            {match.status === 'ended' && (
                <div className="flex items-center gap-2 text-accent-foreground font-bold p-2 bg-accent rounded-lg absolute top-0 right-0">
                    <Trophy className="h-6 w-6" />
                    <span>Match Ended</span>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of all frames in the match.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">Frame</TableHead>
              <TableHead colSpan={3} className="text-center w-full">{match.player1Name} vs {match.player2Name}</TableHead>
              <TableHead className="w-[50px] text-center">Tag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {match.frames.map((frame, index) => (
              <TableRow key={index} className={frame.player1Score > frame.player2Score ? 'bg-primary/5' : frame.player2Score > frame.player1Score ? 'bg-accent/5' : ''}>
                <TableCell className="font-medium text-center">{index + 1}</TableCell>
                <TableCell className="text-right">
                  <span className={frame.player1Score > frame.player2Score ? 'font-bold' : ''}>{frame.player1Score}</span>
                </TableCell>
                <TableCell className="text-center w-[20px]">-</TableCell>
                <TableCell className="text-left">
                  <span className={frame.player2Score > frame.player1Score ? 'font-bold' : ''}>{frame.player2Score}</span>
                </TableCell>
                <TableCell className="text-center">
                  {frame.tag && <Star className="h-4 w-4 text-yellow-500" title={frame.tag} />}
                </TableCell>
              </TableRow>
            ))}
            {match.status === 'playing' && (
              <TableRow>
                <TableCell className="font-medium text-center">{match.frames.length + 1}</TableCell>
                <TableCell className="text-right" colSpan={3}>
                  <div className="flex items-center justify-center gap-1">
                    <Input name="p1Score" value={newFrame.p1Score} onChange={handleInputChange} className="w-24 h-8 text-right" placeholder="Player 1 Score"/>
                    <span className="mx-2">vs</span>
                    <Input name="p2Score" value={newFrame.p2Score} onChange={handleInputChange} className="w-24 h-8" placeholder="Player 2 Score"/>
                  </div>
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {match.status === 'playing' && (
        <CardFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleSaveFrame} disabled={isSaving || (!newFrame.p1Score && !newFrame.p2Score)} className="w-full sm:w-auto">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Frame
            </Button>
            <Button onClick={handleEndMatch} variant="destructive" disabled={isEndingMatch} className="w-full sm:w-auto sm:ml-auto">
                {isEndingMatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                End Match
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
