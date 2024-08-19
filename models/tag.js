const mongoose = require("mongoose")

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  postCount: {
    type: Number,
    default: 0
  }
});

tagSchema.statics.updateTags = function(tags, inc) {
  const tagIds = tags.map(tag => tag._id)
  return this.updateMany({_id: tagIds}, {$inc: {postCount: inc}})
}

tagSchema.statics.incTagsPostCount = function(tags) {
  return this.updateTags(tags, 1)
}

tagSchema.statics.decTagsPostCount = function(tags) {
  return this.updateTags(tags, -1)
}

tagSchema.statics.updateTagsPostCount = async function(prevTags, currentTags) {
  const removedTags = prevTags.filter((prevTag) => {
    return !currentTags.some((currentTag) =>
      new mongoose.Types.ObjectId(currentTag._id).equals(prevTag._id)
    );
  });
  const newTags = currentTags.filter((currentTag) => {
    return !prevTags.some((prevTag) =>
      prevTag._id.equals(new mongoose.Types.ObjectId(currentTag._id))
    );
  });
  await this.decTagsPostCount(removedTags)
  await this.incTagsPostCount(newTags)
}

module.exports = mongoose.model("Tag", tagSchema)
