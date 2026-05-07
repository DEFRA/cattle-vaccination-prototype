const { toArray } = require('./utils')
const { enrichWithFlags, sortCows } = require('./cattle')
const { ANIMALS_BY_CPH } = require('./farm-generator')

function getBaseAnimals(req) {
  const cph = req.session.data['tl_selectedCattle']
  const sortBy = req.session.data['tl_skinTestSortBy'] || 'Ear-tag number (last 5 digits)'
  const sortDir = req.session.data['tl_skinTestSortDirection'] || 'asc'

  return sortCows(ANIMALS_BY_CPH[cph] || [], sortBy, sortDir)
}

function getPrepareCandidateAnimals(req) {
  const cph = req.session.data['tl_selectedCattle']
  const sortBy = req.session.data['tl_prepareSkinTestUntestedSortBy'] || 'Ear-tag number (last 5 digits)'
  const sortDir = req.session.data['tl_prepareSkinTestUntestedSortDirection'] || 'asc'

  return enrichWithFlags(sortCows(ANIMALS_BY_CPH[cph] || [], sortBy, sortDir))
}

function getUntestedAnimals(req) {
  const ids = toArray(req.session.data['tl_prepareSkinTestUntested'])

  if (!ids.length) return []

  const idSet = new Set(ids)

  return getPrepareCandidateAnimals(req).filter((a) => idSet.has(a.officialId))
}

module.exports = { getBaseAnimals, getPrepareCandidateAnimals, getUntestedAnimals }
