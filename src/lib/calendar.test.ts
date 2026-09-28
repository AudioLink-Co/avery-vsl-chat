import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  CALENDAR_TIME_ZONE,
  DEFAULT_BOOKING_URL,
  getBookingUrl,
  listSuggestedSlots,
  type SuggestedSlot,
} from "./calendar";

const wednesdayMorning = new Date("2026-09-30T15:00:00.000Z");

function chicagoHour(iso: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date(iso));
  return Number(hour);
}

function chicagoWeekday(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE,
    weekday: "short",
  }).format(new Date(iso));
}

describe("listSuggestedSlots", () => {
  it("ignores product questions", () => {
    const result = listSuggestedSlots("What does Broadcast cost?", wednesdayMorning);
    assert.equal(result.matched, false);
    assert.deepEqual(result.slots, []);
  });

  it("suggests weekday mornings in Central time", () => {
    const result = listSuggestedSlots("mornings", wednesdayMorning);
    assert.equal(result.matched, true);
    assert.ok(result.slots.length >= 2 && result.slots.length <= 4);

    for (const slot of result.slots) {
      const hour = chicagoHour(slot.startIso);
      const weekday = chicagoWeekday(slot.startIso);
      assert.ok(hour >= 9 && hour <= 11, `${slot.label} should be a morning`);
      assert.ok(weekday !== "Sat" && weekday !== "Sun");
      assert.match(slot.label, /CT$/);
      assert.match(slot.timeLabel, /CT$/);
    }

    const first = result.slots[0];
    assert.equal(first?.dayLabel, "Thursday, October 1");
    assert.equal(chicagoHour(first!.startIso), 10);
  });

  it("keeps Tuesday and Thursday after 2 in the afternoon", () => {
    const result = listSuggestedSlots("Tue/Thu after 2", wednesdayMorning);
    assert.ok(result.slots.length >= 2 && result.slots.length <= 4);

    for (const slot of result.slots) {
      const weekday = chicagoWeekday(slot.startIso);
      const hour = chicagoHour(slot.startIso);
      assert.ok(weekday === "Tue" || weekday === "Thu", slot.label);
      assert.ok(hour >= 14 && hour <= 16, slot.label);
    }
  });

  it("includes Sunday only when they ask for it", () => {
    const result = listSuggestedSlots("Sunday afternoon", wednesdayMorning);
    assert.ok(result.slots.some((slot) => chicagoWeekday(slot.startIso) === "Sun"));
    assert.ok(
      result.slots.every((slot) => chicagoHour(slot.startIso) >= 13 && chicagoHour(slot.startIso) <= 15),
    );
  });

  it("stores a January morning at 15:00 UTC (CST)", () => {
    const mondayNoonCst = new Date("2026-01-05T18:00:00.000Z");
    const result = listSuggestedSlots("Tuesday at 9am", mondayNoonCst);
    const slot = result.slots[0];
    assert.ok(slot);
    assert.equal(slot.startIso, "2026-01-06T15:00:00.000Z");
    assert.equal(slot.label.includes("9:00 AM CT"), true);
  });
});

describe("getBookingUrl", { concurrency: 1 }, () => {
  const previous = process.env.NEXT_PUBLIC_BOOKING_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_BOOKING_URL;
    } else {
      process.env.NEXT_PUBLIC_BOOKING_URL = previous;
    }
  });

  it("uses the live AudioLink calendar and does not deep-link a time", () => {
    delete process.env.NEXT_PUBLIC_BOOKING_URL;
    const slot: SuggestedSlot = listSuggestedSlots("mornings", wednesdayMorning).slots[0]!;
    assert.equal(getBookingUrl(), DEFAULT_BOOKING_URL);
    assert.equal(getBookingUrl(slot), DEFAULT_BOOKING_URL);
  });

  it("prefers NEXT_PUBLIC_BOOKING_URL", () => {
    process.env.NEXT_PUBLIC_BOOKING_URL = "https://calendar.example.com/call";
    assert.equal(getBookingUrl(), "https://calendar.example.com/call");
  });
});
