# Avery for AudioLink

Avery is the chat under an AudioLink video sales letter. She answers from a locked knowledge base, then helps a church leader book a call.

Send this to **Josiah Bailes** (josiah@audiolink.co). He adds Avery to the funnel. This note has no API key.

## Render

Public repo Render can clone:

`https://github.com/AudioLink-Co/avery-vsl-chat.git`

Default branch: `main`.

Create a **Node** web service (or apply [`render.yaml`](render.yaml)):

| Setting | Value |
| --- | --- |
| buildCommand | `npm ci && npm run build` |
| startCommand | `npm start` |
| Health check | `/embed` |

`npm start` listens on `0.0.0.0` and the `PORT` Render sets. With `PORT` unset, local production uses 43123.

Set these in the Render dashboard. Do not put them in git, and do not put `OPENAI_API_KEY` in the email to Josiah.

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes, for answers | Server only. `render.yaml` marks it `sync: false` so the value is typed in the dashboard on first create |
| `NEXT_PUBLIC_BOOKING_URL` | No | Defaults to `https://calendar.audiolink.co/audiolink-call-579300`. Next inlines `NEXT_PUBLIC_*` at build time, so change it and rebuild |
| `AVERY_PORTRAIT_URL` | No | Server only. Blank uses the built-in portrait |

After the service is live, the public paths are `https://YOUR_SERVICE.onrender.com/`, `/embed`, and `/embed.js`.

## Pages to send

Until that Render URL exists, the running preview is local only. Josiah cannot open `127.0.0.1`.

| Path | What Josiah gets |
| --- | --- |
| `/` | Funnel preview: video block, Avery underneath, and copy buttons for both snippets |
| `/embed` | Clean chat page. This is the iframe target and what leads see |
| `/embed.js` | One-line script that inserts that iframe |

Local preview:

- Funnel preview: http://127.0.0.1:43123/
- Embed (iframe target): http://127.0.0.1:43123/embed

After deploy, the same paths are `https://YOUR_DOMAIN/` and `https://YOUR_DOMAIN/embed`. No trailing slash on the host.

## Exact paste for the funnel

In the HighLevel page, add a **custom HTML** element under the video and paste one of these. Replace `YOUR_DOMAIN` with the deployed host.

### Iframe

```html
<iframe
  src="https://YOUR_DOMAIN/embed"
  title="Chat with Avery from AudioLink"
  style="width:100%;max-width:760px;height:620px;border:0;border-radius:20px;display:block;"
  loading="lazy"
></iframe>
```

Height can be anywhere from 560 to 640. 620 is the default under a 16:9 video.

`/embed` sends `Content-Security-Policy: frame-ancestors *`, so a HighLevel page can frame it.

### One-line script

```html
<script src="https://YOUR_DOMAIN/embed.js" data-height="620"></script>
```

Optional attributes:

- `data-height` — `620`, `640`, or `70vh`
- `data-max-width` — default `760px`
- `data-booking-target="self"` — open the calendar in the same window. The default is a new tab, so the video stays put.

Opening `/` fills both snippets with the live origin and gives copy buttons. The script reads its own host, so it does not need a separate key.

## API key — do not email

`OPENAI_API_KEY` stays on the server that hosts Avery. It is not in the HTML snippet, not rendered on `/` or `/embed`, and it must not be copied into the email to Josiah.

Whoever deploys sets it in the host environment (or `.env.local` for local runs). The chat uses OpenAI `gpt-4o-mini` through the Vercel AI SDK. Without the key, the disclosure, starter questions, Book a call button, and time chips still work. Replies say the model key is not configured on the server.

| Variable | Where it lives | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server only. Required for answers | `gpt-4o-mini` |
| `NEXT_PUBLIC_BOOKING_URL` | Build-time env. Optional | Calendar link. Defaults to the AudioLink booking page. Rebuild after changing it |
| `AVERY_PORTRAIT_URL` | Server only. Optional | Photo for Avery. Blank uses the built-in portrait |

Copy `.env.example` to `.env.local` for local runs. Do not commit `.env.local`.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Put the OpenAI key in `.env.local` on your machine. The dev server binds `0.0.0.0:43123`.

`npm run build` then `npm start` serves the production build. It uses `PORT` when that variable is set, and 43123 otherwise.

## What Avery does

1. The header always shows: **Hey, I'm Avery, an AI team member with AudioLink.**
2. The first message uses the Meet Avery lines: "Happy you're here." "Not a pitch. Book a call." The FAQ that remote mixing is real, the walkthrough is about 30 minutes, and the team can share how setup works live. She calls the meeting **30 minutes, stacked, with no buffer.**
3. She answers from [`kb/audiolink.md`](kb/audiolink.md). The only prices she may quote are Broadcast **$2,500**, FOH **$5,000**, and Grand Slam **$7,000**. She does not quote a discount, a membership fee, or any other amount. Josiah's name is the person on the call. She does not page him into the chat.
4. **Book a call** stays visible and opens the live calendar. That URL is intentional on this page.
5. When someone says when they can talk (“mornings”, “Tue/Thu after 2”), she offers 2–4 example times in **America/Chicago** plus **See all times**.

Lines marked `TODO` in the knowledge base are gaps. Avery is instructed not to invent those details.

## Booking behavior

Primary calendar:

`https://calendar.audiolink.co/audiolink-call-579300`

Override it with `NEXT_PUBLIC_BOOKING_URL` if that link changes. Rebuild after you change it.

The meeting she describes is 30 minutes, stacked, with no buffer. Clicking **Book a call** or a time chip opens the live calendar. She does not create the appointment.

**Time chips do not deep-link a slot.** GoHighLevel's public calendar does not document a query parameter that preselects a date or time, and unknown params can break the widget. Clicking a chip opens the clean calendar URL and the chat says which Central-time window they asked for. The calendar shows what is actually open. The chat does not hold the time, send the reminder, or send the Google Meet link.

That logic is in [`src/lib/calendar.ts`](src/lib/calendar.ts):

- `listSuggestedSlots(availabilityHint)` — example windows for the MVP
- `getBookingUrl(slot?)` — the booking page. `slot` is accepted so a later, documented deep link can be appended without changing the buttons

Phase 2 can replace `listSuggestedSlots` with HighLevel free/busy (`calendars_get-calendar-events`) and add appointment creation beside it. The chip tray already reads `/api/slots`, so the UI does not need a rewrite. Do not send SMS or email from this app.

## Model

Chat streams from `POST /api/chat` using the Vercel AI SDK and OpenAI `gpt-4o-mini`. The system prompt is built in [`src/lib/prompt.ts`](src/lib/prompt.ts) from the knowledge base.
