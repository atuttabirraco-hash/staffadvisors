import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { title?: string; name?: string }

function ApplicationConfirmation({ title = "", name = "" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Candidatura inviata per {title}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F172A", fontSize: "20px" }}>Candidatura inviata</Heading>
          <Text style={{ color: "#334155" }}>Ciao {name}, abbiamo inoltrato il tuo messaggio per l'offerta "{title}". Chi l'ha pubblicata ti rispondera direttamente via email.</Text>
          <Text style={{ color: "#FF5A1F", fontSize: "12px" }}>Staff Advisors - staffadvisors.it</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: ApplicationConfirmation,
  subject: (d: Record<string, any>) => `Candidatura inviata: ${d["title"] ?? ""}`,
  displayName: "Conferma al candidato",
  previewData: { title: "Cameriere", name: "Mario" },
} satisfies TemplateEntry;
