'use server';
/**
 * @fileOverview Verifies snooker score entries based on official rules.
 *
 * - verifySnookerScoreEntry - A function that verifies a snooker score entry.
 * - VerifySnookerScoreEntryInput - The input type for the verifySnookerScoreEntry function.
 * - VerifySnookerScoreEntryOutput - The return type for the verifySnookerScoreEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifySnookerScoreEntryInputSchema = z.object({
  player1Score: z.number().describe('Player 1 score for the frame.'),
  player2Score: z.number().describe('Player 2 score for the frame.'),
});
export type VerifySnookerScoreEntryInput = z.infer<
  typeof VerifySnookerScoreEntryInputSchema
>;

const VerifySnookerScoreEntryOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the score entry is valid or not.'),
  warningMessage: z
    .string()
    .describe('A warning message if the score entry is invalid.')
    .optional(),
});
export type VerifySnookerScoreEntryOutput = z.infer<
  typeof VerifySnookerScoreEntryOutputSchema
>;

export async function verifySnookerScoreEntry(
  input: VerifySnookerScoreEntryInput
): Promise<VerifySnookerScoreEntryOutput> {
  return verifySnookerScoreEntryFlow(input);
}

const verifySnookerScoreEntryPrompt = ai.definePrompt({
  name: 'verifySnookerScoreEntryPrompt',
  input: {schema: VerifySnookerScoreEntryInputSchema},
  output: {schema: VerifySnookerScoreEntryOutputSchema},
  prompt: `You are an expert snooker referee. You will be given a score entry for a single frame of snooker and your task is to verify whether the score entry is valid based on the official rules of snooker.

  If the score entry is invalid, you should provide a warning message explaining why the score entry is invalid.

  Here is the score entry:

  Player 1 Score: {{{player1Score}}}
  Player 2 Score: {{{player2Score}}}

  Considerations:
  - The maximum break in snooker is 147.
  - Standard snooker rules apply.
  - If a player's score is more than 147, it is likely an invalid score.

  Output should be in JSON format.
  `,
});

const verifySnookerScoreEntryFlow = ai.defineFlow(
  {
    name: 'verifySnookerScoreEntryFlow',
    inputSchema: VerifySnookerScoreEntryInputSchema,
    outputSchema: VerifySnookerScoreEntryOutputSchema,
  },
  async input => {
    const {output} = await verifySnookerScoreEntryPrompt(input);
    return output!;
  }
);
