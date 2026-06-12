import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Verdocast league invite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let leagueName = "World Cup 2026 Predictor";
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("leagues")
      .select("name")
      .eq("join_code", code)
      .is("deleted_at", null)
      .maybeSingle();
    if (data?.name) leagueName = data.name;
  } catch {
    // fall back to the default name
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0a0b0d",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#8a8d93" }}>
          FIFA WORLD CUP 2026 PREDICTOR
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 800,
            color: "#f5f3ee",
            marginTop: 20,
            lineHeight: 1.05,
          }}
        >
          {leagueName}
        </div>
        <div style={{ display: "flex", fontSize: 36, color: "#e6ff3d", marginTop: 28 }}>
          You&rsquo;re invited &mdash; free to join
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#8a8d93", marginTop: 14 }}>
          Predict every match. Climb the leaderboard.
        </div>
        <div style={{ display: "flex", marginTop: 44 }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              color: "#0a0b0d",
              backgroundColor: "#e6ff3d",
              padding: "12px 22px",
              borderRadius: 10,
            }}
          >
            verdocast.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
