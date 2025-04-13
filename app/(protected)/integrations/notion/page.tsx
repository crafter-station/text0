"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotionIcon } from "@/components/ui/icons/notion";
import {
	CheckCircle2,
	AlertCircle,
	Database,
	FileText,
	Calendar,
} from "lucide-react";
import Link from "next/link";

interface NotionUser {
	id: string;
	name: string;
	avatar_url: string | null;
	email?: string;
	workspace_name?: string;
}

interface NotionPage {
	id: string;
	title: string;
	url: string;
	last_edited_time: string;
	status: string;
	priority?: string;
	dates?: { start: string | null; end: string | null };
	icon_url?: string;
}

interface NotionDatabase {
	id: string;
	title: string;
	url: string;
	last_edited_time: string;
	description: string;
	icon_url?: string;
}

interface RawNotionPage {
	id: string;
	properties: {
		"Project name": {
			title: {
				plain_text: string;
			}[];
		};
		Status: {
			status: {
				name: string;
			};
		};
		Priority: {
			select: {
				name: string;
			};
		};
		Dates: {
			date: {
				start: string | null;
				end: string | null;
			};
		};
	};
	url: string;
	last_edited_time: string;
	icon: {
		external: {
			url: string;
		};
	};
}

interface RawNotionDatabase {
	id: string;
	title: {
		plain_text: string;
	}[];
	url: string;
	last_edited_time: string;
	description: {
		plain_text: string;
	}[];
	icon: {
		external: {
			url: string;
		};
	};
}

export default function NotionIntegrationPage() {
	const { user, isLoaded: userLoaded } = useUser();
	const [notionUser, setNotionUser] = useState<NotionUser | null>(null);
	const [pages, setPages] = useState<NotionPage[]>([]);
	const [databases, setDatabases] = useState<NotionDatabase[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<{
		message: string;
		details?: unknown;
	} | null>(null);

	const isConnected = user?.externalAccounts?.some(
		(account) => account.provider === "notion",
	);

	useEffect(() => {
		async function fetchNotionData() {
			if (!userLoaded || !isConnected) {
				setLoading(false);
				return;
			}

			try {
				const response = await fetch("/api/notion/data", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error, { cause: errorData });
				}

				const data = await response.json();
				console.log({ data });

				// Map user data
				const botUser = data.user;
				setNotionUser({
					id: botUser.bot.owner.user.id,
					name: botUser.bot.owner.user.name,
					avatar_url: botUser.bot.owner.user.avatar_url,
					email: botUser.bot?.owner?.user?.person?.email || undefined,
					workspace_name: botUser.bot?.workspace_name || undefined,
				});

				// Map pages data
				setPages(
					data.pages.map((page: RawNotionPage) => ({
						id: page.id,
						title:
							page.properties?.["Project name"]?.title?.[0]?.plain_text ||
							"Untitled",
						url: page.url,
						last_edited_time: page.last_edited_time,
						status: page.properties?.Status?.status?.name || "Unknown",
						priority: page.properties?.Priority?.select?.name || undefined,
						dates: page.properties?.Dates?.date
							? {
									start: page.properties.Dates.date.start || null,
									end: page.properties.Dates.date.end || null,
								}
							: undefined,
						icon_url: page.icon?.external?.url || undefined,
					})),
				);
				// Map databases data
				setDatabases(
					data.databases.map((db: RawNotionDatabase) => ({
						id: db.id,
						title: db.title?.[0]?.plain_text || "Untitled",
						url: db.url,
						last_edited_time: db.last_edited_time,
						description: db.description?.[0]?.plain_text || "No description",
						icon_url: db.icon?.external?.url || undefined,
					})),
				);
			} catch (err: unknown) {
				if (err instanceof Error) {
					setError({
						message: err.message,
						details: err.cause,
					});
				} else {
					setError({ message: "An unknown error occurred" });
				}
			} finally {
				setLoading(false);
			}
		}

		fetchNotionData();
	}, [userLoaded, isConnected]);

	const handleDisconnect = async () => {
		try {
			const response = await fetch("/api/notion/disconnect", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error, { cause: errorData });
			}

			const data = await response.json();
			if (data.redirectUrl) {
				window.open(data.redirectUrl, "_blank");
				setTimeout(() => {
					window.location.href = "/integrations";
				}, 2000);
			}
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError({
					message: err.message,
					details: err.cause,
				});
			} else {
				setError({ message: "An unknown error occurred" });
			}
		}
	};

	if (!userLoaded || loading) {
		return (
			<div className="flex justify-center items-center h-full">
				<p>Loading...</p>
			</div>
		);
	}

	if (!isConnected) {
		return (
			<div className="p-8">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<NotionIcon className="h-6 w-6" />
							<span>Notion Integration</span>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground mb-4">
							Connect your Notion account to access your pages and databases.
						</p>
						<Button asChild>
							<Link href="/sign-in?redirect=/integrations/notion">
								Connect Notion
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-8">
				<Card>
					<CardContent>
						<p className="text-red-500">Error: {error.message}</p>
						<pre className="text-sm text-gray-500 mt-2">
							Details: {JSON.stringify(error.details ?? {}, null, 2)}
						</pre>
						<Button variant="outline" className="mt-4" asChild>
							<Link href="/sign-in?redirect=/integrations/notion">
								Reconnect Notion
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-full flex-1 flex-col space-y-8 p-8">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<NotionIcon className="h-8 w-8" />
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Notion Integration
						</h2>
						<p className="text-muted-foreground">
							Manage your Notion pages and databases
						</p>
					</div>
					<Badge
						variant="default"
						className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
					>
						<CheckCircle2 className="mr-1 h-3 w-3" />
						Connected
					</Badge>
				</div>
				<Button variant="outline" onClick={handleDisconnect}>
					Disconnect
				</Button>
			</div>

			{/* User Profile */}
			{notionUser && (
				<Card>
					<CardHeader>
						<CardTitle>User Profile</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center space-x-4">
						{notionUser.avatar_url && (
							<img
								src={notionUser.avatar_url}
								alt={notionUser.name}
								className="w-16 h-16 rounded-full"
							/>
						)}
						<div>
							<h3 className="text-lg font-medium">{notionUser.name}</h3>
							{notionUser.email && (
								<p className="text-sm text-muted-foreground">
									Email: {notionUser.email}
								</p>
							)}
							{notionUser.workspace_name && (
								<p className="text-sm text-muted-foreground">
									Workspace: {notionUser.workspace_name}
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Pages */}
			<Card>
				<CardHeader>
					<CardTitle>Pages (Projects)</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4">
						{pages.length === 0 && (
							<p className="text-muted-foreground">No pages found.</p>
						)}
						{pages.map((page) => (
							<div
								key={page.id}
								className="flex items-center justify-between border-b py-2"
							>
								<div className="flex items-center space-x-3">
									{page.icon_url && (
										<img
											src={page.icon_url}
											alt="Page Icon"
											className="w-6 h-6"
										/>
									)}
									<div>
										<Link
											href={page.url}
											target="_blank"
											className="text-blue-500 hover:underline"
										>
											{page.title}
										</Link>
										<div className="flex items-center space-x-4 mt-1">
											<Badge
												variant={
													page.status === "In progress"
														? "default"
														: page.status === "Planning"
															? "secondary"
															: "outline"
												}
												className={
													page.status === "In progress"
														? "bg-yellow-500/10 text-yellow-500"
														: page.status === "Planning"
															? "bg-blue-500/10 text-blue-500"
															: "bg-gray-500/10 text-gray-500"
												}
											>
												{page.status}
											</Badge>
											{page.priority && (
												<Badge
													variant="outline"
													className={
														page.priority === "High"
															? "text-red-500"
															: page.priority === "Medium"
																? "text-yellow-500"
																: "text-green-500"
													}
												>
													Priority: {page.priority}
												</Badge>
											)}
											<span className="text-sm text-muted-foreground flex items-center">
												<Calendar className="h-4 w-4 mr-1" />
												{page.dates?.start
													? `${new Date(page.dates.start).toLocaleDateString()} - ${
															page.dates.end
																? new Date(page.dates.end).toLocaleDateString()
																: "No end date"
														}`
													: "No dates"}
											</span>
											<span className="text-sm text-muted-foreground">
												Last Edited:{" "}
												{new Date(page.last_edited_time).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
								<Button variant="outline" asChild>
									<Link href={page.url} target="_blank">
										View in Notion
									</Link>
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Databases */}
			<Card>
				<CardHeader>
					<CardTitle>Databases</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4">
						{databases.length === 0 && (
							<p className="text-muted-foreground">No databases found.</p>
						)}
						{databases.map((db) => (
							<div
								key={db.id}
								className="flex items-center justify-between border-b py-2"
							>
								<div className="flex items-center space-x-3">
									{db.icon_url && (
										<img
											src={db.icon_url}
											alt="Database Icon"
											className="w-6 h-6"
										/>
									)}
									<div>
										<Link
											href={db.url}
											target="_blank"
											className="text-blue-500 hover:underline"
										>
											{db.title}
										</Link>
										<div className="flex items-center space-x-4 mt-1">
											<span className="text-sm text-muted-foreground">
												{db.description}
											</span>
											<span className="text-sm text-muted-foreground">
												Last Edited:{" "}
												{new Date(db.last_edited_time).toLocaleDateString()}
											</span>
										</div>
									</div>
								</div>
								<Button variant="outline" asChild>
									<Link href={db.url} target="_blank">
										View in Notion
									</Link>
								</Button>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
