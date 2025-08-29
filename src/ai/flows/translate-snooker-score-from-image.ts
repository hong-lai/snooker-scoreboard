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
  player1Name: z.string().describe("The name of player 1. In the image, this is 'L'."),
  player2Name: z.string().describe("The name of player 2. In the image, this is 'Y'."),
  player1TotalFoulPoints: z.number().describe("The total foul points for player 1. In the image, this is the number below the player's final score."),
  player2TotalFoulPoints: z.number().describe("The total foul points for player 2. In the image, this is the number below the player's final score."),
  frames: z.array(
    z.object({
      frameNumber: z.number().describe("The number of the frame."),
      player1Score: z.number().describe("Player 1's score for the frame."),
      player2Score: z.number().describe("Player 2's score for the frame."),
      tag: z.string().optional().describe("A special tag (like a star, checkmark, or circle/dot) associated with the frame, if any."),
    })
  ).describe("Array of frame scores for each player, and any associated tags, ordered by frame number."),
});
export type TranslateSnookerScoreFromImageOutput = z.infer<typeof TranslateSnookerScoreFromImageOutputSchema>;

export async function translateSnookerScoreFromImage(
  input: TranslateSnookerScoreFromImageInput
): Promise<TranslateSnookerScoreFromImageOutput> {
  const result = await translateSnookerScoreFromImageFlow(input);
  // Sort frames by frameNumber before returning
  result.frames.sort((a, b) => a.frameNumber - b.frameNumber);
  return result;
}

const prompt = ai.definePrompt({
  name: 'translateSnookerScoreFromImagePrompt',
  input: {schema: TranslateSnookerScoreFromImageInputSchema},
  output: {schema: TranslateSnookerScoreFromImageOutputSchema},
  prompt: `You are an AI expert at extracting snooker scores from images of scoreboards.

  Given an image of a snooker scoreboard, extract the following information:
  - Player 1's Name is 'L'.
  - Player 2's Name is 'Y'.
  - Each frame is numbered with a circled number (e.g., ①, ②). The frame number must be extracted. The order of frames in the output JSON does not matter.
  - The frame scores are in the format 'L-Y'. For example, '43-24' means L scored 43 and Y scored 24 for that frame.
  - Identify any special symbol or 'tag' (like a star '☆' or a dot '•') next to a frame score.
  - Extract the total foul points for each player. This is the negative number under the player's name (e.g., -99 for L). The output should be a positive number.

  The final scores (e.g., 85 and 65) should be ignored as they will be auto-calculated. Other text is irrelevant.

  Return the data in JSON format. The frames array should contain all frames found.

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
