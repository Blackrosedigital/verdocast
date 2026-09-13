import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

/**
 * The weekly nudge. This is the loop that turns a prediction game into a
 * habit — across 38 gameweeks it is sent more often than any other email we
 * have, so it earns its place only by being specific: which matchday, when it
 * locks, and exactly how many picks are missing.
 */

export interface MatchdayReminderEmailProps {
  leagueName: string;
  competitionName: string;
  /** "Gameweek" or "Matchday" — the competition's own word. */
  unitLabel: string;
  matchday: number;
  /** Pre-formatted deadline, e.g. "Saturday 12:30". Formatted by the caller,
   *  which knows the locale; an email cannot ask the browser. */
  deadline: string;
  predicted: number;
  total: number;
  predictUrl: string;
  /** A few fixtures to make the email concrete. */
  fixtures: Array<{ home: string; away: string }>;
}

const bg = "#0a0b0d";
const surface = "#14161a";
const text = "#f5f3ee";
const muted = "#8a8d93";
const accent = "#e6ff3d";
const border = "#2a2d33";

export function MatchdayReminderEmail({
  leagueName,
  competitionName,
  unitLabel,
  matchday,
  deadline,
  predicted,
  total,
  predictUrl,
  fixtures,
}: MatchdayReminderEmailProps) {
  const outstanding = Math.max(0, total - predicted);
  const unit = unitLabel.toLowerCase();

  return (
    <Html>
      <Head />
      {/* Preview takes a single string, not interpolated children. */}
      <Preview>
        {`${unitLabel} ${matchday} locks ${deadline} — ${outstanding} pick${outstanding === 1 ? "" : "s"} missing`}
      </Preview>
      <Body style={{ backgroundColor: bg, fontFamily: "Arial, sans-serif", margin: 0, padding: "24px" }}>
        <Container
          style={{
            backgroundColor: surface,
            border: `1px solid ${border}`,
            borderRadius: "12px",
            maxWidth: "480px",
            margin: "0 auto",
            padding: "32px",
          }}
        >
          <Text style={{ color: muted, fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 12px" }}>
            Verdocast · {competitionName}
          </Text>

          <Heading style={{ color: text, fontSize: "26px", margin: "0 0 12px" }}>
            {unitLabel} {matchday} locks {deadline}
          </Heading>

          <Text style={{ color: text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 20px" }}>
            {predicted === 0 ? (
              <>
                You haven&rsquo;t picked any of this {unit}&rsquo;s {total}{" "}
                games in <strong>{leagueName}</strong> yet.
              </>
            ) : (
              <>
                You&rsquo;ve predicted <strong>{predicted} of {total}</strong> in{" "}
                <strong>{leagueName}</strong> — {outstanding} still to go.
              </>
            )}
          </Text>

          {fixtures.length > 0 && (
            <Section
              style={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderRadius: "8px",
                padding: "12px 16px",
                margin: "0 0 24px",
              }}
            >
              {fixtures.map((f) => (
                <Text
                  key={`${f.home}-${f.away}`}
                  style={{ color: text, fontSize: "13px", lineHeight: "1.8", margin: 0 }}
                >
                  {f.home} <span style={{ color: muted }}>v</span> {f.away}
                </Text>
              ))}
              {total > fixtures.length && (
                <Text style={{ color: muted, fontSize: "12px", margin: "6px 0 0" }}>
                  + {total - fixtures.length} more
                </Text>
              )}
            </Section>
          )}

          <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
            <Button
              href={predictUrl}
              style={{
                backgroundColor: accent,
                color: "#0a0b0d",
                fontWeight: "bold",
                fontSize: "15px",
                padding: "12px 28px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              {predicted === 0 ? "Make my picks" : "Finish my picks"}
            </Button>
          </Section>

          {/* Per-match locking is more forgiving than the single weekly
              cut-off other games use, and people don't expect it. */}
          <Text style={{ color: muted, fontSize: "12px", lineHeight: "1.6", margin: "0 0 16px" }}>
            Each game locks at its own kickoff, so you can still pick the later
            ones after the {unit} has started.
          </Text>

          <Text style={{ color: muted, fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" }}>
            Or paste this link into your browser:
          </Text>
          <Link href={predictUrl} style={{ color: accent, fontSize: "12px", wordBreak: "break-all" }}>
            {predictUrl}
          </Link>

          <Hr style={{ borderColor: border, margin: "24px 0 12px" }} />
          <Text style={{ color: muted, fontSize: "11px", margin: 0 }}>
            You&rsquo;re receiving this because you play {leagueName} on
            Verdocast. Free to play · no money · not gambling.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MatchdayReminderEmail;
