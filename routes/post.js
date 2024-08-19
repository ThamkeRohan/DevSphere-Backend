const express = require("express")
const router = express.Router()
const tryCatch = require("../utils/tryCatch")
const {
  getPosts,
  getPost,
  editPost,
  deletePost,
  createPost,
  togglePostLike,
  createComment,
  getComment,
  getComments,
  editComment,
  deleteComment,
  toggleCommentLike,
  getRecommendedPosts,
} = require("../controllers/post");
const authentication = require("../middlewares/authentication");

router.get("/", tryCatch(getPosts));
router.get("/:postId", tryCatch(getPost)); //need to handle

router.use(authentication)

router.post("/", tryCatch(createPost));
router.put("/:postId", tryCatch(editPost))
router.delete("/:postId", tryCatch(deletePost));
router.patch("/:postId/toggleLike", tryCatch(togglePostLike))
router.post("/:postId/comments", tryCatch(createComment))
router.patch("/:postId/comments/:commentId", tryCatch(editComment))
router.delete("/:postId/comments/:commentId", tryCatch(deleteComment))
router.patch("/:postId/comments/:commentId/toggleLike", tryCatch(toggleCommentLike))

// router.get("/:postId/comments/:commentId", tryCatch(getComment))

// router.get("/:postId/comments", tryCatch(getComments))






module.exports = router