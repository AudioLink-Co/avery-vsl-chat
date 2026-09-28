import { listSuggestedSlots } from "@/lib/calendar";

export async function GET(request: Request) {
  const hint = new URL(request.url).searchParams.get("hint") ?? "";
  if (hint.length > 500) {
    return Response.json(
      { error: "That availability note is too long." },
      { status: 400 },
    );
  }

  return Response.json(listSuggestedSlots(hint));
}
