const express = require("express")
const session = require("express-session")
const passport = require("passport")
const MongoDbStore = require("connect-mongodb-session")(session)
const cors = require("cors")
const mongoose = require("mongoose")
require("dotenv").config()
const errorHandler = require("./middlewares/errorHandler")
const AuthRoute = require("./routes/auth")
const PostRoute = require("./routes/post")
const UserRoute = require("./routes/user")
const TagRoute = require("./routes/tag")
const NotificationRoute = require("./routes/notification")
const authentication = require("./middlewares/authentication")

require("./utils/createDefaultTags")
require("./utils/createDefaultPosts")

require("./config/passport-config");

const app = express()

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

app.use(express.json())
app.use(
  cors({
    origin: ["http://localhost:5173", "https://dev-sphere.netlify.app"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);


const store = new MongoDbStore({
    uri: MONGO_URL,
    collection: "session"
})

const ONE_DAY = 1000 * 60 * 60 * 24
app.use(
  session({
    secret: SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: ONE_DAY,
      secure: true, // Ensure the cookie is only sent over HTTPS
      sameSite: "None", // Allow the cookie to be sent with cross-origin requests
    },
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.send(req.user)
})

app.use("/api/auth", AuthRoute)
app.use("/api/notifications", NotificationRoute);
app.use("/api/posts", PostRoute)
app.use("/api/users", UserRoute)
app.use("/api/tags", TagRoute)

app.use(errorHandler)

mongoose.connect(MONGO_URL)
.then(() => {
    console.log("Connected to MongoDb...");
    app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
})
.catch(error => {
    console.log("Unable to connect to MongoDb...");
    console.log(error);
})


