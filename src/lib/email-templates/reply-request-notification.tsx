import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props { name?: string; role?: string; email?: string; phone?: string; reply?: string; verified?: boolean }

function ReplyRequestNotification({ name = "Azienda", role = "", email = "", phone = "", reply = "", verified = false }: Props) {
  return (
    <Html lang="it" dir="ltr"><Head /><Preview>{verified ? "Risposta verificata gia' pubblicata" : "Nuova risposta aziendale da verificare"}</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" }}><Container style={{ padding: "24px", maxWidth: "560px" }}>
        <Heading style={{ color: "#0F2C5C", fontSize: "20px" }}>{verified ? "Risposta aziendale verificata e pubblicata" : "Nuova risposta aziendale da verificare"}</Heading>
        <Text style={{ color: "#0F2C5C" }}><strong>Da:</strong> {name}{role ? ` - ${role}` : ""}</Text>
        <Text style={{ color: "#334155" }}><strong>Email:</strong> {email}{phone ? <><br /><strong>Telefono:</strong> {phone}</> : null}</Text>
        <Text style={{ color: "#334155", whiteSpace: "pre-wrap" }}>{reply}</Text>
        {verified ? (
          <Text style={{ color: "#16A34A", fontSize: "12px" }}>L'indirizzo email corrisponde al sito aziendale: la risposta e' gia' visibile sul sito. Nessun'azione richiesta.</Text>
        ) : (
          <Text style={{ color: "#FF5A1F", fontSize: "12px" }}>Apri l'area amministratore di StaffAdvisors per approvare o rifiutare la risposta.</Text>
        )}
      </Container></Body>
    </Html>
  );
}

export const template = {
  component: ReplyRequestNotification,
  subject: "Nuova risposta aziendale - StaffAdvisors",
  displayName: "Notifica risposta aziendale",
  to: "avvisi@staffadvisors.it",
  previewData: { name: "Mario Rossi", role: "Responsabile risorse umane", email: "mario@azienda.it", phone: "+39 333 1234567", reply: "Vorremmo rispondere alla recensione pubblicata.", verified: false },
} satisfies TemplateEntry;
