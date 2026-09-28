/** Exact disclosure. The chat header shows this before the first reply. */
export const AVERY_DISCLOSURE =
  "Hey, I'm Avery, an AI team member with AudioLink.";

/** Meet Avery welcome. */
export const AVERY_WELCOME = "Happy you're here.";

/** After-click framing. More info, not a pitch. */
export const AVERY_NOT_A_PITCH = "Not a pitch. Book a call.";

/**
 * Meet Avery FAQ beat. Non-discovery: remote mixing, 30-minute walkthrough,
 * setup shared live.
 */
export const AVERY_FAQ =
  "Happy to answer a couple of quick questions: yes, AudioLink does remote mixing; walkthroughs run about 30 minutes; and the team can share how the setup works live.";

/**
 * Public booking voice from Meet Avery: 30 minutes, stacked, no buffer.
 * This chat does not say the sandbox line about a hold that is not live.
 * The booking page is the live calendar.
 */
export const AVERY_BOOKING_VOICE =
  "This is a 30-minute meeting, stacked, with no buffer.";

export const AVERY_GREETING = [
  `${AVERY_WELCOME} ${AVERY_NOT_A_PITCH}`,
  AVERY_FAQ,
  `${AVERY_BOOKING_VOICE} What would you like to know?`,
].join("\n\n");
