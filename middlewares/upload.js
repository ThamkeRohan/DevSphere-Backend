const multer = require("multer")

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Only png, jpg and jpeg are accepted")
    error.status = 400
    cb(error) //throws error for incorrect mime type and prevents its saving
    // cb(null, false); //prevents incorrect mime type but does not throw error
  }
};

const upload = multer({ storage: fileStorage, fileFilter: fileFilter })

module.exports = upload