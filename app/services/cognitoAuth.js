const { Buffer } = require('buffer')

let cachedToken = null
let tokenExpiresAt = null

async function getCognitoToken() {
  if (cachedToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const clientId = process.env.COGNITO_CLIENT_ID
  const clientSecret = process.env.COGNITO_CLIENT_SECRET
  const aphaCognitoUrl = process.env.APHA_COGNITO_URL

  if (!clientId || !clientSecret || !aphaCognitoUrl) {
    throw new Error('Missing required env vars: COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET, APHA_COGNITO_URL')
  }

  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(aphaCognitoUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch Cognito token: ${response.status} ${error}`)
  }

  const data = await response.json()

  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000

  return cachedToken
}

module.exports = { getCognitoToken }
