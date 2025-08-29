'use server';
/**
 * @fileOverview This file defines a Genkit flow to translate snooker score from an image.
 *
 * - translateSnookerScoreFromImage - A function that translates snooker score from an image.
 * - TranslateSnookerScoreFromImageInput - The input type for the translateSnookerScoreFromImage function.
 * - TranslateSnookerScoreFromImageOutput - The return type for the translateSnookerScoreFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateSnookerScoreFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a snooker scoreboard, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type TranslateSnookerScoreFromImageInput = z.infer<typeof TranslateSnookerScoreFromImageInputSchema>;

const TranslateSnookerScoreFromImageOutputSchema = z.object({
  player1Name: z.string().describe('The name of player 1.'),
  player2Name: z.string().describe('The name of player 2.'),
  frames: z.array(
    z.object({
      player1Score: z.number().describe('Player 1 score for the frame.'),
      player1FoulPoints: z.number().describe('Player 1 foul points for the frame.'),
      player2Score: z.number().describe('Player 2 score for the frame.'),
      player2FoulPoints: z.number().describe('Player 2 foul points for the frame.'),
    })
  ).describe('Array of frame scores and foul points for each player.'),
  finalResult: z.string().describe('The final result of the match in the format "Player 1 : Player 2".'),
});
export type TranslateSnookerScoreFromImageOutput = z.infer<typeof TranslateSnookerScoreFromImageOutputSchema>;

export async function translateSnookerScoreFromImage(
  input: TranslateSnookerScoreFromImageInput
): Promise<TranslateSnookerScoreFromImageOutput> {
  return translateSnookerScoreFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateSnookerScoreFromImagePrompt',
  input: {schema: TranslateSnookerScoreFromImageInputSchema},
  output: {schema: TranslateSnookerScoreFromImageOutputSchema},
  prompt: `You are an AI expert at extracting snooker scores from images of scoreboards.

  Given an image of a snooker scoreboard, extract the following information:
  - Player 1's Name
  - Player 2's Name
  - For each frame, extract Player 1's score, Player 1's foul points, Player 2's score, and Player 2's foul points.
  - Extract the final result of the match.

  Return the data in JSON format.

  Here is the image of the snooker scoreboard: {{media url=photoDataUri}}
  `,
});

const translateSnookerScoreFromImageFlow = ai.defineFlow(
  {
    name: 'translateSnookerScoreFromImageFlow',
    inputSchema: TranslateSnookerScoreFromImageInputSchema,
    outputSchema: TranslateSnookerScoreFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
