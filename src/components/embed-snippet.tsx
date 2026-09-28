"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function subscribeToOrigin() {
  return () => {};
}

export function EmbedSnippet() {
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => "https://YOUR_DOMAIN",
  );
  const [copied, setCopied] = useState<"iframe" | "script" | null>(null);

  const iframe = `<iframe
  src="${origin}/embed"
  title="Chat with Avery from AudioLink"
  style="width:100%;max-width:760px;height:620px;border:0;border-radius:20px;display:block;"
  loading="lazy"
></iframe>`;

  const script = `<script src="${origin}/embed.js" data-height="620"></script>`;

  async function copy(kind: "iframe" | "script", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-4">
      <Snippet
        title="Iframe"
        code={iframe}
        copied={copied === "iframe"}
        onCopy={() => copy("iframe", iframe)}
      />
      <Snippet
        title="One-line script"
        code={script}
        copied={copied === "script"}
        onCopy={() => copy("script", script)}
      />
    </div>
  );
}

function Snippet({
  title,
  code,
  copied,
  onCopy,
}: {
  title: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button type="button" variant="outline" className="h-8 rounded-full bg-card" onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-2xl bg-booth p-4 text-xs leading-relaxed text-paper">
        <code>{code}</code>
      </pre>
    </div>
  );
}
