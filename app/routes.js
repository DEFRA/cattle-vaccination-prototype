const govukPrototypeKit = require('govuk-prototype-kit')
const { cattleVaxApiRequest } = require('./services/cattleVaxApi')
const { errorToPlainObject } = require('./misc')

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
    cphNumber: '06/036/0006',
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

// ============================================================
// API explorer
// ============================================================

router.get('/api-explorer/cph', (_req, res) => {
  res.render('api-explorer/cph')
})

router.post('/api-explorer/cph', async (req, res) => {
  const { cph } = req.body

  req.session.data.cph = cph

  try {
    const result = await cattleVaxApiRequest('/holdings', 'POST', { ids: [cph] })
    res.locals.cphData = JSON.stringify(result, null, 2)
  } catch (err) {
    res.locals.error = err.message
  }

  res.render('api-explorer/cph')
})

router.get('/api-explorer/workorders', (_req, res) => {
  const today = new Date().toISOString().slice(0, 10)
  res.render('api-explorer/workorders', { defaultStartDate: '2026-01-01', defaultEndDate: today })
})

router.post('/api-explorer/workorders', async (req, res) => {
  const { country, startDate, endDate } = req.body

  req.session.data.country = country
  req.session.data.startDate = startDate
  req.session.data.endDate = endDate

  const uri = `/workorders?startDate=${startDate}&endDate=${endDate}&country=${country}`

  try {
    const result = await cattleVaxApiRequest(uri)
    res.locals.workorders = result.data
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2));
    res.locals.error = plainError.stack
  }

  res.render('api-explorer/workorders')
})

// ============================================================
// API explorer — Livestock
// ============================================================

router.get('/api-explorer/livestock/cattle-on-holding', (_req, res) => {
  res.render('api-explorer/livestock/cattle-on-holding')
})

router.post('/api-explorer/livestock/cattle-on-holding', async (req, res) => {
  const { holdingId } = req.body

  req.session.data.holdingId = holdingId

  try {
    const result = await cattleVaxApiRequest(`/cattle-on-holding?holdingId=${encodeURIComponent(holdingId)}`)
    res.locals.cattleData = result
    res.locals.cattleDataJson = JSON.stringify(result, null, 2)
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2))
    res.locals.error = err.message
  }

  res.render('api-explorer/livestock/cattle-on-holding')
})

// EXAMPLE WORK ORDER
// {
//     "type": "workorders",
//     "id": "WS-76867",
//     "activationDate": "2026-01-02T00:00:00",
//     "targetDate": "2026-02-01T23:59:59",
//     "businessArea": "Endemic Notifiable Disease",
//     "workArea": "Tuberculosis",
//     "country": "ENGLAND",
//     "aim": "Contain / Control / Eradicate Endemic Disease",
//     "purpose": "Overdue TB Test Stage 1 (Surveillance)",
//     "earliestActivityStartDate": null,
//     "species": "Cattle",
//     "activities": [
//         {
//             "type": "activities",
//             "id": "WSA-109545",
//             "activityName": "Assessment Of Overdue Status - Stage 1",
//             "sequenceNumber": 1
//         },
//         {
//             "type": "activities",
//             "id": "WSA-109547",
//             "activityName": "Issue 1st Warning Letter",
//             "sequenceNumber": 2
//         },
//         {
//             "type": "activities",
//             "id": "WSA-109549",
//             "activityName": "Hand Delivery Of Notices",
//             "sequenceNumber": 3
//         }
//     ],
//     "phase": "FOLLOWUP",
//     "relationships": {
//         "customerOrOrganisation": {
//             "data": {
//                 "type": "customers",
//                 "id": "C108906"
//             }
//         },
//         "holding": {
//             "data": {
//                 "type": "holdings",
//                 "id": "55/063/0382"
//             }
//         },
//         "facilities": {
//             "data": []
//         },
//         "location": {
//             "data": {
//                 "type": "locations",
//                 "id": "L65192"
//             }
//         },
//         "livestockUnits": {
//             "data": [
//                 {
//                     "type": "animal-commodities",
//                     "id": "U1006276"
//                 }
//             ]
//         }
//     }
// }