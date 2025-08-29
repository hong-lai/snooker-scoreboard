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
      frameNumber: z.number().describe("The number of the frame, which is inside a circle."),
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
  // Sort frames by frameNumber before returning to guarantee order.
  result.frames.sort((a, b) => a.frameNumber - b.frameNumber);
  return result;
}

const prompt = ai.definePrompt({
  name: 'translateSnookerScoreFromImagePrompt',
  input: {schema: TranslateSnookerScoreFromImageInputSchema},
  output: {schema: TranslateSnookerScoreFromImageOutputSchema},
  prompt: `You are an AI expert at extracting snooker scores from images of handwritten scoreboards. Your task is to extract the data with perfect accuracy.

  **CRITICAL RULE:** The physical, top-to-bottom order of the rows in the image is completely irrelevant. You **MUST** use the number inside the circle (e.g., ①, ⑩) on each line as the one and only identifier for the 'frameNumber'. If you process the rows from top to bottom, you will fail. You must identify the circled number for each row and use that for the frame number.

  **Step-by-step extraction process:**
  1.  **Identify All Frame Rows:** Look at every row that contains a score.
  2.  **For EACH row, find the circled number first.** This is the 'frameNumber'. For example, a row with ⑩ means 'frameNumber: 10'. A row with ① means 'frameNumber: 1'.
  3.  **Extract Player Scores:** For that same row, find the score in the 'L-Y' format. Be very careful reading the handwritten digits. '43-24' means 'player1Score: 43' and 'player2Score: 24'.
  4.  **Extract Tag:** Look for any symbol like a star '☆' or a dot '•' on that row. This is the 'tag'.
  5.  **Assemble Frame Object:** Create a JSON object for that frame, e.g., { "frameNumber": 10, "player1Score": 10, "player2Score": 46, "tag": "☆" }.
  6.  **Repeat for ALL rows.** You must find all rows with scores.
  7.  **Extract Player Names:** Player 1 is 'L'. Player 2 is 'Y'.
  8.  **Extract Foul Points:** Find the total foul points for each player. This is the negative number below the player's name (e.g., -78 for L). The output value must be a positive number.
  9.  **Ignore Other Text:** The large final scores (like 85 and 65) and any other text are irrelevant and MUST BE IGNORED. Only extract the data specified.

  You must return a JSON object containing the player data and an array of frame objects. The array must contain every single frame found in the image.

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
