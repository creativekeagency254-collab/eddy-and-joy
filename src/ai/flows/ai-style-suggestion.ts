'use server';

/**
 * @fileOverview An AI tool that analyzes product images and suggests appropriate style matches based on current fashion trends.
 *
 * - suggestStyles - A function that handles the style suggestion process.
 * - SuggestStylesInput - The input type for the suggestStyles function.
 * - SuggestStylesOutput - The return type for the suggestStyles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStylesInputSchema = z.object({
  productPhotoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productDescription: z.string().describe('The description of the product.'),
});
export type SuggestStylesInput = z.infer<typeof SuggestStylesInputSchema>;

const SuggestStylesOutputSchema = z.object({
  styleSuggestion: z.string().describe('Suggested styles that match the product and current fashion trends.'),
  reasoning: z.string().describe('The reasoning behind the style suggestions.'),
});
export type SuggestStylesOutput = z.infer<typeof SuggestStylesOutputSchema>;

export async function suggestStyles(input: SuggestStylesInput): Promise<SuggestStylesOutput> {
  return suggestStylesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStylesPrompt',
  input: {schema: SuggestStylesInputSchema},
  output: {schema: SuggestStylesOutputSchema},
  prompt: `You are a fashion expert with extensive knowledge of current fashion trends. Your task is to analyze a product image and description and suggest appropriate style matches based on current fashion trends.

Consider the following product:

Description: {{{productDescription}}}
Photo: {{media url=productPhotoDataUri}}

Suggest styles that would match this product, explaining your reasoning. Focus on creating cohesive looks and merchandising effectively.

Output the style suggestion and the reasoning behind it. Make sure the suggestion is easily understood by a store admin who wants to create effective product displays and online listings.
`,
});

const suggestStylesFlow = ai.defineFlow(
  {
    name: 'suggestStylesFlow',
    inputSchema: SuggestStylesInputSchema,
    outputSchema: SuggestStylesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
