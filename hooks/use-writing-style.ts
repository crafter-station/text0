import { DEFAULT_WRITING_STYLE, writingStyles } from "@/lib/writing-styles";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

const STORAGE_KEY = "selected-writing-style";

const VALID_STYLES = writingStyles.map((style) => style.id);

function safeGetItem(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.error("Failed to read from localStorage", error);
		return null;
	}
}

function safeSetItem(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
	} catch (error) {
		console.error("Failed to write to localStorage", error);
	}
}

function getInitialStyle() {
	if (typeof window !== "undefined") {
		const storedStyle = safeGetItem(STORAGE_KEY);
		if (storedStyle && VALID_STYLES.includes(storedStyle as never)) {
			return storedStyle;
		}
	}
	return DEFAULT_WRITING_STYLE;
}

export function useWritingStyle() {
	const [writingStyle, setWritingStyle] = useQueryState("style", {
		defaultValue: getInitialStyle(),
	});

	useEffect(() => {
		if (writingStyle && VALID_STYLES.includes(writingStyle as never)) {
			safeSetItem(STORAGE_KEY, writingStyle);
		}
	}, [writingStyle]);

	return [writingStyle, setWritingStyle] as const;
}
