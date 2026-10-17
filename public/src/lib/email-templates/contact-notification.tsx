import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string;
  email?: string;
  message?: string;
}

function ContactNotification({ name = "Visitatore", email = "", message = "" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nuovo messaggio da {name}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F2C5C", fontSize: "20px" }}>Nuovo messaggio dal sito</Heading>
          <Text style={{ color: "#0F2C5C" }}>
            <strong>Da:</strong> {name} ({email})
          </Text>
          <Text style={{ color: "#334155", whiteSpace: "pre-wrap" }}>{message}</Text>
          <Text style={{ color: "#FF5A1F", fontSize: "12px" }}>
            Rispondi a questa email per scrivere direttamente al mittente.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: ContactNotification,
  subject: (d: Record<string, any>) => `Nuovo messaggio da ${d["name"] ?? "StaffAdvisors"}`,
  displayName: "Notifica modulo Contatti",
  to: "avvisi@staffadvisors.it",
  previewData: { name: "Mario Rossi", email: "mario@example.com", message: "Ciao, vorrei informazioni." },
} satisfies TemplateEntry;
