import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { docsAgent } from '../agents';
import { docsTool } from '../tools';

const llm = openai(process.env.MODEL ?? "gpt-4o");

// const agent = new Agent({
//   name: "Docs Agent",
//   instructions: `You are a helpful documentation assistant that analyzes documentation and technical documents.
//     Use the provided vector query tool to find relevant information from your knowledge base, 
//     and provide accurate, well-supported answers based on the retrieved content.
//     Focus on the specific content available in the tool and acknowledge if you cannot find sufficient information to answer a question.
//     Base your responses only on the content provided, not on general knowledge.`,
//   model: llm,
// });

const responseSchema = z.object({
  snippets: z.array(z.string()).describe('Matching snippets from the documentation'),
  sourceUrl: z.string().describe('The URL from which the documentation was fetched'),
});

const step = createStep({
  id: 'documentation-query-step',
  description: 'Fetches documentation from a URL and queries its content using an agent and docsTool.',
  inputSchema: z.object({
    url: z.string().describe('URL of the documentation page'),
    query: z.string().describe('Query string to search within the documentation'),
  }),
  outputSchema: responseSchema,
  execute: async ({ inputData }) => {
    // Construct a clear prompt for the agent, including both URL and query.
    // This guides the agent to use the docsTool with the correct parameters.
    const agentPrompt = `Use the docsTool to fetch documentation from the URL "${inputData.url}" and find information related to the query: "${inputData.query}".`;

    const agentGenerationResult = await docsAgent.generate(agentPrompt);

    // Process the agent's result to extract docsTool output
    if (agentGenerationResult.toolResults && agentGenerationResult.toolResults.length > 0) {
      const toolCallResult = agentGenerationResult.toolResults[0]; // Assuming docsTool is the first/only tool

      if (toolCallResult.toolName === 'docsTool' && toolCallResult.result) {
        // The 'result' from toolCallResult is the direct output of docsTool's execute function,
        // which should match responseSchema.
        const toolOutput = toolCallResult.result as z.infer<typeof responseSchema>;
        return {
          snippets: toolOutput.snippets || [],
          sourceUrl: toolOutput.sourceUrl || inputData.url, // Fallback for sourceUrl
        };
      } else {
        console.warn(`Agent called an unexpected tool ('${toolCallResult.toolName}') or docsTool result was empty.`);
      }
    } else {
      console.warn(`Agent did not call any tools. Agent text response: ${agentGenerationResult.text}`);
    }

    // Fallback: If docsTool wasn't used or failed, return an empty/default response
    // conforming to the outputSchema.
    return {
      snippets: [],
      sourceUrl: inputData.url,
    };
  },
});

export const docsWorkflow = createWorkflow({ // Added export here
  id: 'docs-workflow',
  inputSchema: z.object({
    url: z.string().describe('URL of the documentation page'),
    query: z.string().describe('Query string to search within the documentation'),
  }),
  outputSchema: responseSchema,
  steps: [step],
});