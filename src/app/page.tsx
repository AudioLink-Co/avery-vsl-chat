import { AveryChat } from "@/components/avery-chat";
import { EmbedSnippet } from "@/components/embed-snippet";
import { getBookingUrl } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const portraitUrl = process.env.AVERY_PORTRAIT_URL?.trim() || null;

  return (
    <main className="min-h-full bg-paper text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
        <header className="space-y-3">
          <p className="text-xs font-medium tracking-[0.22em] text-copper uppercase">AudioLink</p>
          <h1 className="font-heading text-4xl leading-tight text-ink sm:text-5xl">
            Let&apos;s talk about your church&apos;s audio.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Not a pitch. Watch the overview, then ask Avery. The walkthrough is a 30-minute
            meeting, stacked, with no buffer.
          </p>
        </header>

        <section aria-label="Video sales letter" className="overflow-hidden rounded-3xl bg-booth text-paper shadow-xl">
          <div className="relative flex aspect-video flex-col justify-between p-6 sm:p-10">
            <Waveform />
            <p className="relative text-xs font-medium tracking-[0.22em] text-white/70 uppercase">
              Video sales letter
            </p>
            <div className="relative max-w-lg">
              <p className="font-heading text-3xl leading-tight sm:text-5xl">
                Your church&apos;s mix, covered.
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
                The overview plays here. Avery is the conversation underneath, ready to answer
                and book the walkthrough.
              </p>
            </div>
            <div
              className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-sm sm:size-20"
              aria-hidden="true"
            >
              <span className="ml-1 size-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-white sm:border-y-[12px] sm:border-l-[20px]" />
            </div>
          </div>
        </section>

        <section aria-label="Chat with Avery" className="h-[640px] overflow-hidden rounded-3xl border border-border shadow-lg">
          <AveryChat
            bookingUrl={getBookingUrl()}
            portraitUrl={portraitUrl}
            className="h-full"
          />
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-2xl text-ink">Add Avery under the video</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Paste either snippet into a custom HTML block directly under the VSL. The chat above
            is the same page the iframe loads. Height can sit between 560 and 640. Add{" "}
            <code className="text-foreground">data-booking-target=&quot;self&quot;</code> on the
            script if the calendar should open in the same window. The default opens a new tab
            so the video stays put.
          </p>
          <div className="mt-4">
            <EmbedSnippet />
          </div>
        </section>
      </div>
    </main>
  );
}

function Waveform() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-copper/50"
      viewBox="0 0 400 80"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 50 C 20 50 20 18 40 18 C 60 18 60 62 80 62 C 100 62 100 28 120 28 C 140 28 140 70 160 70 C 180 70 180 20 200 20 C 220 20 220 58 240 58 C 260 58 260 24 280 24 C 300 24 300 66 320 66 C 340 66 340 30 360 30 C 380 30 380 50 400 50"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
