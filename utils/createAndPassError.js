function createAndPassError(message, status, next){
    const error = new Error(message)
    error.status = status
    next(error)
}

module.exports = createAndPassError