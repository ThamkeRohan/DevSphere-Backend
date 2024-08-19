const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("../models/user");
const createAndPassError = require("../utils/createAndPassError");

async function passwordBasedSignup(req, res, next) {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser != null) {
    return createAndPassError("Email already exists", 400, next);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);

  const newUser = new User({
    name,
    email,
    password: hashedPass,
    authType: "password-based",
  });
  await newUser.save();

  req.logIn(newUser, (err) => {
    if (err) {
      return next(err);
    }
    return res.status(200).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      profileImageUrl: newUser.profileImageUrl,
      areTagsFollowed: false
    });
  });
}

async function passwordBasedLogin(req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return createAndPassError(info.message, 401, next);
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        areTagsFollowed: user.followedTags.length > 0,
      });
    });
  })(req, res, next);
}

async function googleAuthFailed(req, res, next) {
  res
    .status(400)
    .json({
      message:
        "Google authentication failed: Error occured because the same email could have been used in password based authentication. Try with some other email.",
    });
}

async function logout(req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
}

module.exports = {
  passwordBasedSignup,
  passwordBasedLogin,
  googleAuthFailed,
  logout,
};
