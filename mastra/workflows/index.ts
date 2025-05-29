import { Mastra } from "@mastra/core";
import { createWorkflow, createStep, Step, cloneStep, cloneWorkflow } from "@mastra/core/workflows";
import { z } from "zod"; // For schema validation

// Create a step with defined input/output schemas and execution logic
const inputSchema = z.object({
  inputValue: z.any(),
});
 
const firstStepOutputSchema = z.object({
  outputValue: z.any(),
});

const firstStep = createStep({
  id: "first-step",
  description: "Does something useful",
  inputSchema,
  outputSchema: firstStepOutputSchema,
  // Optional: Define the resume schema for step resumption
  resumeSchema: z.object({
    resumeValue: z.any(),
  }),
  // Optional: Define the suspend schema for step suspension
  suspendSchema: z.object({
    suspendValue: z.any(),
  }),
  execute: async ({
    inputData,
    mastra,
    getStepResult,
    getInitData,
    runtimeContext,
  }): Promise<z.infer<typeof firstStepOutputSchema>> => {
    const otherStepOutput = getStepResult(secondStep as any); // TODO: Revisit type casting for getStepResult as unknown as Step)
    const initData = getInitData<typeof inputSchema>(); // typed as the input schema variable (zod schema)
    return {
      outputValue: `Processed: ${inputData.inputValue}, ${otherStepOutput.outputValue} (runtimeContextValue: ${runtimeContext.get("runtimeContextValue")})`,
    };
  },
});

// Define a specific input schema for secondStep to match firstStep's output
const secondStepInputSchema = z.object({
  outputValue: z.any(), // Matches the 'outputValue' from firstStep's outputSchema
});

const secondStepOutputSchema = z.object({
  outputValue: z.any(),
});

const secondStep = createStep({
  id: "second-step",
  description: "Does something useful",
  inputSchema: secondStepInputSchema,
  outputSchema: secondStepOutputSchema,
  // Optional: Define the resume schema for step resumption
  resumeSchema: z.object({
    resumeValue: z.any(),
  }),
  // Optional: Define the suspend schema for step suspension
  suspendSchema: z.object({
    suspendValue: z.string(),
  }),
  execute: async ({
    inputData,
    mastra,
    getStepResult,
    getInitData,
    runtimeContext,
  }): Promise<z.infer<typeof secondStepOutputSchema>> => {
    const firstStepOutput = getStepResult(firstStep as any); // TODO: Revisit type casting for getStepResult as unknown as Step);
    const initData = getInitData<typeof secondStepInputSchema>(); 
    return {
      outputValue: `Processed: ${inputData.outputValue}, from first step: ${firstStepOutput.outputValue} (runtimeContextValue: ${runtimeContext.get("runtimeContextValue")})`,
    };
  },
});

// Create a workflow with defined steps and execution flow
const myWorkflow = createWorkflow({
  id: "my-workflow",
  // Define the expected input structure (should match the first step's inputSchema)
  inputSchema: z.object({
    inputValue: z.any(), // Aligned with firstStep's inputSchema
  }),
  // Define the expected output structure (should match the last step's outputSchema)
  outputSchema: z.object({
    result: z.string(),
  }),
  steps: [firstStep, secondStep], // Declare steps used in this workflow
})
  .then(firstStep)
  .then(secondStep)
  .commit();

  // Register workflow with Mastra instance
const mastra = new Mastra({
  workflows: {
    myWorkflow,
  },
});
 
// Create a run instance of the workflow
const run = mastra.getWorkflow("myWorkflow").createRun();

// Start the run
const result_1: any = await run.start({ inputData: { inputValue: "initial workflow input" } });

// Log the result
console.log({ result_1 });

  // With steps declared in workflow options
const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ inputValue: z.any() }), // Aligned with firstStep's inputSchema
  outputSchema: z.object({}),
  steps: [firstStep, secondStep], // TypeScript knows these steps exist
})
  .then(firstStep)
  .then(secondStep)
  .commit();
 
const result = await workflow.createRun().start({ inputData: { inputValue: "initial workflow input" } });
if (result.status === "success") {
  console.log(result.result); // only exists if status is success
} else if (result.status === "failed") {
  console.error(result.error); // only exists if status is failed, this is an instance of Error
  throw result.error;
} else if (result.status === "suspended") {
  console.log(result.suspended); // only exists if status is suspended
}

export { myWorkflow };

// TypeScript knows these properties exist and their types
if (result.steps['first-step'].status === 'success') {
  console.log(result.steps['first-step'].output.outputValue); // Access outputValue
}
if (result.steps['second-step'].status === 'success') {
  console.log(result.steps['second-step'].output.outputValue);
}

const clonedStep = cloneStep(firstStep as any, { id: "cloned-step" });
const clonedWorkflow = cloneWorkflow(myWorkflow, { id: "cloned-workflow" });