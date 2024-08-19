const express = require("express")
const passport = require("passport")
const router= express.Router()
const {passwordBasedSignup, logout, passwordBasedLogin, googleAuthFailed} = require("../controllers/auth")
const tryCatch = require("../utils/tryCatch")

router.post("/password-based/signup", tryCatch(passwordBasedSignup))

router.post("/password-based/login", passwordBasedLogin)

router.get("/oauth/google", passport.authenticate("google"))

router.get(
  "/oauth/google/callback",
  passport.authenticate("google", {
    successRedirect: process.env.CLIENT_URL,
    failureRedirect: "/api/auth/oauth/google/failed",
  })
);

router.get("/oauth/google/failed", googleAuthFailed)

router.get("/logout", logout)

module.exports = router