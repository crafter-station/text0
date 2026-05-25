import { getSecureSession } from "@/lib/auth/server";
import { vector } from "@/lib/vector";
import { getWritingStylePrompt } from "@/lib/writing-styles";
import {
	type Message,
	type StreamTextOnErrorCallback,
	type StreamTextOnFinishCallback,
	streamText,
} from "ai";
import { NextResponse } from "next/server";
import { ollama } from "ollama-ai-provider";

// No edge runtime - Ollama runs locally and needs Node.js runtime
export const maxDuration = 60; // Allow longer duration for local models

const SYSTEM_PROMPT = (
	context: string,
	writingStylePrompt: string,
) => `Your name is text0. You are an AI writing assistant. When asked to modify text, you should:
1. Analyze the text and understand its context and purpose
2. Make the requested changes while preserving the original meaning
3. Return the modified text with the prefix "UPDATED_CONTENT:" followed by the new text
4. For other questions, respond normally without the prefix
5. Use the context provided in <context> tags. Use this as a knowledge base to help you answer the questions or tasks.
<context>
${context}
</context>${
	writingStylePrompt
		? `\n\nWhen writing or modifying text, follow this writing style:\n${writingStylePrompt}`
		: ""
}

Example:
User: Make this text more professional: "Hey there! Just wanted to check in"
Assistant: UPDATED_CONTENT: Dear [Name], I hope this message finds you well. I am writing to follow up...`;

export async function POST(req: Request) {
	try {
		const { messages, model, references, writingStyle } = await req.json();

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

		// Extract the actual model name from "ollama/modelname" format
		const ollamaModel = model?.startsWith("ollama/")
			? model.replace("ollama/", "")
			: "llama3.2";

		const result = streamText({
			model: ollama(ollamaModel),
			system: SYSTEM_PROMPT(context, getWritingStylePrompt(writingStyle)),
			messages,
			temperature: 0.7,
			maxTokens: 2000,
			onError: (({ error }) => {
				console.error("Ollama streaming error:", error);
			}) satisfies StreamTextOnErrorCallback,
			onFinish: (({
				finishReason,
				usage,
			}: {
				finishReason: string;
				usage?: {
					promptTokens: number;
					completionTokens: number;
					totalTokens: number;
				};
			}) => {
				console.log("Ollama stream finished:", {
					finishReason,
					totalTokens: usage?.totalTokens,
				});
			}) satisfies StreamTextOnFinishCallback<never>,
		});

		return result.toDataStreamResponse({
			sendUsage: true,
			sendReasoning: true,
			getErrorMessage: (error: unknown) => {
				if (error instanceof Error) {
					console.error("Ollama Chat API Error:", error);
					if (error.message.includes("ECONNREFUSED")) {
						return "Cannot connect to Ollama. Make sure Ollama is running (ollama serve).";
					}
					return "An error occurred while processing your request. Please try again.";
				}
				return "Unknown error occurred";
			},
		});
	} catch (error) {
		console.error("Error in Ollama chat API:", error);
		return new NextResponse(
			JSON.stringify({
				error:
					error instanceof Error && error.message.includes("ECONNREFUSED")
						? "Cannot connect to Ollama. Make sure Ollama is running (ollama serve)."
						: "An error occurred while processing your request. Please try again.",
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
