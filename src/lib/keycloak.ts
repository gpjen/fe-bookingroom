export async function getClientCredentialsToken() {
  const issuer = process.env.KEYCLOAK_ISSUER!
  const clientId = process.env.KEYCLOAK_CLIENT_ID!
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!
  const url = `${issuer}/protocol/openid-connect/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Failed to fetch client credentials token')
  return res.json()
}

