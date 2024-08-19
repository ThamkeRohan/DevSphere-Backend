const express = require("express")
const router = express.Router()
const tryCatch = require("../utils/tryCatch")
const {
  subscribeToNotifications,
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notification");
const authentication = require("../middlewares/authentication")

router.use(authentication);

router.get("/subscribe", tryCatch(subscribeToNotifications))

router.patch("/:notificationId/markNotificationAsRead", tryCatch(markNotificationAsRead))

router.get("/", tryCatch(getNotifications))

module.exports = router