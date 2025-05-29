import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { docsTool, vectorQueryTool } from "../tools";

export const docsAgent = new Agent({
  name: "Docs Agent",
  instructions: `You are a helpful documentation assistant that analyzes documentation and technical documents.
    Use the provided vector query tool to find relevant information from your knowledge base, 
    and provide accurate, well-supported answers based on the retrieved content.
    Focus on the specific content available in the tool and acknowledge if you cannot find sufficient information to answer a question.
    Base your responses only on the content provided, not on general knowledge.`,
  model: openai("gpt-4o"),
  tools: {
    docsTool,
    vectorQueryTool,
  },
});