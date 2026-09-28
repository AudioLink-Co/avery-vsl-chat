import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | undefined;

export function loadKnowledgeBase(): string {
  if (process.env.NODE_ENV === "production" && cached) {
    return cached;
  }

  const markdown = readFileSync(join(process.cwd(), "kb", "audiolink.md"), "utf8");
  cached = markdown;
  return markdown;
}
