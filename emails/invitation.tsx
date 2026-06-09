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

export interface InvitationEmailProps {
  leagueName: string;
  joinUrl: string;
}

const bg = "#0a0b0d";
const surface = "#14161a";
const text = "#f5f3ee";
const muted = "#8a8d93";
const accent = "#e6ff3d";
const border = "#2a2d33";

export function InvitationEmail({ leagueName, joinUrl }: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&rsquo;re invited to {leagueName} — predict every World Cup 2026 match</Preview>
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
            You&rsquo;re invited to {leagueName}
          </Heading>
          <Text style={{ color: text, fontSize: "15px", lineHeight: "1.6", margin: "0 0 24px" }}>
            Predict the score of every group-stage match, climb the leaderboard,
            and settle the office debate once and for all. No password needed —
            just tap below to join.
          </Text>
          <Section style={{ textAlign: "center", margin: "0 0 24px" }}>
            <Button
              href={joinUrl}
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
              Join the league
            </Button>
          </Section>
          <Text style={{ color: muted, fontSize: "12px", lineHeight: "1.6", margin: "0 0 4px" }}>
            Or paste this link into your browser:
          </Text>
          <Link href={joinUrl} style={{ color: accent, fontSize: "12px", wordBreak: "break-all" }}>
            {joinUrl}
          </Link>
          <Hr style={{ borderColor: border, margin: "24px 0 12px" }} />
          <Text style={{ color: muted, fontSize: "11px", margin: 0 }}>
            If you weren&rsquo;t expecting this invitation, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default InvitationEmail;
