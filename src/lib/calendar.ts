/**
 * Meeting times for Avery.
 *
 * MVP booking choice (b): chips do not deep-link a specific slot.
 * GoHighLevel's public calendar does not document a query parameter that
 * preselects a date or time. `getBookingUrl()` returns the clean booking
 * page. The chat tells the lead which Central-time window they asked for
 * and that the calendar shows live openings. Unknown query params are not
 * appended, because they can break a HighLevel booking widget.
 *
 * Phase 2 can replace the body of `listSuggestedSlots` with free/busy from
 * HighLevel (`calendars_get-calendar-events`) and teach `getBookingUrl(slot)`
 * to append a documented deep link. The chip UI should stay as it is.
 * A later `createAppointment` can book without an SMS or email step.
 */

export const DEFAULT_BOOKING_URL =
  "https://calendar.audiolink.co/audiolink-call-579300";

export const CALENDAR_TIME_ZONE = "America/Chicago";

const SLOT_MINUTES = 30;
const SEARCH_DAYS = 21;
const SEARCH_DAYS_EXTENDED = 35;

export type SuggestedSlot = {
  id: string;
  startIso: string;
  endIso: string;
  /** Short chip label, e.g. "Tue, Oct 6 · 2:00 PM CT". */
  label: string;
  /** Spoken day, e.g. "Tuesday, October 6". */
  dayLabel: string;
  /** Spoken time, e.g. "2:00 PM CT". */
  timeLabel: string;
  /** Phase 2: HighLevel event or slot id once free/busy is connected. */
  providerSlotId?: string;
};

export type SlotSuggestion = {
  matched: boolean;
  availabilityHint: string;
  timezone: typeof CALENDAR_TIME_ZONE;
  slots: SuggestedSlot[];
  bookingUrl: string;
  note: string;
};

/**
 * Phase 2 shape. Not called in the MVP. Implement against HighLevel and
 * keep returning `SlotSuggestion` / opening `getBookingUrl()`.
 */
export type LiveCalendarSource = {
  /** HighLevel tool: calendars_get-calendar-events */
  listEvents(range: { startIso: string; endIso: string }): Promise<unknown>;
  createAppointment(input: {
    slotId: string;
    startIso: string;
  }): Promise<{ appointmentId: string }>;
};

type Ymd = { year: number; month: number; day: number };

type ParsedHint = {
  days: number[] | null;
  hours: number[];
  includeToday: boolean;
};

type Candidate = Ymd & {
  hour: number;
  date: Date;
};

export function getBookingUrl(slot?: SuggestedSlot): string {
  const configured = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  const base = configured || DEFAULT_BOOKING_URL;
  // `slot` is part of the signature so a documented deep link can be added
  // later without changing the chip click handler.
  if (!slot) return base;
  return base;
}

export function looksLikeAvailability(hint: string): boolean {
  const text = hint.trim();
  if (!text) return false;

  return (
    /\b(mondays?|mon|tuesdays?|tues|tue|wednesdays?|wed|thursdays?|thurs|thur|thu|fridays?|fri|saturdays?|sat|sundays?|sun|weekdays?|weekends?|mornings?|afternoons?|evenings?|tonight|tomorrow|today|available|availability|whenever|anytime|any time|flexible)\b/i.test(
      text,
    ) ||
    /\b(?:i(?:'m| am)|we(?:'re| are)) free\b/i.test(text) ||
    /\bfree on\b/i.test(text) ||
    /\b(?:after|before)\s+\d{1,2}\b/i.test(text) ||
    /\b(?:at|around)\s+\d{1,2}\b/i.test(text) ||
    /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(text) ||
    /\bnext week\b/i.test(text)
  );
}

export function listSuggestedSlots(
  availabilityHint: string,
  now: Date = new Date(),
): SlotSuggestion {
  const hint = availabilityHint.trim().slice(0, 500);
  const bookingUrl = getBookingUrl();
  const empty: SlotSuggestion = {
    matched: false,
    availabilityHint: hint,
    timezone: CALENDAR_TIME_ZONE,
    slots: [],
    bookingUrl,
    note: "",
  };

  if (!looksLikeAvailability(hint)) return empty;

  const parsed = parseHint(hint);
  let slots = collectSlots(parsed, now, SEARCH_DAYS);
  if (slots.length < 2) {
    slots = collectSlots(parsed, now, SEARCH_DAYS_EXTENDED);
  }

  return {
    matched: slots.length > 0,
    availabilityHint: hint,
    timezone: CALENDAR_TIME_ZONE,
    slots,
    bookingUrl,
    note:
      slots.length > 0
        ? "Example windows in Central time for the next few business days. The calendar shows which times are actually open."
        : "The calendar has the live openings.",
  };
}

export function describeRequestedWindow(slot: SuggestedSlot): string {
  return `${slot.dayLabel} at ${slot.timeLabel}`;
}

function parseHint(hint: string): ParsedHint {
  const lower = hint.toLowerCase();
  const days = parseDays(lower);
  const hours = parseHours(lower, days);
  return {
    days,
    hours,
    includeToday: /\btoday\b/.test(lower),
  };
}

function parseDays(lower: string): number[] | null {
  if (/\b(whenever|anytime|any time|flexible|any day)\b/.test(lower)) {
    return null;
  }

  const found = new Set<number>();
  const tokens: Array<[RegExp, number]> = [
    [/\b(?:sundays?|sun)\b/, 0],
    [/\b(?:mondays?|mon)\b/, 1],
    [/\b(?:tuesdays?|tues|tue)\b/, 2],
    [/\b(?:wednesdays?|wed)\b/, 3],
    [/\b(?:thursdays?|thurs|thur|thu)\b/, 4],
    [/\b(?:fridays?|fri)\b/, 5],
    [/\b(?:saturdays?|sat)\b/, 6],
  ];

  for (const [pattern, day] of tokens) {
    if (pattern.test(lower)) found.add(day);
  }

  if (/\bweekdays?\b/.test(lower)) {
    [1, 2, 3, 4, 5].forEach((day) => found.add(day));
  }
  if (/\bweekends?\b/.test(lower)) {
    found.add(0);
    found.add(6);
  }

  if (found.size === 0) return null;
  return [...found].sort((a, b) => a - b);
}

function parseHours(lower: string, days: number[] | null): number[] {
  const part = /\bmorning/.test(lower)
    ? "morning"
    : /\bafternoon/.test(lower)
      ? "afternoon"
      : /\bevening|\btonight|\bnight/.test(lower)
        ? "evening"
        : null;

  const bounds = lower
    .replace(/\bafter\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/g, " ")
    .replace(/\bbefore\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/g, " ");

  const exact: number[] = [];
  const clock = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/g;
  for (const match of bounds.matchAll(clock)) {
    exact.push(toHour(match[1], match[3]));
  }

  if (exact.length === 0) {
    const at = bounds.match(/\b(?:at|around)\s+(\d{1,2})(?::(\d{2}))?\b/);
    if (at) {
      exact.push(inferHour(Number(at[1]), part));
    }
  }

  const after = readBound(lower, "after", part);
  const before = readBound(lower, "before", part);

  let hours: number[];
  if (exact.length > 0 && after == null && before == null) {
    hours = exact;
  } else if (part === "morning") {
    hours = [10, 9, 11];
  } else if (part === "afternoon") {
    hours = [14, 13, 15];
  } else if (part === "evening") {
    hours = [17, 16];
  } else if (after != null || before != null) {
    const start = after ?? 9;
    const end = before != null ? before - 1 : 16;
    hours = [];
    for (let hour = start; hour <= Math.min(end, 17); hour += 1) {
      hours.push(hour);
    }
  } else if (days) {
    hours = [10, 14];
  } else {
    hours = [10, 14];
  }

  if (after != null) hours = hours.filter((hour) => hour >= after);
  if (before != null) hours = hours.filter((hour) => hour < before);

  if (hours.length === 0) {
    if (after != null) {
      hours = [after, after + 1, after + 2];
    } else if (exact.length > 0) {
      hours = exact;
    } else {
      hours = [10, 14];
    }
  }

  return [...new Set(hours.filter((hour) => hour >= 8 && hour <= 18))];
}

function readBound(
  lower: string,
  word: "after" | "before",
  part: "morning" | "afternoon" | "evening" | null,
): number | null {
  const match = lower.match(
    new RegExp(`\\b${word}\\s+(\\d{1,2})(?::\\d{2})?\\s*(am|pm)?`),
  );
  if (!match) return null;
  if (match[2]) return toHour(match[1], match[2]);
  return inferHour(Number(match[1]), part);
}

function toHour(num: string, ampm: string): number {
  let hour = Number(num);
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  return hour;
}

function inferHour(
  hour: number,
  part: "morning" | "afternoon" | "evening" | null,
): number {
  if (hour >= 13) return hour;
  if (part === "afternoon" || part === "evening") {
    return hour < 12 ? hour + 12 : hour;
  }
  if (part === "morning") return hour;
  // "after 2" with no am/pm is afternoon. "after 9" or "at 10" stays morning.
  if (hour >= 1 && hour <= 7) return hour + 12;
  return hour;
}

function collectSlots(parsed: ParsedHint, now: Date, horizon: number): SuggestedSlot[] {
  const today = chicagoYmd(now);
  const earliest = parsed.includeToday ? 0 : 1;
  const byDay = new Map<string, Candidate[]>();

  for (let offset = earliest; offset <= horizon; offset += 1) {
    const ymd = addDays(today, offset);
    const weekday = weekdayIndex(ymd);
    if (!dayAllowed(weekday, parsed.days)) continue;

    for (const hour of parsed.hours) {
      const date = zonedTimeToUtc(
        ymd.year,
        ymd.month,
        ymd.day,
        hour,
        0,
        CALENDAR_TIME_ZONE,
      );
      if (date.getTime() < now.getTime() + 2 * 60 * 60 * 1000) continue;
      const key = `${ymd.year}-${ymd.month}-${ymd.day}`;
      const list = byDay.get(key) ?? [];
      list.push({ ...ymd, hour, date });
      byDay.set(key, list);
    }
  }

  const namedDays = parsed.days?.length ?? 0;
  const maxDays = namedDays > 0 ? Math.min(namedDays + 1, 4) : 3;
  const cap = namedDays > 0 && namedDays <= 3 ? 4 : 3;
  const dayKeys = [...byDay.keys()].slice(0, maxDays);
  const chosen: Candidate[] = [];

  for (let round = 0; chosen.length < cap && round < 4; round += 1) {
    let added = false;
    for (const key of dayKeys) {
      if (chosen.length >= cap) break;
      const slot = byDay.get(key)?.[round];
      if (!slot) continue;
      chosen.push(slot);
      added = true;
    }
    if (!added) break;
  }

  chosen.sort((a, b) => a.date.getTime() - b.date.getTime());
  return chosen.map(toSlot);
}

function dayAllowed(weekday: number, days: number[] | null): boolean {
  if (days) return days.includes(weekday);
  if (weekday === 0 || weekday === 6) return false;
  return true;
}

function toSlot(candidate: Candidate): SuggestedSlot {
  const end = new Date(candidate.date.getTime() + SLOT_MINUTES * 60 * 1000);
  const dayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(candidate.date);
  const timeLabel = `${new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(candidate.date)} CT`;
  const shortDay = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(candidate.date);

  const id = `${candidate.year}-${pad(candidate.month)}-${pad(candidate.day)}T${pad(candidate.hour)}:00`;

  return {
    id,
    startIso: candidate.date.toISOString(),
    endIso: end.toISOString(),
    label: `${shortDay} · ${timeLabel}`,
    dayLabel,
    timeLabel,
  };
}

function chicagoYmd(date: Date): Ymd {
  const parts = zonedParts(date, CALENDAR_TIME_ZONE);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function weekdayIndex(ymd: Ymd): number {
  const noon = zonedTimeToUtc(ymd.year, ymd.month, ymd.day, 12, 0, CALENDAR_TIME_ZONE);
  const short = zonedParts(noon, CALENDAR_TIME_ZONE).weekday;
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[short] ?? 0;
}

function addDays(ymd: Ymd, days: number): Ymd {
  const utc = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour,
    minute: Number(pick("minute")),
    second: Number(pick("second")),
    weekday: pick("weekday"),
  };
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = offsetMinutes(new Date(utcGuess), timeZone);
  let instant = utcGuess - offset * 60_000;
  offset = offsetMinutes(new Date(instant), timeZone);
  instant = utcGuess - offset * 60_000;
  return new Date(instant);
}

function offsetMinutes(utcDate: Date, timeZone: string): number {
  const zoned = zonedParts(utcDate, timeZone);
  const asUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
  );
  return Math.round((asUtc - utcDate.getTime()) / 60_000);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
