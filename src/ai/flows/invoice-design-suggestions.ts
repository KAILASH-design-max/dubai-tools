'use server';

/**
 * @fileOverview Invoice design suggestion flow using Genkit.
 *
 * This file exports:
 * - `getInvoiceDesignSuggestions`: A function to get invoice design suggestions.
 * - `InvoiceDesignSuggestionsInput`: The input type for the `getInvoiceDesignSuggestions` function.
 * - `InvoiceDesignSuggestionsOutput`: The output type for the `getInvoiceDesignSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvoiceDesignSuggestionsInputSchema = z.object({
  invoiceLayoutDescription: z
    .string()
    .describe('A description of the current invoice layout and design.'),
});

export type InvoiceDesignSuggestionsInput = z.infer<
  typeof InvoiceDesignSuggestionsInputSchema
>;

const InvoiceDesignSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'A list of suggestions to improve the invoice design and layout.'
    ),
});

export type InvoiceDesignSuggestionsOutput = z.infer<
  typeof InvoiceDesignSuggestionsOutputSchema
>;

export async function getInvoiceDesignSuggestions(
  input: InvoiceDesignSuggestionsInput
): Promise<InvoiceDesignSuggestionsOutput> {
  return invoiceDesignSuggestionsFlow(input);
}

const invoiceDesignSuggestionsPrompt = ai.definePrompt({
  name: 'invoiceDesignSuggestionsPrompt',
  input: {schema: InvoiceDesignSuggestionsInputSchema},
  output: {schema: InvoiceDesignSuggestionsOutputSchema},
  prompt: `You are an expert in invoice design and user experience.

  Based on the description of the current invoice layout, provide a list of actionable suggestions to improve its visual appeal, information hierarchy, and overall effectiveness.

  Consider aspects like font choices, color schemes, spacing, readability, and the clear presentation of key information such as amounts, dates, and company details.

  Current Invoice Layout Description: {{{invoiceLayoutDescription}}}

  Suggestions (as a numbered list):
`, // Ensure output is a numbered list
});

const invoiceDesignSuggestionsFlow = ai.defineFlow(
  {
    name: 'invoiceDesignSuggestionsFlow',
    inputSchema: InvoiceDesignSuggestionsInputSchema,
    outputSchema: InvoiceDesignSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await invoiceDesignSuggestionsPrompt(input);
    return output!;
  }
);
