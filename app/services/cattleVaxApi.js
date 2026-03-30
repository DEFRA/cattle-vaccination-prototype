const CATTLE_VAX_BACKEND_URL = process.env.CATTLE_VAX_BACKEND_URL

async function cattleVaxApiRequest(path, method = 'GET', body = undefined, options = {}) {
  if (!CATTLE_VAX_BACKEND_URL) {
    throw new Error('Missing required env var: CATTLE_VAX_BACKEND_URL')
  }

  const reqUrl = `${CATTLE_VAX_BACKEND_URL}${path}`
  console.log(`Sending ${method} request to Cattle Vax API: ${reqUrl}`)

  const response = await fetch(reqUrl, {
    ...options,
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cattle Vax API error ${response.status}: ${error}`)
  }

  return response.json()
}

module.exports = { cattleVaxApiRequest }
