const multer = require("multer");

// 1. Configure Memory Storage
// This stores the file in memory as a 'buffer' property on req.file
const storage = multer.memoryStorage();

// 2. Define File Filter (Security)
// This ensures only images are processed, reducing the risk of malicious uploads
const fileFilter = (req, file, cb) => {
  // Check if the mimetype starts with 'image/' OR 'video/'
  // This covers .jpg, .png, .gif, .mp4, .mov, .avi, .webp, etc.
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Please upload an image or video file.",
      ),
      false,
    );
  }
};

// 3. Initialize Multer
const uploadProfile = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Strict 50MB limit to protect server RAM
  },
  fileFilter: fileFilter,
});

module.exports = { uploadProfile };
