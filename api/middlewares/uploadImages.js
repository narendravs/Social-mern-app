const multer = require("multer");

// 1. Configure Memory Storage
// This stores the file in memory as a 'buffer' property on req.file
const storage = multer.memoryStorage();

// 2. Define File Filter (Security)
// This ensures only images are processed, reducing the risk of malicious uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Please upload an image (JPG, PNG, GIF, WebP).",
      ),
      false,
    );
  }
};

// 3. Initialize Multer
const uploadProfile = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Strict 5MB limit to protect server RAM
  },
  fileFilter: fileFilter,
});

module.exports = { uploadProfile };
