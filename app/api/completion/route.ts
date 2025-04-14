import { vector } from "@/lib/vector";
import { streamText, type LanguageModelV1 } from "ai";

import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    const _model = searchParams.get("model");

    console.log(body);

    const user = await auth();

    let model: LanguageModelV1;

    if (_model === "gpt-4o-mini") {
      model = openai("gpt-4o-mini");
    } else if (_model === "grok-3-fast-beta") {
      model = xai("grok-3-fast-beta");
    } else if (_model === "claude-3-5-sonnet-latest") {
      model = anthropic("claude-3-5-sonnet-latest");
    } else if (_model === "claude-3-5-haiku-latest") {
      model = anthropic("claude-3-5-haiku-latest");
    } else if (_model === "llama-3.1-8b-instant") {
      model = groq("llama-3.1-8b-instant");
    } else if (_model === "llama-3.3-70b-versatile") {
      model = groq("llama-3.3-70b-versatile");
    } else if (_model === "gemini-2.0-flash-001") {
      model = google("gemini-2.0-flash-001");
    } else if (_model === "gemini-2.0-flash-lite-preview-02-05") {
      model = google("gemini-2.0-flash-lite-preview-02-05");
    } else {
      model = openai("gpt-4o-mini");
    }

    const filter = `userId = '${
      user.userId
    }' AND referenceId IN ('${body.references.join("','")}')`;

    const context = await vector.query({
      data: body.prompt,
      topK: 5,
      includeData: true,
      filter,
    });

    const contextData = context.map((c) => c.data).join("\n");

    const result = streamText({
      model,
      prompt: `
      <task>
      You are an autocompletion system that suggests text completions.
      Your name is text0.
      
      Rules:
      - USE the provided context in <context> tags
      - Read CAREFULLY the input text in <input> tags
      - Suggest up to 10 words maximum
      - Ensure suggestions maintain semantic meaning
      - Wrap completion in <completion> tags
      - Return only the completion text
      - Periods at the end of the completion are OPTIONAL, not fully required
      </task>
      
      <example>
      <context>Math Academy is a challenging but rewarding platform for learning math.</context>
      <input>Math Academy teaches</input>
      <completion> math in a fun and engaging way.</completion>
      </example>

      <context>
      ${contextData}
      </context>
      <input>
      ${body.prompt}
      </input>

      Your completion:
    `,
      temperature: 0.75,
      maxTokens: 50,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
