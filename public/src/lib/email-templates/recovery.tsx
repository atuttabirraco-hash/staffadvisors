import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Img,
  Preview,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Reimposta la tua password - {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Container style={header}>
          <Img src="https://staffadvisors.it/icon-192.png" width="56" height="56" alt="StaffAdvisors" style={logo} />
          <Text style={brand}>{siteName}</Text>
        </Container>
        <Heading style={h1}>Reimposta la tua password</Heading>
        <Text style={text}>
          Hai richiesto il reset. Clicca qui sotto per reimpostare la tua password.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reimposta Password
        </Button>
        <Text style={notice}>Se non sei stato tu, ignora questa email.</Text>
        <Hr style={divider} />
        <Text style={footer}>StaffAdvisors.it - Piattaforma di consulenza per PMI - info@staffadvisors.it</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', padding: '24px 12px' }
const container = { border: '1px solid #dbe3ee', borderRadius: '12px', maxWidth: '560px', overflow: 'hidden', padding: '0 32px 28px' }
const header = { backgroundColor: '#0F2C5C', margin: '0 -32px 28px', padding: '24px', textAlign: 'center' as const }
const logo = { display: 'block', margin: '0 auto 8px' }
const brand = { color: '#ffffff', fontSize: '22px', fontWeight: 'bold' as const, margin: '0' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0F2C5C',
  margin: '0 0 20px',
}
const text = {
  fontSize: '16px',
  color: '#334155',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#0F2C5C',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 22px',
  textDecoration: 'none',
}
const notice = { fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: '24px 0 0' }
const divider = { borderColor: '#dbe3ee', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0', textAlign: 'center' as const }
