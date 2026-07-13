import { getSecureSession } from "@/lib/auth/server";
import { minimax } from "@/lib/minimax";
import { vector } from "@/lib/vector";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import {
	type Message,
	type StreamTextOnErrorCallback,
	type StreamTextOnFinishCallback,
	type StreamTextResult,
	streamText,
} from "ai";
import { NextResponse } from "next/server";

// Set the runtime to edge for better performance
export const runtime = "edge";
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const SYSTEM_PROMPT = (
	context: string,
) => `Your name is text0. You are an AI writing assistant. When asked to modify text, you should:
1. Analyze the text and understand its context and purpose
2. Make the requested changes while preserving the original meaning
3. Return the modified text with the prefix "UPDATED_CONTENT:" followed by the new text
4. For other questions, respond normally without the prefix
5. Use the context provided in <context> tags. Use this as a knowledge base to help you answer the questions or tasks.
<context>
${context}
</context>

Example:
User: Make this text more professional: "Hey there! Just wanted to check in"
Assistant: UPDATED_CONTENT: Dear [Name], I hope this message finds you well. I am writing to follow up...`;

export async function POST(req: Request) {
	try {
		const { messages, model, references } = await req.json();

		const session = await getSecureSession();

		const andFilter =
			references.length > 0
				? ` AND referenceId IN ('${references.join("','")}')`
				: "";

		const userFilter = `userId = '${session.userId}'`;

		let closestReferences = await vector.query({
			data: messages
				.slice(-3)
				.map((m: Message) => m.content)
				.join("\n"),
			topK: 5,
			includeData: true,
			filter: `${userFilter}${andFilter}`,
		});

		if (andFilter && !closestReferences.some((c) => c.score > 0.875)) {
			closestReferences = await vector.query({
				data: messages
					.slice(-3)
					.map((m: Message) => m.content)
					.join("\n"),
				topK: 5,
				includeData: true,
				filter: userFilter,
			});
		}

		closestReferences = closestReferences.filter((c) => c.score > 0.8);

		const context = closestReferences.map((c) => c.data).join("\n");

		// Select the appropriate provider based on the model
		let result: StreamTextResult<never, never>;

		const streamOptions = {
			system: SYSTEM_PROMPT(context),
			messages,
			temperature: 0.7,
			maxTokens: 2000,
			// Handle errors during streaming
			onError: (({ error }) => {
				console.error("Streaming error:", error);
			}) satisfies StreamTextOnErrorCallback,
			// Handle stream completion
			onFinish: (({
				text,
				finishReason,
				usage,
			}: {
				text: string;
				finishReason: string;
				usage?: {
					promptTokens: number;
					completionTokens: number;
					totalTokens: number;
				};
			}) => {
				console.log("Stream finished:", {
					finishReason,
					totalTokens: usage?.totalTokens,
				});
			}) satisfies StreamTextOnFinishCallback<never>,
		};

		// Create stream based on model
		if (model?.startsWith("gpt-")) {
			result = await streamText({
				model: openai(model),
				...streamOptions,
			});
		} else if (model?.startsWith("claude-")) {
			result = await streamText({
				model: anthropic(model),
				...streamOptions,
			});
		} else if (model?.startsWith("gemini-")) {
			result = await streamText({
				model: google(model),
				...streamOptions,
			});
		} else if (model?.startsWith("grok-")) {
			result = await streamText({
				model: xai(model),
				...streamOptions,
			});
		} else if (model?.startsWith("MiniMax-")) {
			result = await streamText({
				model: minimax(model),
				...streamOptions,
			});
		} else {
			// Default to GPT-4 if no model specified
			result = await streamText({
				model: openai("gpt-4"),
				...streamOptions,
			});
		}

		// Return the stream with enhanced features
		return result.toDataStreamResponse({
			// Send usage information to track token consumption
			sendUsage: true,
			// Enable reasoning for supported models
			sendReasoning: true,
			// Custom error handling
			getErrorMessage: (error: unknown) => {
				if (error instanceof Error) {
					// Log the full error server-side
					console.error("Chat API Error:", error);
					// Return a sanitized message to the client
					return "An error occurred while processing your request. Please try again.";
				}
				return "Unknown error occurred";
			},
		});
	} catch (error) {
		console.error("Error in chat API:", error);
		return new NextResponse(
			JSON.stringify({
				error:
					"An error occurred while processing your request. Please try again.",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}
