function formatEarTagParts(officialId) {
  const s = String(officialId || '')
    .replace(/\s+/g, '')
    .replace(/^UK/i, '')
  return { prefix: 'UK', herd: s.slice(0, 6), check: s.slice(6, 7), individual: s.slice(7, 12), individualStart: s.slice(7, 8), last4: s.slice(-4) }
}

function calculateAge(dob) {
  if (!dob) return ''
  const parts = dob.split('/')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts.map(Number)
  const birthDate = new Date(year, month - 1, day)
  if (Number.isNaN(birthDate.getTime())) return ''
  const today = new Date()
  if (birthDate > today) return ''
  const daysOld = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24))
  let monthsOld = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
  if (today.getDate() < birthDate.getDate()) monthsOld--
  let yearsOld = today.getFullYear() - birthDate.getFullYear()
  if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) yearsOld--
  if (daysOld < 30) return `${daysOld}D`
  if (monthsOld < 12) return `${Math.max(monthsOld, 1)}M`
  return `${Math.max(yearsOld, 1)}Y`
}

function ageInDaysFromDob(dob) {
  if (!dob) return -1
  const parts = dob.split('/')
  if (parts.length !== 3) return -1
  const [day, month, year] = parts.map(Number)
  const birthDate = new Date(year, month - 1, day)
  if (Number.isNaN(birthDate.getTime())) return -1
  return Math.floor((new Date() - birthDate) / (1000 * 60 * 60 * 24))
}

function sortCowsByValue(animal, sortBy) {
  switch (sortBy) {
    case 'Age':
      return ageInDaysFromDob(animal.dob)
    case 'Ear-tag number (last 5 digits)':
      return String(animal.officialId || '').slice(-5)
    case 'Ear-tag number':
      return animal.officialId || ''
    case 'DOB':
      return animal.dob || ''
    case 'Sex':
      return animal.sex || ''
    case 'Breed':
      return animal.breed || ''
    case 'Vaccination status':
      return animal.vaccinationStatus || ''
    default:
      return String(animal.officialId || '').slice(-5)
  }
}

function sortCows(animals, sortBy, sortDir) {
  const dir = sortDir === 'desc' ? -1 : 1
  return [...animals].sort(function (a, b) {
    const av = sortCowsByValue(a, sortBy)
    const bv = sortCowsByValue(b, sortBy)
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
}

function getFieldValue(animal, field) {
  switch (field) {
    case 'Age':
      return calculateAge(animal.dob)
    case 'DOB':
      return animal.dob || ''
    case 'Sex':
      return animal.sex || ''
    case 'Breed':
      return animal.breed || ''
    default:
      return ''
  }
}

function enrichWithFlags(animals) {
  const counts = {}
  animals.forEach(function (a) {
    const last4 = String(a.officialId || '').slice(-4)
    counts[last4] = (counts[last4] || 0) + 1
  })

  return animals.map(function (a) {
    return Object.assign({}, a, {
      earTagParts: formatEarTagParts(a.officialId),
      age: calculateAge(a.dob),
      isDuplicate: counts[String(a.officialId || '').slice(-4)] > 1,
      isVaccinated: a.vaccinationStatus === 'Vaccinated'
    })
  })
}

module.exports = { formatEarTagParts, calculateAge, ageInDaysFromDob, sortCowsByValue, sortCows, getFieldValue, enrichWithFlags }
