import { START_DEFUSE_MANUAL_TEXT } from "../manual.js";

export const helpToolSchemas = [
  {
    name: "start_defuse",
    description: "Call this tool when the user wants to start or learn how to play the Defuse game. IMPORTANT: Display the EXACT tool response to the user, word for word, without any summarization, rephrasing, or modification. Do NOT add any extra text before or after the output.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export async function handleHelpToolCall(name: string, args: any) {
  if (name === "start_defuse") {
    return {
      content: [
        {
          type: "text",
          text: START_DEFUSE_MANUAL_TEXT,
        },
      ],
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found in help tools: ${name}` }]
  };
}
