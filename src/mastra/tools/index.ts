import { createTool } from '@mastra/core/tools';
import { createVectorQueryTool } from '@mastra/rag'; // For vectorQueryTool
import { openai } from '@ai-sdk/openai';         // For vectorQueryTool model
import { z } from 'zod';

interface InputParams {
  docUrl: string,
  query: string
}

export const docsTool = createTool({
  id: 'get-documentation',
  description: 'Get documentation from a URL and query its content',
  inputSchema: z.object({
    docUrl: z.string().describe('URL of the documentation page'),
    query: z.string().describe('Query string to search within the documentation'),
  }),
  outputSchema: z.object({
    snippets: z.array(z.string()).describe('Matching snippets from the documentation'),
    sourceUrl: z.string().describe('The URL from which the documentation was fetched'),
  }),
  // Corrected signature:
  // @ts-ignore
  execute: async (input: InputParams) => {
    return await fetchAndQueryDocumentation(input);
  },
});

// The rest of your file (fetchAndQueryDocumentation function and vectorQueryTool definition)
// should remain as we discussed previously (with the simplified return in fetchAndQueryDocumentation
// and the definition of vectorQueryTool).
// Make sure the fetchAndQueryDocumentation function is below this, and then vectorQueryTool.

const fetchAndQueryDocumentation = async (input: InputParams) => {
  try {
    const response = await fetch(input.docUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch documentation from ${input.docUrl}. Status: ${response.status}`);
    }
    let htmlContent = await response.text();

    let processedText = htmlContent.replace(/<\/(p|div|h[1-6]|li|tr|dt|dd)>/gi, '\n');
    processedText = processedText.replace(/<(p|div|h[1-6]|li|br|tr|dt|dd)\b[^>]*>/gi, '\n');
    processedText = processedText.replace(/<[^>]+>/g, ' ');
    processedText = processedText.replace(/(\n\s*)+/g, '\n');
    processedText = processedText.replace(/\s\s+/g, ' ');
    processedText = processedText.trim();

    const lines = processedText.split('\n');
    const matchingLines: string[] = [];
    const lowerCaseQuery = input.query.toLowerCase();

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.toLowerCase().includes(lowerCaseQuery)) {
        matchingLines.push(trimmedLine);
      }
    }

    console.log(`Tool query: '${input.query}' on URL: '${input.docUrl}'`);
    console.log(`Found ${matchingLines.length} matching lines. Snippets:`, matchingLines.slice(0, 5));

    return {
      snippets: matchingLines,
      sourceUrl: input.docUrl,
    };

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in fetchAndQueryDocumentation: ${error.message}`);
      throw new Error(`Could not process documentation from ${input.docUrl}: ${error.message}`);
    }
    console.error(`An unknown error occurred while processing documentation from ${input.docUrl}:`, error);
    throw new Error(`An unknown error occurred while processing documentation from ${input.docUrl}`);
  }
};

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: 'default', 
  indexName: 'docs_embeddings',  
  model: openai.embedding('text-embedding-ada-002'), 
});