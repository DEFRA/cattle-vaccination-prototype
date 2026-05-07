function toArray(val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

module.exports = { toArray }
