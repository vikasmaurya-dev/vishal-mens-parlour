// Shared email delivery layer.
// Auto-selects a provider based on which env vars are set:
//   1. BREVO_API_KEY present -> Brevo (300/day free, no domain required)
//   2. else RESEND_API_KEY present -> Resend (3000/mo free, needs domain for any recipient)
// If neither is set, throw so the caller returns a clear error.

interface SendArgs {
  to: string
  subject: string
  html: string
  fromEmail: string
  fromName: string
}

export async function sendTransactionalEmail({ to, subject, html, fromEmail, fromName }: SendArgs): Promise<void> {
  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (brevoKey) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`BREVO_${response.status}: ${detail}`)
    }
    return
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${resendKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`RESEND_${response.status}: ${detail}`)
    }
    return
  }

  throw new Error('EMAIL_PROVIDER_NOT_CONFIGURED')
}

export function parseSender(fallbackName: string): { fromName: string; fromEmail: string } {
  const raw = Deno.env.get('EMAIL_FROM') ?? ''
  // Accept either "Name <email@x>" or plain "email@x".
  const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (match) {
    return { fromName: match[1] || fallbackName, fromEmail: match[2] }
  }
  if (raw.includes('@')) {
    return { fromName: fallbackName, fromEmail: raw.trim() }
  }
  return { fromName: fallbackName, fromEmail: 'onboarding@resend.dev' }
}
