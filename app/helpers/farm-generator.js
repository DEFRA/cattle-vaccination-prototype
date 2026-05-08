const { TL_HERD_DATA, TL_FARM_TB_STATUS } = require('../data/test-list-farms')

const STATIC_ANIMALS = [
  { officialId: 'UK246810000156', breed: 'HF', dob: '14/04/2021', sex: 'F', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK246810000289', breed: 'AAX', dob: '14/04/2023', sex: 'F', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK246810000412', breed: 'LIM', dob: '14/04/2024', sex: 'M', vaccinationStatus: 'Vaccinated' },
  { officialId: 'UK246810000534', breed: 'HF', dob: '14/04/2020', sex: 'F', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK246810000678', breed: 'SIM', dob: '14/04/2022', sex: 'F', vaccinationStatus: 'Vaccinated' },
  { officialId: 'UK246810000791', breed: 'HF', dob: '14/09/2025', sex: 'F', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK246810000823', breed: 'BB', dob: '14/02/2026', sex: 'F', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK246810000945', breed: 'HF', dob: '14/04/2018', sex: 'F', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK246810001067', breed: 'AAX', dob: '14/04/2024', sex: 'F', vaccinationStatus: 'Vaccinated' },
  { officialId: 'UK246810001234', breed: 'CH', dob: '14/04/2023', sex: 'M', vaccinationStatus: 'Not vaccinated' },
  { officialId: 'UK120900101234', breed: 'HF', dob: '14/04/2022', sex: 'F', vaccinationStatus: 'Vaccinated' },
  { officialId: 'UK246810001356', breed: 'DS', dob: '14/04/2021', sex: 'F', vaccinationStatus: 'Vaccinated' }
]

const ANIMALS_BY_CPH = (() => {
  const result = {}
  Object.keys(TL_HERD_DATA).forEach((cph) => {
    result[cph] = STATIC_ANIMALS
  })
  return result
})()

function getTbStatus(cph) {
  const baseCph = String(cph || '').split('-')[0]
  const entry = TL_FARM_TB_STATUS[cph] || TL_FARM_TB_STATUS[baseCph]
  if (!entry) return null

  return {
    status: entry.status,
    statusFullName: entry.status === 'OTF' ? 'Officially TB Free' : 'Officially TB Free Withdrawn',
    lastTestDate: entry.lastTestDate,
    lastBreakdown: entry.lastBreakdown
  }
}

function searchFarms() {
  const groupsByFarm = {}
  Object.keys(TL_HERD_DATA).forEach((cph) => {
    const herd = TL_HERD_DATA[cph]

    if (!groupsByFarm[herd.farm]) {
      const addrParts = String(herd.address || '')
        .split(',')
        .map((s) => s.trim())

      groupsByFarm[herd.farm] = {
        farm: herd.farm,
        location: addrParts[addrParts.length - 2] || addrParts[0] || '',
        postcode: addrParts[addrParts.length - 1] || '',
        totalCattle: 0,
        cphs: []
      }
    }
    groupsByFarm[herd.farm].cphs.push({ cph, holdingLabel: herd.holdingLabel || 'Main holding', cattle: herd.cattle })
    groupsByFarm[herd.farm].totalCattle += Number(herd.cattle) || 0
  })

  return Object.values(groupsByFarm).sort((a, b) => a.farm.localeCompare(b.farm))
}

module.exports = { ANIMALS_BY_CPH, getTbStatus, searchFarms }
