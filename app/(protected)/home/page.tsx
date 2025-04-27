import { AddReference } from "@/components/add-reference";
import { AppHeader } from "@/components/home/app-header";
import { QuickActionButton } from "@/components/home/quick-action-button";
import { RecentFilesCard } from "@/components/home/recent-files-card";
import { StatusBar } from "@/components/home/status-bar";
import { getSecureUser } from "@/lib/auth/server";
import {
	DOCUMENT_KEY,
	type Document,
	REFERENCE_KEY,
	type Reference,
	USER_DOCUMENTS_KEY,
	USER_REFERENCES_KEY,
	redis,
} from "@/lib/redis";
import { TOUR_STEP_IDS } from "@/lib/tour-constants";
import { NewDoc } from "./new-doc";
import { SearchCommand } from "./search-command";
import { HomeTour } from "./tour";

export default async function HomePage() {
	const user = await getSecureUser();

	// Fetch documents and references
	const documentsWithIds = await redis.zrange<string[]>(
		USER_DOCUMENTS_KEY(user.id),
		0,
		-1,
	);
	const referencesWithIds = await redis.smembers(USER_REFERENCES_KEY(user.id));

	const [documents, references] = await Promise.all([
		Promise.all(
			documentsWithIds.map((id) => redis.hgetall<Document>(DOCUMENT_KEY(id))),
		),
		Promise.all(
			referencesWithIds.map((id) =>
				redis.hgetall<Reference>(REFERENCE_KEY(id)),
			),
		),
	]);

	const validDocuments = documents.filter(
		(doc): doc is Document => doc !== null,
	);
	const validReferences = references.filter(
		(ref): ref is Reference => ref !== null,
	);

	// Combine and sort by date
	const allFiles = [
		...validDocuments.map((doc) => ({ ...doc, type: "document" as const })),
		...validReferences.map((ref) => ({ ...ref, type: "reference" as const })),
	]
		.sort((a, b) => {
			const dateA = new Date(
				a.type === "document" ? a.updatedAt : a.uploadedAt,
			);
			const dateB = new Date(
				b.type === "document" ? b.updatedAt : b.uploadedAt,
			);
			return dateA.getTime() - dateB.getTime();
		})
		.slice(0, 5); // Limit to 5 most recent items

	return (
		<div className="flex h-full flex-col bg-background text-foreground">
			<HomeTour />
			{/* Main Content */}
			<main className="flex flex-1 items-center justify-center overflow-auto">
				<div className="container mx-auto my-auto max-w-2xl px-4 py-12">
					<div>
						<AppHeader />
					</div>

					{/* Quick Actions */}
					<div className="mb-8 grid grid-cols-3 gap-3">
						<div id={TOUR_STEP_IDS.NEW_DOC}>
							<NewDoc />
						</div>
						<div id={TOUR_STEP_IDS.NEW_MEMORY}>
							<AddReference>
								<QuickActionButton iconName="Brain" label="New Memory">
									<span className="hidden md:block">New Memory</span>
									<span className="block md:hidden">New Mem</span>
								</QuickActionButton>
							</AddReference>
						</div>
						<div id={TOUR_STEP_IDS.SEARCH_COMMAND}>
							<SearchCommand documents={validDocuments} />
						</div>
					</div>

					<div id={TOUR_STEP_IDS.RECENT_FILES}>
						<RecentFilesCard files={allFiles} />
					</div>
				</div>
			</main>

			<div id={TOUR_STEP_IDS.STATUS_BAR}>
				<StatusBar
					documentsCount={validDocuments.length}
					referencesCount={validReferences.length}
					userName={user.fullName}
				/>
			</div>
		</div>
	);
}
