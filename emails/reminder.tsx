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

export interface ReminderEmailProps {
  leagueName: string;
  predictUrl: string;
}

const bg = "#0a0b0d";
const surface = "#14161a";
const text = "#f5f3ee";
const muted = "#8a8d93";
const accent = "#e6ff3d";
const border = "#2a2d33";

export function ReminderEmail({ leagueName, predictUrl }: ReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>The World Cup&rsquo;s underway and your picks are missing - {leagueName}</Preview>
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
            Verdocast · World Cup 2026
          </Text>
          <Heading style={{ color: text, fontSize: "26px", margin: "0 0 12px" }}>
            Your picks are missing
          </Heading>
          <Text style={{ color: text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 24px" }}>
            The World Cup is underway and you haven&rsquo;t made any predictions
            for <strong>{leagueName}</strong> yet. Every match you miss is points
            left on the table - and the leaderboard won&rsquo;t wait. It only
            takes a couple of minutes.
          </Text>
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
              Make my predictions
            </Button>
          </Section>
          <Text style={{ color: muted, fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" }}>
            Or paste this link into your browser:
          </Text>
          <Link href={predictUrl} style={{ color: accent, fontSize: "12px", wordBreak: "break-all" }}>
            {predictUrl}
          </Link>
          <Hr style={{ borderColor: border, margin: "24px 0 12px" }} />
          <Text style={{ color: muted, fontSize: "11px", margin: 0 }}>
            You&rsquo;re receiving this because you joined {leagueName} on Verdocast.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ReminderEmail;
