import { MinimalIntegrationSidebar } from "@/components/integration-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getSecureUser } from "@/lib/auth/server";
import {
	DOCUMENT_KEY,
	type Document,
	USER_DOCUMENTS_KEY,
	redis,
} from "@/lib/redis";
import { redirect } from "next/navigation";
import { AnnouncementBarWrapper } from "../components/announcement-bar";
import { DocumentContextProvider } from "../context/documentContext";
import { DeleteDialog } from "@/components/delete-dialog";

export default async function ProtectedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const user = await getSecureUser();

	if (!user) {
		redirect("/sign-in");
	}

	const documentsWithIds = await redis.zrange<string[]>(
		USER_DOCUMENTS_KEY(user.id),
		0,
		-1,
	);
	const _documents = await Promise.all(
		documentsWithIds.map((documentId) =>
			redis.hgetall<Document>(DOCUMENT_KEY(documentId)),
		),
	);
	const documents = _documents
		.map((document) => document as Document)
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

	return (
		<DocumentContextProvider>
		<SidebarProvider
			defaultOpen={true}
			className="grid h-dvh grid-rows-[auto_1fr]"
		>
			<AnnouncementBarWrapper />
			<div className="row-span-2 flex">
				
					<MinimalIntegrationSidebar documents={documents} />
					<main className="flex flex-1 overflow-auto relative">
						<div className="grid flex-1">{children}</div>
					</main>
					<DeleteDialog/>
			</div>
		</SidebarProvider>
		</DocumentContextProvider>
	);
}
