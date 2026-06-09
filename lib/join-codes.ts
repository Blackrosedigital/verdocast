/**
 * League join codes (ADJECTIVE-NOUN, e.g. MIGHTY-LIONS) and URL slugs.
 *
 * Pure helpers — uniqueness is enforced at the DB layer (leagues.join_code is
 * unique; (organization_id, slug) is unique), so callers generate and retry on
 * conflict.
 */

const ADJECTIVES = [
  "MIGHTY", "ROARING", "RAPID", "GOLDEN", "IRON", "ROYAL", "WILD", "FEARLESS",
  "ELECTRIC", "THUNDER", "BLAZING", "SUPREME", "RUTHLESS", "CLINICAL",
  "RELENTLESS", "UNITED", "RAMPANT", "SAVAGE", "COSMIC", "ATOMIC", "NOBLE",
  "STORMING", "VELVET", "TITAN",
] as const;

const NOUNS = [
  "LIONS", "EAGLES", "WOLVES", "TIGERS", "FALCONS", "SHARKS", "DRAGONS",
  "PANTHERS", "HAWKS", "BEARS", "RHINOS", "STALLIONS", "COBRAS", "RAVENS",
  "BULLS", "JAGUARS", "VIPERS", "COMETS", "TITANS", "GIANTS", "ROVERS",
  "STRIKERS", "KESTRELS", "FOXES",
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Generate a memorable join code like "MIGHTY-LIONS". */
export function generateJoinCode(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

/** URL-safe slug from a free-text league name; never empty. */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug || "league";
}
