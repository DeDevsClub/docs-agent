import { Mastra } from '@mastra/core';
import { PinoLogger } from '@mastra/loggers';
import { myWorkflow } from './workflows';
import { docsAgent, ragAgent } from './agents';
import { UpstashVector } from '@mastra/upstash';
import { MDocument } from '@mastra/rag';
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
 
// const doc = MDocument.fromText("Your plain text content...");

const docFromText = MDocument.fromText(process.env.DOCUMENT_PATH || "https://docs.morpho.org/llms-full.txt");
// const docFromHTML = MDocument.fromHTML("<html>Your HTML content...</html>");
// const docFromMarkdown = MDocument.fromMarkdown("# Your Markdown content...");
// const docFromJSON = MDocument.fromJSON(`{ "key": "value" }`);

// const chunks = await docFromText.chunk({
//   strategy: "recursive",
//   size: 512,
//   overlap: 50,
//   separator: "\n",
//   extract: {
//     // metadata: true, // Optionally extract metadata
//   },
// });

const chunks = await docFromText.chunk({
  strategy: "recursive",
  size: 256,
  overlap: 50,
});

// The embedding functions return vectors, 
// arrays of numbers representing the semantic meaning of your text, 
// ready for similarity searches in your vector database.
// const { embeddings } = await embedMany({
//   model: openai.embedding("bge-large-en-v1.5"),
//   values: chunks.map((chunk) => chunk.text),
// });

// When storing embeddings, the vector database index must be configured to match the output size of your embedding model. 
// If the dimensions do not match, you may get errors or data corruption.

// const { embeddings } = await embedMany({
//   model: openai.embedding("bge-large-en-v1.5", {
//     dimensions: 1024, // Only supported in text-embedding-3 and later
//   }),
//   values: chunks.map((chunk) => chunk.text),
// });
 
// Generate embeddings with OpenAI
const { embeddings: openAIEmbeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-large"),
  values: chunks.map((chunk) => chunk.text),
});

const upstashUrl = process.env.UPSTASH_URL!;
console.log(`Attempting to connect to Upstash at: ${upstashUrl}`); // Log the URL

const store = new UpstashVector({
url: process.env.UPSTASH_URL!,
token: process.env.UPSTASH_TOKEN!
})
try {
  console.log(`Attempting to create Upstash index 'embeddings' with 1024 dimensions...`);
  await store.createIndex({
    indexName: "embeddings",
    dimension: 1024,
  });
  console.log("Upstash index 'embeddings' creation attempt finished. Assuming success if no error thrown or caught specifically for 'already exists'.");
} catch (e: any) {
  console.error("Detailed error during createIndex:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
  if (e.message && (e.message.toLowerCase().includes("already exists") || e.message.toLowerCase().includes("already created") || e.message.toLowerCase().includes("exists"))) {
    console.log("Upstash index 'embeddings' likely already exists.");
  } else {
    console.error("Failed to create Upstash index 'embeddings' due to an unexpected error:", e.message);
  }
}
// Store embeddings with their corresponding metadata
// Store embeddings with rich metadata for better organization and filtering
await store.upsert({
  indexName: "embeddings",
  vectors: openAIEmbeddings,
  metadata: chunks.map((chunk: any) => ({
    // Basic content
    text: chunk.text,
    id: chunk.id,
 
    // Document organization
    source: chunk.source,
    category: chunk.category,
 
    // Temporal metadata
    createdAt: new Date().toISOString(),
    version: "1.0",
 
    // Custom fields
    language: chunk.language,
    author: chunk.author,
    confidenceScore: chunk.score,
  })),
});

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