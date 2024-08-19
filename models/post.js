const mongoose = require("mongoose")
const User = require("./user")

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    coverImageUrl: {
      type: String,
      required: true,
    },

    tags: {
      type: [
        {
          _id: {
            type: mongoose.Types.ObjectId,
            ref: "Tag",
            required: true,
          },
          name: { type: String, required: true },
        },
      ],
      validate: {
        validator: function (tags) {
          return tags.length >= 2;
        },
        message: "Number of tags should be atleast two",
      },
    },

    content: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    author: {
      required: true,
      type: {
        _id: {
          type: mongoose.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: { type: String, required: true },
        profileImageUrl: {
          type: String,
          required: true,
        },
      },
    },

    bookmarkedByUsers: [{type: mongoose.Types.ObjectId, ref: "User"}],

    likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],

    comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
  },
  { 
    timestamps: true,
    toJSON: {virtuals: true}
  }
);

postSchema.statics.getPostById = async function(postId, loggedInUserId) {
  const post = await this.findById(postId).populate("comments").lean()
  post.likedByMe = post.likes.some(user => user.equals(loggedInUserId))
  post.likeCount = post.likes.length
  post.likes = null
  post.comments = post.comments.map(comment => {
    comment.likedByMe = comment.likes.some(user => user.equals(loggedInUserId))
    comment.likeCount = comment.likes.length
    comment.likes = null
    return comment
  })
  post.bookmarkedByMe = post.bookmarkedByUsers.some(userId => userId.equals(loggedInUserId))
  post.bookmarkedByUsersCount = post.bookmarkedByUsers.length;
  post.bookmarkedByUsers = null;
  return post
}

postSchema.statics.getPosts = async function(filter, page, limit, loggedInUserId) {
  let posts = await this.find(filter).select("-content").skip((page - 1) * limit).limit(limit).lean()
  posts = posts.map(post => {
    post.likedByMe = post.likes.some(user => user.equals(loggedInUserId))
    post.likeCount = post.likes.length
    post.commentCount = post.comments.length
    post.likes = null
    post.comments = null
    return post
  })
  
  return posts
}


module.exports = mongoose.model("Post", postSchema)

