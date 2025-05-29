import { Mastra } from '@mastra/core'; // Ensure Mastra is imported from '@mastra/core'
import { PinoLogger } from '@mastra/loggers';
import { openai } from '@ai-sdk/openai'; // To get the embedder
import { docsWorkflow } from './workflows';
import { docsAgent } from './agents';

// Initialize the embedder
// const embedder = openai.embedding('text-embedding-ada-002'); // Or your preferred OpenAI embedding model

export const mastra = new Mastra({
  workflows: { docsWorkflow },
  agents: { docsAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});