const { getCognitoToken } = require('./cognitoAuth')

const API_BASE_URL = process.env.APHA_API_BASE_URL
const DEV_API_KEY = process.env.DEV_API_KEY

async function aphaRequest(path, method = 'GET', body = undefined, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Missing required env var: APHA_API_BASE_URL')
  }

  const token = await getCognitoToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
      ...(process.env.NODE_ENV === 'development' && { 'x-api-key': DEV_API_KEY }),
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`APHA API error ${response.status}: ${error}`)
  }

  return response.json()
}

module.exports = { aphaRequest }
