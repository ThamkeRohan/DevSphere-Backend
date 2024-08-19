function extractDbField(doc) {
    return JSON.parse(JSON.stringify(doc))
}

module.exports = extractDbField