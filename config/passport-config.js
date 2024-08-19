const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

// Passport Local Strategy for Password-based login
passport.use(
  new LocalStrategy({
  usernameField: 'email',
}, async (email, password, done) => {
    try {
      const user = await User.findOne({ authType: "password-based", email });
      if (!user) {
        return done(null, false, {message: "Email does not exists"});
      }
      const isMatched = await bcrypt.compare(password, user.password);
      if (!isMatched) {
        return done(null, false, {message: "Incorrect password"});
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Configure the Google strategy for use by Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({
          email: profile.emails[0].value
        });

        //If user does not exists we can simply store the user document and create session
        if(user == null) {
            const newUser = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              profileImageUrl: profile.photos[0].value,
              authType: "oauth"
            });
            await newUser.save()
            return done(null, newUser)
        }
        else {
            //Check if email is already been used in password-based authentication
            if(user.authType === "password-based") {
                return done(null, false, {
                  message:
                    "Google oauth failed. Email has already been taken!!",
                });
            }
            else {
                return done(null, user)
            }
        }
      } catch (error) {
        done(error);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
