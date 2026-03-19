//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// ============================================================
// Expression of interest flow
// ============================================================

router.post('/expression-of-interest/eligibility', (req, res) => {
  const herdInEngland = req.session.data['herdInEngland']
  if (herdInEngland === 'yes') {
    res.redirect('/expression-of-interest/farm-details')
  } else {
    res.redirect('/expression-of-interest/ineligible')
  }
})

router.post('/expression-of-interest/farm-details', (req, res) => {
  res.redirect('/expression-of-interest/herd-details')
})

router.post('/expression-of-interest/herd-details', (req, res) => {
  res.redirect('/expression-of-interest/contact-details')
})

router.post('/expression-of-interest/contact-details', (req, res) => {
  res.redirect('/expression-of-interest/check-answers')
})

router.post('/expression-of-interest/check-answers', (req, res) => {
  res.redirect('/expression-of-interest/confirmation')
})

// ============================================================
// Invitation flow
// ============================================================

router.post('/invitation/start', (req, res) => {
  res.redirect('/invitation/confirm-details')
})

router.post('/invitation/confirm-details', (req, res) => {
  res.redirect('/invitation/herd-details')
})

router.post('/invitation/herd-details', (req, res) => {
  res.redirect('/invitation/preferred-dates')
})

router.post('/invitation/preferred-dates', (req, res) => {
  res.redirect('/invitation/check-answers')
})

router.post('/invitation/check-answers', (req, res) => {
  res.redirect('/invitation/confirmation')
})
