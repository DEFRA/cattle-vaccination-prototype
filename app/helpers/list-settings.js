const { toArray } = require('./utils')

const ALL_COLUMNS = ['Age', 'DOB', 'Sex', 'Breed', 'Vaccination status']

function getDownloadListSettings(data) {
  let previewOptions = toArray(data['previewOptions'])
  if (previewOptions.length === 0) {
    previewOptions = ['show-last-five', ...ALL_COLUMNS]
  }
  return {
    downloadFormat: data['downloadFormat'] || 'pdf',
    showLastFive: previewOptions.includes('show-last-five'),
    previewOptions,
    sortBy: data['sortBy'] || 'Ear-tag number',
    sortDirection: data['sortDirection'] || 'asc',
    previewTextSize: data['previewTextSize'] || 'standard',
    previewOrientation: data['previewOrientation'] || 'portrait',
    previewSpacing: data['previewSpacing'] || 'standard'
  }
}

function sortCattle(cattle, sortBy, sortDirection) {
  const direction = sortDirection === 'desc' ? -1 : 1
  return [...cattle].sort((a, b) => {
    let av, bv
    switch (sortBy) {
      case 'Age':
        av = a.ageMonths
        bv = b.ageMonths
        break
      case 'DOB':
        av = a.dobIso
        bv = b.dobIso
        break
      case 'Sex':
        av = a.sex
        bv = b.sex
        break
      case 'Breed':
        av = a.breed
        bv = b.breed
        break
      case 'Vaccination status':
        av = ''
        bv = ''
        break
      default:
        av = a.herd + a.check + a.indStart + a.last4
        bv = b.herd + b.check + b.indStart + b.last4
    }
    if (av < bv) return -1 * direction
    if (av > bv) return 1 * direction
    return 0
  })
}

function getTestListSettings(data) {
  const testType = data['testList_testType'] || 'SICCT'
  let previewOptions = toArray(data['testList_previewOptions'])

  if (previewOptions.length === 0) {
    previewOptions = ['show-last-five', 'Age', 'DOB', 'Sex', 'Breed']

    if (testType === 'Both') previewOptions.push('Test type')
  }

  return {
    testType,
    downloadFormat: data['testList_downloadFormat'] || 'pdf',
    showLastFive: previewOptions.includes('show-last-five'),
    previewOptions,
    sortBy: data['testList_sortBy'] || 'Ear-tag number',
    sortDirection: data['testList_sortDirection'] || 'asc',
    previewTextSize: data['testList_previewTextSize'] || 'standard',
    previewOrientation: data['testList_previewOrientation'] || 'portrait',
    previewSpacing: data['testList_previewSpacing'] || 'standard'
  }
}

function sortTestCattle(cattle, sortBy, sortDirection) {
  const dir = sortDirection === 'desc' ? -1 : 1

  return [...cattle].sort((a, b) => {
    let av, bv
    switch (sortBy) {
      case 'Age':
        av = a.ageMonths
        bv = b.ageMonths
        break
      case 'DOB':
        av = a.dobIso
        bv = b.dobIso
        break
      case 'Sex':
        av = a.sex
        bv = b.sex
        break
      case 'Breed':
        av = a.breed
        bv = b.breed
        break
      case 'Test type':
        av = a.vaccinationStatus === 'Vaccinated' ? 'DIVA' : 'SICCT'
        bv = b.vaccinationStatus === 'Vaccinated' ? 'DIVA' : 'SICCT'
        break
      default:
        av = a.herd + a.check + a.indStart + a.last4
        bv = b.herd + b.check + b.indStart + b.last4
    }

    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir

    return 0
  })
}

module.exports = { ALL_COLUMNS, getDownloadListSettings, sortCattle, getTestListSettings, sortTestCattle }
