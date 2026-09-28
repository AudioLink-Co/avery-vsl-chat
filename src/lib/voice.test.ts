import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const kb = readFileSync(new URL("../../kb/audiolink.md", import.meta.url), "utf8");
const prompt = readFileSync(new URL("./prompt.ts", import.meta.url), "utf8");
const copy = readFileSync(new URL("./copy.ts", import.meta.url), "utf8");

const locked = [
  "Hey, I'm Avery, an AI team member with AudioLink.",
  "Happy you're here.",
  "Not a pitch. Book a call.",
  "yes, AudioLink does remote mixing; walkthroughs run about 30 minutes; and the team can share how the setup works live.",
  "30-minute meeting, stacked, with no buffer",
  "https://calendar.audiolink.co/audiolink-call-579300",
  "$2,500",
  "$5,000",
  "$7,000",
];

describe("Avery voice", () => {
  for (const line of locked) {
    it(`knowledge base includes ${line.slice(0, 48)}`, () => {
      assert.ok(kb.includes(line), line);
    });
  }

  it("does not teach her to quote a discount amount", () => {
    assert.equal(kb.includes("$1,500"), false);
    assert.equal(kb.includes("$1,750"), false);
    assert.equal(kb.includes("$3,000"), false);
  });

  it("prompt reuses the disclosure, FAQ, and booking voice", () => {
    assert.match(prompt, /AVERY_DISCLOSURE/);
    assert.match(prompt, /AVERY_FAQ/);
    assert.match(copy, /AVERY_BOOKING_VOICE/);
    assert.match(copy, /stacked, with no buffer/);
  });
});
