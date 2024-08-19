const Notification = require("../models/notification");
const Post = require("../models/post");
const Comment = require("../models/comment")
const User = require("../models/user");
const createAndPassError = require("../utils/createAndPassError");

const notificationStream = Notification.watch()

async function getNotifications(req, res, next) {
    const notifications = await Notification.getNotifications(req.user._id)
    const result = []
    for(const notification of notifications) {
        const notificationBody = await getNotificationBody(notification, req.user._id)
        result.push({
          notificationId: notification._id,
          notificationType: notification.entityType,
          body: notificationBody,
          isRead: notification.isRead
        })
    }
    res.status(200).json(result)
}

async function subscribeToNotifications(req, res) {
    console.log("Step 1: Write response head and keep the connection open");
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    console.log("Step 2: Write the opening event message");
    res.write("event: open\n")
    res.write("data: Connection opened!\n\n")

    console.log("Step 3: Subscribe to change stream of MongoDB");
    notificationStream.on("change", async (next) => {
        console.log("Step 3.1: Change in Database detected!");
        console.log("Step 3.2: Writing out response to connected clients");
        
        const {operationType, fullDocument: notification, documentKey, updateDescription} = next
        let receiver
        if(operationType === "insert") {
          receiver = notification.receiver
        }
        else if(operationType === "update") {
          const notify = await Notification.findById(documentKey._id)
          receiver = notify.receiver
        }

        if(!receiver.equals(req.user._id)) return 

        if (operationType === "insert") {
          sendInsertEvent(res, notification, req.user._id);
        }  
        else if(operationType === "update" && updateDescription.updatedFields.isValid === false) {
            sendDeleteEvent(res, documentKey._id)
        }   
        else{
          console.log("something else event is triggered in change stream");
        }    
    })

    console.log("Step 4: Handle request events such as client disconnect");
    req.on("close", () => {
        console.log("Disconnecting");
        res.end()
    })
}

async function markNotificationAsRead(req, res, next) {
  const notification = await Notification.findById(req.params.notificationId)
  if(notification == null) {
    return createAndPassError("Notification not found", 404, next)
  }
  if(notification.isRead) {
    return createAndPassError("Notification is already read", 400, next)
  }
  notification.isRead = true
  await notification.save()
  res.status(200).json({_id: notification._id})
}

async function sendDeleteEvent(res, notificationId) {
    res.write(`event: delete\n`)
    res.write(`data: ${JSON.stringify({notificationId})}\n\n`)
}

async function sendInsertEvent(res, notification, loggedInUserId) {
    const notificationBody = await getNotificationBody(notification, loggedInUserId);
    res.write(`event: insert\n`);
    res.write(
      `data: ${JSON.stringify({
        notificationId: notification._id,
        notificationType: notification.entityType,
        body: notificationBody,
        isRead: notification.isRead
      })}\n\n`
    );
}

async function getNotificationBody(notification, loggedInUserId) {
  if (notification.entityType === "NEW_POST") {
    const post = await Post.findById(notification.entity)
      .select("title author tags createdAt likes bookmarkedByUsers")
      .lean(); 
    post.likedByMe = post.likes.some(user => user.equals(loggedInUserId))
    post.likes = null
    post.bookmarkedByMe = post.bookmarkedByUsers.some(userId => userId.equals(loggedInUserId))
    post.bookmarkedByUsers = null
    return post
  } 
  else if (notification.entityType === "COMMENT") {
    return await getComment(notification.entity, loggedInUserId)
  } 
  else if (notification.entityType === "REPLY") {
    const comment = await getComment(notification.entity, loggedInUserId)
    const parent = await Comment.findById(comment.parent).select("content").lean();
    return { ...comment, parent };
  } 
  else if (notification.entityType === "POST_LIKE") {
    const post = await Post.findById(notification.entity)
      .select("_id title")
      .lean();
    const likedBy = await User.findById(notification.sender)
      .select("name profileImageUrl")
      .lean();
    return { post, likedBy };
  } 
  else if (notification.entityType === "COMMENT_LIKE") {
    const comment = await Comment.findById(notification.entity)
      .select("content post")
      .lean();
    const likedBy = await User.findById(notification.sender)
      .select("name profileImageUrl")
      .lean();
    return { comment, likedBy };
  } 
  else if (notification.entityType === "FOLLOW") {
    const follower = await User.findById(notification.sender)
      .select("name profileImageUrl")
      .lean();
    const loggedInUser = await User.findById(loggedInUserId).select("following")
    const followedByMe = loggedInUser.following.some(user => user.equals(follower._id))
    return {follower, followedByMe};
  }
}
async function getComment(entity, loggedInUserId) {
    const comment = await Comment.findById(entity).populate({path: "post", select: "title"})
      .lean();
    const likedByMe = comment.likes.some(user => user.equals(loggedInUserId))
    comment.likes = null
    const [reply] = await Comment.find({parent: comment._id, "madeBy._id": loggedInUserId}).sort({createdAt: -1}).limit(1).select("_id")
    const repliedByMe = reply != null
    return {...comment, likedByMe, repliedByMe, reply: reply?._id}
}
module.exports = {
    getNotifications,
    markNotificationAsRead,
    subscribeToNotifications
}