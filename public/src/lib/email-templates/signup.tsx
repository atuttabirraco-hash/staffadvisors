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

interface SignupEmailProps {
  siteName: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma il tuo account su {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Container style={header}>
          <Img src="https://staffadvisors.it/icon-192.png" width="56" height="56" alt="StaffAdvisors" style={logo} />
          <Text style={brand}>{siteName}</Text>
        </Container>
        <Heading style={h1}>Conferma il tuo account</Heading>
        <Text style={text}>
          Ciao, benvenuto su StaffAdvisors. Conferma la tua email cliccando qui sotto per attivare il tuo account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Conferma Email
        </Button>
        <Hr style={divider} />
        <Text style={footer}>StaffAdvisors.it - Piattaforma di consulenza per PMI - info@staffadvisors.it</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const divider = { borderColor: '#dbe3ee', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0', textAlign: 'center' as const }
