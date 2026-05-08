function formatDate(isoString, includeTime = false) {
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

module.exports = { formatDate }
