"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AveryPortrait } from "@/components/avery-portrait";
import { MessageText } from "@/components/message-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  describeRequestedWindow,
  type SlotSuggestion,
  type SuggestedSlot,
} from "@/lib/calendar";
import { AVERY_DISCLOSURE, AVERY_GREETING } from "@/lib/copy";
import { cn } from "@/lib/utils";

const STARTERS = [
  "What does AudioLink actually do?",
  "What are the packages?",
  "We already have volunteers. Is this still for us?",
];

export type BookingTarget = "blank" | "self";

export function AveryChat({
  bookingUrl,
  portraitUrl,
  bookingTarget = "blank",
  className,
}: {
  bookingUrl: string;
  portraitUrl?: string | null;
  bookingTarget?: BookingTarget;
  className?: string;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: chatFetch,
      }),
    [],
  );

  const { messages, sendMessage, status, error, stop, clearError, regenerate } = useChat({
    transport,
  });

  const [input, setInput] = useState("");
  const [fallback, setFallback] = useState<SlotSuggestion | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const toolSuggestion = useMemo(() => latestToolSuggestion(messages), [messages]);
  const suggestion = toolSuggestion?.slots.length ? toolSuggestion : fallback;
  const busy = status === "submitted" || status === "streaming";
  const showStarters = messages.length === 0;
  const showTyping = busy && !assistantHasVisibleText(messages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, suggestion, notice, status, error]);

  useEffect(() => {
    const text = latestUserText(messages);
    if (!text) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/slots?hint=${encodeURIComponent(text)}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: SlotSuggestion | null) => {
          if (data?.matched && data.slots.length > 0) {
            setFallback(data);
          }
        })
        .catch(() => undefined);
    }, 150);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [messages]);

  function openCalendar(slot?: SuggestedSlot) {
    const where = bookingTarget === "self" ? "in this window" : "in a new tab";
    setNotice(
      slot
        ? `You asked for ${describeRequestedWindow(slot)}. The calendar is opening ${where}. Pick that time if it's open. Live availability is on the booking page, and this chat can't hold the slot.`
        : `The calendar is opening ${where} with every open time.`,
    );

    if (bookingTarget === "self") {
      window.location.assign(bookingUrl);
      return;
    }

    const opened = window.open(bookingUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      const anchor = document.createElement("a");
      anchor.href = bookingUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    }
  }

  function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    setInput("");
    void sendMessage({ text: trimmed });
  }

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-card text-card-foreground",
        className,
      )}
      aria-label="Chat with Avery"
    >
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-card px-4 py-3">
        <AveryPortrait src={portraitUrl} size={48} className="mt-0.5 shrink-0 ring-2 ring-copper/40" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl leading-none text-ink">Avery</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              AI
            </span>
          </div>
          <p className="mt-1 text-sm leading-snug text-muted-foreground" data-testid="avery-disclosure">
            {AVERY_DISCLOSURE}
          </p>
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 rounded-full bg-copper px-4 text-white hover:bg-copper/90"
          onClick={() => openCalendar()}
        >
          Book a call
        </Button>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
        <MessageBubble portraitUrl={portraitUrl} align="assistant">
          <MessageText text={AVERY_GREETING} />
        </MessageBubble>

        {messages.map((message) => {
          const text = textFromMessage(message);
          if (!text) return null;

          return (
            <MessageBubble
              key={message.id}
              portraitUrl={portraitUrl}
              align={message.role === "user" ? "user" : "assistant"}
            >
              <MessageText text={text} />
            </MessageBubble>
          );
        })}

        {showTyping ? (
          <MessageBubble portraitUrl={portraitUrl} align="assistant">
            <span className="inline-flex items-center gap-1 py-1" aria-label="Avery is typing">
              <Dot />
              <Dot />
              <Dot />
            </span>
          </MessageBubble>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm">
            <p>{friendlyError(error)}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 h-9 rounded-full bg-card"
              onClick={() => regenerate()}
            >
              Try again
            </Button>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {suggestion && suggestion.slots.length > 0 ? (
        <div className="border-t border-border bg-secondary/60 px-4 py-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Suggested windows
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{suggestion.note}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestion.slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className="rounded-full border border-border bg-card px-3 py-2 text-left text-sm font-medium text-ink transition hover:border-copper hover:text-copper"
                onClick={() => openCalendar(slot)}
              >
                {slot.label}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full px-3 py-2 text-sm font-medium text-copper underline-offset-4 hover:underline"
              onClick={() => openCalendar()}
            >
              See all times
            </button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="border-t border-border bg-accent px-4 py-2 text-sm leading-snug text-ink" role="status">
          {notice}
        </p>
      ) : null}

      <form
        className="border-t border-border bg-card p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitText(input);
        }}
      >
        {showStarters ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-2 text-left text-sm text-foreground hover:border-copper"
                onClick={() => submitText(starter)}
              >
                {starter}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <label htmlFor="avery-message" className="sr-only">
            Message Avery
          </label>
          <Textarea
            id="avery-message"
            value={input}
            rows={1}
            maxLength={2000}
            placeholder="Ask about the mix, the packages, or a time to talk"
            disabled={busy}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-background px-4 py-3 text-base md:text-sm"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitText(input);
              }
            }}
          />
          {busy ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-4"
              onClick={() => stop()}
            >
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              className="h-11 rounded-full bg-ink px-4 text-paper hover:bg-ink/90"
              disabled={!input.trim()}
            >
              Send
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Avery is an AI team member. A person from AudioLink joins you on the call.
        </p>
      </form>
    </section>
  );
}

function MessageBubble({
  align,
  portraitUrl,
  children,
}: {
  align: "assistant" | "user";
  portraitUrl?: string | null;
  children: ReactNode;
}) {
  const isUser = align === "user";

  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      {isUser ? (
        <span className="sr-only">You</span>
      ) : (
        <AveryPortrait src={portraitUrl} size={28} className="mb-0.5 shrink-0" />
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-ink text-paper"
            : "rounded-bl-md border border-border bg-background text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn("size-1.5 animate-pulse rounded-full bg-muted-foreground", className)}
    />
  );
}

function textFromMessage(message: UIMessage): string {
  const lines: string[] = [];
  for (const part of message.parts) {
    if (part.type === "text" && part.text.trim()) {
      lines.push(part.text);
    }
  }
  return lines.join("\n\n").trim();
}

function assistantHasVisibleText(messages: UIMessage[]): boolean {
  const message = messages[messages.length - 1];
  if (message?.role !== "assistant") return false;
  return textFromMessage(message).length > 0;
}

function latestUserText(messages: UIMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") continue;
    return textFromMessage(message);
  }
  return "";
}

function latestToolSuggestion(messages: UIMessage[]): SlotSuggestion | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "assistant") continue;
    for (const part of message.parts) {
      const candidate = part as { type: string; state?: string; output?: unknown };
      if (
        candidate.type !== "tool-suggestMeetingTimes" ||
        candidate.state !== "output-available"
      ) {
        continue;
      }
      if (!isSlotSuggestion(candidate.output)) continue;
      return candidate.output;
    }
  }
  return null;
}

function isSlotSuggestion(value: unknown): value is SlotSuggestion {
  if (!value || typeof value !== "object") return false;
  const slots = (value as { slots?: unknown }).slots;
  return Array.isArray(slots);
}

function friendlyError(error: Error): string {
  if (/model key|OPENAI_API_KEY|not configured/i.test(error.message)) {
    return error.message;
  }
  return "Avery couldn't reply just now. You can try again, or book a call and a teammate will cover it.";
}

async function chatFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = "Avery couldn't reply just now. You can try again, or book a call.";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // The status body was not JSON. The fallback sentence is enough.
    }
    throw new Error(message);
  }
  return response;
}
