const mongoose = require("mongoose")


const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },

  madeBy: {
    required: true,
    type: {
      _id: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      profileImageUrl: { type: String, required: true }
    },
  },

  post: {
    type: mongoose.Types.ObjectId,
    ref: "Post",
    required: true
  },

  parent: {
    type: mongoose.Types.ObjectId,
    ref: "Comment"
  },

  likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],
},
{
  timestamps: true,
  toJSON: {virtuals: true}
})


module.exports = mongoose.model("Comment", commentSchema)