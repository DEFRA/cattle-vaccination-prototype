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

const invitationMockData = {
  'ABC-111': {
    farmName: '1st Farm',
    cphNumber: '11/111/1111',
    addressLine1: '1 Farm Lane',
    town: 'Farmington',
    county: 'Herefordshire',
    postcode: 'HR1 1AB',
    herdSize: '50',
    herdType: 'beef'
  },
  default: {
    farmName: 'Random Farm',
    cphNumber: '12/345/6789',
    addressLine1: '99 Farm Avenue',
    town: 'Leeds',
    county: 'West Yorkshire',
    postcode: 'LS21 2AB',
    herdSize: '100',
    herdType: 'dairy'
  }
}

router.post('/invitation/start', (req, res) => {
  const ref = req.session.data['invitationReference']
  const farm = invitationMockData[ref] || invitationMockData.default
  Object.assign(req.session.data, farm)
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
