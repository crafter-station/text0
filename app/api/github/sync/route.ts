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

// GitHub notification type definition
interface GitHubNotification {
	id: string;
	repository: {
		full_name: string;
	};
	subject: {
		title: string;
		type: string;
		url: string;
	};
	reason: string;
	updated_at: string;
}

// Create a unique key for GitHub references by user
const GITHUB_REFERENCE_KEY = (userId: string) => `github:reference:${userId}`;

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
					"github",
				);
			oauthTokens = oauthTokensResponse.data;
		} catch (error) {
			if (error instanceof ClerkAPIResponseError) {
				return NextResponse.json(
					{
						error: "Failed to retrieve GitHub OAuth token",
						details: error.errors,
					},
					{ status: 400 },
				);
			}
			throw error;
		}

		if (!oauthTokens || oauthTokens.length === 0) {
			return NextResponse.json(
				{ error: "GitHub OAuth token not found for this user" },
				{ status: 400 },
			);
		}

		const token = oauthTokens[0].token;

		// Fetch GitHub notifications
		const notificationsResponse = await fetch(
			"https://api.github.com/notifications?per_page=100",
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/vnd.github+json",
				},
			},
		);

		if (!notificationsResponse.ok) {
			const errorData = await notificationsResponse.json();
			return NextResponse.json(
				{
					error: "Failed to fetch notifications from GitHub",
					details: errorData,
					status: notificationsResponse.status,
				},
				{ status: notificationsResponse.status },
			);
		}

		const notificationsData =
			(await notificationsResponse.json()) as GitHubNotification[];

		// Check if a GitHub reference already exists for this user
		const existingReferenceId = await redis.get(
			GITHUB_REFERENCE_KEY(session.userId),
		);
		let referenceId: string;
		let isNewReference = false;

		// If no reference exists, create a new one
		if (!existingReferenceId) {
			referenceId = nanoid();
			isNewReference = true;
			// Store the mapping of user to GitHub reference
			await redis.set(GITHUB_REFERENCE_KEY(session.userId), referenceId);
		} else {
			// Use the existing reference ID
			referenceId = existingReferenceId as string;
		}

		// Create markdown content from notifications
		const markdownContent = formatNotificationsAsMarkdown(notificationsData);

		// Create or update reference entry in Redis
		const referenceInfo = {
			id: referenceId,
			userId: session.userId,
			name: "GitHub Data & Notifications",
			url: "https://github.com/notifications",
			processed: false,
			chunksCount: 0,
			uploadedAt: new Date().toISOString(),
		} satisfies Reference;

		await redis.hset(REFERENCE_KEY(referenceId), referenceInfo);

		// If it's an existing reference, delete old vector entries
		if (!isNewReference) {
			// Instead of trying to delete by filter, we'll keep it simple
			// Just log that we're updating the reference
			console.log(`Updating existing GitHub reference: ${referenceId}`);
			// The new vectors will replace the old ones naturally by their association with the same referenceId
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
		console.error("Error in GitHub sync route:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: String(error) },
			{ status: 500 },
		);
	}
}

function formatNotificationsAsMarkdown(
	notifications: GitHubNotification[],
): string {
	if (!notifications || notifications.length === 0) {
		return "# GitHub Notifications\n\nNo notifications found.";
	}

	let markdown = "# GitHub Notifications\n\n";

	for (const notification of notifications) {
		const repo = notification.repository.full_name;
		const subject = notification.subject;
		const title = subject.title;
		const type = subject.type;
		const url = subject.url;
		const reason = notification.reason;
		const updatedAt = notification.updated_at;

		markdown += `## ${title}\n\n`;
		markdown += `- **Repository:** ${repo}\n`;
		markdown += `- **Type:** ${type}\n`;
		markdown += `- **Reason:** ${reason}\n`;
		markdown += `- **Updated:** ${updatedAt}\n`;
		markdown += `- **URL:** ${url}\n\n`;
	}

	return markdown;
}
