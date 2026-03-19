const express = require('express')
const request = require('supertest')

let mockRouter // must be prefixed 'mock' for jest.mock() factory access

jest.mock('govuk-prototype-kit', () => {
  const express = require('express')
  mockRouter = express.Router()
  return {
    requests: { setupRouter: () => mockRouter },
  }
})

require('../app/routes')

function createApp(sessionData = {}) {
  const app = express()
  app.use(express.urlencoded({ extended: true }))
  app.use((req, res, next) => {
    req.session = { data: sessionData }
    next()
  })
  app.use(mockRouter)
  return app
}

// ============================================================
// Expression of interest flow
// ============================================================

describe('Expression of interest flow', () => {
  describe('POST /expression-of-interest/eligibility', () => {
    it('redirects to farm-details when herd is in England', async () => {
      const res = await request(createApp({ herdInEngland: 'yes' })).post(
        '/expression-of-interest/eligibility'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/expression-of-interest/farm-details')
    })

    it('redirects to ineligible when herd is not in England', async () => {
      const res = await request(createApp({ herdInEngland: 'no' })).post(
        '/expression-of-interest/eligibility'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/expression-of-interest/ineligible')
    })

    it('redirects to ineligible when herdInEngland is absent', async () => {
      const res = await request(createApp()).post(
        '/expression-of-interest/eligibility'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/expression-of-interest/ineligible')
    })
  })

  describe('POST /expression-of-interest/farm-details', () => {
    it('redirects to herd-details', async () => {
      const res = await request(createApp()).post(
        '/expression-of-interest/farm-details'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/expression-of-interest/herd-details')
    })
  })

  describe('POST /expression-of-interest/herd-details', () => {
    it('redirects to contact-details', async () => {
      const res = await request(createApp()).post(
        '/expression-of-interest/herd-details'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(
        '/expression-of-interest/contact-details'
      )
    })
  })

  describe('POST /expression-of-interest/contact-details', () => {
    it('redirects to check-answers', async () => {
      const res = await request(createApp()).post(
        '/expression-of-interest/contact-details'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/expression-of-interest/check-answers')
    })
  })

  describe('POST /expression-of-interest/check-answers', () => {
    it('redirects to confirmation', async () => {
      const res = await request(createApp()).post(
        '/expression-of-interest/check-answers'
      )
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/expression-of-interest/confirmation')
    })
  })
})

// ============================================================
// Invitation flow
// ============================================================

describe('Invitation flow', () => {
  describe('POST /invitation/start', () => {
    it('redirects to confirm-details', async () => {
      const res = await request(createApp()).post('/invitation/start')
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/invitation/confirm-details')
    })
  })

  describe('POST /invitation/confirm-details', () => {
    it('redirects to herd-details', async () => {
      const res = await request(createApp()).post('/invitation/confirm-details')
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/invitation/herd-details')
    })
  })

  describe('POST /invitation/herd-details', () => {
    it('redirects to preferred-dates', async () => {
      const res = await request(createApp()).post('/invitation/herd-details')
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/invitation/preferred-dates')
    })
  })

  describe('POST /invitation/preferred-dates', () => {
    it('redirects to check-answers', async () => {
      const res = await request(createApp()).post('/invitation/preferred-dates')
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/invitation/check-answers')
    })
  })

  describe('POST /invitation/check-answers', () => {
    it('redirects to confirmation', async () => {
      const res = await request(createApp()).post('/invitation/check-answers')
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('/invitation/confirmation')
    })
  })
})
