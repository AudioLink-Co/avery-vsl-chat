import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { listSuggestedSlots } from "@/lib/calendar";
import { buildInstructions } from "@/lib/prompt";

export const maxDuration = 30;

const MAX_MESSAGES = 30;
const MAX_TEXT = 2_000;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "Avery's model key isn't configured on this server yet. You can still book a call.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a chat message to continue." }, { status: 400 });
  }

  const messages = (body as { messages?: UIMessage[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Send a chat message to continue." }, { status: 400 });
  }

  const prepared = prepareMessages(messages);
  const latestUserText = latestUserMessage(prepared);
  const userTurns = prepared.filter((message) => message.role === "user").length;

  const result = streamText({
    model: openai("gpt-4o-mini"),
    instructions: buildInstructions(userTurns, latestUserText),
    messages: await convertToModelMessages(prepared),
    maxOutputTokens: 500,
    temperature: 0.4,
    stopWhen: isStepCount(4),
    tools: {
      suggestMeetingTimes: tool({
        description:
          "Turn a visitor's availability into 2 to 4 example Central-time meeting windows. Call this when they mention days, mornings, afternoons, evenings, or a time they can talk. Pass their words as availabilityHint. Do not call it for pricing or product questions.",
        inputSchema: z.object({
          availabilityHint: z
            .string()
            .describe("The visitor's availability in their own words."),
        }),
        execute: async ({ availabilityHint }) => listSuggestedSlots(availabilityHint),
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

function prepareMessages(messages: UIMessage[]): UIMessage[] {
  return messages.slice(-MAX_MESSAGES).map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type === "text" && part.text.length > MAX_TEXT) {
        return { ...part, text: part.text.slice(0, MAX_TEXT) };
      }
      return part;
    }),
  }));
}

function latestUserMessage(messages: UIMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    const lines: string[] = [];
    for (const part of message.parts) {
      if (part.type === "text") lines.push(part.text);
    }
    return lines.join(" ").slice(0, MAX_TEXT);
  }
  return "";
}
