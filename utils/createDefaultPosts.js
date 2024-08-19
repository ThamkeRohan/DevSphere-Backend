const Post = require("../models/post")

const posts = [
  {
    title: "Understanding React Hooks",
    coverImageUrl: "https://example.com/image1.jpg",
    tags: [
      { _id: "66acb775f67d1997c8f09742", name: "javascript" },
      { _id: "66acb775f67d1997c8f09743", name: "python" },
    ],
    content:
      "React Hooks are functions that let you use state and other React features without writing a class...",
    description:
      "A comprehensive guide to understanding and using React Hooks in your projects.",
    author: {
      _id: "66ab62fbdfe72633f771eac9",
      name: "IT.B.65.RohanThamke",
      profileImageUrl:
        "https://lh3.googleusercontent.com/a/ACg8ocJcgy_x_VRPb_pHzZz51oXVogFSxkHrIaB2Q6yYdiPa-86GwEg=s96-c",
    },
  },
  {
    title: "Getting Started with Node.js",
    coverImageUrl: "https://example.com/image2.jpg",
    tags: [
      { _id: "66acb775f67d1997c8f09742", name: "javascript" },
      { _id: "66acb775f67d1997c8f09744", name: "java" },
    ],
    content:
      "Node.js is a runtime environment that allows you to run JavaScript on the server side...",
    description:
      "An introductory post on getting started with Node.js for server-side development.",
    author: {
      _id: "66ab62fbdfe72633f771eac9",
      name: "IT.B.65.RohanThamke",
      profileImageUrl:
        "https://lh3.googleusercontent.com/a/ACg8ocJcgy_x_VRPb_pHzZz51oXVogFSxkHrIaB2Q6yYdiPa-86GwEg=s96-c",
    },
  },
  {
    title: "Mastering CSS Grid",
    coverImageUrl: "https://example.com/image3.jpg",
    tags: [
      { _id: "66acb775f67d1997c8f09742", name: "javascript" },
      { _id: "66acb775f67d1997c8f09745", name: "c#" },
    ],
    content:
      "CSS Grid is a powerful layout system available in CSS. It allows you to design web pages using a grid-based layout...",
    description:
      "Learn how to use CSS Grid to create complex and responsive web layouts with ease.",
    author: {
      _id: "66ab57b50cc16c483e5b87d4",
      name: "Jonny",
      profileImageUrl: "default-profile-image.jpg",
    },
  },
];

async function createDefaultPosts() {
  const postsCount = await Post.countDocuments();

  if (postsCount === 0) {
    await Post.insertMany(posts);
    console.log("Default posts have been created");
  } else {
    console.log("Posts already exists in the collection");
  }
}

createDefaultPosts();
