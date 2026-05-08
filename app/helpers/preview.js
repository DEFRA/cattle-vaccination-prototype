const { toArray } = require('./utils')
const { getFieldValue } = require('./cattle')

const TL_SKIN_TEST_COLUMNS = ['Age', 'DOB', 'Sex', 'Breed']

function tlBuildPreviewSettings(data) {
  let previewOptions = toArray(data['tl_skinTestPreviewOptions'])
  if (!previewOptions.length) previewOptions = ['show-last-five', ...TL_SKIN_TEST_COLUMNS, 'Overall result', 'Remarks']

  return {
    previewOptions,
    emphasiseLastFive: previewOptions.includes('show-last-five'),
    visibleColumns: TL_SKIN_TEST_COLUMNS.filter(function (c) {
      return previewOptions.includes(c)
    }),
    previewTextSize: data['tl_skinTestPreviewTextSize'] || 'standard',
    previewOrientation: data['tl_skinTestPreviewOrientation'] || 'portrait',
    previewSpacing: data['tl_skinTestPreviewSpacing'] || 'standard'
  }
}

function tlBuildPreviewRows(animals, visibleColumns) {
  return animals.map(function (a) {
    return {
      officialId: a.officialId,
      earTagParts: a.earTagParts,
      isDuplicate: a.isDuplicate,
      isVaccinated: a.isVaccinated,
      cells: visibleColumns.map(function (col) {
        return { key: col, value: getFieldValue(a, col) }
      })
    }
  })
}

module.exports = { TL_SKIN_TEST_COLUMNS, tlBuildPreviewSettings, tlBuildPreviewRows }
