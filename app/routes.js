const govukPrototypeKit = require('govuk-prototype-kit')
const { cattleVaxApiRequest } = require('./services/cattleVaxApi')
const { errorToPlainObject } = require('./misc')
const { DOWNLOAD_LIST_CATTLE } = require('./data/download-list-cattle')
const { TEST_LIST_CATTLE } = require('./data/test-list-cattle')
const { TL_HERD_DATA } = require('./data/test-list-farms')
const { toArray } = require('./helpers/utils')
const { getDownloadListSettings, sortCattle, getTestListSettings, sortTestCattle } = require('./helpers/list-settings')
const { ANIMALS_BY_CPH, getTbStatus, searchFarms } = require('./helpers/farm-generator')
const { TL_SKIN_TEST_COLUMNS, tlBuildPreviewSettings, tlBuildPreviewRows } = require('./helpers/preview')
const { enrichWithFlags } = require('./helpers/cattle')
const { formatDate } = require('./helpers/date')
const { UNTESTED_REASON_LABELS } = require('./data/untested-reason-labels')
const { getPrepareCandidateAnimals, getUntestedAnimals, getBaseAnimals } = require('./helpers/animal-testing')

const router = govukPrototypeKit.requests.setupRouter()

router.get('/list-print/select-visit-task', (_req, res) => {
  res.render('list-print/select-visit-task')
})

router.get('/list-print/download-list', (req, res) => {
  const settings = getDownloadListSettings(req.session.data)
  const cattle = sortCattle(DOWNLOAD_LIST_CATTLE, settings.sortBy, settings.sortDirection)

  res.locals.settings = settings
  res.locals.cattle = cattle
  res.locals.showAge = settings.previewOptions.includes('Age')
  res.locals.showDob = settings.previewOptions.includes('DOB')
  res.locals.showSex = settings.previewOptions.includes('Sex')
  res.locals.showBreed = settings.previewOptions.includes('Breed')
  res.locals.showVaccinationStatus = settings.previewOptions.includes('Vaccination status')
  res.locals.datePopulated = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  res.render('list-print/download-list')
})

router.post('/list-print/download-list', (req, res) => {
  req.session.data['previewOptions'] = toArray(req.body['previewOptions'])
  req.session.data['downloadFormat'] = req.body['downloadFormat'] || 'pdf'
  req.session.data['sortBy'] = req.body['sortBy'] || 'Ear-tag number'
  req.session.data['sortDirection'] = req.body['sortDirection'] || 'asc'
  req.session.data['previewTextSize'] = req.body['previewTextSize'] || 'standard'
  req.session.data['previewOrientation'] = req.body['previewOrientation'] || 'portrait'
  req.session.data['previewSpacing'] = req.body['previewSpacing'] || 'standard'
  res.redirect('/list-print/download-list')
})

router.get('/list-print/download-list/reset', (req, res) => {
  for (const key of ['previewOptions', 'downloadFormat', 'sortBy', 'sortDirection', 'previewTextSize', 'previewOrientation', 'previewSpacing']) {
    delete req.session.data[key]
  }
  res.redirect('/list-print/download-list')
})

router.get('/test-list/search', function (_req, res) {
  res.render('test-list/search')
})

router.post('/test-list/search', function (req, res) {
  const searchInput = (req.body['tl_cattleSearch'] || '').trim()
  req.session.data['tl_cattleSearch'] = searchInput

  if (!searchInput) {
    return res.render('test-list/search', {
      errors: { tl_cattleSearch: { text: 'Enter a CPH, farm name, postcode or ear tag' } },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [{ text: 'Enter a CPH, farm name, postcode or ear tag', href: '#tl_cattleSearch' }]
      }
    })
  }

  req.session.data['tl_searchResultGroups'] = searchFarms(searchInput)
  res.redirect('/test-list/search-results')
})

router.get('/test-list/search-results', function (_req, res) {
  res.render('test-list/search-results')
})

router.post('/test-list/search-results', function (req, res) {
  const selected = req.body['tl_selectedCattle']
  if (!selected) {
    return res.render('test-list/search-results', {
      errors: { tl_selectedCattle: { text: 'Select a farm' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select a farm', href: '#tl_selectedCattle' }] }
    })
  }

  req.session.data['tl_selectedCattle'] = selected
  req.session.data['tl_herd'] = TL_HERD_DATA[selected]
  res.redirect('/test-list/confirm-herd')
})

router.get('/test-list/confirm-herd', function (req, res) {
  const selected = req.session.data['tl_selectedCattle']
  const locals = { tbStatus: getTbStatus(selected) }
  if (selected && ANIMALS_BY_CPH[selected]) {
    locals.vaccinatedCount = ANIMALS_BY_CPH[selected].filter(function (a) {
      return a.vaccinationStatus === 'Vaccinated'
    }).length
  }
  res.render('test-list/confirm-herd', locals)
})

router.get('/test-list/select-visit-task', function (_req, res) {
  res.render('test-list/select-visit-task')
})

router.post('/test-list/select-journey', function (req, res) {
  const journey = req.body['tl_journey']
  req.session.data['tl_journey'] = journey
  if (!journey) {
    return res.render('test-list/select-visit-task', {
      errors: { tl_journey: { text: 'Select what you will do on this visit' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select what you will do on this visit', href: '#tl_journey' }] }
    })
  }
  if (journey === 'prepare-skin-test') {
    req.session.data['tl_prepareSkinTestType'] = null
    req.session.data['tl_prepareSkinTestPhase'] = null
    return res.redirect('/test-list/prepare-skin-test-type')
  }
  if (journey === 'report-skin-test-results') {
    return res.redirect('/test-list/report-who-tested')
  }
  return res.redirect('/test-list/select-visit-task')
})

router.get('/test-list/prepare-skin-test-type', function (_req, res) {
  res.render('test-list/prepare-skin-test-type')
})

router.post('/test-list/prepare-skin-test-type', function (req, res) {
  const submitted = req.body['tl_prepareSkinTestType']
  const prepareSkinTestType = submitted === 'DIVA and SICCT' ? 'Both' : submitted
  req.session.data['tl_prepareSkinTestType'] = prepareSkinTestType
  if (!prepareSkinTestType) {
    return res.render('test-list/prepare-skin-test-type', {
      errors: { tl_prepareSkinTestType: { text: 'Select which skin test you are preparing a list for' } },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [{ text: 'Select which skin test you are preparing a list for', href: '#tl_prepareSkinTestType' }]
      }
    })
  }
  req.session.data['tl_prepareSkinTestUntested'] = null
  req.session.data['tl_prepareSkinTestUntestedReasons'] = null
  req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = null
  req.session.data['tl_currentPrepareUntestedIndex'] = 0
  req.session.data['tl_prepareSkinTestAssignments'] = null
  req.session.data['tl_prepareAssignMode'] = null
  req.session.data['tl_prepareAssignFirstTest'] = null
  req.session.data['tl_prepareAssignCurrentTest'] = null
  req.session.data['tl_prepareAssignCompletedTests'] = []
  if (prepareSkinTestType === 'Both') {
    req.session.data['tl_prepareSkinTestPhase'] = 'sicct'
    return res.redirect('/test-list/prepare-skin-test-assign')
  }
  const cph = req.session.data['tl_selectedCattle']
  const animals = ANIMALS_BY_CPH[cph] || []
  if (prepareSkinTestType === 'SICCT') {
    const mismatched = animals.filter(function (a) {
      return a.vaccinationStatus === 'Vaccinated'
    })
    if (mismatched.length > 0) {
      req.session.data['tl_warningContext'] = 'SICCT-with-vax'
      return res.redirect('/test-list/prepare-skin-test-warning')
    }
  } else if (prepareSkinTestType === 'DIVA') {
    const mismatched = animals.filter(function (a) {
      return a.vaccinationStatus !== 'Vaccinated'
    })
    if (mismatched.length > 0) {
      req.session.data['tl_warningContext'] = 'DIVA-without-vax'
      return res.redirect('/test-list/prepare-skin-test-warning')
    }
  }
  req.session.data['tl_prepareSkinTestPhase'] = prepareSkinTestType === 'SICCT' ? 'sicct' : 'diva'
  req.session.data['tl_prepareSkinTestUntested'] = []
  req.session.data['tl_prepareSkinTestUntestedReasons'] = {}
  req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = {}
  res.redirect('/test-list/skin-test-list')
})

router.get('/test-list/prepare-skin-test-warning', function (req, res) {
  const warningContext = req.session.data['tl_warningContext']
  const cph = req.session.data['tl_selectedCattle']
  const animals = ANIMALS_BY_CPH[cph] || []
  const mismatchedCattle =
    warningContext === 'SICCT-with-vax'
      ? animals.filter(function (a) {
          return a.vaccinationStatus === 'Vaccinated'
        })
      : animals.filter(function (a) {
          return a.vaccinationStatus !== 'Vaccinated'
        })
  res.render('test-list/prepare-skin-test-warning', { warningContext, mismatchedCattle })
})

router.post('/test-list/prepare-skin-test-warning', function (req, res) {
  const warningChoice = req.body['tl_warningChoice']
  if (!warningChoice) {
    const warningContext = req.session.data['tl_warningContext']
    const cph = req.session.data['tl_selectedCattle']
    const animals = ANIMALS_BY_CPH[cph] || []
    const mismatchedCattle =
      warningContext === 'SICCT-with-vax'
        ? animals.filter(function (a) {
            return a.vaccinationStatus === 'Vaccinated'
          })
        : animals.filter(function (a) {
            return a.vaccinationStatus !== 'Vaccinated'
          })
    return res.render('test-list/prepare-skin-test-warning', {
      warningContext,
      mismatchedCattle,
      errors: { tl_warningChoice: { text: 'Select what you would like to do' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select what you would like to do', href: '#tl_warningChoice' }] }
    })
  }
  if (warningChoice === 'switch-both') {
    req.session.data['tl_prepareSkinTestType'] = 'Both'
    req.session.data['tl_prepareSkinTestPhase'] = 'sicct'
    return res.redirect('/test-list/prepare-skin-test-assign')
  }
  const prepareSkinTestType = req.session.data['tl_prepareSkinTestType']
  req.session.data['tl_prepareSkinTestPhase'] = prepareSkinTestType === 'SICCT' ? 'sicct' : 'diva'
  req.session.data['tl_prepareSkinTestUntested'] = []
  req.session.data['tl_prepareSkinTestUntestedReasons'] = {}
  req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = {}
  res.redirect('/test-list/skin-test-list')
})

router.get('/test-list/prepare-skin-test-assign', function (req, res) {
  if (req.session.data['tl_prepareSkinTestType'] !== 'Both') {
    return res.redirect('/test-list/prepare-skin-test-type')
  }
  res.render('test-list/prepare-skin-test-assign')
})

router.post('/test-list/prepare-skin-test-assign', function (req, res) {
  const prepareAssignMode = req.body['tl_prepareAssignMode']
  req.session.data['tl_prepareAssignMode'] = prepareAssignMode
  if (prepareAssignMode !== 'auto' && prepareAssignMode !== 'manual') {
    return res.render('test-list/prepare-skin-test-assign', {
      errors: { tl_prepareAssignMode: { text: 'Select how you want to assign cattle to each test' } },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [{ text: 'Select how you want to assign cattle to each test', href: '#tl_prepareAssignMode' }]
      }
    })
  }
  if (prepareAssignMode === 'auto') {
    const animals = getBaseAnimals(req)
    req.session.data['tl_prepareSkinTestAssignments'] = {
      sicct: animals
        .filter(function (a) {
          return a.vaccinationStatus !== 'Vaccinated'
        })
        .map(function (a) {
          return a.officialId
        }),
      diva: animals
        .filter(function (a) {
          return a.vaccinationStatus === 'Vaccinated'
        })
        .map(function (a) {
          return a.officialId
        })
    }
    req.session.data['tl_prepareAssignCompletedTests'] = ['sicct', 'diva']
    req.session.data['tl_prepareSkinTestUntested'] = []
    req.session.data['tl_prepareSkinTestUntestedReasons'] = {}
    req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = {}
    return res.redirect('/test-list/skin-test-list')
  }
  req.session.data['tl_prepareSkinTestAssignments'] = { sicct: [], diva: [] }
  req.session.data['tl_prepareAssignCompletedTests'] = []
  res.redirect('/test-list/prepare-skin-test-assign-order')
})

router.get('/test-list/prepare-skin-test-assign-order', function (req, res) {
  if (req.session.data['tl_prepareAssignMode'] !== 'manual') {
    return res.redirect('/test-list/prepare-skin-test-assign')
  }
  res.render('test-list/prepare-skin-test-assign-order')
})

router.post('/test-list/prepare-skin-test-assign-order', function (req, res) {
  const prepareAssignFirstTest = req.body['tl_prepareAssignFirstTest']
  req.session.data['tl_prepareAssignFirstTest'] = prepareAssignFirstTest
  if (prepareAssignFirstTest !== 'sicct' && prepareAssignFirstTest !== 'diva') {
    return res.render('test-list/prepare-skin-test-assign-order', {
      errors: { tl_prepareAssignFirstTest: { text: 'Select which test you want to choose cattle for first' } },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [{ text: 'Select which test you want to choose cattle for first', href: '#tl_prepareAssignFirstTest' }]
      }
    })
  }
  req.session.data['tl_prepareAssignCurrentTest'] = prepareAssignFirstTest
  res.redirect('/test-list/prepare-skin-test-assign-cattle')
})

router.get('/test-list/prepare-skin-test-assign-cattle', function (req, res) {
  if (req.session.data['tl_prepareAssignMode'] !== 'manual') {
    return res.redirect('/test-list/prepare-skin-test-assign')
  }
  const currentTest = req.session.data['tl_prepareAssignCurrentTest']
  if (currentTest !== 'sicct' && currentTest !== 'diva') {
    return res.redirect('/test-list/prepare-skin-test-assign-order')
  }
  const otherTest = currentTest === 'sicct' ? 'diva' : 'sicct'
  const completed = toArray(req.session.data['tl_prepareAssignCompletedTests'])
  const isSecondPass = completed.indexOf(otherTest) !== -1
  const assignments = req.session.data['tl_prepareSkinTestAssignments'] || { sicct: [], diva: [] }
  const otherAssigned = new Set(assignments[otherTest] || [])
  const allAnimals = getPrepareCandidateAnimals(req)
  const animals = isSecondPass
    ? allAnimals.filter(function (a) {
        return !otherAssigned.has(a.officialId)
      })
    : allAnimals
  res.render('test-list/prepare-skin-test-assign-cattle', {
    currentTestLabel: currentTest === 'diva' ? 'DIVA' : 'SICCT',
    otherTestLabel: otherTest === 'diva' ? 'DIVA' : 'SICCT',
    isSecondPass,
    animals,
    selectedAssigned: assignments[currentTest] || [],
    backHref: isSecondPass ? '/test-list/prepare-skin-test-assign-cattle' : '/test-list/prepare-skin-test-assign-order',
    sortBy: req.session.data['tl_prepareSkinTestUntestedSortBy'] || 'Ear-tag number (last 4 digits)',
    sortDirection: req.session.data['tl_prepareSkinTestUntestedSortDirection'] || 'asc'
  })
})

router.post('/test-list/prepare-skin-test-assign-cattle', function (req, res) {
  const currentTest = req.session.data['tl_prepareAssignCurrentTest']
  if (currentTest !== 'sicct' && currentTest !== 'diva') {
    return res.redirect('/test-list/prepare-skin-test-assign-order')
  }
  const submitted = toArray(req.body['tl_assignedCattle'])
  const assigned = submitted.filter(function (id) {
    return id && id !== '_unchecked'
  })
  const assignments = Object.assign({ sicct: [], diva: [] }, req.session.data['tl_prepareSkinTestAssignments'] || {})
  assignments[currentTest] = assigned
  req.session.data['tl_prepareSkinTestAssignments'] = assignments
  const completed = toArray(req.session.data['tl_prepareAssignCompletedTests']).slice()
  if (completed.indexOf(currentTest) === -1) completed.push(currentTest)
  req.session.data['tl_prepareAssignCompletedTests'] = completed
  const otherTest = currentTest === 'sicct' ? 'diva' : 'sicct'
  if (completed.indexOf(otherTest) === -1) {
    req.session.data['tl_prepareAssignCurrentTest'] = otherTest
    return res.redirect('/test-list/prepare-skin-test-assign-cattle')
  }
  req.session.data['tl_prepareSkinTestUntested'] = []
  req.session.data['tl_prepareSkinTestUntestedReasons'] = {}
  req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = {}
  res.redirect('/test-list/skin-test-list')
})

router.post('/test-list/prepare-skin-test-assign-cattle/settings', function (req, res) {
  req.session.data['tl_prepareSkinTestUntestedSortBy'] = req.body['tl_sortBy'] || 'Ear-tag number (last 4 digits)'
  req.session.data['tl_prepareSkinTestUntestedSortDirection'] = req.body['tl_sortDirection'] || 'asc'
  res.redirect('/test-list/prepare-skin-test-assign-cattle')
})

router.get('/test-list/prepare-skin-test-assign-cattle/settings/reset', function (req, res) {
  req.session.data['tl_prepareSkinTestUntestedSortBy'] = 'Ear-tag number (last 4 digits)'
  req.session.data['tl_prepareSkinTestUntestedSortDirection'] = 'asc'
  res.redirect('/test-list/prepare-skin-test-assign-cattle')
})

router.get('/test-list/prepare-skin-test-assign-cattle/edit/:test', function (req, res) {
  const test = req.params.test === 'diva' ? 'diva' : 'sicct'
  const otherTest = test === 'diva' ? 'sicct' : 'diva'
  const assignments = req.session.data['tl_prepareSkinTestAssignments'] || { sicct: [], diva: [] }
  res.render('test-list/prepare-skin-test-assign-cattle', {
    currentTestLabel: test === 'diva' ? 'DIVA' : 'SICCT',
    otherTestLabel: otherTest === 'diva' ? 'DIVA' : 'SICCT',
    isSecondPass: false,
    isEditMode: true,
    editTest: test,
    animals: getPrepareCandidateAnimals(req),
    selectedAssigned: assignments[test] || [],
    backHref: '/test-list/skin-test-list',
    sortBy: req.session.data['tl_prepareSkinTestUntestedSortBy'] || 'Ear-tag number (last 4 digits)',
    sortDirection: req.session.data['tl_prepareSkinTestUntestedSortDirection'] || 'asc'
  })
})

router.post('/test-list/prepare-skin-test-assign-cattle/edit/:test', function (req, res) {
  const test = req.params.test === 'diva' ? 'diva' : 'sicct'
  const submitted = toArray(req.body['tl_assignedCattle'])
  const assigned = submitted.filter(function (id) {
    return id && id !== '_unchecked'
  })
  const assignments = Object.assign({ sicct: [], diva: [] }, req.session.data['tl_prepareSkinTestAssignments'] || {})
  assignments[test] = assigned
  req.session.data['tl_prepareSkinTestAssignments'] = assignments
  req.session.data['tl_prepareAssignCompletedTests'] = ['sicct', 'diva']
  res.redirect('/test-list/skin-test-list?sublist=' + (test === 'diva' ? 'diva' : 'sicct'))
})

router.get('/test-list/prepare-skin-test-untested', function (req, res) {
  if (!req.session.data['tl_prepareSkinTestType']) {
    return res.redirect('/test-list/prepare-skin-test-type')
  }
  if (req.query && req.query.skip === '1') {
    req.session.data['tl_prepareSkinTestUntested'] = []
    req.session.data['tl_prepareSkinTestUntestedReasons'] = {}
    req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = {}
    return res.redirect('/test-list/skin-test-list')
  }
  const animals = getPrepareCandidateAnimals(req)
  const selectedUntested = toArray(req.session.data['tl_prepareSkinTestUntested'])
  res.render('test-list/prepare-skin-test-untested', {
    animals,
    selectedUntested,
    sortBy: req.session.data['tl_prepareSkinTestUntestedSortBy'] || 'Ear-tag number (last 4 digits)',
    sortDirection: req.session.data['tl_prepareSkinTestUntestedSortDirection'] || 'asc'
  })
})

router.post('/test-list/prepare-skin-test-untested/settings', function (req, res) {
  req.session.data['tl_prepareSkinTestUntestedSortBy'] = req.body['tl_sortBy'] || 'Ear-tag number (last 4 digits)'
  req.session.data['tl_prepareSkinTestUntestedSortDirection'] = req.body['tl_sortDirection'] || 'asc'
  res.redirect('/test-list/prepare-skin-test-untested')
})

router.get('/test-list/prepare-skin-test-untested/settings/reset', function (req, res) {
  req.session.data['tl_prepareSkinTestUntestedSortBy'] = 'Ear-tag number (last 4 digits)'
  req.session.data['tl_prepareSkinTestUntestedSortDirection'] = 'asc'
  res.redirect('/test-list/prepare-skin-test-untested')
})

router.post('/test-list/prepare-skin-test-untested', function (req, res) {
  const submitted = toArray(req.body['tl_untested'])
  const untested = submitted.filter(function (id) {
    return id && id !== '_unchecked'
  })
  req.session.data['tl_prepareSkinTestUntested'] = untested
  const existingReasons = req.session.data['tl_prepareSkinTestUntestedReasons'] || {}
  const existingOthers = req.session.data['tl_prepareSkinTestUntestedReasonOthers'] || {}
  const prunedReasons = {}
  const prunedOthers = {}
  untested.forEach(function (id) {
    if (existingReasons[id]) prunedReasons[id] = existingReasons[id]
    if (existingOthers[id]) prunedOthers[id] = existingOthers[id]
  })
  req.session.data['tl_prepareSkinTestUntestedReasons'] = prunedReasons
  req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = prunedOthers
  req.session.data['tl_currentPrepareUntestedIndex'] = 0
  if (untested.length === 0) return res.redirect('/test-list/skin-test-list')
  res.redirect('/test-list/prepare-skin-test-untested-reason/0')
})

router.get('/test-list/prepare-skin-test-untested-reason', function (req, res) {
  const resumeIndex = Number.isInteger(req.session.data['tl_currentPrepareUntestedIndex']) ? req.session.data['tl_currentPrepareUntestedIndex'] : 0
  res.redirect('/test-list/prepare-skin-test-untested-reason/' + resumeIndex)
})

function tlRenderPrepareUntestedReason(req, res, index, options) {
  const animals = getUntestedAnimals(req)
  const total = animals.length
  if (total === 0) return res.redirect('/test-list/prepare-skin-test-untested')
  const safeIndex = Math.max(0, Math.min(index, total - 1))
  const currentAnimal = animals[safeIndex]
  const reasons = req.session.data['tl_prepareSkinTestUntestedReasons'] || {}
  const others = req.session.data['tl_prepareSkinTestUntestedReasonOthers'] || {}
  const completedCount = animals.filter(function (a) {
    return reasons[a.officialId]
  }).length
  res.render('test-list/prepare-skin-test-untested-reason', {
    currentIndex: safeIndex,
    currentPosition: safeIndex + 1,
    totalUntested: total,
    completedCount,
    remainingCount: total - completedCount,
    progressPercent: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    currentAnimal,
    savedReason: reasons[currentAnimal.officialId] || '',
    savedReasonOther: others[currentAnimal.officialId] || '',
    backHref: safeIndex > 0 ? '/test-list/prepare-skin-test-untested-reason/' + (safeIndex - 1) : '/test-list/prepare-skin-test-untested',
    errors: options && options.errors,
    errorSummary: options && options.errorSummary,
    formValues: (options && options.formValues) || {}
  })
}

router.get('/test-list/prepare-skin-test-untested-reason/:index', function (req, res) {
  const animals = getUntestedAnimals(req)
  if (animals.length === 0) return res.redirect('/test-list/prepare-skin-test-untested')
  const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
  req.session.data['tl_currentPrepareUntestedIndex'] = index
  tlRenderPrepareUntestedReason(req, res, index)
})

router.post('/test-list/prepare-skin-test-untested-reason/:index', function (req, res) {
  const animals = getUntestedAnimals(req)
  if (animals.length === 0) return res.redirect('/test-list/prepare-skin-test-untested')
  const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
  const currentAnimal = animals[index]
  const reason = (req.body['tl_reason'] || '').trim()
  const reasonOther = (req.body['tl_reasonOther'] || '').trim()
  if (!reason) {
    return tlRenderPrepareUntestedReason(req, res, index, {
      errors: { tl_reason: { text: 'Select a reason this animal will not be tested' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select a reason this animal will not be tested', href: '#tl_reason' }] },
      formValues: { tl_reason: reason, tl_reasonOther: reasonOther }
    })
  }
  const reasons = Object.assign({}, req.session.data['tl_prepareSkinTestUntestedReasons'] || {})
  const others = Object.assign({}, req.session.data['tl_prepareSkinTestUntestedReasonOthers'] || {})
  reasons[currentAnimal.officialId] = reason
  if (reason === 'other') {
    others[currentAnimal.officialId] = reasonOther
  } else {
    delete others[currentAnimal.officialId]
  }
  req.session.data['tl_prepareSkinTestUntestedReasons'] = reasons
  req.session.data['tl_prepareSkinTestUntestedReasonOthers'] = others
  if (index < animals.length - 1) {
    const nextIndex = index + 1
    req.session.data['tl_currentPrepareUntestedIndex'] = nextIndex
    return res.redirect('/test-list/prepare-skin-test-untested-reason/' + nextIndex)
  }
  req.session.data['tl_currentPrepareUntestedIndex'] = animals.length - 1
  res.redirect('/test-list/prepare-skin-test-untested-confirm')
})

router.get('/test-list/prepare-skin-test-untested-confirm', function (req, res) {
  const ids = toArray(req.session.data['tl_prepareSkinTestUntested'])
  const reasons = req.session.data['tl_prepareSkinTestUntestedReasons'] || {}
  const others = req.session.data['tl_prepareSkinTestUntestedReasonOthers'] || {}
  const idSet = new Set(ids)
  const untestedRows = getPrepareCandidateAnimals(req)
    .filter(function (a) {
      return idSet.has(a.officialId)
    })
    .map(function (a) {
      return {
        officialId: a.officialId,
        earTagParts: a.earTagParts,
        age: a.age,
        dob: a.dob,
        sex: a.sex,
        breed: a.breed,
        reason: reasons[a.officialId] || '',
        reasonLabel: UNTESTED_REASON_LABELS[reasons[a.officialId]] || 'No reason',
        reasonOther: reasons[a.officialId] === 'other' ? others[a.officialId] || '' : ''
      }
    })
  res.render('test-list/prepare-skin-test-untested-confirm', { untestedRows })
})

router.post('/test-list/prepare-skin-test-untested-confirm', function (_req, res) {
  res.redirect('/test-list/skin-test-list')
})

router.get('/test-list/skin-test-list', function (req, res) {
  const baseAnimals = getBaseAnimals(req)
  const prepareSkinTestType = req.session.data['tl_prepareSkinTestType'] || 'SICCT'
  const sublistOverride = req.query && req.query.sublist
  const sessionPhase = req.session.data['tl_prepareSkinTestPhase'] || (prepareSkinTestType === 'DIVA' ? 'diva' : 'sicct')
  const prepareSkinTestPhase = sublistOverride === 'sicct' || sublistOverride === 'diva' ? sublistOverride : sessionPhase
  const isBoth = prepareSkinTestType === 'Both'
  const settings = tlBuildPreviewSettings(req.session.data)
  const prepareUntestedSet = new Set(toArray(req.session.data['tl_prepareSkinTestUntested']))
  const assignments = req.session.data['tl_prepareSkinTestAssignments'] || null
  const hasAssignments =
    isBoth &&
    assignments &&
    Array.isArray(assignments.sicct) &&
    Array.isArray(assignments.diva) &&
    assignments.sicct.length + assignments.diva.length > 0

  function buildPreviewForPhase(phase) {
    const phaseSet = hasAssignments ? new Set(assignments[phase] || []) : null
    const filtered = baseAnimals.filter(function (a) {
      if (prepareUntestedSet.has(a.officialId)) return false
      if (phaseSet && !phaseSet.has(a.officialId)) return false
      return true
    })
    const enriched = enrichWithFlags(filtered)
    return { rows: tlBuildPreviewRows(enriched, settings.visibleColumns), count: enriched.length }
  }

  let sicctPreview = null
  let divaPreview = null
  if (isBoth || prepareSkinTestPhase === 'sicct') sicctPreview = buildPreviewForPhase('sicct')
  if (isBoth || prepareSkinTestPhase === 'diva') divaPreview = buildPreviewForPhase('diva')

  res.render('test-list/skin-test-list', {
    prepareSkinTestType,
    prepareSkinTestPhase,
    isBothJourney: isBoth,
    listTestLabel: prepareSkinTestPhase === 'diva' ? 'DIVA' : 'SICCT',
    bothStepText: isBoth ? (prepareSkinTestPhase === 'sicct' ? 'Step 1 of 2' : 'Step 2 of 2') : null,
    previewColumns: settings.visibleColumns,
    previewAllColumns: TL_SKIN_TEST_COLUMNS,
    previewOptions: settings.previewOptions,
    emphasiseLastFive: settings.emphasiseLastFive,
    downloadFormat: req.session.data['tl_downloadFormat'] || 'pdf',
    previewTextSize: settings.previewTextSize,
    previewOrientation: settings.previewOrientation,
    previewSpacing: settings.previewSpacing,
    sicctPreviewRows: sicctPreview && sicctPreview.rows,
    sicctPreviewCount: sicctPreview && sicctPreview.count,
    divaPreviewRows: divaPreview && divaPreview.rows,
    divaPreviewCount: divaPreview && divaPreview.count
  })
})

router.post('/test-list/skin-test-list', function (req, res) {
  req.session.data['tl_skinTestPreviewOptions'] = toArray(req.body['tl_previewOptions'])
  req.session.data['tl_downloadFormat'] = req.body['tl_downloadFormat'] || 'pdf'
  req.session.data['tl_skinTestSortBy'] = req.body['tl_sortBy'] || 'Ear-tag number (last 4 digits)'
  req.session.data['tl_skinTestSortDirection'] = req.body['tl_sortDirection'] || 'asc'
  req.session.data['tl_skinTestPreviewTextSize'] = req.body['tl_previewTextSize'] || 'standard'
  req.session.data['tl_skinTestPreviewOrientation'] = req.body['tl_previewOrientation'] || 'portrait'
  req.session.data['tl_skinTestPreviewSpacing'] = req.body['tl_previewSpacing'] || 'standard'
  res.redirect('/test-list/skin-test-list')
})

router.get('/test-list/skin-test-list/reset', function (req, res) {
  for (const key of [
    'tl_skinTestPreviewOptions',
    'tl_downloadFormat',
    'tl_skinTestSortBy',
    'tl_skinTestSortDirection',
    'tl_skinTestPreviewTextSize',
    'tl_skinTestPreviewOrientation',
    'tl_skinTestPreviewSpacing'
  ]) {
    delete req.session.data[key]
  }
  res.redirect('/test-list/skin-test-list')
})

router.get('/test-list/skin-test-list-confirmed', function (req, res) {
  const prepareSkinTestType = req.session.data['tl_prepareSkinTestType'] || 'SICCT'
  const prepareSkinTestPhase = req.session.data['tl_prepareSkinTestPhase'] || (prepareSkinTestType === 'DIVA' ? 'diva' : 'sicct')
  const isBoth = prepareSkinTestType === 'Both'
  const listTestLabel = prepareSkinTestPhase === 'diva' ? 'DIVA' : 'SICCT'
  const bothHasNextStep = isBoth && prepareSkinTestPhase === 'sicct'
  res.render('test-list/skin-test-list-confirmed', {
    prepareSkinTestType,
    prepareSkinTestPhase,
    listTestLabel,
    isBothJourney: isBoth,
    bothHasNextStep
  })
})

router.post('/test-list/prepare-skin-test-next', function (req, res) {
  if (req.session.data['tl_prepareSkinTestType'] === 'Both' && req.session.data['tl_prepareSkinTestPhase'] === 'sicct') {
    req.session.data['tl_prepareSkinTestPhase'] = 'diva'
    for (const key of [
      'tl_skinTestPreviewOptions',
      'tl_skinTestSortBy',
      'tl_skinTestSortDirection',
      'tl_downloadFormat',
      'tl_skinTestPreviewTextSize',
      'tl_skinTestPreviewOrientation',
      'tl_skinTestPreviewSpacing'
    ]) {
      delete req.session.data[key]
    }
    return res.redirect('/test-list/skin-test-list')
  }
  res.redirect('/test-list/skin-test-list-confirmed')
})

router.get('/test-list/test-type', (_req, res) => {
  res.render('test-list/test-type')
})

router.post('/test-list/test-type', (req, res) => {
  const testType = req.body['testType']
  if (!testType) {
    return res.render('test-list/test-type', {
      errors: { testType: { text: 'Select which skin test you are preparing a list for' } },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [{ text: 'Select which skin test you are preparing a list for', href: '#testType' }]
      }
    })
  }
  req.session.data['testList_testType'] = testType
  for (const key of ['testList_previewOptions', 'testList_sortBy']) {
    delete req.session.data[key]
  }
  res.redirect('/test-list/download-list')
})

router.get('/test-list/download-list', (req, res) => {
  if (!req.session.data['testList_testType']) {
    return res.redirect('/test-list/test-type')
  }
  const settings = getTestListSettings(req.session.data)

  let cattle = TEST_LIST_CATTLE
  if (settings.testType === 'SICCT') {
    cattle = cattle.filter((a) => a.vaccinationStatus !== 'Vaccinated')
  } else if (settings.testType === 'DIVA') {
    cattle = cattle.filter((a) => a.vaccinationStatus === 'Vaccinated')
  }
  cattle = sortTestCattle(cattle, settings.sortBy, settings.sortDirection)

  res.locals.settings = settings
  res.locals.cattle = cattle
  res.locals.showAge = settings.previewOptions.includes('Age')
  res.locals.showDob = settings.previewOptions.includes('DOB')
  res.locals.showSex = settings.previewOptions.includes('Sex')
  res.locals.showBreed = settings.previewOptions.includes('Breed')
  res.locals.showTestType = settings.testType === 'Both' && settings.previewOptions.includes('Test type')
  res.locals.datePopulated = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  res.render('test-list/download-list')
})

router.post('/test-list/download-list', (req, res) => {
  req.session.data['testList_previewOptions'] = toArray(req.body['previewOptions'])
  req.session.data['testList_downloadFormat'] = req.body['downloadFormat'] || 'pdf'
  req.session.data['testList_sortBy'] = req.body['sortBy'] || 'Ear-tag number'
  req.session.data['testList_sortDirection'] = req.body['sortDirection'] || 'asc'
  req.session.data['testList_previewTextSize'] = req.body['previewTextSize'] || 'standard'
  req.session.data['testList_previewOrientation'] = req.body['previewOrientation'] || 'portrait'
  req.session.data['testList_previewSpacing'] = req.body['previewSpacing'] || 'standard'
  res.redirect('/test-list/download-list')
})

router.get('/test-list/download-list/reset', (req, res) => {
  for (const key of [
    'testList_previewOptions',
    'testList_downloadFormat',
    'testList_sortBy',
    'testList_sortDirection',
    'testList_previewTextSize',
    'testList_previewOrientation',
    'testList_previewSpacing'
  ]) {
    delete req.session.data[key]
  }
  res.redirect('/test-list/download-list')
})

// ============================================================
// Test list — Report skin test results
// ============================================================

router.get('/test-list/report-who-tested', function (_req, res) {
  res.render('test-list/report-who-tested')
})

router.post('/test-list/report-who-tested', function (req, res) {
  const tester = req.body['tl_reportTester']
  const testerName = (req.body['tl_reportTesterName'] || '').trim()
  const testerRole = req.body['tl_reportTesterRole']
  const testerRoleOther = (req.body['tl_reportTesterRoleOther'] || '').trim()

  const errors = {}
  const errorList = []

  if (!tester) {
    errors.tl_reportTester = { text: 'Select who tested the cattle' }
    errorList.push({ text: 'Select who tested the cattle', href: '#tl_reportTester' })
  }

  if (tester === 'someone-else') {
    if (!testerName) {
      errors.tl_reportTesterName = { text: "Enter the tester's name" }
      errorList.push({ text: "Enter the tester's name", href: '#tl_reportTesterName' })
    }
    if (!testerRole) {
      errors.tl_reportTesterRole = { text: "Select the tester's role" }
      errorList.push({ text: "Select the tester's role", href: '#tl_reportTesterRole' })
    } else if (testerRole === 'other' && !testerRoleOther) {
      errors.tl_reportTesterRoleOther = { text: "Enter the tester's role" }
      errorList.push({ text: "Enter the tester's role", href: '#tl_reportTesterRoleOther' })
    }
  }

  if (errorList.length) {
    return res.render('test-list/report-who-tested', {
      errors,
      errorSummary: { titleText: 'There is a problem', errorList },
      formValues: req.body
    })
  }

  req.session.data['tl_reportTester'] = tester
  req.session.data['tl_reportTesterName'] = testerName || null
  req.session.data['tl_reportTesterRole'] = testerRole || null
  req.session.data['tl_reportTesterRoleOther'] = testerRoleOther || null

  return res.redirect('/test-list/report-day-1')
})

router.get('/test-list/report-day-1', function (_req, res) {
  res.render('test-list/report-day-1')
})

router.post('/test-list/report-day-1', function (req, res) {
  const day = (req.body['tl_reportDay1Date-day'] || '').trim()
  const month = (req.body['tl_reportDay1Date-month'] || '').trim()
  const year = (req.body['tl_reportDay1Date-year'] || '').trim()
  const hour = (req.body['tl_reportDay1Time-hour'] || '').trim()
  const minute = (req.body['tl_reportDay1Time-minute'] || '').trim()
  const ampm = (req.body['tl_reportDay1Time-ampm'] || '').trim()

  const errors = {}
  const errorList = []

  if (!day || !month || !year) {
    errors.tl_reportDay1Date = { text: 'Enter the date of Day 1' }
    errorList.push({ text: 'Enter the date of Day 1', href: '#tl_reportDay1Date-day' })
  }

  const hourNum = parseInt(hour, 10)
  const minuteNum = parseInt(minute, 10)
  if (!hour || !minute || !ampm || isNaN(hourNum) || isNaN(minuteNum) || hourNum < 1 || hourNum > 12 || minuteNum < 0 || minuteNum > 59) {
    errors.tl_reportDay1Time = { text: 'Enter a valid time Day 1 began' }
    errorList.push({ text: 'Enter a valid time Day 1 began', href: '#tl_reportDay1Time-hour' })
  }

  if (errorList.length) {
    return res.render('test-list/report-day-1', {
      errors,
      errorSummary: { titleText: 'There is a problem', errorList },
      formValues: req.body
    })
  }

  req.session.data['tl_reportDay1Date'] = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
  req.session.data['tl_reportDay1Time'] = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${ampm}`

  const d1 = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
  const d2 = new Date(d1.getTime() + 72 * 60 * 60 * 1000)
  req.session.data['tl_reportDay2Date-day'] = String(d2.getUTCDate())
  req.session.data['tl_reportDay2Date-month'] = String(d2.getUTCMonth() + 1)
  req.session.data['tl_reportDay2Date-year'] = String(d2.getUTCFullYear())
  req.session.data['tl_reportDay2Date'] = `${String(d2.getUTCDate()).padStart(2, '0')}/${String(d2.getUTCMonth() + 1).padStart(2, '0')}/${d2.getUTCFullYear()}`

  return res.redirect('/test-list/report-test-type')
})


router.get('/test-list/report-test-type', function (req, res) {
  res.render('test-list/report-test-type', {
    sicctBatchValue: toArray(req.session.data['tl_reportSicctBatchNumbers'])[0] || '',
    divaBatchValue: toArray(req.session.data['tl_reportDivaBatchNumbers'])[0] || ''
  })
})

router.post('/test-list/report-test-type', function (req, res) {
  const testTypes = toArray(req.body['tl_reportTestTypes']).filter(v => v !== '_unchecked')
  const sicctBatchNumbers = toArray(req.body['tl_reportSicctBatchNumbers']).filter(Boolean)
  const divaBatchNumbers = toArray(req.body['tl_reportDivaBatchNumbers']).filter(Boolean)

  const errors = {}
  const errorList = []

  if (!testTypes.length) {
    errors.tl_reportTestTypes = { text: 'Select which test you did' }
    errorList.push({ text: 'Select which test you did', href: '#tl_reportTestTypes' })
  }

  if (errorList.length) {
    return res.render('test-list/report-test-type', {
      errors,
      errorSummary: { titleText: 'There is a problem', errorList },
      selectedTestTypes: testTypes,
      sicctBatchValue: sicctBatchNumbers[0] || '',
      divaBatchValue: divaBatchNumbers[0] || ''
    })
  }

  req.session.data['tl_reportTestTypes'] = testTypes
  req.session.data['tl_reportSicctBatchNumbers'] = sicctBatchNumbers[0] || null
  req.session.data['tl_reportDivaBatchNumbers'] = divaBatchNumbers[0] || null

  const bothSelected = testTypes.includes('sicct') && testTypes.includes('diva')
  if (bothSelected) {
    return res.redirect('/test-list/report-record-order')
  }
  req.session.data['tl_reportCurrentReactionTest'] = testTypes[0]
  req.session.data['tl_reportCompletedReactionTests'] = []
  return res.redirect('/test-list/report-reactions')
})

// ============================================================
// Flow 3: Report skin test results — steps 5–10
// ============================================================

router.get('/test-list/report-record-order', function (req, res) {
  res.render('test-list/report-record-order')
})

router.post('/test-list/report-record-order', function (req, res) {
  const order = (req.body['tl_reportRecordOrder'] || '').trim()

  if (!order) {
    return res.render('test-list/report-record-order', {
      errors: { tl_reportRecordOrder: { text: 'Select which results you would like to record first' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select which results you would like to record first', href: '#tl_reportRecordOrder' }] },
      formValues: req.body
    })
  }

  req.session.data['tl_reportRecordOrder'] = order
  req.session.data['tl_reportCurrentReactionTest'] = order
  req.session.data['tl_reportCompletedReactionTests'] = []
  return res.redirect('/test-list/report-reactions')
})

router.get('/test-list/report-reactions/back', function (req, res) {
  const testTypes = toArray(req.session.data['tl_reportTestTypes'])
  const firstTest = req.session.data['tl_reportRecordOrder'] || testTypes[0]
  req.session.data['tl_reportCurrentReactionTest'] = firstTest
  req.session.data['tl_reportCompletedReactionTests'] = []
  if (firstTest === 'sicct') {
    delete req.session.data['tl_reportSicctPositiveReaction']
  } else {
    delete req.session.data['tl_reportDivaPositiveReaction']
  }
  return res.redirect('/test-list/report-reactions')
})

router.get('/test-list/report-reactions', function (req, res) {
  const testTypes = toArray(req.session.data['tl_reportTestTypes'])
  const currentTest = req.session.data['tl_reportCurrentReactionTest'] || testTypes[0]
  const completed = toArray(req.session.data['tl_reportCompletedReactionTests'])
  const isBoth = testTypes.length > 1
  const stepNumber = completed.length + 1
  const totalSteps = testTypes.length

  let backHref
  if (isBoth && stepNumber > 1) {
    backHref = '/test-list/report-reactions/back'
  } else if (isBoth) {
    backHref = '/test-list/report-record-order'
  } else {
    backHref = '/test-list/report-test-type'
  }

  res.render('test-list/report-reactions', { currentTest, stepNumber, totalSteps, isBoth, backHref })
})

router.post('/test-list/report-reactions', function (req, res) {
  const testTypes = toArray(req.session.data['tl_reportTestTypes'])
  const currentTest = req.session.data['tl_reportCurrentReactionTest'] || testTypes[0]
  const completed = toArray(req.session.data['tl_reportCompletedReactionTests'])
  const isBoth = testTypes.length > 1
  const stepNumber = completed.length + 1
  const totalSteps = testTypes.length
  const reaction = (req.body['tl_reportReaction'] || '').trim()

  if (!reaction) {
    const backHref = isBoth && stepNumber > 1 ? '/test-list/report-reactions/back' : (isBoth ? '/test-list/report-record-order' : '/test-list/report-test-type')
    return res.render('test-list/report-reactions', {
      errors: { tl_reportReaction: { text: 'Select yes or no' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select yes or no', href: '#tl_reportReaction' }] },
      formValues: req.body,
      currentTest,
      stepNumber,
      totalSteps,
      isBoth,
      backHref
    })
  }

  if (currentTest === 'sicct') {
    req.session.data['tl_reportSicctPositiveReaction'] = reaction
  } else {
    req.session.data['tl_reportDivaPositiveReaction'] = reaction
  }

  const newCompleted = completed.concat([currentTest])
  req.session.data['tl_reportCompletedReactionTests'] = newCompleted

  if (reaction === 'yes') {
    return res.redirect('/test-list/report-identify-reactors')
  }

  const remaining = testTypes.filter(function (t) { return !newCompleted.includes(t) })
  if (remaining.length > 0) {
    req.session.data['tl_reportCurrentReactionTest'] = remaining[0]
    return res.redirect('/test-list/report-reactions')
  }

  return res.redirect('/test-list/report-all-tested')
})

router.get('/test-list/report-all-tested', function (req, res) {
  const cph = req.session.data['tl_selectedCattle']
  const animals = enrichWithFlags(ANIMALS_BY_CPH[cph] || [])
  res.render('test-list/report-all-tested', { cattleCount: animals.length, animals })
})

router.post('/test-list/report-all-tested', function (req, res) {
  const allTested = (req.body['tl_reportAllTested'] || '').trim()

  if (!allTested) {
    const cph = req.session.data['tl_selectedCattle']
    const animals = ANIMALS_BY_CPH[cph] || []
    return res.render('test-list/report-all-tested', {
      cattleCount: animals.length,
      errors: { tl_reportAllTested: { text: 'Select yes or no' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select yes or no', href: '#tl_reportAllTested' }] },
      formValues: req.body
    })
  }

  req.session.data['tl_reportAllTested'] = allTested

  if (allTested === 'yes') {
    return res.redirect('/test-list/report-check-answers')
  }
  return res.redirect('/test-list/report-untested')
})

router.get('/test-list/report-untested', function (req, res) {
  const cph = req.session.data['tl_selectedCattle']
  const animals = enrichWithFlags(ANIMALS_BY_CPH[cph] || [])
  const selectedUntested = toArray(req.session.data['tl_reportUntestedCattle'])
  res.render('test-list/report-untested', { animals, selectedUntested })
})

router.post('/test-list/report-untested', function (req, res) {
  const submitted = toArray(req.body['tl_reportUntested'])
  const untested = submitted.filter(function (id) { return id && id !== '_unchecked' })

  if (!untested.length) {
    const cph = req.session.data['tl_selectedCattle']
    const animals = enrichWithFlags(ANIMALS_BY_CPH[cph] || [])
    return res.render('test-list/report-untested', {
      animals,
      selectedUntested: [],
      errors: { tl_reportUntested: { text: 'Select at least one animal that was not tested' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select at least one animal that was not tested', href: '#report-untested-0' }] }
    })
  }

  req.session.data['tl_reportUntestedCattle'] = untested

  const existingReasons = req.session.data['tl_reportUntestedReasons'] || {}
  const existingOthers = req.session.data['tl_reportUntestedReasonOthers'] || {}
  const prunedReasons = {}
  const prunedOthers = {}
  untested.forEach(function (id) {
    if (existingReasons[id]) prunedReasons[id] = existingReasons[id]
    if (existingOthers[id]) prunedOthers[id] = existingOthers[id]
  })
  req.session.data['tl_reportUntestedReasons'] = prunedReasons
  req.session.data['tl_reportUntestedReasonOthers'] = prunedOthers
  req.session.data['tl_reportCurrentUntestedIndex'] = 0

  return res.redirect('/test-list/report-untested-reason/0')
})

function getReportUntestedAnimals(req) {
  const cph = req.session.data['tl_selectedCattle']
  const ids = toArray(req.session.data['tl_reportUntestedCattle'])
  if (!ids.length) return []
  const idSet = new Set(ids)
  return enrichWithFlags(ANIMALS_BY_CPH[cph] || []).filter(function (a) { return idSet.has(a.officialId) })
}

function reportRenderUntestedReason(req, res, index, options) {
  const animals = getReportUntestedAnimals(req)
  const total = animals.length
  if (total === 0) return res.redirect('/test-list/report-untested')
  const safeIndex = Math.max(0, Math.min(index, total - 1))
  const currentAnimal = animals[safeIndex]
  const reasons = req.session.data['tl_reportUntestedReasons'] || {}
  const others = req.session.data['tl_reportUntestedReasonOthers'] || {}
  res.render('test-list/report-untested-reason', {
    currentIndex: safeIndex,
    currentPosition: safeIndex + 1,
    totalUntested: total,
    currentAnimal,
    savedReason: reasons[currentAnimal.officialId] || '',
    savedReasonOther: others[currentAnimal.officialId] || '',
    backHref: safeIndex > 0 ? '/test-list/report-untested-reason/' + (safeIndex - 1) : '/test-list/report-untested',
    errors: options && options.errors,
    errorSummary: options && options.errorSummary,
    formValues: (options && options.formValues) || {}
  })
}

router.get('/test-list/report-untested-reason/:index', function (req, res) {
  const animals = getReportUntestedAnimals(req)
  if (animals.length === 0) return res.redirect('/test-list/report-untested')
  const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
  req.session.data['tl_reportCurrentUntestedIndex'] = index
  reportRenderUntestedReason(req, res, index)
})

router.post('/test-list/report-untested-reason/:index', function (req, res) {
  const animals = getReportUntestedAnimals(req)
  if (animals.length === 0) return res.redirect('/test-list/report-untested')
  const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
  const currentAnimal = animals[index]
  const reason = (req.body['tl_reportReason'] || '').trim()
  const reasonOther = (req.body['tl_reportReasonOther'] || '').trim()

  if (!reason) {
    return reportRenderUntestedReason(req, res, index, {
      errors: { tl_reportReason: { text: 'Select a reason this animal was not tested' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select a reason this animal was not tested', href: '#tl_reportReason' }] },
      formValues: { tl_reportReason: reason, tl_reportReasonOther: reasonOther }
    })
  }

  const reasons = Object.assign({}, req.session.data['tl_reportUntestedReasons'] || {})
  const others = Object.assign({}, req.session.data['tl_reportUntestedReasonOthers'] || {})
  reasons[currentAnimal.officialId] = reason
  if (reason === 'other') {
    others[currentAnimal.officialId] = reasonOther
  } else {
    delete others[currentAnimal.officialId]
  }
  req.session.data['tl_reportUntestedReasons'] = reasons
  req.session.data['tl_reportUntestedReasonOthers'] = others

  if (index < animals.length - 1) {
    const nextIndex = index + 1
    req.session.data['tl_reportCurrentUntestedIndex'] = nextIndex
    return res.redirect('/test-list/report-untested-reason/' + nextIndex)
  }
  req.session.data['tl_reportCurrentUntestedIndex'] = animals.length - 1
  return res.redirect('/test-list/report-check-answers')
})

function getReportReactorAnimals(req) {
  const cph = req.session.data['tl_selectedCattle']
  const currentTest = req.session.data['tl_reportCurrentReactionTest']
  const key = currentTest === 'sicct' ? 'tl_reportSicctReactors' : 'tl_reportDivaReactors'
  const ids = toArray(req.session.data[key])
  if (!ids.length) return []
  const idSet = new Set(ids)
  return enrichWithFlags(ANIMALS_BY_CPH[cph] || []).filter(function (a) { return idSet.has(a.officialId) })
}

router.get('/test-list/report-identify-reactors', function (req, res) {
  const cph = req.session.data['tl_selectedCattle']
  const animals = enrichWithFlags(ANIMALS_BY_CPH[cph] || [])
  const currentTest = req.session.data['tl_reportCurrentReactionTest']
  const key = currentTest === 'sicct' ? 'tl_reportSicctReactors' : 'tl_reportDivaReactors'
  const selectedReactors = toArray(req.session.data[key])
  const testTypes = toArray(req.session.data['tl_reportTestTypes'])
  const completed = toArray(req.session.data['tl_reportCompletedReactionTests'])
  const isBoth = testTypes.length > 1
  const stepNumber = completed.length
  const totalSteps = testTypes.length
  res.render('test-list/report-identify-reactors', { animals, selectedReactors, currentTest, isBoth, stepNumber, totalSteps })
})

router.post('/test-list/report-identify-reactors', function (req, res) {
  const submitted = toArray(req.body['tl_reportReactors'])
  const reactors = submitted.filter(function (id) { return id && id !== '_unchecked' })
  const currentTest = req.session.data['tl_reportCurrentReactionTest']

  if (!reactors.length) {
    const cph = req.session.data['tl_selectedCattle']
    const animals = enrichWithFlags(ANIMALS_BY_CPH[cph] || [])
    const testTypes = toArray(req.session.data['tl_reportTestTypes'])
    const completed = toArray(req.session.data['tl_reportCompletedReactionTests'])
    const isBoth = testTypes.length > 1
    return res.render('test-list/report-identify-reactors', {
      animals,
      selectedReactors: [],
      currentTest,
      isBoth,
      stepNumber: completed.length,
      totalSteps: testTypes.length,
      errors: { tl_reportReactors: { text: 'Select at least one animal' } },
      errorSummary: { titleText: 'There is a problem', errorList: [{ text: 'Select at least one animal', href: '#report-reactor-0' }] }
    })
  }

  const key = currentTest === 'sicct' ? 'tl_reportSicctReactors' : 'tl_reportDivaReactors'
  req.session.data[key] = reactors

  const measurementsKey = currentTest === 'sicct' ? 'tl_reportSicctMeasurements' : 'tl_reportDivaMeasurements'
  const existingMeasurements = req.session.data[measurementsKey] || {}
  const prunedMeasurements = {}
  reactors.forEach(function (id) {
    if (existingMeasurements[id]) prunedMeasurements[id] = existingMeasurements[id]
  })
  req.session.data[measurementsKey] = prunedMeasurements
  req.session.data['tl_reportCurrentMeasurementIndex'] = 0

  return res.redirect('/test-list/report-measurements/0')
})

function reportRenderMeasurements(req, res, index, options) {
  const animals = getReportReactorAnimals(req)
  const total = animals.length
  if (total === 0) return res.redirect('/test-list/report-identify-reactors')
  const safeIndex = Math.max(0, Math.min(index, total - 1))
  const currentAnimal = animals[safeIndex]
  const currentTest = req.session.data['tl_reportCurrentReactionTest']
  const measurementsKey = currentTest === 'sicct' ? 'tl_reportSicctMeasurements' : 'tl_reportDivaMeasurements'
  const allMeasurements = req.session.data[measurementsKey] || {}
  const savedMeasurements = allMeasurements[currentAnimal.officialId] || {}
  res.render('test-list/report-measurements', {
    currentIndex: safeIndex,
    currentPosition: safeIndex + 1,
    totalReactors: total,
    currentAnimal,
    currentTest,
    savedMeasurements,
    backHref: safeIndex > 0 ? '/test-list/report-measurements/' + (safeIndex - 1) : '/test-list/report-identify-reactors',
    errors: options && options.errors,
    errorSummary: options && options.errorSummary,
    formValues: (options && options.formValues) || {}
  })
}

router.get('/test-list/report-measurements/:index', function (req, res) {
  const animals = getReportReactorAnimals(req)
  if (animals.length === 0) return res.redirect('/test-list/report-identify-reactors')
  const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
  req.session.data['tl_reportCurrentMeasurementIndex'] = index
  reportRenderMeasurements(req, res, index)
})

router.post('/test-list/report-measurements/:index', function (req, res) {
  const animals = getReportReactorAnimals(req)
  if (animals.length === 0) return res.redirect('/test-list/report-identify-reactors')
  const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
  const currentAnimal = animals[index]
  const currentTest = req.session.data['tl_reportCurrentReactionTest']
  const isSicct = currentTest === 'sicct'

  const bovineDay1 = (req.body['tl_bovineDay1'] || '').trim()
  const bovineDay2 = (req.body['tl_bovineDay2'] || '').trim()
  const avianDay1 = isSicct ? (req.body['tl_avianDay1'] || '').trim() : null
  const avianDay2 = isSicct ? (req.body['tl_avianDay2'] || '').trim() : null

  const errors = {}
  const errorList = []
  if (!bovineDay1) {
    errors.tl_bovineDay1 = { text: 'Enter the bovine tuberculin Day 1 measurement' }
    errorList.push({ text: 'Enter the bovine tuberculin Day 1 measurement', href: '#tl_bovineDay1' })
  }
  if (!bovineDay2) {
    errors.tl_bovineDay2 = { text: 'Enter the bovine tuberculin Day 2 measurement' }
    errorList.push({ text: 'Enter the bovine tuberculin Day 2 measurement', href: '#tl_bovineDay2' })
  }
  if (isSicct && !avianDay1) {
    errors.tl_avianDay1 = { text: 'Enter the avian tuberculin Day 1 measurement' }
    errorList.push({ text: 'Enter the avian tuberculin Day 1 measurement', href: '#tl_avianDay1' })
  }
  if (isSicct && !avianDay2) {
    errors.tl_avianDay2 = { text: 'Enter the avian tuberculin Day 2 measurement' }
    errorList.push({ text: 'Enter the avian tuberculin Day 2 measurement', href: '#tl_avianDay2' })
  }

  if (errorList.length) {
    return reportRenderMeasurements(req, res, index, {
      errors,
      errorSummary: { titleText: 'There is a problem', errorList },
      formValues: req.body
    })
  }

  const measurementsKey = isSicct ? 'tl_reportSicctMeasurements' : 'tl_reportDivaMeasurements'
  const allMeasurements = Object.assign({}, req.session.data[measurementsKey] || {})
  const measurements = { bovineDay1, bovineDay2 }
  if (isSicct) {
    measurements.avianDay1 = avianDay1
    measurements.avianDay2 = avianDay2
  }
  allMeasurements[currentAnimal.officialId] = measurements
  req.session.data[measurementsKey] = allMeasurements

  if (index < animals.length - 1) {
    const nextIndex = index + 1
    req.session.data['tl_reportCurrentMeasurementIndex'] = nextIndex
    return res.redirect('/test-list/report-measurements/' + nextIndex)
  }
  req.session.data['tl_reportCurrentMeasurementIndex'] = animals.length - 1

  const testTypes = toArray(req.session.data['tl_reportTestTypes'])
  const completed = toArray(req.session.data['tl_reportCompletedReactionTests'])
  const remaining = testTypes.filter(function (t) { return !completed.includes(t) })

  if (remaining.length > 0) {
    req.session.data['tl_reportCurrentReactionTest'] = remaining[0]
    return res.redirect('/test-list/report-reactions')
  }
  return res.redirect('/test-list/report-all-tested')
})

router.get('/test-list/report-check-answers', function (req, res) {
  const untestedIds = toArray(req.session.data['tl_reportUntestedCattle'])
  const reasons = req.session.data['tl_reportUntestedReasons'] || {}
  const others = req.session.data['tl_reportUntestedReasonOthers'] || {}

  const untestedAnimals = untestedIds.length
    ? getReportUntestedAnimals(req).map(function (a) {
        const reasonCode = reasons[a.officialId] || ''
        return Object.assign({}, a, {
          reasonLabel: UNTESTED_REASON_LABELS[reasonCode] || reasonCode,
          reasonOther: others[a.officialId] || ''
        })
      })
    : []

  const cph = req.session.data['tl_selectedCattle']
  const allAnimals = enrichWithFlags(ANIMALS_BY_CPH[cph] || [])
  const animalById = {}
  allAnimals.forEach(function (a) { animalById[a.officialId] = a })

  function buildReactorList(reactorKey, measurementsKey) {
    const ids = toArray(req.session.data[reactorKey])
    const measurements = req.session.data[measurementsKey] || {}
    return ids.map(function (id) {
      return Object.assign({}, animalById[id] || { officialId: id }, { measurements: measurements[id] || {} })
    })
  }

  const sicctReactors = buildReactorList('tl_reportSicctReactors', 'tl_reportSicctMeasurements')
  const divaReactors = buildReactorList('tl_reportDivaReactors', 'tl_reportDivaMeasurements')

  const submitError = req.session.data['tl_submitError'] || null
  delete req.session.data['tl_submitError']

  res.render('test-list/report-check-answers', { untestedAnimals, sicctReactors, divaReactors, submitError })
})

router.get('/test-list/report-submitted', function (req, res) {
  res.locals.caseNumber = req.session.data['tl_submittedCaseNumber'] || null
  res.render('test-list/report-submitted')
})

router.post('/test-list/report-check-answers', async function (req, res) {
  const d = req.session.data

  const day1ISO = `${d['tl_reportDay1Date-year']}-${String(d['tl_reportDay1Date-month']).padStart(2, '0')}-${String(d['tl_reportDay1Date-day']).padStart(2, '0')}`
  const day1DateObj = new Date(Date.UTC(parseInt(d['tl_reportDay1Date-year']), parseInt(d['tl_reportDay1Date-month']) - 1, parseInt(d['tl_reportDay1Date-day'])))
  const day2DateObj = new Date(day1DateObj.getTime() + 72 * 60 * 60 * 1000)
  const day2ISO = `${day2DateObj.getUTCFullYear()}-${String(day2DateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(day2DateObj.getUTCDate()).padStart(2, '0')}`
  const day1TimeMatch = (d['tl_reportDay1Time'] || '').match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/)
  let day1Hour24 = day1TimeMatch ? parseInt(day1TimeMatch[1], 10) : 0
  if (day1TimeMatch && day1TimeMatch[3] === 'PM' && day1Hour24 !== 12) day1Hour24 += 12
  if (day1TimeMatch && day1TimeMatch[3] === 'AM' && day1Hour24 === 12) day1Hour24 = 0
  const day1StartTime = day1TimeMatch ? `${String(day1Hour24).padStart(2, '0')}:${day1TimeMatch[2]}` : null

  const tester = d['tl_reportTester'] === 'me' ? 'Farmer John' : (d['tl_reportTesterName'] || 'Farmer John')
  const sicctBatch = toArray(d['tl_reportSicctBatchNumbers'])[0] || null
  const divaBatch = toArray(d['tl_reportDivaBatchNumbers'])[0] || null

  const cph = d['tl_selectedCattle']
  const untestedSet = new Set(toArray(d['tl_reportUntestedCattle']))
  const testedAnimals = (ANIMALS_BY_CPH[cph] || []).filter(function (a) { return !untestedSet.has(a.officialId) })
  const testTypes = toArray(d['tl_reportTestTypes'])

  function buildAllTestedResults(testType, reactorKey, measurementsKey, batch) {
    const reactorIds = new Set(toArray(d[reactorKey]))
    const measurements = d[measurementsKey] || {}
    const parseNum = function (v) { return (v !== '' && v !== undefined && v !== null) ? Number(v) : null }
    return testedAnimals.map(function (animal) {
      const id = animal.officialId
      const isReactor = reactorIds.has(id)
      const m = isReactor ? (measurements[id] || {}) : {}
      if (testType === 'SICCT') {
        return {
          testType: 'SICCT',
          earTagNo: id,
          batchAvian: batch,
          batchBovine: batch,
          batchDiva: null,
          day1Avian: isReactor ? parseNum(m.avianDay1) : 0,
          day1Bovine: isReactor ? parseNum(m.bovineDay1) : 0,
          day1Diva: null,
          day2Avian: isReactor ? parseNum(m.avianDay2) : 0,
          day2Bovine: isReactor ? parseNum(m.bovineDay2) : 0,
          day2Diva: null
        }
      }
      return {
        testType: 'DIVA',
        earTagNo: id,
        batchAvian: null,
        batchBovine: null,
        batchDiva: batch,
        day1Avian: null,
        day1Bovine: null,
        day1Diva: isReactor ? parseNum(m.bovineDay1) : 0,
        day2Avian: null,
        day2Bovine: null,
        day2Diva: isReactor ? parseNum(m.bovineDay2) : 0
      }
    })
  }

  const results = []
  if (testTypes.includes('sicct')) {
    results.push(...buildAllTestedResults('SICCT', 'tl_reportSicctReactors', 'tl_reportSicctMeasurements', sicctBatch))
  }
  if (testTypes.includes('diva')) {
    results.push(...buildAllTestedResults('DIVA', 'tl_reportDivaReactors', 'tl_reportDivaMeasurements', divaBatch))
  }

  const untestedReasons = d['tl_reportUntestedReasons'] || {}
  for (const id of untestedSet) {
    const reasonCode = untestedReasons[id] || ''
    results.push({
      testType: 'Not Tested',
      earTagNo: id,
      notTestedReason: UNTESTED_REASON_LABELS[reasonCode] || 'Other reason'
    })
  }

  try {
    const caseResult = await cattleVaxApiRequest('/cases', 'POST', {
      cphNumber: '01/001/0006',
      reasonForTest: 'Pre-Movement',
      testWindowStart: day1ISO < day2ISO ? day1ISO : day2ISO,
      testWindowEnd: day1ISO > day2ISO ? day1ISO : day2ISO
    })
    const caseId = caseResult.caseId

    await cattleVaxApiRequest(`/cases/${encodeURIComponent(caseId)}/test-parts`, 'POST', {
      testParts: [{
        day1: day1ISO,
        day1StartTime,
        day2: day2ISO,
        certifyingVet: 'Dr Bob',
        tester,
        results
      }]
    })

    const caseData = await cattleVaxApiRequest(`/cases/${encodeURIComponent(caseId)}`)
    const caseNumber = caseData.caseNumber
    for (const key of Object.keys(req.session.data)) {
      if (key.startsWith('tl_')) delete req.session.data[key]
    }
    req.session.data['tl_submittedCaseNumber'] = caseNumber
    return res.redirect('/test-list/report-submitted')
  } catch (err) {
    const plainError = errorToPlainObject(err)
    console.log(JSON.stringify(plainError, null, 2))
    req.session.data['tl_submitError'] = err.message
    return res.redirect('/test-list/report-check-answers')
  }
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
    console.log(JSON.stringify(plainError, null, 2))
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
    .filter((r) => r.earTagNo !== '' && r.earTagNo !== undefined && r.earTagNo !== null)

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
    .filter((r) => r.earTagNo !== '' && r.earTagNo !== undefined && r.earTagNo !== null)

  try {
    await cattleVaxApiRequest(`/cases/${encodeURIComponent(caseId)}/test-parts/${encodeURIComponent(testPartId)}/results`, 'POST', { results })
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

module.exports = router
