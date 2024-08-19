const mongoose = require("mongoose")
const Post = require("./post")
const Comment = require("./comment")

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
    },

    name: {
      type: String,
      required: true,
    },

    authType: {
      type: String,
      required: true,
      enum: ["password-based", "oauth"],
    },

    profileImageUrl: {
      type: String,
      default: "default-profile-image.jpg",
    },

    bio: String,

    socialMedia: {
      gitHub: String,
      stackOverflow: String,
      linkedIn: String,
      twitter: String,
    },

    website: String,

    location: String,

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],

    followedTags: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
  },
  { timestamps: true }
);

userSchema.post("save", async function (doc, next) {
  try {
    await Post.updateMany(
      {"author._id": doc._id}, 
      {$set: {"author.name": doc.name, "author.profileImageUrl": doc.profileImageUrl}}
    )
    await Comment.updateMany(
      {"madeBy._id": doc._id},
      {$set: {"madeBy.name": doc.name, "madeBy.profileImageUrl": doc.profileImageUrl}}
    )
    
    next()
  } catch (error) {
    next(error) 
  }
})



module.exports = mongoose.model("User", userSchema)