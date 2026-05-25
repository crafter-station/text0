export type WritingStyleId =
	| "default"
	| "academic"
	| "technical"
	| "humorous"
	| "essay"
	| "divulgative";

export interface WritingStyle {
	id: WritingStyleId;
	name: string;
	description: string;
	/** Lucide icon key mapped to a component in the selector UI. */
	icon: string;
	/** System-prompt fragment appended to the assistant prompt. Empty for the default style. */
	prompt: string;
}

export const DEFAULT_WRITING_STYLE: WritingStyleId = "default";

export const writingStyles: WritingStyle[] = [
	{
		id: "default",
		name: "Default",
		description: "Balanced, adaptive tone that fits everyday writing",
		icon: "sparkles",
		prompt: "",
	},
	{
		id: "academic",
		name: "Academic",
		description:
			"Formal, precise, and well-structured for research or scholarly content",
		icon: "graduation-cap",
		prompt:
			"Write in an academic style: formal, precise, and well-structured. Use scholarly vocabulary, maintain an objective third-person voice, support claims with reasoning, and organize ideas logically with clear topic sentences.",
	},
	{
		id: "technical",
		name: "Technical / Professional",
		description:
			"Intuitive yet serious, ideal for industry-specific or expert discussions",
		icon: "briefcase",
		prompt:
			"Write in a technical, professional style: clear, accurate, and serious. Use correct domain terminology, prefer active voice and concise sentences, and prioritize precision and unambiguous explanations suited to an expert audience.",
	},
	{
		id: "humorous",
		name: "Humorous / Witty",
		description:
			"Lighthearted and engaging, perfect for casual or entertaining content",
		icon: "laugh",
		prompt:
			"Write in a humorous, witty style: lighthearted, playful, and engaging. Use clever wordplay and light jokes while still conveying the intended message clearly and never sacrificing accuracy for the joke.",
	},
	{
		id: "essay",
		name: "Essay",
		description:
			"Thoughtful and reflective, well-articulated for in-depth analysis or opinion",
		icon: "feather",
		prompt:
			"Write in an essay style: thoughtful, reflective, and well-articulated. Develop ideas with a clear narrative flow, build a coherent argument, and use smooth transitions between paragraphs.",
	},
	{
		id: "divulgative",
		name: "Divulgative",
		description:
			"Clear and accessible, perfect for explaining complex topics to a broad audience",
		icon: "lightbulb",
		prompt:
			"Write in a divulgative (popular-science) style: clear, accessible, and engaging. Explain complex topics in plain language for a general audience, use relatable analogies and concrete examples, and avoid unnecessary jargon.",
	},
];

export function getWritingStyle(id?: string | null): WritingStyle {
	return (
		writingStyles.find((style) => style.id === id) ??
		writingStyles.find((style) => style.id === DEFAULT_WRITING_STYLE) ??
		writingStyles[0]
	);
}

/** Returns the system-prompt fragment for a style id, or an empty string for the default style. */
export function getWritingStylePrompt(id?: string | null): string {
	return getWritingStyle(id).prompt;
}
