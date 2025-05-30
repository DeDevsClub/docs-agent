import { createTool, ToolExecutionContext, Tool } from '@mastra/core/tools';
import { createVectorQueryTool } from '@mastra/rag'; // For vectorQueryTool
import { openai } from '@ai-sdk/openai';         // For vectorQueryTool model
import { z } from 'zod';

// Define schemas separately
const docsToolInputSchema = z.object({
  query: z.string().describe('Query string to search within the documentation'),
  docUrl: z.string().describe('URL of the documentation page').optional(),
});

const docsToolOutputSchema = z.object({
  snippets: z.array(z.string()).describe('Matching snippets from the documentation'),
  sourceUrl: z.string().describe('The URL from which the documentation was fetched'),
});
interface ContextProps {
  input: z.infer<typeof docsToolInputSchema>;
}
export const docsTool = createTool({
  id: 'get-documentation',
  description: 'Get documentation from a URL and query its content',
    inputSchema: docsToolInputSchema,
  outputSchema: docsToolOutputSchema,
  // Corrected signature:
  execute: async (input: ToolExecutionContext<typeof docsToolInputSchema>) => {
    // <<<< IMPORTANT: Replace this with your actual documentation fetching and querying logic >>>>
    console.log(`Executing docsTool with input:`, input.context.query);
    if (!input.context.docUrl) {
      // This is a temporary measure. The tool needs a URL.
      // Or, the agent needs to provide a default if not given.
      // Consider making docUrl non-optional if it's always required for the core logic.
      throw new Error("docUrl is required for the docsTool to function.");
    }
    // Example placeholder logic:
    const fetchedSnippets = [`Snippet for '${input.context.query}' from ${input.context.docUrl}`];
    return {
      snippets: fetchedSnippets,
      sourceUrl: input.context.docUrl,
    };
    // <<<< END IMPORTANT >>>>
  },
});

export const vectorQueryTool = createVectorQueryTool({
  model: openai.embedding('text-embedding-ada-002'),
  indexName: 'docs_embeddings',
  vectorStoreName: 'default',
});