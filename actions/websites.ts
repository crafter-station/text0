"use server";

import { getSecureSession } from "@/lib/auth/server";
import { nanoid } from "@/lib/nanoid";
import { redis } from "@/lib/redis";
import type { Reference } from "@/lib/redis";
import type { ActionState } from "@/lib/utils";
import type { processReferenceTask } from "@/trigger/process-document";
import { openai } from "@ai-sdk/openai";
import { tasks } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const USER_REFERENCES_KEY = (userId: string) => `user:${userId}:references`;
const REFERENCE_KEY = (referenceId: string) => `reference:${referenceId}`;

export type AddWebsiteReferenceActionState = ActionState<
	{ url: string },
	{ referenceId: string }
>;

export async function addWebsiteReference(
	prevState: AddWebsiteReferenceActionState | undefined,
	formData: FormData,
): Promise<AddWebsiteReferenceActionState> {
	try {
		const session = await getSecureSession();
		if (!session.userId) {
			throw new Error("Unauthorized");
		}

		const url = formData.get("url") as string;
		if (!url) {
			throw new Error("URL is required");
		}

		const urlSchema = z.string().url();
		const result = urlSchema.safeParse(url);
		if (!result.success) {
			throw new Error("Invalid URL");
		}

		// Content moderation check
		const model = openai("gpt-4o-mini");
		const { text } = await generateText({
			model,
			prompt: `
As a content moderator, analyze the file name or the URL for any inappropriate, NSFW.
Focus on:
1. NSFW or adult content 

If you don't have enough information to make a decision, just allow it.

Content to analyze:
URL: ${url}

Respond with a JSON object containing:
{
  "isAllowed": boolean,
  "reason": string if rejected, null if allowed
}

Only respond with the JSON object, nothing else.
			`.trim(),
			temperature: 0,
			maxTokens: 150,
		});

		const moderationResult = JSON.parse(text);
		if (!moderationResult.isAllowed) {
			return {
				success: false,
				error: moderationResult.reason || "Content not allowed",
			};
		}

		const referenceId = nanoid();

		await redis.sadd(USER_REFERENCES_KEY(session.userId), referenceId);
		await redis.hset(REFERENCE_KEY(referenceId), {
			id: referenceId,
			userId: session.userId,
			url,
			uploadedAt: new Date().toISOString(),
			chunksCount: 0,
			processed: false,
			name: url,
		} satisfies Reference);

		// Trigger the document processing task
		await tasks.trigger<typeof processReferenceTask>("process-reference", {
			userId: session.userId,
			referenceId,
		});

		revalidatePath("/references");

		return { success: true, data: { referenceId } };
	} catch (error) {
		console.error("Website reference error:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to add website reference",
		};
	}
}
