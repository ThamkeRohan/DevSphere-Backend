const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },

  entityType: {
    type: String,
    required: true,
    enum: ["NEW_POST", "COMMENT", "REPLY", "POST_LIKE", "COMMENT_LIKE", "FOLLOW"],
  },

  entity: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  isValid: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});


notificationSchema.statics.getNotifications = function(receiver) {
  return this.find({
    receiver,
    isRead: false,
    isValid: true
  })
  .sort({createdAt: -1}).lean()
}
notificationSchema.statics.generateNotification = function(sender, receiver, entityType, entity) {
  return this.create({
    sender,
    receiver,
    entityType,
    entity
  })
}
notificationSchema.statics.markNotificationAsInvalid = async function(filter) {
  return await this.updateMany(
    {
      ...filter,
      isValid: true,
    },
    {
      isValid: false,
    }
  );
}

module.exports = mongoose.model("Notification", notificationSchema)