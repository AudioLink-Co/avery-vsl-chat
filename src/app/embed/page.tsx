import { AveryChat } from "@/components/avery-chat";
import { getBookingUrl } from "@/lib/calendar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avery · AudioLink",
  description: "Ask Avery about AudioLink and book a call for your church.",
  robots: { index: false, follow: false },
};

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingTarget?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.bookingTarget)
    ? params.bookingTarget[0]
    : params.bookingTarget;
  const bookingTarget = raw === "self" ? "self" : "blank";
  const portraitUrl = process.env.AVERY_PORTRAIT_URL?.trim() || null;

  return (
    <main className="h-dvh min-h-0 overflow-hidden">
      <AveryChat
        bookingUrl={getBookingUrl()}
        portraitUrl={portraitUrl}
        bookingTarget={bookingTarget}
        className="h-full"
      />
    </main>
  );
}
