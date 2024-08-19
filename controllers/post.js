const mongoose = require("mongoose")
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const Tag = require("../models/tag")
const User = require("../models/user")
const createAndPassError = require("../utils/createAndPassError")
const extractDbField = require("../utils/extractDbFields")


async function createPost(req, res, next){
    if (!req.user._id.equals(new mongoose.Types.ObjectId(req.body.author._id))) {
      return createAndPassError("You do not have permission to create this post", 403, next);
    }
    await Tag.incTagsPostCount(req.body.tags)
    const post = await Post.create(req.body)

    const {followers} = await User.findById(req.user._id).select("followers")
    const notifications = followers.map(follower => Notification.generateNotification(
      req.user._id,
      follower,
      "NEW_POST",
      post._id
    ))
    await Promise.all(notifications)

    res.status(201).json({_id: post._id})
}

async function editPost(req, res, next) {
    const post = await Post.findById(req.params.postId)
    if(post == null) {
        return createAndPassError("Post does not exists", 404, next)
    }
    if (!req.user._id.equals(new mongoose.Types.ObjectId(req.body.author._id))) {
      return createAndPassError("You do not have permission to edit this post", 403, next);
    }
    const prevTags = post.tags
    const currentTags = req.body.tags
    await Tag.updateTagsPostCount(prevTags, currentTags)
    post.title = req.body.title
    post.coverImageUrl = req.body.coverImageUrl
    post.tags = req.body.tags
    post.content = req.body.content
    post.description = req.body.description
    await post.save()
    res.status(200).json({_id: post._id})
}

async function deletePost(req, res, next) {
    const post = await Post.findById(req.params.postId).select("_id author tags")
    if(post == null) {
        return createAndPassError("Post does not exists", 404, next)
    }
    if(!req.user._id.equals(post.author._id)) {
        return createAndPassError("You do not have permission to delete this post", 403, next)
    }
    await Tag.decTagsPostCount(post.tags)
    await deletePostAndAssociatedEntities(post)
    res.status(200).json({_id: post._id})
}

async function getPost(req, res, next) {
  const post = await Post.getPostById(req.params.postId, req.user._id)
  res.status(200).json(post)
}

async function togglePostLike(req, res, next) {
    const post = await Post.findById(req.params.postId)
    if(post == null){
        return createAndPassError("Cannot like or dislike as post does not exists", 404, next)
    }
    if(post.author._id.equals(req.user._id)) {
      return createAndPassError("Cannot like your own post", 403, next)
    }
    const isLikedByMe = post.likes.some(userId => userId.equals(req.user._id))
    if(isLikedByMe){
        post.likes = post.likes.filter(userId => !userId.equals(req.user._id))
        await post.save()

        await Notification.markNotificationAsInvalid({
          entityType: "POST_LIKE",
          entity: post._id,
          sender: req.user._id
        })

        return res.status(200).json({likedByMe: false})
    }
    else{
        post.likes.push(req.user._id)
        await post.save()

        await Notification.generateNotification(
          req.user._id,
          post.author._id,
          "POST_LIKE",
          post._id
        )

        return res.status(200).json({likedByMe: true})
    }
}

async function getPosts(req, res, next){
    let selectedTags
    if(req.query.selectedTags != null && req.query.selectedTags !== "") {
      selectedTags = req.query.selectedTags.split(",")
    }
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const filter = selectedTags != null ? {"tags.name": { $in: selectedTags }} : {}
    const posts = await Post.getPosts(filter, page, limit, req.user._id)
    res.status(200).json(posts)
}



async function createComment(req, res, next){
    if(!new mongoose.Types.ObjectId(req.body.madeBy._id).equals(req.user._id)) {
      return createAndPassError("You do not have permission to create comment for this user", 403, next)
    }

    const comment = await Comment.create(req.body)
    await Post.findByIdAndUpdate(req.body.post, {$push: {comments: comment._id}})

    const entityType = req.body.parent == null ? "COMMENT" : "REPLY"
    let receiver
    if(entityType === "COMMENT") {
      const {author} = await Post.findById(comment.post).select("author").lean()
      receiver = author._id
    }
    else {
      const {madeBy} = await Comment.findById(comment.parent).select("madeBy").lean()
      receiver = madeBy._id
    }
    await Notification.generateNotification(
      comment.madeBy._id,
      receiver,
      entityType,
      comment._id
    )

    res.status(201).json({...extractDbField(comment), likes: null, likedByMe: false, likeCount: 0})
}

async function getComment(req, res, next) {
    const comment = await Comment.findById(req.params.commentId).lean()
    res.status(200).json({...comment, likes: null})
}

async function getComments(req, res, next) {
    let comments = await Comment.find({post: new mongoose.Types.ObjectId(req.params.postId)}).lean()
    comments = comments.map(comment => {
      comment.likeCount = comment.likes.length
      comment.likedByMe = comment.likes.some(userId => userId.equals(req.user._id))
      comment.likes = null
      return comment
    })
    res.status(200).json(comments)
}

async function editComment(req, res, next){
    const comment = await Comment.findById(req.params.commentId)
    if(!comment.madeBy._id.equals(new mongoose.Types.ObjectId(req.user._id))) {
        return createAndPassError("You do not permission to edit this comment", 403, next)
    }
    comment.content = req.body.content
    await comment.save()
    res.status(200).json({...extractDbField(comment), likes: null})
}

async function deleteComment(req, res, next){
    const comment = await Comment.findById(req.params.commentId).select("_id post madeBy")
    if(comment == null){
        return createAndPassError("Comment does not exists", 404, next)
    }
    if(!comment.madeBy._id.equals(req.user._id)) {
        return createAndPassError("You do not permission to delete this comment", 403, next)
    }
    await deleteCommentAndAssociatedEntities(comment)
    res.status(200).json({_id: comment._id})
}

async function toggleCommentLike(req, res, next){
    const comment = await Comment.findById(req.params.commentId)
    if (comment == null) {
      return createAndPassError("Cannot like or dislike as post does not exists", 404, next);
    }
    if(comment.madeBy._id.equals(req.user._id)) {
      return createAndPassError("Cannot like your own comment", 403, next)
    }
  
    const isLikedByMe = comment.likes.some(userId => userId.equals(req.user._id))
    if(isLikedByMe){
        comment.likes = comment.likes.filter(userId => !userId.equals(req.user._id))
        await comment.save()

        await Notification.markNotificationAsInvalid({
          entityType: "COMMENT_LIKE",
          entity: comment._id,
          sender: req.user._id
        })

        return res.status(200).json({likedByMe: false})
    }
    else{
        comment.likes.push(req.user._id)
        await comment.save()

        await Notification.generateNotification(
          req.user._id,
          comment.madeBy._id,
          "COMMENT_LIKE",
          comment._id
        )

        return res.status(200).json({likedByMe: true})
    }
}

async function deleteCommentAndAssociatedEntities(comment) {
  await Notification.markNotificationAsInvalid({ entity: comment._id });
  await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } });
  const children = await Comment.find({ parent: comment._id }).lean();
  for (const child of children) {
    await deleteCommentAndAssociatedEntities(child);
  }
  await Comment.deleteOne({_id: comment._id})
}

async function deletePostAndAssociatedEntities(post) {
  const comments = await Comment.find({ post: post._id }).select("_id").lean();
  await Notification.markNotificationAsInvalid({
    entity: { $in: [post._id, ...comments.map((comment) => comment._id)] },
  });
  await Comment.deleteMany({ post: post._id });
  await Post.deleteOne({_id: post._id})
}


module.exports = {
    getPosts,
    getPost,
    editPost,
    deletePost,
    createPost,
    getComment,
    getComments,
    togglePostLike,
    createComment,
    editComment,
    deleteComment,
    toggleCommentLike
}