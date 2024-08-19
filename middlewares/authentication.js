const createAndPassError = require("../utils/createAndPassError")

function authentication(req, res, next){
    console.log(req.headers);
    if(req.isAuthenticated()){
        return next()
    }
    createAndPassError("User is unauthorized to access the resource", 401, next)
}

module.exports = authentication