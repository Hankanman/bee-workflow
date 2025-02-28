import "dotenv/config";
import { BeeAgent } from "beeai-framework/agents/bee/agent";
import { z } from "zod";
import { Message, UserMessage } from "beeai-framework/backend/message";
import { WikipediaTool } from "beeai-framework/tools/search/wikipedia";
import { OpenMeteoTool } from "beeai-framework/tools/weather/openMeteo";
import { DuckDuckGoSearchTool } from "beeai-framework/tools/search/duckDuckGoSearch";
import { ReadOnlyMemory } from "beeai-framework/memory/base";
import { UnconstrainedMemory } from "beeai-framework/memory/unconstrainedMemory";
import { Workflow } from "beeai-framework/workflows/workflow";
import { createConsoleReader } from "./utils/io.js";
import { OllamaChatModel } from "beeai-framework/adapters/ollama/backend/chat";
import { getEnv } from "beeai-framework/internals/env";

/**
 * Main workflow implementation for a conversational AI system using the BeeAI framework.
 * This file implements a two-tier agent system with a simple agent for basic queries
 * and a complex agent for more sophisticated tasks requiring external tools.
 */

/**
 * Schema definition for the workflow state
 * Defines the structure of data passed between workflow steps
 */
const schema = z.object({
  answer: z.instanceof(Message).optional(), // The agent's response message
  memory: z.instanceof(ReadOnlyMemory), // Conversation memory store
});

// Get the LLM model name from environment variables or use default
const model = getEnv("LLM_MODEL", "granite3.1-dense");

/**
 * Main workflow definition
 * Implements a three-step process:
 * 1. Simple Agent: Handles basic queries without external tools
 * 2. Critique: Evaluates the simple agent's response
 * 3. Complex Agent: Handles complex queries using external tools
 */
const workflow = new Workflow({ schema: schema })
  // Step 1: Simple Agent Implementation
  .addStep("simpleAgent", async (state) => {
    const simpleAgent = new BeeAgent({
      llm: new OllamaChatModel(model),
      tools: [], // No tools for simple agent
      memory: state.memory,
    });
    const answer = await simpleAgent.run({ prompt: null });
    reader.write("🤖 Simple Agent", answer.result.text);

    state.answer = answer.result;
    return "critique";
  })
  // Step 2: Response Critique Implementation
  .addStrictStep("critique", schema.required(), async (state) => {
    const llm = new OllamaChatModel(model);
    const { object: critiqueResponse } = await llm.createStructure({
      schema: z.object({ score: z.number().int().min(0).max(100) }),
      messages: [
        Message.of({
          role: "system",
          text: `You are an evaluation assistant who scores the credibility of the last assistant's response. Chitchatting always has a score of 100. If the assistant was unable to answer the user's query, then the score will be 0.`,
        }),
        ...state.memory.messages,
        state.answer,
      ],
    });
    reader.write("🧠 Score", critiqueResponse.score.toString());

    // If score is less than 75, escalate to complex agent
    return critiqueResponse.score < 75 ? "complexAgent" : Workflow.END;
  })
  // Step 3: Complex Agent Implementation
  .addStep("complexAgent", async (state) => {
    const complexAgent = new BeeAgent({
      llm: new OllamaChatModel(model),
      tools: [
        new WikipediaTool(), // For knowledge queries
        new OpenMeteoTool(), // For weather queries
        new DuckDuckGoSearchTool(), // For web searches
      ],
      memory: state.memory,
    });
    const { result } = await complexAgent.run({ prompt: null });
    reader.write("🤖 Complex Agent", result.text);
    state.answer = result;
  })
  .setStart("simpleAgent");

/**
 * Initialize console reader and memory system
 */
const reader = createConsoleReader();
const memory = new UnconstrainedMemory();

/**
 * Main interaction loop
 * Processes user input and manages the conversation flow through the workflow
 */
for await (const { prompt } of reader) {
  // Create and store user message
  const userMessage = new UserMessage(prompt);
  await memory.add(userMessage);

  // Run the workflow with current memory state
  const response = await workflow.run({
    memory: memory.asReadOnly(),
  });
  await memory.add(response.state.answer!);

  // Output the final response
  reader.write("🤖 Final Answer", response.state.answer!.text);
}
