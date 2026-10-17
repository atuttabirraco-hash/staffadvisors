import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  /** "disponibilita" for the work board, "offerta" for a job ad. */
  kind?: "disponibilita" | "offerta";
  title?: string;
  subtitle?: string;
  /** ISO date when the ad stops being visible. */
  expiresAt?: string;
}

const s = { color: "#0F172A", fontSize: "14px", lineHeight: "22px" };

function fmt(expiresAt?: string) {
  if (!expiresAt) return "";
  const d = new Date(expiresAt);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString("it-IT") : "";
}

function ListingPublished({ kind = "disponibilita", title = "", subtitle = "", expiresAt = "" }: Props) {
  const date = fmt(expiresAt);
  const what = kind === "offerta" ? "annuncio di lavoro" : "annuncio di disponibilita";
  return (
    <Html>
      <Head />
      <Preview>{`Il tuo ${what} e online: visibile fino al ${date}`}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F172A", fontSize: "20px" }}>Il tuo annuncio e online</Heading>
          <Text style={s}>
            Il tuo {what} <strong>{title || "e pubblicato"}</strong>
            {subtitle ? ` (${subtitle})` : ""} e visibile su StaffAdvisors.
          </Text>
          {date ? (
            <Text style={{ ...s, fontSize: "16px", fontWeight: "bold", color: "#FF5A1F" }}>Visibile fino al {date}</Text>
          ) : null}
          <Text style={s}>
            Alla scadenza l'annuncio viene tolto dalla pagina e cancellato automaticamente. Puoi ripubblicarlo quando vuoi,
            senza costi.
          </Text>
          <Text style={s}>
            Nei 3 giorni prima della scadenza trovi un avviso ben visibile nella tua area personale, con il pulsante per
            rinnovarlo subito.
          </Text>
          <Hr style={{ borderColor: "#E2E8F0", margin: "24px 0" }} />
          <Text style={{ ...s, color: "#64748B", fontSize: "12px" }}>
            StaffAdvisors - www.staffadvisors.it - recapiti mai pubblicati senza il tuo consenso.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: ListingPublished,
  subject: (d: Record<string, any>) => `Il tuo annuncio e online - visibile fino al ${fmt(String(d["expiresAt"] ?? ""))}`,
  displayName: "Conferma annuncio pubblicato",
  previewData: {
    kind: "disponibilita",
    title: "Anna B.",
    subtitle: "Badante - Verona",
    expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
  },
} satisfies TemplateEntry;
