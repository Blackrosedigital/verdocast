import { redirect } from "next/navigation";

// Short link for the public global league — share verdocast.com/play anywhere.
export default function PlayPage() {
  redirect("/league/GLOBAL/join");
}
