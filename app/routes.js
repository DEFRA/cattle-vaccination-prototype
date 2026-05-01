const govukPrototypeKit = require('govuk-prototype-kit')
const { cattleVaxApiRequest } = require('./services/cattleVaxApi')
const { errorToPlainObject } = require('./misc')

const router = govukPrototypeKit.requests.setupRouter()

function formatDate (isoString, includeTime = false) {
  if (!isoString) return ''

  const d = new Date(isoString)
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()

  if (!includeTime) return `${day}/${month}/${year}`

  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

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
// API explorer — Cases
// ============================================================

router.get('/api-explorer/cases', (_req, res) => {
  res.render('api-explorer/cases')
})

// Search redirect — must come before /:caseId to avoid route conflict
router.post('/api-explorer/cases/search', async (req, res) => {
  const { caseNumber } = req.body
  try {
    const result = await cattleVaxApiRequest(`/cases?caseNumber=${encodeURIComponent(caseNumber.trim())}`)
    res.redirect(`/api-explorer/cases/${encodeURIComponent(result.caseId)}`)
  } catch (err) {
    res.locals.searchError = err.message
    res.render('api-explorer/cases')
  }
})

router.get('/api-explorer/cases/create', (_req, res) => {
  res.render('api-explorer/cases/create')
})

router.post('/api-explorer/cases/create', async (req, res) => {
  const { cphNumber, reasonForTest, testWindowStart, testWindowEnd } = req.body

  Object.assign(req.session.data, { cphNumber, reasonForTest, testWindowStart, testWindowEnd })

  try {
    const result = await cattleVaxApiRequest('/cases', 'POST', {
      cphNumber,
      reasonForTest,
      testWindowStart,
      testWindowEnd
    })
    res.redirect(`/api-explorer/cases/${encodeURIComponent(result.caseId)}`)
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2))
    res.locals.error = err.message
    res.render('api-explorer/cases/create')
  }
})

router.get('/api-explorer/cases/:caseId', async (req, res) => {
  const { caseId } = req.params

  try {
    const caseData = await cattleVaxApiRequest(`/cases/${encodeURIComponent(caseId)}`)
    caseData.openedDate = formatDate(caseData.openedDate, true)
    caseData.testWindowStart = formatDate(caseData.testWindowStart)
    caseData.testWindowEnd = formatDate(caseData.testWindowEnd)
    for (const testPart of caseData.testParts ?? []) {
      testPart.day1 = formatDate(testPart.day1)
      testPart.day2 = formatDate(testPart.day2)
    }
    res.locals.caseData = caseData
    if (req.query.success) {
      res.locals.successMessage = req.query.success
    }
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2))
    res.locals.error = err.message
  }

  res.render('api-explorer/cases/view')
})

router.get('/api-explorer/cases/:caseId/add-test-parts', (req, res) => {
  res.locals.caseId = req.params.caseId
  res.locals.caseNumber = req.query.caseNumber
  res.render('api-explorer/cases/add-test-parts')
})

router.post('/api-explorer/cases/:caseId/add-test-parts', async (req, res) => {
  const { caseId } = req.params
  const { testPart_day1, testPart_day2, testPart_certifyingVet, testPart_tester } = req.body

  Object.assign(req.session.data, { testPart_day1, testPart_day2, testPart_certifyingVet, testPart_tester })

  const parseOptionalNumber = (val) => (val !== '' && val !== undefined && val !== null ? Number(val) : null)
  const parseOptionalString = (val) => (val !== '' && val !== undefined && val !== null ? val : null)
  const toArray = (val) => val === undefined ? [] : Array.isArray(val) ? val : [val]

  const testTypes = toArray(req.body['result_testType'])
  const earTagNos = toArray(req.body['result_earTagNo'])
  const batchAvians = toArray(req.body['result_batchAvian'])
  const batchBovines = toArray(req.body['result_batchBovine'])
  const batchDivas = toArray(req.body['result_batchDiva'])
  const day1Avians = toArray(req.body['result_day1Avian'])
  const day1Bovines = toArray(req.body['result_day1Bovine'])
  const day1Divas = toArray(req.body['result_day1Diva'])
  const day2Avians = toArray(req.body['result_day2Avian'])
  const day2Bovines = toArray(req.body['result_day2Bovine'])
  const day2Divas = toArray(req.body['result_day2Diva'])

  const results = earTagNos
    .map((earTagNo, i) => ({
      testType: testTypes[i],
      earTagNo,
      batchAvian: parseOptionalString(batchAvians[i]),
      batchBovine: parseOptionalString(batchBovines[i]),
      batchDiva: parseOptionalString(batchDivas[i]),
      day1Avian: parseOptionalNumber(day1Avians[i]),
      day1Bovine: parseOptionalNumber(day1Bovines[i]),
      day1Diva: parseOptionalNumber(day1Divas[i]),
      day2Avian: parseOptionalNumber(day2Avians[i]),
      day2Bovine: parseOptionalNumber(day2Bovines[i]),
      day2Diva: parseOptionalNumber(day2Divas[i])
    }))
    .filter(r => r.earTagNo !== '' && r.earTagNo !== undefined && r.earTagNo !== null)

  const payload = {
    testParts: [
      {
        day1: testPart_day1,
        day2: testPart_day2,
        certifyingVet: testPart_certifyingVet,
        tester: testPart_tester,
        results
      }
    ]
  }

  try {
    await cattleVaxApiRequest(`/cases/${encodeURIComponent(caseId)}/test-parts`, 'POST', payload)
    res.redirect(`/api-explorer/cases/${encodeURIComponent(caseId)}?success=Test+parts+submitted+successfully`)
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2))
    res.locals.caseId = caseId
    res.locals.caseNumber = req.query.caseNumber
    res.locals.error = err.message
    res.render('api-explorer/cases/add-test-parts')
  }
})

router.get('/api-explorer/cases/:caseId/test-parts/:testPartId/add-results', (req, res) => {
  res.locals.caseId = req.params.caseId
  res.locals.caseNumber = req.query.caseNumber
  res.locals.testPartId = req.params.testPartId
  res.render('api-explorer/cases/add-test-part-results')
})

router.post('/api-explorer/cases/:caseId/test-parts/:testPartId/add-results', async (req, res) => {
  const { caseId, testPartId } = req.params

  const parseOptionalNumber = (val) => (val !== '' && val !== undefined && val !== null ? Number(val) : null)
  const parseOptionalString = (val) => (val !== '' && val !== undefined && val !== null ? val : null)
  const toArray = (val) => val === undefined ? [] : Array.isArray(val) ? val : [val]

  const testTypes = toArray(req.body['result_testType'])
  const earTagNos = toArray(req.body['result_earTagNo'])
  const batchAvians = toArray(req.body['result_batchAvian'])
  const batchBovines = toArray(req.body['result_batchBovine'])
  const batchDivas = toArray(req.body['result_batchDiva'])
  const day1Avians = toArray(req.body['result_day1Avian'])
  const day1Bovines = toArray(req.body['result_day1Bovine'])
  const day1Divas = toArray(req.body['result_day1Diva'])
  const day2Avians = toArray(req.body['result_day2Avian'])
  const day2Bovines = toArray(req.body['result_day2Bovine'])
  const day2Divas = toArray(req.body['result_day2Diva'])

  const results = earTagNos
    .map((earTagNo, i) => ({
      testType: testTypes[i] || 'SICCT',
      earTagNo,
      batchAvian: parseOptionalString(batchAvians[i]),
      batchBovine: parseOptionalString(batchBovines[i]),
      batchDiva: parseOptionalString(batchDivas[i]),
      day1Avian: parseOptionalNumber(day1Avians[i]),
      day1Bovine: parseOptionalNumber(day1Bovines[i]),
      day1Diva: parseOptionalNumber(day1Divas[i]),
      day2Avian: parseOptionalNumber(day2Avians[i]),
      day2Bovine: parseOptionalNumber(day2Bovines[i]),
      day2Diva: parseOptionalNumber(day2Divas[i])
    }))
    .filter(r => r.earTagNo !== '' && r.earTagNo !== undefined && r.earTagNo !== null)

  try {
    await cattleVaxApiRequest(
      `/cases/${encodeURIComponent(caseId)}/test-parts/${encodeURIComponent(testPartId)}/results`,
      'POST',
      { results }
    )
    res.redirect(`/api-explorer/cases/${encodeURIComponent(caseId)}?success=Results+added+successfully`)
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2))
    res.locals.caseId = caseId
    res.locals.caseNumber = req.query.caseNumber
    res.locals.testPartId = testPartId
    res.locals.error = err.message
    res.render('api-explorer/cases/add-test-part-results')
  }
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