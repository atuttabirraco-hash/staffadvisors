import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { title?: string; name?: string; email?: string; message?: string }

function OfferApplication({ title = "", name = "Candidato", email = "", message = "" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nuova candidatura per {title}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F172A", fontSize: "20px" }}>Nuova candidatura: {title}</Heading>
          <Text style={{ color: "#0F172A" }}><strong>Da:</strong> {name} ({email})</Text>
          <Text style={{ color: "#334155", whiteSpace: "pre-wrap" }}>{message}</Text>
          <Text style={{ color: "#FF5A1F", fontSize: "12px" }}>Rispondi a questa email per scrivere direttamente al candidato.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: OfferApplication,
  subject: (d: Record<string, any>) => `Nuova candidatura: ${d["title"] ?? "la tua offerta"}`,
  displayName: "Candidatura a chi pubblica",
  previewData: { title: "Cameriere", name: "Mario Rossi", email: "mario@example.com", message: "Sono interessato." },
} satisfies TemplateEntry;
