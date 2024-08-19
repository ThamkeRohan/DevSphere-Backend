const express = require("express")
const router = express.Router()
const tryCatch = require("../utils/tryCatch")
const {getTags, getPopularTags, createTag} = require("../controllers/tag")
const authentication = require("../middlewares/authentication")

router.use(authentication)

router.get("/", tryCatch(getTags))

router.get("/popularTags", tryCatch(getPopularTags))

router.post("/", tryCatch(createTag))

module.exports = router