import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { ownerName?: string; mansione?: string; zona?: string; requestCode?: string; requesterName?: string; message?: string }

const s = { color: "#0F172A", fontSize: "14px", lineHeight: "22px" };

function AvailabilityReceipt({ ownerName = "", mansione = "", zona = "", requestCode = "", requesterName = "", message = "" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>La tua richiesta e stata inviata</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F172A", fontSize: "20px" }}>Richiesta inviata</Heading>
          {requestCode ? (
            <Text style={{ ...s, fontWeight: "bold" }}>Codice richiesta: {requestCode}</Text>
          ) : null}
          <Text style={s}>Ciao {requesterName}, la tua richiesta per '{mansione} a {zona}' e stata inviata a {ownerName}.</Text>
          <Text style={s}>Messaggio inviato: 'Ciao, ho visto la tua disponibilita come {mansione} a {zona} su StaffAdvisors e mi piacerebbe mettermi in contatto con te.'{message ? ` ${message}` : ""}</Text>
          <Text style={s}><strong>Importante:</strong> il tuo numero di telefono e la tua email sono visibili SOLO a {ownerName}, non sono mai pubblicati in bacheca e nessun altro puo vederli.</Text>
          <Text style={s}>Ora devi solo aspettare che sia lui/lei a ricontattarti direttamente. Non inviare mai pagamenti anticipati.</Text>
          <Text style={{ ...s, color: "#64748B", fontSize: "12px" }}>Conserva questo codice: se devi scriverci per informazioni o problemi, cita il codice {requestCode || "indicato in cima a questa email"}.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: AvailabilityReceipt,
  subject: (d: Record<string, any>) => `Richiesta ${d["requestCode"] ?? ""} inviata a ${d["ownerName"]} per ${d["mansione"]} a ${d["zona"]}`,
  displayName: "Ricevuta richiesta disponibilita",
  previewData: { ownerName: "Maria", mansione: "Badante", zona: "Verona", requestCode: "#ABCD1234", requesterName: "Luca", message: "" },
} satisfies TemplateEntry;
