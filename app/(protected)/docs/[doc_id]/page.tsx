import { Redis } from "@upstash/redis";
import { auth } from "@clerk/nextjs/server";
import { type Document, DOCUMENT_KEY } from "@/lib/redis";
import { TextEditor } from "./text-editor";

if (
	!process.env.UPSTASH_REDIS_REST_URL ||
	!process.env.UPSTASH_REDIS_REST_TOKEN
) {
	throw new Error("Missing Redis environment variables");
}

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function DocumentPage({
	params,
}: Readonly<{
	params: Promise<{ doc_id: string }>;
}>) {
	const { doc_id } = await params;
	const user = await auth();
	const document: Document | null = await redis.hgetall(DOCUMENT_KEY(doc_id));

	if (!document) {
		return <div>Document not found</div>;
	}

	if (user.userId !== document.userId) {
		return <div>Document not found</div>;
	}

	return (
		<TextEditor
			initialContent={document.content}
			documentId={document.id}
			initialName={document.name}
		/>
	);
}
