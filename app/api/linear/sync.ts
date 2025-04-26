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
import { LinearClient } from "@linear/sdk";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { NextResponse } from "next/server";

// Create a unique key for Linear references by user
const LINEAR_REFERENCE_KEY = (userId: string) => `linear:reference:${userId}`;

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
					"linear",
				);
			oauthTokens = oauthTokensResponse.data;
		} catch (error) {
			if (error instanceof ClerkAPIResponseError) {
				return NextResponse.json(
					{
						error: "Failed to retrieve Linear OAuth token",
						details: error.errors,
					},
					{ status: 400 },
				);
			}
			throw error;
		}

		if (!oauthTokens || oauthTokens.length === 0) {
			return NextResponse.json(
				{ error: "Linear OAuth token not found for this user" },
				{ status: 400 },
			);
		}

		const token = oauthTokens[0].token;

		// Initialize Linear Client with the access token
		const linearClient = new LinearClient({
			accessToken: token,
		});

		// Fetch the current user (viewer)
		const user = await linearClient.viewer;
		if (!user) {
			return NextResponse.json(
				{ error: "Failed to fetch user data from Linear" },
				{ status: 400 },
			);
		}

		// Fetch the user's assigned issues
		const assignedIssues = await user.assignedIssues();
		const issues = assignedIssues.nodes.map((issue) => ({
			id: issue.id,
			title: issue.title,
			description: issue.description ?? "No description",
			url: issue.url,
			createdAt: issue.createdAt.toString(),
			updatedAt: issue.updatedAt.toString(),
		}));

		// Fetch the user's teams
		const teams = await linearClient.teams();
		const teamData = teams.nodes.map((team) => ({
			id: team.id,
			name: team.name,
			description: team.description ?? "No description",
			createdAt: team.createdAt.toString(),
		}));

		// Check if a Linear reference already exists for this user
		const existingReferenceId = await redis.get(
			LINEAR_REFERENCE_KEY(session.userId),
		);
		let referenceId: string;
		let isNewReference = false;

		// If no reference exists, create a new one
		if (!existingReferenceId) {
			referenceId = nanoid();
			isNewReference = true;
			// Store the mapping of user to Linear reference
			await redis.set(LINEAR_REFERENCE_KEY(session.userId), referenceId);
		} else {
			// Use the existing reference ID
			referenceId = existingReferenceId as string;
		}

		// Create markdown content from Linear data
		const markdownContent = formatLinearDataAsMarkdown({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				displayName: user.displayName,
			},
			issues,
			teams: teamData,
		});

		// Create or update reference entry in Redis
		const referenceInfo = {
			id: referenceId,
			userId: session.userId,
			name: "Linear Issues & Teams",
			url: "https://linear.app",
			processed: false,
			chunksCount: 0,
			uploadedAt: new Date().toISOString(),
		} satisfies Reference;

		await redis.hset(REFERENCE_KEY(referenceId), referenceInfo);

		// If it's an existing reference, log that we're updating
		if (!isNewReference) {
			console.log(`Updating existing Linear reference: ${referenceId}`);
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
		console.error("Error in Linear sync route:", error);
		return NextResponse.json(
			{ error: "Internal server error", details: String(error) },
			{ status: 500 },
		);
	}
}

interface LinearData {
	user: {
		id: string;
		name: string;
		email: string;
		displayName: string;
	};
	issues: {
		id: string;
		title: string;
		description: string;
		url: string;
		createdAt: string;
		updatedAt: string;
	}[];
	teams: {
		id: string;
		name: string;
		description: string;
		createdAt: string;
	}[];
}

function formatLinearDataAsMarkdown(data: LinearData): string {
	let markdown = "# Linear Data\n\n";

	// User section
	markdown += "## User\n\n";
	markdown += `- **Name:** ${data.user.name || data.user.displayName}\n`;
	markdown += `- **Email:** ${data.user.email}\n\n`;

	// Teams section
	markdown += "## Teams\n\n";
	if (data.teams.length === 0) {
		markdown += "No teams found.\n\n";
	} else {
		for (const team of data.teams) {
			markdown += `### ${team.name}\n\n`;
			markdown += `${team.description}\n\n`;
			markdown += `- **Created At:** ${new Date(team.createdAt).toLocaleDateString()}\n\n`;
		}
	}

	// Issues section
	markdown += "## Issues\n\n";
	if (data.issues.length === 0) {
		markdown += "No issues assigned.\n\n";
	} else {
		for (const issue of data.issues) {
			markdown += `### ${issue.title}\n\n`;
			markdown += `${issue.description}\n\n`;
			markdown += `- **Created:** ${new Date(issue.createdAt).toLocaleDateString()}\n`;
			markdown += `- **Updated:** ${new Date(issue.updatedAt).toLocaleDateString()}\n`;
			markdown += `- **URL:** ${issue.url}\n\n`;
		}
	}

	return markdown;
}
