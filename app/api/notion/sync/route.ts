import { getSecureSession } from "@/lib/auth/server";
import { nanoid } from "@/lib/nanoid";
import {
	REFERENCE_KEY,
	type Reference,
	USER_REFERENCES_KEY,
	redis,
} from "@/lib/redis";
import { vector } from "@/lib/vector";
import { type OauthAccessToken, createClerkClient } from "@clerk/backend";
import { ClerkAPIResponseError } from "@clerk/shared";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { NextResponse } from "next/server";

// Create a unique key for Notion references by user
const NOTION_REFERENCE_KEY = (userId: string) => `notion:reference:${userId}`;

export async function POST() {
	try {
		const session = await getSecureSession();
		if (!session.userId) {
			return NextResponse.json(
				{ error: "Unauthorized: No user ID found" },
				{ status: 401 },
			);
		}

		const clerkClient = createClerkClient({
			secretKey: process.env.CLERK_SECRET_KEY,
		});

		let oauthTokens: OauthAccessToken[] | undefined;
		try {
			const oauthTokensResponse =
				await clerkClient.users.getUserOauthAccessToken(
					session.userId,
					"notion",
				);
			oauthTokens = oauthTokensResponse.data;
		} catch (error) {
			if (error instanceof ClerkAPIResponseError) {
				return NextResponse.json(
					{
						error: "Failed to retrieve Notion OAuth token",
						details: error.errors,
					},
					{ status: 400 },
				);
			}
			throw error;
		}

		if (!oauthTokens || oauthTokens.length === 0) {
			return NextResponse.json(
				{ error: "Notion OAuth token not found for this user" },
				{ status: 400 },
			);
		}

		const token = oauthTokens[0].token;

		// Fetch user data from Notion
		const userResponse = await fetch("https://api.notion.com/v1/users/me", {
			headers: {
				Authorization: `Bearer ${token}`,
				"Notion-Version": "2022-06-28",
			},
		});
		if (!userResponse.ok) {
			const errorData = await userResponse.json();
			return NextResponse.json(
				{
					error: "Failed to fetch user data from Notion",
					details: errorData,
					status: userResponse.status,
				},
				{ status: userResponse.status },
			);
		}
		const userData = await userResponse.json();

		// Fetch user's pages (search for accessible pages)
		const pagesResponse = await fetch("https://api.notion.com/v1/search", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				"Notion-Version": "2022-06-28",
			},
			body: JSON.stringify({
				filter: { property: "object", value: "page" },
				sort: { direction: "descending", timestamp: "last_edited_time" },
				page_size: 25, // Fetch more pages for better context
			}),
		});
		if (!pagesResponse.ok) {
			const errorData = await pagesResponse.json();
			return NextResponse.json(
				{
					error: "Failed to fetch pages from Notion",
					details: errorData,
					status: pagesResponse.status,
				},
				{ status: pagesResponse.status },
			);
		}
		const pagesData = await pagesResponse.json();

		// Fetch user's databases (search for accessible databases)
		const databasesResponse = await fetch("https://api.notion.com/v1/search", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
				"Notion-Version": "2022-06-28",
			},
			body: JSON.stringify({
				filter: { property: "object", value: "database" },
				sort: { direction: "descending", timestamp: "last_edited_time" },
				page_size: 25, // Fetch more databases for better context
			}),
		});
		if (!databasesResponse.ok) {
			const errorData = await databasesResponse.json();
			return NextResponse.json(
				{
					error: "Failed to fetch databases from Notion",
					details: errorData,
					status: databasesResponse.status,
				},
				{ status: databasesResponse.status },
			);
		}
		const databasesData = await databasesResponse.json();

		// Check if a Notion reference already exists for this user
		const existingReferenceId = await redis.get(
			NOTION_REFERENCE_KEY(session.userId),
		);
		let referenceId: string;
		let isNewReference = false;

		// If no reference exists, create a new one
		if (!existingReferenceId) {
			referenceId = nanoid();
			isNewReference = true;
			// Store the mapping of user to Notion reference
			await redis.set(NOTION_REFERENCE_KEY(session.userId), referenceId);
		} else {
			// Use the existing reference ID
			referenceId = existingReferenceId as string;
		}

		// Create markdown content from Notion data
		const markdownContent = formatNotionDataAsMarkdown({
			user: userData,
			pages: pagesData.results,
			databases: databasesData.results,
		});

		// Create or update reference entry in Redis
		const referenceInfo = {
			id: referenceId,
			userId: session.userId,
			name: "Notion Pages & Databases",
			url: "https://notion.so",
			processed: false,
			chunksCount: 0,
			uploadedAt: new Date().toISOString(),
		} satisfies Reference;

		await redis.hset(REFERENCE_KEY(referenceId), referenceInfo);

		// If it's an existing reference, log that we're updating
		if (!isNewReference) {
			console.log(`Updating existing Notion reference: ${referenceId}`);
		}

		// Create a text splitter
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		// Split the content into chunks
		const chunks = await textSplitter.splitText(markdownContent);

		// Store chunks in vector database
		await vector.upsert(
			chunks.map((chunk) => ({
				id: nanoid(),
				data: chunk,
				metadata: {
					userId: session.userId,
					referenceId: referenceId,
				},
			})),
		);

		// Update reference info
		const updatedInfo = {
			...referenceInfo,
			chunksCount: chunks.length,
			processed: true,
		};

		await redis.hset(REFERENCE_KEY(referenceId), updatedInfo);

		// Add to user references if it's a new reference
		if (isNewReference) {
			await redis.sadd(USER_REFERENCES_KEY(session.userId), referenceId);
		}

		return NextResponse.json({
			success: true,
			referenceId,
			chunks: chunks.length,
			isNew: isNewReference,
		});
	} catch (error) {
		console.error("Error in Notion sync route:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: String(error) },
			{ status: 500 },
		);
	}
}

interface NotionData {
	user: {
		bot?: {
			owner?: {
				user?: {
					name?: string;
					person?: {
						email?: string;
					};
				};
			};
			workspace_name?: string;
		};
	};
	pages: Array<{
		properties?: Record<
			string,
			{
				type?: string;
				title?: Array<{ plain_text: string }>;
				rich_text?: Array<{ plain_text: string }>;
				select?: { name: string };
				date?: { start: string | null; end: string | null };
				status?: { name: string };
			}
		>;
		url: string;
		last_edited_time?: string;
	}>;
	databases: Array<{
		title?: Array<{ plain_text: string }>;
		description?: Array<{ plain_text: string }>;
		url: string;
		last_edited_time?: string;
	}>;
}

function formatNotionDataAsMarkdown(data: NotionData): string {
	let markdown = "# Notion Data\n\n";

	// User section
	markdown += "## User\n\n";
	markdown += `- **Name:** ${data.user.bot?.owner?.user?.name || "Unknown"}\n`;
	if (data.user.bot?.owner?.user?.person?.email) {
		markdown += `- **Email:** ${data.user.bot.owner.user.person.email}\n`;
	}
	if (data.user.bot?.workspace_name) {
		markdown += `- **Workspace:** ${data.user.bot.workspace_name}\n`;
	}
	markdown += "\n";

	// Pages section
	markdown += "## Pages\n\n";
	if (data.pages.length === 0) {
		markdown += "No pages found.\n\n";
	} else {
		for (const page of data.pages) {
			// Extract title from properties
			let title = "Untitled";
			if (page.properties) {
				// Try to find a title property
				const titleProperty = Object.values(page.properties).find(
					(prop) => prop.type === "title",
				);

				if (titleProperty?.title && titleProperty.title.length > 0) {
					title = titleProperty.title.map((t) => t.plain_text).join("");
				}
			}

			markdown += `### ${title}\n\n`;

			// Add URL
			markdown += `- **URL:** ${page.url}\n`;

			// Add last edited time
			if (page.last_edited_time) {
				markdown += `- **Last Edited:** ${new Date(page.last_edited_time).toLocaleDateString()}\n`;
			}

			// Add any other available properties
			if (page.properties) {
				for (const [key, value] of Object.entries(page.properties)) {
					if (key !== "title" && value.type) {
						const propType = value.type;

						// Format based on property type
						let propValue = "";
						if (propType === "rich_text" && value.rich_text) {
							propValue = value.rich_text.map((t) => t.plain_text).join("");
						} else if (propType === "select" && value.select) {
							propValue = value.select.name;
						} else if (propType === "date" && value.date) {
							const date = value.date;
							propValue = date.start
								? `${date.start}${date.end ? ` to ${date.end}` : ""}`
								: "";
						} else if (propType === "status" && value.status) {
							propValue = value.status.name;
						}

						if (propValue) {
							markdown += `- **${key}:** ${propValue}\n`;
						}
					}
				}
			}

			markdown += "\n";
		}
	}

	// Databases section
	markdown += "## Databases\n\n";
	if (data.databases.length === 0) {
		markdown += "No databases found.\n\n";
	} else {
		for (const db of data.databases) {
			// Extract title
			let title = "Untitled";
			if (db.title && db.title.length > 0) {
				title = db.title.map((t) => t.plain_text).join("");
			}

			markdown += `### ${title}\n\n`;

			// Add description if available
			if (db.description && db.description.length > 0) {
				const description = db.description.map((d) => d.plain_text).join("");
				if (description.trim()) {
					markdown += `${description}\n\n`;
				}
			}

			// Add URL
			markdown += `- **URL:** ${db.url}\n`;

			// Add last edited time
			if (db.last_edited_time) {
				markdown += `- **Last Edited:** ${new Date(db.last_edited_time).toLocaleDateString()}\n`;
			}

			markdown += "\n";
		}
	}

	return markdown;
}
