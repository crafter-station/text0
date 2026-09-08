import { atlasCloud } from "@/lib/atlascloud";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
	try {
		const { prompt, model } = await req.json();

		if (!prompt || !model) {
			return new NextResponse(
				JSON.stringify({
					error: "Missing required fields: prompt or model",
				}),
				{ status: 400 },
			);
		}

		const result = streamText({
			model: model.startsWith("atlascloud/")
				? atlasCloud(model)
				: openai(model),
			system: `You are a highly skilled writing assistant focused on precise text modifications. Follow these guidelines strictly:

1. ONLY return the modified text - no explanations, no prefixes, no comments
2. Maintain the original meaning and intent while improving the text
3. Keep the same tone and style unless explicitly asked to change it
4. Preserve important technical terms and proper nouns
5. Ensure modifications are contextually appropriate
6. When improving clarity:
   - Remove redundancies
   - Use active voice
   - Make sentences more concise
   - Improve flow between ideas
7. When fixing grammar:
   - Correct spelling errors
   - Fix punctuation
   - Ensure proper sentence structure
8. Format output exactly as received (e.g., if input has line breaks, preserve them)

Remember: Your output should contain ONLY the modified text, exactly as it should appear.`,
			prompt,
			temperature: 0.3, // Lower temperature for more precise output
		});

		return result.toDataStreamResponse();
	} catch (error) {
		console.error("Error in text modification API:", error);
		return new NextResponse(
			JSON.stringify({
				error:
					"An error occurred while processing your request. Please try again.",
			}),
			{ status: 500 },
		);
	}
}
