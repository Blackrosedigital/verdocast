import { redirect } from "next/navigation";

// Short link for the public global league — share verdocast.com/play (optionally
// with ?ref=<creator> for attribution).
export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const suffix = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  redirect(`/league/GLOBAL/join${suffix}`);
}
