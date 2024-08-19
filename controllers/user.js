const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/post")
const Comment = require("../models/comment")
const Notification = require("../models/notification")
const createAndPassError = require("../utils/createAndPassError");
const extractDbFields = require("../utils/extractDbFields")

async function setFollowedTags(req, res, next) {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return createAndPassError("User with the given id does not exists", 404, next);
  }
  if (!req.user._id.equals(new mongoose.Types.ObjectId(req.params.userId))) {
    return createAndPassError(
      "You do not have permission to follow tags for this user",
      403,
      next
    );
  }
  if (user.followedTags.length > 0) {
    return createAndPassError("User already follows tags", 400, next);
  }

  const { followedTags } = req.body;

  if (followedTags == null || followedTags.length === 0) {
    return createAndPassError("Followed Tags are required", 400, next);
  }

  user.followedTags = followedTags;
  await user.save();
  res.status(200).json({
    areTagsFollowed: true,
  });
}

async function getUserProfile(req, res, next) {
    const user = await User.findById(req.params.userId).select("name email profileImageUrl bio socialMedia website location followers following followedTags createdAt").lean()
    user.followedByMe = user.followers.some(follower => follower.equals(req.user._id))
    user.followerCount = user.followers.length
    user.followingCount = user.following.length
    user.followedTagCount = user.followedTags.length
    user.followers = null
    user.following = null
    user.contributions = {}
    user.contributions.postCount = await Post.countDocuments({"author._id": user._id})
    user.contributions.commentCount = await Comment.countDocuments({"madeBy._id": user._id})
    user.contributions.tagCount = user.followedTags.length
    res.status(200).json(user)
}

async function getAuthenticatedUserProfile(req, res, next) {
  res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    profileImageUrl: req.user.profileImageUrl,
    areTagsFollowed: req.user.followedTags.length > 0,
  });
}

async function editUserProfile(req, res, next) {
    if(!req.user._id.equals(new mongoose.Types.ObjectId(req.params.userId))) {
      return createAndPassError("You do not have permission to edit profile for this user", 403, next)
    }
    const user = await User.findById(req.user._id).select("-readingList -password")
    const { name, email, bio, socialMedia, website, location, profileImageUrl } = req.body

    if (name !== "" && name != null) {
      user.name = name
    }
    if (email !== "" && email != null) {
      user.email = email
    }
    if (bio !== "" && bio != null) {
      user.bio = bio
    }
    if (socialMedia != null) {
      user.socialMedia = socialMedia
    }
    if (website !== "" && website != null) {
      user.website = website
    }
    if (location !== "" && location != null) {
      user.location = location
    }
    if(profileImageUrl !== "" && profileImageUrl != null) {
      user.profileImageUrl = profileImageUrl
    }

    await user.save();
    res.status(200).json({
      ...extractDbFields(user),
      followersCount: user.followers?.length,
      followingCount: user.following?.length,
      followers: null,
      following: null,
    });
}

async function getUserPosts(req, res, next) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const posts = await Post.aggregate([
      {
        $match: { "author._id": new mongoose.Types.ObjectId(req.params.userId) },
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      },
      {
        $addFields: {
                likeCount: {$size: "$likes"},
                commentCount: {$size: "$comments"},
                likedByMe: {$in: [new mongoose.Types.ObjectId(req.user._id), "$likes"]}
            }
      },
      {
        $project: {
            content: false,
            likes: false,
            comments: false
        }
      }
    ]);
    res.status(200).json(posts)
}

async function getUserComments(req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const comments = await Comment.find({
    "madeBy._id": new mongoose.Types.ObjectId(req.params.userId),
  })
    .populate({ path: "post", select: "title" })
    .skip((page - 1) * limit)
    .limit(limit);
  res.status(200).json(comments);
}

async function getUserFollowers(req, res, next) {
  const {followers} = await User.findById(req.params.userId)
    .populate("followers", "_id name email profileImageUrl")
  res.status(200).json(followers);
}

async function getUserFollowings(req, res, next) {
  const {following} = await User.findById(req.params.userId)
    .populate("following", "_id name email profileImageUrl")
  res.status(200).json(following)
}

async function toggleUserFollow(req, res, next) {
  const self = await User.findById(req.user._id)
  const isFollowing = self.following.some(userId => userId.equals(new mongoose.Types.ObjectId(req.params.userId)))
  if(isFollowing) {
    //unfollow user
    self.following = self.following.filter(userId => !userId.equals(req.params.userId))
    self.save()
    const unfollowedUser = await User.findById(req.params.userId)
    unfollowedUser.followers = unfollowedUser.followers.filter(userId => !userId.equals(req.user._id))
    unfollowedUser.save()
    await Notification.markNotificationAsInvalid({
      entityType: "FOLLOW",
      sender: req.user._id,
      receiver: new mongoose.Types.ObjectId(req.params.userId)
    });
    res.status(200).json({followedByMe: false})
  }
  else {
    //follow user
    self.following.push(new mongoose.Types.ObjectId(req.params.userId))
    self.save()
    const followedUser = await User.findById(req.params.userId)
    followedUser.followers.push(new mongoose.Types.ObjectId(req.user._id))
    followedUser.save()
    await Notification.generateNotification(
      req.user._id,
      new mongoose.Types.ObjectId(req.params.userId),
      "FOLLOW",
      new mongoose.Types.ObjectId(req.params.userId),
    )
    res.status(200).json({followedByMe: true})
  }
}

async function toggleTagFollow(req, res, next) {
    if(!req.user._id.equals(new mongoose.Types.ObjectId(req.params.userId))) {
      return createAndPassError("You do not have permission to follow or unfollow a tag for this user", 403, next)
    }
    const user = await User.findById(req.user._id)
    const isFollowed = user.followedTags.some(tagId => tagId.equals(new mongoose.Types.ObjectId(req.body.tagId)))
    if(isFollowed) {
      user.followedTags = user.followedTags.filter(tagId => !tagId.equals(new mongoose.Types.ObjectId(req.body.tagId)))
      await user.save()
      res.status(200).json({followedByMe: false})
    }
    else {
      user.followedTags.push(new mongoose.Types.ObjectId(req.body.tagId))
      await user.save()
      res.status(200).json({followedByMe: true})
    }
}

async function getFollowedTags(req, res, next) {
  const {followedTags} = await User.findById(req.params.userId)
    .populate("followedTags", "-postCount")
  res.status(200).json(followedTags)
}

async function togglePostBookmark(req, res, next) {
  if (!req.user._id.equals(new mongoose.Types.ObjectId(req.params.userId))) {
    return createAndPassError(
      "You do not have permisssion to bookmark post for this user",
      403,
      next
    );
  }
  const user = await User.findById(req.user._id)
  const post = await Post.findById(req.body.postId)
  const isPresent = user.bookmarkedPosts.some((postId) =>
    postId.equals(new mongoose.Types.ObjectId(req.body.postId))
  );
  if(isPresent){
    user.bookmarkedPosts = user.bookmarkedPosts.filter(
      (postId) => !postId.equals(new mongoose.Types.ObjectId(req.body.postId))
    );
    await user.save()
    post.bookmarkedByUsers = post.bookmarkedByUsers.filter(userId => !userId.equals(req.user._id))
    await post.save()
    res.status(200).json({bookmarkedByMe: false})
  }
  else{
    user.bookmarkedPosts.push(new mongoose.Types.ObjectId(req.body.postId))
    await user.save()
    post.bookmarkedByUsers.push(req.user._id)
    await post.save()
    res.status(200).json({bookmarkedByMe: true})
  }
}

async function getBookmarkedPosts(req, res, next) {
  if(!req.user._id.equals(req.params.userId)) {
    return createAndPassError("You do not have permisssion to view the reading list for this user", 403, next)
  }
  const { bookmarkedPosts } = await User.findById(req.user._id);
  const posts = await Post.aggregate([
    {
      $match: { _id: { $in: bookmarkedPosts } },
    },
    {
      $addFields: {
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        likedByMe: {
          $in: [new mongoose.Types.ObjectId(req.user._id), "$likes"],
        },
      },
    },
    {
      $project: {
        content: false,
        likes: false,
        comments: false,
      },
    },
  ]);
  res.status(200).json(posts)
}

// async function getSuggestedFollows(req, res) {
//   if(req.query.selectedTags == null || req.query.selectedTags.trim().length === 0) {
//     createHttpError("Tags are required", 400)
//   }
//   const selectedTags = req.query.selectedTags.split(",")
//   const SUGGESTED_FOLLOWS_LIMIT = 10
//   const usersFollowingSelectedTags = await User.find({"followedTags": {$in: selectedTags}}).select("_id username profileImageUrl bio").limit(SUGGESTED_FOLLOWS_LIMIT)
//   const remainingUsersCount = SUGGESTED_FOLLOWS_LIMIT - usersFollowingSelectedTags.length
//   let usersNotFollowingSelectedTags = []
//   if(remainingUsersCount > 0) {
//     usersNotFollowingSelectedTags = await User.find({"followedTags": {$nin: selectedTags}}).select("_id username profileImageUrl bio").limit(remainingUsersCount)
//   }
//   res.status(200).json([...usersFollowingSelectedTags, ...usersNotFollowingSelectedTags])
// }

async function getRecommendedPosts(req, res, next) {
  const { followedTags } = await User.findById(req.user._id);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filter = { "tags._id": { $in: followedTags } };
  const posts = await Post.getPosts(filter, page, limit, req.user._id);
  res.status(200).json(posts);
}

module.exports = {
  setFollowedTags,
  getUserProfile,
  getAuthenticatedUserProfile,
    editUserProfile,
    getUserPosts,
    getUserComments,
    getUserFollowers,
    getUserFollowings,
    toggleUserFollow,
    toggleTagFollow,
    getFollowedTags,
    togglePostBookmark,
    getBookmarkedPosts,
  //   getSuggestedFollows,
    getRecommendedPosts
};
