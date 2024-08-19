const express = require("express");
const router = express.Router();
const tryCatch = require("../utils/tryCatch");

const {
  setFollowedTags,
  getUserProfile,
  getAuthenticatedUserProfile,
  editUserProfile,
  getUserPosts,
  getRecommendedPosts,
  getUserComments,
  getUserFollowers,
  getUserFollowings,
  toggleUserFollow,
  toggleTagFollow,
  getFollowedTags,
  getBookmarkedPosts,
  togglePostBookmark,
  // getSuggestedFollows,
} = require("../controllers/user");
const authentication = require("../middlewares/authentication");

// router.get("/suggestedFollows", authentication, tryCatch(getSuggestedFollows));

router.patch("/:userId/setFollowedTags", authentication, tryCatch(setFollowedTags));

router.get("/authUserProfile", authentication, tryCatch(getAuthenticatedUserProfile));

router.get("/:userId", tryCatch(getUserProfile)); //

router.patch("/:userId", authentication, tryCatch(editUserProfile));

router.get("/:userId/posts", tryCatch(getUserPosts)); //

router.get(
  "/:userId/recommendedPosts",
  authentication,
  tryCatch(getRecommendedPosts)
);

router.get("/:userId/comments", tryCatch(getUserComments)); //

router.get("/:userId/followers", tryCatch(getUserFollowers)); //

router.get("/:userId/followings", tryCatch(getUserFollowings)); //

router.patch(
  "/:userId/toggleUserFollow",
  authentication,
  tryCatch(toggleUserFollow)
);

router.patch(
  "/:userId/toggleTagFollow",
  authentication,
  tryCatch(toggleTagFollow)
);

router.get("/:userId/followedTags", tryCatch(getFollowedTags)); //

router.patch(
  "/:userId/togglePostBookmark",
  authentication,
  tryCatch(togglePostBookmark)
);

router.get(
  "/:userId/bookmarkedPosts",
  authentication,
  tryCatch(getBookmarkedPosts)
);



module.exports = router;
