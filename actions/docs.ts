"use server";

import { getSecureSession } from "@/lib/auth/server";
import { nanoid } from "@/lib/nanoid";
import {
	DOCUMENT_KEY,
	type Document,
	USER_DOCUMENTS_KEY,
	redis,
} from "@/lib/redis";
import type { ActionState } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CreateDocumentActionState = ActionState<
	{ name: string },
	{ documentId: string }
>;

export type UpdateDocumentNameActionState = ActionState<{
	name: string;
	documentId: string;
}>;

export async function createDocument(
	prevState: CreateDocumentActionState | undefined,
	formData: FormData,
): Promise<CreateDocumentActionState> {
	const rawFormData = Object.fromEntries(formData.entries()) as {
		name: string;
		pathname: string;
	};

	try {
		const session = await getSecureSession();
		if (!session.userId) {
			throw new Error("Unauthorized");
		}

		const form = z.object({
			name: z.string().min(1, "Document name is required"),
			pathname: z.string(),
		});

		const parsed = form.safeParse(rawFormData);

		if (!parsed.success) {
			return { success: false, error: parsed.error.message };
		}

		const id = nanoid();
		const document: Document = {
			id,
			userId: session.userId,
			name: parsed.data.name,
			content: "",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		// Store the document
		await redis.hset(DOCUMENT_KEY(id), document);

		// Add document ID to user's documents list
		await redis.zadd(USER_DOCUMENTS_KEY(session.userId), {
			score: Date.now(),
			member: id,
		});
		revalidatePath(parsed.data.pathname, "layout");

		return { success: true, data: { documentId: id } };
	} catch (error) {
		console.error(error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
			form: rawFormData,
		};
	}
}

export async function updateDocumentName(
	prevState: UpdateDocumentNameActionState | undefined,
	formData: FormData,
): Promise<UpdateDocumentNameActionState> {
	const rawFormData = Object.fromEntries(formData.entries()) as {
		name: string;
		documentId: string;
	};

	try {
		const session = await getSecureSession();
		if (!session.userId) {
			throw new Error("Unauthorized");
		}

		const form = z.object({
			name: z.string().min(1, "Document name is required"),
			documentId: z.string().min(1, "Document ID is required"),
		});

		const parsed = form.safeParse(rawFormData);

		if (!parsed.success) {
			return { success: false, error: parsed.error.message };
		}

		// Verify the document belongs to the user
		const document = await redis.hgetall<Document>(
			DOCUMENT_KEY(parsed.data.documentId),
		);
		if (!document || document.userId !== session.userId) {
			throw new Error("Document not found or unauthorized");
		}

		// Update the document name
		await redis.hset(DOCUMENT_KEY(parsed.data.documentId), {
			...document,
			name: parsed.data.name,
			updatedAt: new Date().toISOString(),
		} satisfies Document);

		revalidatePath(`/docs/${parsed.data.documentId}`);

		return { success: true };
	} catch (error) {
		console.error(error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
			form: rawFormData,
		};
	}
}

export async function getDocumentContentForExport(docId: string): Promise<{
	success: boolean;
	data?: { content: string }; // Only return content needed for export
	error?: string;
}> {
	try {
		const session = await getSecureSession();
		if (!session?.userId) {
			throw new Error("Unauthorized");
		}

		if (!docId) {
			return { success: false, error: "Document ID is required." };
		}

		const docKey = DOCUMENT_KEY(docId);
		const document = await redis.hgetall<Document>(docKey);

		if (!document) {
			return { success: false, error: "Document not found." };
		}

		if (document.userId !== session.userId) {
			// Although the user might only see their own docs, double-check ownership server-side
			return {
				success: false,
				error: "Forbidden: You do not own this document.",
			};
		}

		return { success: true, data: { content: document.content ?? "" } };
	} catch (error) {
		console.error(
			`Error fetching document content for export (ID: ${docId}):`,
			error,
		);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to retrieve document content.",
		};
	}
}

export async function deleteDocument(docId: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const session = await getSecureSession();
		if (!session?.userId) {
			throw new Error("Unauthorized");
		}

		if (!docId) {
			return { success: false, error: "Document ID is required." };
		}

		const docKey = DOCUMENT_KEY(docId);
		const userDocsKey = USER_DOCUMENTS_KEY(session.userId);

		const document = await redis.hgetall<Document>(docKey);
		if (!document) {
			// Document already gone, consider it a success from the user's perspective
			console.warn(`Attempted to delete non-existent document: ${docId}`);
			return { success: true }; // Idempotent: If it's gone, the goal is achieved
		}

		if (document.userId !== session.userId) {
			return {
				success: false,
				error: "Forbidden: You do not own this document.",
			};
		}

		const pipeline = redis.pipeline();
		pipeline.del(docKey);
		pipeline.zrem(userDocsKey, docId);
		const results = await pipeline.exec();

		// Check results (optional, but good for debugging)
		// results[0] contains the result of del (number of keys deleted, should be 1)
		// results[1] contains the result of zrem (number of members removed, should be 1)
		// @ts-ignore
		const delResult = results[0][1] as number;
		// @ts-ignore
		const zremResult = results[1][1] as number;

		if (delResult === 0 && zremResult === 0) {
			console.warn(
				`Document ${docId} already deleted or removed from user list.`,
			);
		}

		revalidatePath("/home", "layout");

		return { success: true };
	} catch (error) {
		console.error(`Error deleting document (ID: ${docId}):`, error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to delete document.",
		};
	}
}
