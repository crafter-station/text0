import { getSecureSession } from "@/lib/auth/server";
import { DOCUMENT_KEY, type Document, redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateDocumentSchema = z.object({
	content: z.string(),
});

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ doc_id: string }> },
) {
	try {
		const session = await getSecureSession();
		const { doc_id } = await params;
		if (!session.userId) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await request.json();
		const parsed = updateDocumentSchema.safeParse(body);

		if (!parsed.success) {
			return new NextResponse("Invalid request data", { status: 400 });
		}

		// Verify the document belongs to the user
		const document = await redis.hgetall<Document>(DOCUMENT_KEY(doc_id));
		if (!document || document.userId !== session.userId) {
			return new NextResponse("Document not found or unauthorized", {
				status: 404,
			});
		}

		// Update the document content
		await redis.hset(DOCUMENT_KEY(doc_id), {
			...document,
			content: parsed.data.content,
			updatedAt: new Date().toISOString(),
		} satisfies Document);

		revalidatePath(`/docs/${doc_id}`, "page");

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[DOCUMENT_UPDATE]", error);
		return new NextResponse("Internal error", { status: 500 });
	}
}
