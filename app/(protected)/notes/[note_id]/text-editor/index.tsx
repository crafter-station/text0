"use client";

import { useCompletion } from "@ai-sdk/react";
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Maximize2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModel } from "@/hooks/use-model";
import { AIChatSidebar } from "@/app/(protected)/notes/[note_id]/text-editor/ai-chat-sidebar";
import { TextSelectionMenu } from "@/components/text-selection-menu";
import { InlineDiffView } from "@/components/inline-diff-view";
import { EditableNoteName } from "@/components/editable-note-name";
import useDebouncedCallback from "@/hooks/use-debounced-callback";

export function TextEditor({
  initialContent,
  noteId,
  initialName,
}: Readonly<{
  initialContent: string;
  noteId: string;
  initialName: string;
}>) {
  const [model] = useModel();
  const editorRef = React.useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] =
    React.useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(true);
  const [isZenMode, setIsZenMode] = React.useState(false);
  const {
    completion,
    input,
    setInput,
    handleSubmit: handleSubmitAI,
    stop: stopAI,
    setCompletion,
  } = useCompletion({
    api: `/api/completion?model=${model}`,
    initialInput: initialContent,
  });

  const [selectedText, setSelectedText] = React.useState("");
  const [selectionPosition, setSelectionPosition] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedRange, setSelectedRange] = React.useState<Range | null>(null);

  const [pendingUpdate, setPendingUpdate] = React.useState<string | null>(null);

  const debouncedUpdateContent = useDebouncedCallback(
    (noteId: string, content: string) => {
      fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    3000
  );

  React.useEffect(() => {
    if (!isAutocompleteEnabled) {
      setCompletion("");
    }
  }, [isAutocompleteEnabled, setCompletion]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isAutocompleteEnabled) {
        handleSubmitAI();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [handleSubmitAI, isAutocompleteEnabled]);

  React.useEffect(() => {
    if (editorRef.current && cursorPosition === -1) {
      editorRef.current.selectionStart = editorRef.current.selectionEnd =
        input.length;
      setCursorPosition(input.length);
    }
  }, [input, cursorPosition]);

  // Handle zen mode toggle with keyboard shortcut
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
        if (!isZenMode) {
          setIsAIChatOpen(false);
          // Request full screen when entering zen mode
          document.documentElement.requestFullscreen().catch((err) => {
            console.log("Error attempting to enable full-screen mode:", err);
          });
        } else if (document.fullscreenElement) {
          // Exit full screen when leaving zen mode
          document.exitFullscreen().catch((err) => {
            console.log("Error attempting to exit full-screen mode:", err);
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isZenMode]);

  // Handle AI Chat toggle with keyboard shortcut
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsAIChatOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && completion) {
      e.preventDefault();
      const completionText = parseCompletion(completion, input);
      stopAI();
      setCompletion("");
      const newText = input + completionText;
      setInput(newText);
      setCursorPosition(-1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      stopAI();
      setCompletion("");
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    stopAI();
    setInput(newText);
    setCursorPosition(e.target.selectionStart);
  };

  const handleSelectionChange = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection?.toString()) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        // Get textarea position and scroll
        const textareaRect = editorRef.current.getBoundingClientRect();
        const scrollTop = editorRef.current.scrollTop;

        // Get selection coordinates and full text
        const startCoords = getCaretCoordinates(
          editorRef.current,
          editorRef.current.selectionStart
        );
        const fullText = editorRef.current.value;

        // Calculate line information
        const lines = fullText.split("\n");
        let currentPos = 0;
        let selectionStartLine = -1;
        let positionInLine = 0;

        // Find which line contains the selection start
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + 1; // +1 for newline
          if (currentPos + lineLength > editorRef.current.selectionStart) {
            selectionStartLine = i;
            positionInLine = editorRef.current.selectionStart - currentPos;
            break;
          }
          currentPos += lineLength;
        }

        // Calculate average character width using a test span
        const testSpan = document.createElement("span");
        testSpan.style.font = getComputedStyle(editorRef.current).font;
        testSpan.style.visibility = "hidden";
        testSpan.style.position = "absolute";
        testSpan.textContent = selectedText;
        document.body.appendChild(testSpan);
        const charWidth = testSpan.offsetWidth / selectedText.length;
        document.body.removeChild(testSpan);

        // Calculate center based on character count and line position
        const MAX_CHARS = 98;
        const totalChars = selectedText.length;

        let effectiveLength: number;
        if (selectionStartLine >= 0) {
          const lineStartToSelection = positionInLine;
          if (lineStartToSelection > MAX_CHARS) {
            // If selection starts after line wrap, use modulo
            effectiveLength = lineStartToSelection % MAX_CHARS;
          } else if (totalChars > MAX_CHARS) {
            // If selection is longer than max chars, limit to max
            effectiveLength = MAX_CHARS;
          } else {
            // Otherwise use actual length
            effectiveLength = totalChars;
          }
        } else {
          effectiveLength = Math.min(totalChars, MAX_CHARS);
        }

        const selectionWidth = effectiveLength * charWidth;
        const centerX =
          textareaRect.left + startCoords.left + selectionWidth / 2;
        const y = textareaRect.top + startCoords.top - scrollTop;

        // Store the range and text
        setSelectedRange(range.cloneRange());
        setSelectedText(selectedText);

        // Position menu at the exact center
        setSelectionPosition({
          x: centerX,
          y: y,
        });
      } else {
        setSelectedText("");
        setSelectionPosition(null);
        setSelectedRange(null);
      }
    }
  };

  // Add helper function to calculate caret coordinates
  function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const div = document.createElement("div");
    const styles = getComputedStyle(element);
    const properties = [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "wordWrap",
      "whiteSpace",
      "borderLeftWidth",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "paddingLeft",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "lineHeight",
    ];

    for (const prop of properties) {
      // @ts-ignore
      div.style[prop] = styles[prop];
    }

    div.style.position = "absolute";
    div.style.top = "0";
    div.style.left = "0";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";

    const text = element.value.substring(0, position);
    div.textContent = text;

    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    document.body.appendChild(div);
    const coordinates = {
      top:
        span.offsetTop +
        Number.parseInt(styles.borderTopWidth) +
        Number.parseInt(styles.paddingTop),
      left:
        span.offsetLeft +
        Number.parseInt(styles.borderLeftWidth) +
        Number.parseInt(styles.paddingLeft),
    };
    document.body.removeChild(div);

    return coordinates;
  }

  // Restore selection when dropdown opens
  const handleDropdownOpen = (open: boolean) => {
    if (open && selectedRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectedRange);
    }
  };

  const displayedCompletion = parseCompletion(completion, input);

  return (
    <div className="relative w-full h-full bg-background flex">
      <div
        className={cn(
          "flex-1 flex flex-col relative",
          !isAIChatOpen && "pr-0",
          isZenMode && "bg-background/95 fixed inset-0 z-50"
        )}
      >
        <div className="flex h-full justify-center py-4">
          <div className={cn("w-full max-w-4xl h-full pt-8")}>
            <EditableNoteName noteId={noteId} initialName={initialName} />
            <div className="relative w-full h-full flex-1">
              <textarea
                ref={editorRef}
                value={input}
                onChange={(e) => {
                  handleInput(e);
                  debouncedUpdateContent(noteId, e.target.value);
                }}
                onKeyDown={handleKeyDown}
                onSelect={handleSelectionChange}
                onMouseUp={handleSelectionChange}
                placeholder="Start writing..."
                className={cn(
                  "w-full h-full flex-1 outline-none whitespace-pre-wrap font-serif text-lg bg-transparent resize-none placeholder:text-muted-foreground/50 px-8",
                  isZenMode && "text-xl leading-relaxed px-4",
                  pendingUpdate && "opacity-0"
                )}
                style={{
                  caretColor: "var(--primary)",
                }}
              />
              {isAutocompleteEnabled &&
                displayedCompletion &&
                !pendingUpdate && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute flex-1 h-full w-full top-0 left-0 right-0 font-serif pointer-events-none whitespace-pre-wrap",
                      isZenMode
                        ? "text-xl leading-relaxed opacity-30 px-4"
                        : "text-lg w-full opacity-50 px-8"
                    )}
                  >
                    <span className="whitespace-pre-wrap">{input}</span>
                    <span className="text-muted-foreground">
                      {displayedCompletion}
                    </span>
                  </div>
                )}
              {pendingUpdate && (
                <div className="absolute inset-0 flex flex-col">
                  <div
                    className={cn(
                      "absolute flex-1 h-full w-full top-0 left-0 right-0 font-serif",
                      isZenMode
                        ? "text-xl leading-relaxed px-4"
                        : "text-lg px-8"
                    )}
                  >
                    <div className="whitespace-pre-wrap">
                      {/* Content before selection */}
                      <span>
                        {input.substring(
                          0,
                          editorRef.current?.selectionStart ?? 0
                        )}
                      </span>

                      {/* Diff view container with improved styling */}
                      <div className="flex justify-start items-start bg-background/50 backdrop-blur-sm rounded-lg">
                        <InlineDiffView
                          originalText={selectedText}
                          newText={pendingUpdate}
                          className="inline"
                          onAccept={() => {
                            if (editorRef.current) {
                              const start = editorRef.current.selectionStart;
                              const end = editorRef.current.selectionEnd;
                              const newText =
                                input.substring(0, start) +
                                pendingUpdate +
                                input.substring(end);
                              setInput(newText);
                              setPendingUpdate(null);
                            }
                          }}
                          onReject={() => setPendingUpdate(null)}
                        />
                      </div>

                      {/* Content after selection */}
                      <span>
                        {input.substring(editorRef.current?.selectionEnd ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Bottom Bar - Only show when not in Zen mode */}
        {!isZenMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-10 w-full max-w-[38rem] px-4">
            <div className="flex items-center space-x-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm w-full justify-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autocomplete"
                  checked={isAutocompleteEnabled}
                  onCheckedChange={setIsAutocompleteEnabled}
                />
                <Label htmlFor="autocomplete">Enable AI</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {
                  setIsZenMode((prev) => !prev);
                  if (!isZenMode) {
                    setIsAIChatOpen(false);
                    // Request full screen when clicking the button
                    document.documentElement
                      .requestFullscreen()
                      .catch((err) => {
                        console.log(
                          "Error attempting to enable full-screen mode:",
                          err
                        );
                      });
                  } else if (document.fullscreenElement) {
                    // Exit full screen when leaving zen mode
                    document.exitFullscreen().catch((err) => {
                      console.log(
                        "Error attempting to exit full-screen mode:",
                        err
                      );
                    });
                  }
                }}
              >
                <Maximize2 className="h-4 w-4" />
                <span>Zen Mode</span>
                <kbd className="text-muted-foreground/70 inline-flex h-5 max-h-full items-center rounded border px-1 font-mono text-[0.625rem] font-medium ml-2">
                  ⌘J
                </kbd>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsAIChatOpen((prev) => !prev)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>AI Chat</span>
                <kbd className="text-muted-foreground/70 inline-flex h-5 max-h-full items-center rounded border px-1 font-mono text-[0.625rem] font-medium ml-2">
                  ⌘A
                </kbd>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Sidebar - Only show when not in Zen mode */}
      {isAIChatOpen && !isZenMode && (
        <div className="w-80">
          <AIChatSidebar
            content={input}
            isEnabled={isAutocompleteEnabled}
            onEnableChange={setIsAutocompleteEnabled}
            onPendingUpdate={setPendingUpdate}
          />
        </div>
      )}

      {/* Text Selection Menu */}
      {selectedText && selectionPosition && !isZenMode && (
        <div
          className="fixed z-[100]"
          style={{
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            transform: "translate(-50%, 0)", // Center the menu exactly
          }}
        >
          <TextSelectionMenu
            selectedText={selectedText}
            model={model}
            onPendingUpdate={setPendingUpdate}
            onOpenChange={handleDropdownOpen}
          />
        </div>
      )}
    </div>
  );
}

function parseCompletion(completion: string | undefined, input: string) {
  if (!completion) return "";
  const startTag = "<completion>";
  const endTag = "</completion>";
  if (completion.startsWith(startTag) && completion.includes(endTag)) {
    const startIndex = startTag.length;
    const endIndex = completion.indexOf(endTag);
    let result = completion.substring(startIndex, endIndex);
    if (input.endsWith(" ") && result.startsWith(" ")) {
      result = result.trimStart();
    }
    return result;
  }
  return "";
}
