'use server';
/**
 * @fileOverview Exports all match data for a user to a CSV file.
 *
 * - exportMatchesToCsv - A function that takes a userId and returns CSV data.
 * - ExportMatchesToCsvInput - The input type for the exportMatchesToCsv function.
 * - ExportMatchesToCsvOutput - The return type for the exportMatchesToCsv function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAllMatchesWithDetails } from '@/lib/store';
import type { Match } from '@/lib/types';
import { unparse } from 'papaparse';

const ExportMatchesToCsvInputSchema = z.object({
  userId: z.string().describe('The ID of the user whose matches to export.'),
});
export type ExportMatchesToCsvInput = z.infer<typeof ExportMatchesToCsvInputSchema>;

const ExportMatchesToCsvOutputSchema = z.object({
  csvData: z.string().describe('The match data formatted as a CSV string.'),
});
export type ExportMatchesToCsvOutput = z.infer<typeof ExportMatchesToCsvOutputSchema>;

export async function exportMatchesToCsv(input: ExportMatchesToCsvInput): Promise<ExportMatchesToCsvOutput> {
  return exportMatchesToCsvFlow(input);
}

const exportMatchesToCsvFlow = ai.defineFlow(
  {
    name: 'exportMatchesToCsvFlow',
    inputSchema: ExportMatchesToCsvInputSchema,
    outputSchema: ExportMatchesToCsvOutputSchema,
  },
  async (input) => {
    const matches: Match[] = await getAllMatchesWithDetails(input.userId);
    
    if (matches.length === 0) {
      return { csvData: '' };
    }

    const flattenedData = matches.flatMap(match => 
        (match.frames && Array.isArray(match.frames)) ? match.frames.map((frame, index) => ({
            match_id: match.id,
            date: match.createdAt,
            player1_name: match.player1Name,
            player2_name: match.player2Name,
            frame_number: index + 1,
            player1_score: frame.player1Score,
            player2_score: frame.player2Score,
            tag: frame.tag || '',
            player1_total_foul_points: match.player1TotalFoulPoints,
            player2_total_foul_points: match.player2TotalFoulPoints,
            status: match.status,
        })) : []
    );

    if (flattenedData.length === 0) {
      return { csvData: '' };
    }

    const csvData = unparse(flattenedData, { header: true });

    return { csvData };
  }
);
