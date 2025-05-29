import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { myWorkflow } from './workflows';
import { docsAgent, ragAgent } from './agents';
import { UpstashVector } from '@mastra/upstash';
import { MDocument } from '@mastra/rag';
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
 
// const doc = MDocument.fromText("Your plain text content...");

const docFromText = MDocument.fromText("Your plain text content...");
const docFromHTML = MDocument.fromHTML("<html>Your HTML content...</html>");
const docFromMarkdown = MDocument.fromMarkdown("# Your Markdown content...");
const docFromJSON = MDocument.fromJSON(`{ "key": "value" }`);

// const chunks = await docFromText.chunk({
//   strategy: "recursive",
//   size: 512,
//   overlap: 50,
//   separator: "\n",
//   extract: {
//     // metadata: true, // Optionally extract metadata
//   },
// });

// The embedding functions return vectors, 
// arrays of numbers representing the semantic meaning of your text, 
// ready for similarity searches in your vector database.
// const { embeddings } = await embedMany({
//   model: openai.embedding("text-embedding-3-small"),
//   values: chunks.map((chunk) => chunk.text),
// });

// When storing embeddings, the vector database index must be configured to match the output size of your embedding model. 
// If the dimensions do not match, you may get errors or data corruption.

// const { embeddings } = await embedMany({
//   model: openai.embedding("text-embedding-3-small", {
//     dimensions: 256, // Only supported in text-embedding-3 and later
//   }),
//   values: chunks.map((chunk) => chunk.text),
// });

const chunks = await docFromText.chunk({
  strategy: "recursive",
  size: 256,
  overlap: 50,
});
 
// Generate embeddings with OpenAI
const { embeddings: openAIEmbeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: chunks.map((chunk) => chunk.text),
});

const store = new UpstashVector({
url: process.env.UPSTASH_URL!,
token: process.env.UPSTASH_TOKEN!
})
await store.createIndex({
indexName: "embeddings",
dimension: 256,
// dimension: 1536,
});
// Store embeddings with their corresponding metadata
// Store embeddings with rich metadata for better organization and filtering
// await store.upsert({
//   indexName: "embeddings",
//   vectors: embeddings,
//   metadata: chunks.map((chunk: any) => ({
//     // Basic content
//     text: chunk.text,
//     id: chunk.id,
 
//     // Document organization
//     source: chunk.source,
//     category: chunk.category,
 
//     // Temporal metadata
//     createdAt: new Date().toISOString(),
//     version: "1.0",
 
//     // Custom fields
//     language: chunk.language,
//     author: chunk.author,
//     confidenceScore: chunk.score,
//   })),
// });

await store.upsert({
  indexName: "embeddings",
  vectors: openAIEmbeddings,
});

// Export the Mastra instance
export const mastra = new Mastra({
  workflows: { myWorkflow },
  agents: { docsAgent, ragAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  vectors: { default: store }, // Register the vector store
});