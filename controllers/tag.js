const Tag = require("../models/tag");
const User = require("../models/user");

async function getTags(req, res, next) {
  const tags = await Tag.find({
    name: new RegExp(req.query.search, "i"),
  });
  res.status(200).json(tags);
}

async function getPopularTags(req, res, next) {
  let tags = await Tag.find().sort({ postCount: -1 }).limit(50).lean();
  const { followedTags } = await User.findById(req.user._id).select(
    "followedTags"
  );
  
  tags = tags.map((tag) => {
    if (followedTags.some((followedTag) => followedTag.equals(tag._id))) {
      return { ...tag, followedByMe: true };
    }
    return { ...tag, followedByMe: false };
  });
  res.status(200).json(tags);
}

async function createTag(req, res, next) {
  const tag = await Tag.create({ name: req.body.name });
  res.status(201).json(tag);
}

module.exports = {
  getTags,
  getPopularTags,
  createTag,
};
