const Tag = require("../models/tag")

const programmingTags = [
      'JavaScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'Swift', 'TypeScript',
      'PHP', 'C++', 'Kotlin', 'Rust', 'Scala', 'Dart', 'Objective-C', 'Elixir',
      'Perl', 'Haskell', 'Clojure', 'R'
    ];

async function createDefaultTags() {
    const tagsCount = await Tag.countDocuments()

    if(tagsCount === 0) {

        const newTags = programmingTags.map(name => ({name}))
        await Tag.insertMany(newTags)
        console.log("Default tags have been created")
    }
    else {
        console.log("Tags already exists in the collection")
    }
}

createDefaultTags()