const crypto = require("crypto")
function generateToken() {
  return crypto.randomBytes(20).toString("hex")
}

function getTokenHash (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
    generateToken,
    getTokenHash
}