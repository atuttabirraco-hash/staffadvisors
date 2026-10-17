import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  name?: string;
  reply?: string;
  link?: string;
}

function ReplyConfirmation({ name = "", reply = "", link = "https://www.staffadvisors.it" }: Props) {
  return (
    <Html lang="it">
      <Head />
      <Preview>Sei tu ad aver risposto a una recensione su StaffAdvisors?</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F2C5C", fontSize: "20px" }}>Confermi la tua risposta?</Heading>
          <Text style={{ color: "#334155" }}>
            {name ? `Ciao ${name}, ` : "Ciao, "}abbiamo ricevuto questa risposta a nome della tua azienda:
          </Text>
          <Text style={{ color: "#0F2C5C", whiteSpace: "pre-wrap", borderLeft: "3px solid #FF5A1F", paddingLeft: "12px" }}>
            {reply}
          </Text>
          <Text style={{ color: "#334155" }}>Se sei stato tu, clicca il pulsante: la risposta verra pubblicata subito.</Text>
          <Button href={link} style={{ backgroundColor: "#FF5A1F", color: "#ffffff", padding: "12px 20px", borderRadius: "10px", fontWeight: "bold" }}>
            Si, sono io: pubblica
          </Button>
          <Text style={{ color: "#64748b", fontSize: "12px", marginTop: "20px" }}>
            Se non sei stato tu, ignora questa email oppure apri il link e scegli "Non sono io": la risposta non verra mai pubblicata.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: ReplyConfirmation,
  subject: "Conferma la tua risposta su StaffAdvisors",
  displayName: "Conferma risposta azienda",
  previewData: { name: "Mario", reply: "Grazie per il feedback.", link: "https://www.staffadvisors.it/conferma-replica?t=x" },
} satisfies TemplateEntry;
