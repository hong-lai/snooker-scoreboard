'use server';
/**
 * @fileOverview A flow to convert an image to JPEG format.
 *
 * - convertImageToJpeg - A function that takes an image data URI and returns a JPEG data URI.
 * - ConvertImageToJpegInput - The input type for the convertImageToJpeg function.
 * - ConvertImageToJpegOutput - The return type for the convertImageToJpeg function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConvertImageToJpegInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ConvertImageToJpegInput = z.infer<typeof ConvertImageToJpegInputSchema>;

const ConvertImageToJpegOutputSchema = z.object({
    jpegDataUri: z.string().describe("The image converted to a JPEG data URI.")
});
export type ConvertImageToJpegOutput = z.infer<typeof ConvertImageToJpegOutputSchema>;


export async function convertImageToJpeg(
  input: ConvertImageToJpegInput
): Promise<ConvertImageToJpegOutput> {
  return convertImageToJpegFlow(input);
}

const convertImageToJpegFlow = ai.defineFlow(
  {
    name: 'convertImageToJpegFlow',
    inputSchema: ConvertImageToJpegInputSchema,
    outputSchema: ConvertImageToJpegOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
        prompt: [{ media: { url: input.photoDataUri } }],
        model: 'googleai/gemini-pro-vision'
    });

    if (!media) {
      throw new Error('Image conversion failed: No media returned from the model.');
    }
    
    // The model automatically converts the image to JPEG when processing it.
    // We can just return the data URI it provides.
    return { jpegDataUri: media.url };
  }
);
