import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  ownerName?: string; mansione?: string; zona?: string; requestCode?: string;
  requesterName?: string; requesterEmail?: string; phone?: string; message?: string;
}

const s = { color: "#0F172A", fontSize: "14px", lineHeight: "22px" };
const label = { ...s, margin: "0", width: "72px", fontWeight: "bold" as const, verticalAlign: "top" as const };
const value = { ...s, margin: "0", verticalAlign: "top" as const, wordBreak: "break-word" as const };

function AvailabilityRequest({ ownerName = "", mansione = "", zona = "", requestCode = "", requesterName = "", requesterEmail = "", phone = "", message = "" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nuova richiesta per la tua disponibilita</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ color: "#0F172A", fontSize: "20px" }}>Nuova richiesta di contatto</Heading>
          {requestCode ? (
            <Text style={{ ...s, fontWeight: "bold" }}>Codice richiesta: {requestCode}</Text>
          ) : null}
          <Text style={s}>Ciao {ownerName}, hai ricevuto una nuova richiesta per il tuo annuncio '{mansione} a {zona}'.</Text>
          <Text style={s}>Messaggio automatico: 'Ciao, ho visto la tua disponibilita come {mansione} a {zona} su StaffAdvisors e mi piacerebbe mettermi in contatto con te.'</Text>
          <Text style={s}>Messaggio aggiuntivo di {requesterName}: '{message || "Nessun messaggio aggiuntivo"}'</Text>
          <Text style={{ ...s, fontWeight: "bold", marginBottom: "8px" }}>Dati di chi ti ha contattato per ricontattarlo direttamente:</Text>
          <table role="presentation" cellPadding="0" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={label}>Nome:</td><td style={value}>{requesterName}</td></tr>
              <tr><td style={label}>Email:</td><td style={value}>{requesterEmail}</td></tr>
              <tr><td style={label}>Telefono:</td><td style={value}>{phone}</td></tr>
            </tbody>
          </table>
          <Text style={{ ...s, color: "#64748B", fontSize: "12px" }}>StaffAdvisors non fa intermediazione. Se devi segnalarci questa richiesta, cita il codice {requestCode || "indicato in cima a questa email"}.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: AvailabilityRequest,
  subject: (d: Record<string, any>) => `Nuova richiesta ${d["requestCode"] ?? ""} per la tua disponibilita - ${d["mansione"]} a ${d["zona"]}`,
  displayName: "Richiesta disponibilita (a chi pubblica)",
  previewData: { ownerName: "Maria", mansione: "Badante", zona: "Verona", requestCode: "#ABCD1234", requesterName: "Luca", requesterEmail: "luca@example.com", phone: "3331234567", message: "" },
} satisfies TemplateEntry;
