const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) return next(); // Skip if no file is uploaded

    // 1. Convert buffer to Data URI
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // 2. Upload to Cloudinary
    // You can specify the folder here based on the route
    const uploadRes = await cloudinary.uploader.upload(dataURI, {
      folder: "narensocial/profiles",
      resource_type: "auto",
    });

    // 3. Attach the URL to the request object for the next function
    req.cloudinaryUrl = uploadRes.secure_url;
    next();
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ error: "Failed to upload image to Cloudinary" });
  }
};

module.exports = uploadToCloudinary;
