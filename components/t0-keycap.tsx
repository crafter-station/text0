"use client";

import { SpinnerIcon } from "@/components/ui/icons/spinner";
import { T0Logo } from "@/components/ui/icons/t0-logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
interface KeyProps {
	char: string;
	span?: boolean;
	active?: boolean;
	onClick: () => void;
	onMouseDown: () => void;
	onMouseUp: () => void;
	onKeyDown?: (e: React.KeyboardEvent) => void;
	onKeyUp?: (e: React.KeyboardEvent) => void;
	tabIndex?: number;
}

const Key: React.FC<KeyProps> = ({
	char,
	span,
	active,
	onClick,
	onMouseDown,
	onMouseUp,
	onKeyDown,
	onKeyUp,
	tabIndex = 0,
}) => {
	return (
		<div
			className={`key p-2 ${span ? "span" : ""} ${active ? "active" : ""}`}
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseUp={onMouseUp}
			onKeyDown={onKeyDown}
			onKeyUp={onKeyUp}
			tabIndex={tabIndex}
		>
			<div
				onClick={onClick}
				className="side"
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
			/>
			<div
				className="top"
				onClick={onClick}
				onKeyDown={onKeyDown}
				onKeyUp={onKeyUp}
			/>
			{active ? (
				<SpinnerIcon className="char h-10 w-10 animate-spin" />
			) : (
				<T0Logo className="char h-10 w-10 transition-transform" />
			)}
		</div>
	);
};

const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="column">{children}</div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="row">{children}</div>
);

const useSetState = (initialState: string[] = []) => {
	const [state, setState] = useState(new Set(initialState));

	const add = (item: string) => setState((state) => new Set(state.add(item)));
	const remove = (item: string) => {
		setState((state) => {
			const newState = new Set(state);
			newState.delete(item);
			return newState;
		});
		return state;
	};

	return {
		set: state,
		add,
		remove,
		has: (char: string) => state.has(char),
	};
};

const useSound = (url: string) => {
	const audio = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		audio.current = new Audio(url);
	}, [url]);

	return {
		play: () => {
			if (audio.current) {
				audio.current.currentTime = 0;
				audio.current
					.play()
					.catch((err) => console.log("Audio play error:", err));
			}
		},
		stop: () => {
			if (audio.current) {
				audio.current.pause();
				audio.current.currentTime = 0;
			}
		},
	};
};

export const T0Keycap: React.FC = () => {
	const router = useRouter();
	const { add, remove, has } = useSetState([]);
	const { play, stop } = useSound("/keytype.mp3");
	const [isNavigating, setIsNavigating] = useState(false);
	const isMobile = useIsMobile();

	const handleNavigation = useCallback(() => {
		setIsNavigating(true);
		router.push("/sign-in");
	}, [router]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "t" && !isNavigating) {
				add(e.key);
				stop();
				play();
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "t" && !isNavigating) {
				remove(e.key);
				handleNavigation();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, [add, remove, play, stop, isNavigating, handleNavigation]);

	const handleClick = (char: string) => {
		if (isNavigating) return;
		add(char);
		stop();
		play();
		setTimeout(() => {
			remove(char);
			handleNavigation();
		}, 100);
	};

	const handleMouseDown = (char: string) => {
		if (isNavigating) return;
		add(char);
		stop();
		play();
	};

	const handleMouseUp = (char: string) => {
		if (isNavigating) return;
		remove(char);
		handleNavigation();
	};

	const handleKeyDown = (char: string, e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (isNavigating) return;
			add(char);
			stop();
			play();
		}
	};

	const handleKeyUp = (char: string, e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (isNavigating) return;
			remove(char);
			handleNavigation();
		}
	};

	const keys = (chars: string[], spans: boolean[] = []) =>
		chars.map((char, i) => (
			<Key
				key={char}
				char={char}
				span={spans[i] || false}
				active={has(char) || isNavigating}
				onClick={() => handleClick(char)}
				onMouseDown={() => handleMouseDown(char)}
				onMouseUp={() => handleMouseUp(char)}
				onKeyDown={(e) => handleKeyDown(char, e)}
				onKeyUp={(e) => handleKeyUp(char, e)}
			/>
		));

	return (
		<div className={cn("keyboard", "relative")}>
			<Column>
				<Row>{keys(["t"])}</Row>
			</Column>
			<div className="cover" />
			<button
				disabled={!isMobile}
				className="-inset-30 absolute z-10 bg-transparent sm:hidden"
				onClick={() => {
					if (isMobile) {
						handleNavigation();
					}
				}}
				type="button"
			/>
		</div>
	);
};
